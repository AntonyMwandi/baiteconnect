// src/app/api/memoranda/route.ts
// BaiteConnect — Memorandum Submission Endpoint
// POST /api/memoranda  — create a new submission
// GET  /api/memoranda  — list (admin only)

import { NextRequest, NextResponse }  from 'next/server'
import { z }                          from 'zod'
import prisma                         from '@/lib/prisma'
import { checkRateLimit, moderateContent, validateGeoLocation,
         validateKenyanPhone, normalisePhone, validateNationalId,
         generateReferenceCode, writeAuditLog }  from '@/lib/security'
import { sendSubmissionConfirmation }             from '@/lib/sms'
import { getSession, getClientIp, requireRole }  from '@/lib/auth'
import { CURRENT_FISCAL_YEAR }                   from '@/types'
import crypto                                     from 'crypto'

// ── Validation schema ─────────────────────────────────────────
const MemoSchema = z.object({
  fullName:      z.string().min(3).max(100),
  nationalId:    z.string().regex(/^\d{7,8}$/, 'National ID must be 7–8 digits'),
  phoneNumber:   z.string().min(10).max(15),
  wardId:        z.number().int().positive(),
  fiscalYear:    z.string().default(CURRENT_FISCAL_YEAR),
  sectorCategory:z.enum(['Health', 'Agriculture', 'Roads & Infrastructure', 'Water & Environment', 'General Public Service']),
  writtenText:   z.string().min(30).max(5000),
  attachmentUrl: z.string().url().optional(),
  sliderChoices: z.object({
    health:        z.number().int().min(1).max(98),
    agriculture:   z.number().int().min(1).max(98),
    roads:         z.number().int().min(1).max(98),
    water:         z.number().int().min(1).max(98),
    publicService: z.number().int().min(1).max(98),
  }).refine(
    c => c.health + c.agriculture + c.roads + c.water + c.publicService === 100,
    { message: 'Budget sliders must total exactly 100' }
  ),
  latitude:  z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
})

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)

  // ── 1. Rate limiting ──────────────────────────────────────
  const rateResult = await checkRateLimit(`ip:${ip}`)
  if (!rateResult.allowed) {
    return NextResponse.json(
      { success: false, error: 'Too many requests. Please wait before trying again.' },
      { status: 429, headers: { 'Retry-After': rateResult.resetAt.toISOString() } }
    )
  }

  // ── 2. Parse & validate body ──────────────────────────────
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = MemoSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Validation failed', details: parsed.error.flatten() },
      { status: 422 }
    )
  }

  const data = parsed.data

  // ── 3. Phone normalisation + validation ───────────────────
  const phone = normalisePhone(data.phoneNumber)
  if (!validateKenyanPhone(phone)) {
    return NextResponse.json(
      { success: false, error: 'Invalid Kenyan phone number format' },
      { status: 422 }
    )
  }

  if (!validateNationalId(data.nationalId)) {
    return NextResponse.json(
      { success: false, error: 'Invalid National ID format' },
      { status: 422 }
    )
  }

  // ── 4. Verify phone OTP was completed ─────────────────────
  const otpRecord = await prisma.otpVerification.findFirst({
    where: { phoneNumber: phone, verified: true },
    orderBy: { createdAt: 'desc' },
  })

  if (!otpRecord) {
    return NextResponse.json(
      { success: false, error: 'Phone number not verified. Please complete OTP verification.' },
      { status: 403 }
    )
  }

  // ── 5. Find or create user record ─────────────────────────
  const nationalIdHash = crypto.createHash('sha256').update(data.nationalId).digest('hex')

  let user = await prisma.user.findUnique({ where: { nationalIdHash } })

  if (!user) {
    user = await prisma.user.create({
      data: {
        nationalId:      data.nationalId,
        nationalIdHash,
        phoneNumber:     phone,
        fullName:        data.fullName,
        isPhoneVerified: true,
        role:            'CITIZEN',
      },
    })
  }

  // ── 6. Duplicate check per fiscal cycle ───────────────────
  const existingMemo = await prisma.memorandum.findFirst({
    where: { userId: user.id, fiscalYear: data.fiscalYear },
  })

  if (existingMemo) {
    return NextResponse.json(
      { success: false, error: 'You have already submitted a memorandum for this fiscal year.' },
      { status: 409 }
    )
  }

  // ── 7. Verify ward exists ─────────────────────────────────
  const ward = await prisma.ward.findUnique({ where: { id: data.wardId } })
  if (!ward) {
    return NextResponse.json({ success: false, error: 'Invalid ward selection' }, { status: 422 })
  }

  // ── 8. Geolocation validation ─────────────────────────────
  const geoResult = await validateGeoLocation(data.latitude, data.longitude, data.wardId)

  // ── 9. Content moderation ─────────────────────────────────
  const textModeration = moderateContent(data.writtenText)
  let moderationStatus: 'PENDING' | 'APPROVED' | 'UNDER_REVIEW' | 'SHADOW_BANNED' = 'PENDING'

  if (!geoResult.isWithinMeru) {
    moderationStatus = 'SHADOW_BANNED'
  } else if (textModeration === 'UNDER_REVIEW') {
    moderationStatus = 'UNDER_REVIEW'
  } else if (!geoResult.isWithinWard) {
    moderationStatus = 'UNDER_REVIEW'
  } else {
    moderationStatus = 'APPROVED'
  }

  // ── 10. Create memorandum ─────────────────────────────────
  const referenceCode = generateReferenceCode()

  const memorandum = await prisma.memorandum.create({
    data: {
      userId:           user.id,
      wardId:           data.wardId,
      fiscalYear:       data.fiscalYear,
      sectorCategory:   data.sectorCategory,
      writtenText:      data.writtenText,
      attachmentUrl:    data.attachmentUrl ?? null,
      userSliderChoices:data.sliderChoices,
      submissionIp:     ip,
      submissionLat:    data.latitude,
      submissionLng:    data.longitude,
      isWithinWard:     geoResult.isWithinWard,
      moderationStatus,
      referenceCode,
    },
  })

  // ── 11. Audit log ─────────────────────────────────────────
  await writeAuditLog({
    actorId:    user.id,
    action:     'MEMORANDUM_SUBMITTED',
    entityType: 'Memorandum',
    entityId:   memorandum.id,
    metadata:   { ward: ward.wardName, sector: data.sectorCategory, moderationStatus },
    ipAddress:  ip,
  })

  // ── 12. SMS confirmation (non-blocking) ───────────────────
  if (moderationStatus !== 'SHADOW_BANNED') {
    sendSubmissionConfirmation(
      phone,
      data.fullName.split(' ')[0],
      referenceCode,
      ward.wardName,
      data.sectorCategory
    ).catch(e => console.error('[SMS]', e))
  }

  // ── 13. Response (never reveal shadow ban to user) ────────
  return NextResponse.json(
    {
      success: true,
      data: {
        referenceCode,
        wardName:   ward.wardName,
        sector:     data.sectorCategory,
        fiscalYear: data.fiscalYear,
        status:     moderationStatus === 'SHADOW_BANNED' ? 'PENDING' : moderationStatus,
      },
      message: 'Your memorandum has been received successfully.',
    },
    { status: 201 }
  )
}

// ── GET — admin listing ───────────────────────────────────────
export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!requireRole(session, 'COUNTY_ADMIN', 'GOVERNOR_EXEC')) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const wardId      = searchParams.get('wardId')
  const fiscalYear  = searchParams.get('fiscalYear') ?? CURRENT_FISCAL_YEAR
  const status      = searchParams.get('status')
  const page        = parseInt(searchParams.get('page') ?? '1', 10)
  const limit       = Math.min(parseInt(searchParams.get('limit') ?? '50', 10), 100)

  const where: Record<string, unknown> = { fiscalYear }
  if (wardId)  where.wardId           = parseInt(wardId, 10)
  if (status)  where.moderationStatus = status

  const [total, memoranda] = await Promise.all([
    prisma.memorandum.count({ where }),
    prisma.memorandum.findMany({
      where,
      include: { ward: true, user: { select: { fullName: true, phoneNumber: true } } },
      orderBy: { createdAt: 'desc' },
      skip:    (page - 1) * limit,
      take:    limit,
    }),
  ])

  return NextResponse.json({ success: true, data: { memoranda, total, page, limit } })
}
