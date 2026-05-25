// src/app/api/admin/wards/route.ts
// GET  /api/admin/wards        — list all wards (admin, paginated)
// POST /api/admin/wards        — create a new ward

import { NextRequest, NextResponse }            from 'next/server'
import { z }                                    from 'zod'
import prisma                                   from '@/lib/prisma'
import { getSession, requireRole, getClientIp } from '@/lib/auth'
import { writeAuditLog }                        from '@/lib/security'

const CreateWardSchema = z.object({
  wardName:  z.string().min(2).max(50),
  subCounty: z.string().min(2).max(50),
})

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!requireRole(session, 'COUNTY_ADMIN', 'GOVERNOR_EXEC')) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const subCounty = searchParams.get('subCounty')
  const search    = searchParams.get('search')

  const where: Record<string, unknown> = {}
  if (subCounty) where.subCounty = subCounty
  if (search)    where.wardName   = { contains: search, mode: 'insensitive' }

  const wards = await prisma.ward.findMany({
    where,
    include: {
      mcaUser:  { select: { fullName: true, phoneNumber: true } },
      _count: {
        select: {
          memoranda:  true,
          projects:   true,
        },
      },
    },
    orderBy: [{ subCounty: 'asc' }, { wardName: 'asc' }],
  })

  // Attach sub-location counts
  const wardsWithSub = await Promise.all(
    wards.map(async w => {
      const subLocCount = await prisma.subLocation.count({ where: { wardId: w.id } })
      return { ...w, subLocationCount: subLocCount }
    })
  )

  return NextResponse.json({ success: true, data: wardsWithSub })
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!requireRole(session, 'COUNTY_ADMIN', 'GOVERNOR_EXEC')) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = CreateWardSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Validation failed', details: parsed.error.flatten() }, { status: 422 })
  }

  // Prevent duplicate ward names in the same sub-county
  const existing = await prisma.ward.findFirst({
    where: {
      wardName:  { equals: parsed.data.wardName, mode: 'insensitive' },
      subCounty: { equals: parsed.data.subCounty, mode: 'insensitive' },
    },
  })
  if (existing) {
    return NextResponse.json({ success: false, error: `Ward "${parsed.data.wardName}" already exists in ${parsed.data.subCounty}` }, { status: 409 })
  }

  const ward = await prisma.ward.create({ data: parsed.data })

  await writeAuditLog({
    actorId:    session!.userId,
    action:     'WARD_CREATED',
    entityType: 'Ward',
    entityId:   String(ward.id),
    metadata:   { wardName: ward.wardName, subCounty: ward.subCounty },
    ipAddress:  getClientIp(request),
  })

  return NextResponse.json({ success: true, data: ward }, { status: 201 })
}
