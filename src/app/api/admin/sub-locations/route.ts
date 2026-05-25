// src/app/api/admin/sub-locations/route.ts
// GET  /api/admin/sub-locations?wardId=X   — list sub-locations for a ward
// POST /api/admin/sub-locations             — create a sub-location under a ward

import { NextRequest, NextResponse }            from 'next/server'
import { z }                                    from 'zod'
import prisma                                   from '@/lib/prisma'
import { getSession, requireRole, getClientIp } from '@/lib/auth'
import { writeAuditLog }                        from '@/lib/security'

const CreateSubLocationSchema = z.object({
  wardId:    z.number().int().positive(),
  name:      z.string().min(2).max(100),
  latitude:  z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  notes:     z.string().max(500).optional(),
})

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const wardId = searchParams.get('wardId')

  const where: Record<string, unknown> = {}
  if (wardId) where.wardId = parseInt(wardId, 10)

  const subLocations = await prisma.subLocation.findMany({
    where,
    include: {
      ward:     { select: { wardName: true, subCounty: true } },
      villages: { orderBy: { name: 'asc' } },
      _count:   { select: { villages: true } },
    },
    orderBy: [{ ward: { wardName: 'asc' } }, { name: 'asc' }],
  })

  return NextResponse.json({ success: true, data: subLocations })
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

  const parsed = CreateSubLocationSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Validation failed', details: parsed.error.flatten() }, { status: 422 })
  }

  // Verify ward exists
  const ward = await prisma.ward.findUnique({ where: { id: parsed.data.wardId } })
  if (!ward) return NextResponse.json({ success: false, error: 'Ward not found' }, { status: 404 })

  // Prevent duplicates
  const existing = await prisma.subLocation.findFirst({
    where: {
      wardId: parsed.data.wardId,
      name:   { equals: parsed.data.name, mode: 'insensitive' },
    },
  })
  if (existing) {
    return NextResponse.json({ success: false, error: `Sub-location "${parsed.data.name}" already exists in ${ward.wardName}` }, { status: 409 })
  }

  const subLocation = await prisma.subLocation.create({ data: parsed.data, include: { ward: true, villages: true } })

  await writeAuditLog({
    actorId:    session!.userId,
    action:     'SUB_LOCATION_CREATED',
    entityType: 'SubLocation',
    entityId:   String(subLocation.id),
    metadata:   { name: subLocation.name, wardName: ward.wardName },
    ipAddress:  getClientIp(request),
  })

  return NextResponse.json({ success: true, data: subLocation }, { status: 201 })
}
