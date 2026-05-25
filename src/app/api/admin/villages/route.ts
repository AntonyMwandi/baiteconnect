// src/app/api/admin/villages/route.ts
// GET  /api/admin/villages?subLocationId=X
// POST /api/admin/villages

import { NextRequest, NextResponse }            from 'next/server'
import { z }                                    from 'zod'
import prisma                                   from '@/lib/prisma'
import { getSession, requireRole, getClientIp } from '@/lib/auth'
import { writeAuditLog }                        from '@/lib/security'

const CreateVillageSchema = z.object({
  subLocationId: z.number().int().positive(),
  name:          z.string().min(2).max(100),
  latitude:      z.number().min(-90).max(90).optional(),
  longitude:     z.number().min(-180).max(180).optional(),
  estimatedPop:  z.number().int().positive().optional(),
  notes:         z.string().max(500).optional(),
})

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const subLocationId = searchParams.get('subLocationId')
  const wardId        = searchParams.get('wardId')

  const where: Record<string, unknown> = {}
  if (subLocationId) {
    where.subLocationId = parseInt(subLocationId, 10)
  } else if (wardId) {
    // Fetch all villages under a ward via sub-locations
    const subLocs = await prisma.subLocation.findMany({
      where:  { wardId: parseInt(wardId, 10) },
      select: { id: true },
    })
    where.subLocationId = { in: subLocs.map(s => s.id) }
  }

  const villages = await prisma.village.findMany({
    where,
    include: {
      subLocation: {
        select: {
          name: true,
          ward: { select: { wardName: true, subCounty: true } },
        },
      },
    },
    orderBy: { name: 'asc' },
  })

  return NextResponse.json({ success: true, data: villages })
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

  const parsed = CreateVillageSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Validation failed', details: parsed.error.flatten() }, { status: 422 })
  }

  const subLoc = await prisma.subLocation.findUnique({
    where:   { id: parsed.data.subLocationId },
    include: { ward: true },
  })
  if (!subLoc) return NextResponse.json({ success: false, error: 'Sub-location not found' }, { status: 404 })

  // Prevent duplicates
  const existing = await prisma.village.findFirst({
    where: {
      subLocationId: parsed.data.subLocationId,
      name:          { equals: parsed.data.name, mode: 'insensitive' },
    },
  })
  if (existing) {
    return NextResponse.json({ success: false, error: `Village "${parsed.data.name}" already exists in ${subLoc.name}` }, { status: 409 })
  }

  const village = await prisma.village.create({
    data:    parsed.data,
    include: { subLocation: { include: { ward: true } } },
  })

  await writeAuditLog({
    actorId:    session!.userId,
    action:     'VILLAGE_CREATED',
    entityType: 'Village',
    entityId:   String(village.id),
    metadata:   { name: village.name, subLocation: subLoc.name, ward: subLoc.ward.wardName },
    ipAddress:  getClientIp(request),
  })

  return NextResponse.json({ success: true, data: village }, { status: 201 })
}
