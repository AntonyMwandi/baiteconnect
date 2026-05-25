// src/app/api/auth/otp/route.ts
// POST /api/auth/otp        — send OTP to phone
// PUT  /api/auth/otp        — verify submitted OTP code

import { NextRequest, NextResponse } from 'next/server'
import { z }                         from 'zod'
import prisma                        from '@/lib/prisma'
import { checkRateLimit, validateKenyanPhone, normalisePhone, writeAuditLog } from '@/lib/security'
import { sendOtpSms }                from '@/lib/sms'
import { getClientIp }               from '@/lib/auth'

const SendSchema = z.object({
  phoneNumber: z.string(),
  fullName:    z.string().min(3).max(100),
  nationalId:  z.string().regex(/^\d{7,8}$/),
})

const VerifySchema = z.object({
  phoneNumber: z.string(),
  otpCode:     z.string().length(6),
})

// ── POST — Send OTP ──────────────────────────────────────────
export async function POST(request: NextRequest) {
  const ip          = getClientIp(request)
  const rateResult  = await checkRateLimit(`otp-send:${ip}`)

  if (!rateResult.allowed) {
    return NextResponse.json(
      { success: false, error: 'Too many OTP requests. Please wait.' },
      { status: 429 }
    )
  }

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 })
  }

  const parsed = SendSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Validation failed' }, { status: 422 })
  }

  const phone = normalisePhone(parsed.data.phoneNumber)
  if (!validateKenyanPhone(phone)) {
    return NextResponse.json({ success: false, error: 'Invalid Kenyan phone number' }, { status: 422 })
  }

  // Find or create placeholder user for OTP binding
  let user = await prisma.user.findFirst({ where: { phoneNumber: phone } })
  if (!user) {
    const crypto  = await import('crypto')
    const idHash  = crypto.createHash('sha256').update(parsed.data.nationalId).digest('hex')
    user = await prisma.user.upsert({
      where:  { nationalIdHash: idHash },
      create: {
        nationalId:     parsed.data.nationalId,
        nationalIdHash: idHash,
        phoneNumber:    phone,
        fullName:       parsed.data.fullName,
      },
      update: { fullName: parsed.data.fullName },
    })
  }

  // Invalidate any existing unverified OTPs
  await prisma.otpVerification.updateMany({
    where:  { userId: user.id, verified: false },
    data:   { expiresAt: new Date() },
  })

  // Send new OTP
  const { otp, result } = await sendOtpSms(phone, parsed.data.fullName)

  if (!result.success) {
    console.error('[OTP] SMS send failed:', result.error)
    // In development/sandbox, still create the OTP record so UI can proceed
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ success: false, error: 'Failed to send SMS. Try again.' }, { status: 502 })
    }
  }

  const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

  await prisma.otpVerification.create({
    data: { userId: user.id, phoneNumber: phone, otpCode: otp, expiresAt },
  })

  await writeAuditLog({
    actorId:    user.id,
    action:     'OTP_SENT',
    entityType: 'OtpVerification',
    entityId:   user.id,
    ipAddress:  ip,
  })

  // In development, return the OTP so frontend can auto-fill
  const devOtp = process.env.NODE_ENV !== 'production' ? otp : undefined

  return NextResponse.json({
    success: true,
    message: `Verification code sent to ${phone.replace(/(\+254\d{3})\d{4}(\d{3})/, '$1****$2')}`,
    ...(devOtp ? { _dev_otp: devOtp } : {}),
  })
}

// ── PUT — Verify OTP ─────────────────────────────────────────
export async function PUT(request: NextRequest) {
  const ip = getClientIp(request)

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 })
  }

  const parsed = VerifySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Validation failed' }, { status: 422 })
  }

  const phone = normalisePhone(parsed.data.phoneNumber)
  const now   = new Date()

  const record = await prisma.otpVerification.findFirst({
    where: {
      phoneNumber: phone,
      otpCode:     parsed.data.otpCode,
      verified:    false,
      expiresAt:   { gt: now },
    },
    orderBy: { createdAt: 'desc' },
  })

  if (!record) {
    // Increment attempt counter on most recent unverified record
    await prisma.otpVerification.updateMany({
      where:  { phoneNumber: phone, verified: false },
      data:   { attempts: { increment: 1 } },
    })
    return NextResponse.json({ success: false, error: 'Invalid or expired verification code.' }, { status: 400 })
  }

  if (record.attempts >= 5) {
    return NextResponse.json({ success: false, error: 'Too many failed attempts. Request a new code.' }, { status: 429 })
  }

  // Mark verified + update user
  await Promise.all([
    prisma.otpVerification.update({
      where: { id: record.id },
      data:  { verified: true },
    }),
    prisma.user.update({
      where: { id: record.userId },
      data:  { isPhoneVerified: true },
    }),
  ])

  await writeAuditLog({
    actorId:    record.userId,
    action:     'OTP_VERIFIED',
    entityType: 'OtpVerification',
    entityId:   record.id,
    ipAddress:  ip,
  })

  const user = await prisma.user.findUnique({
    where:  { id: record.userId },
    select: { id: true, role: true, fullName: true, assignedWardId: true },
  })

  return NextResponse.json({
    success: true,
    message: 'Phone number verified successfully.',
    data:    { userId: user?.id, role: user?.role, fullName: user?.fullName },
  })
}
