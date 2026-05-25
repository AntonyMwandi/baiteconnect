// src/app/api/admin/sub-locations/[id]/route.ts
// PATCH  /api/admin/sub-locations/[id]
// DELETE /api/admin/sub-locations/[id]

import { NextRequest, NextResponse }            from 'next/server'
import { z }                                    from 'zod'
import prisma                                   from '@/lib/prisma'
import { getSession, requireRole, getClientIp } from '@/lib/auth'
import { writeAuditLog }                        from '@/lib/security'

const UpdateSchema = z.object({
  name:      z.string().min(2).max(100).optional(),
  latitude:  z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  notes:     z.string().max(500).optional(),
})

type Params = { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, { params }: Params) {
  const session = await getSession()
  if (!requireRole(session, 'COUNTY_ADMIN', 'GOVERNOR_EXEC')) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const subLocId = parseInt(id, 10)
  if (isNaN(subLocId)) return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 })

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = UpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Validation failed' }, { status: 422 })
  }

  const updated = await prisma.subLocation.update({
    where:   { id: subLocId },
    data:    parsed.data,
    include: { ward: true, villages: true },
  })

  await writeAuditLog({
    actorId: session!.userId, action: 'SUB_LOCATION_UPDATED',
    entityType: 'SubLocation', entityId: String(subLocId),
    metadata: parsed.data, ipAddress: getClientIp(request),
  })

  return NextResponse.json({ success: true, data: updated })
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const session = await getSession()
  if (!requireRole(session, 'COUNTY_ADMIN', 'GOVERNOR_EXEC')) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const subLocId = parseInt(id, 10)
  if (isNaN(subLocId)) return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 })

  // Delete villages first (cascade)
  await prisma.village.deleteMany({ where: { subLocationId: subLocId } })
  await prisma.subLocation.delete({ where: { id: subLocId } })

  await writeAuditLog({
    actorId: session!.userId, action: 'SUB_LOCATION_DELETED',
    entityType: 'SubLocation', entityId: String(subLocId),
    ipAddress: getClientIp(request),
  })

  return NextResponse.json({ success: true, message: 'Sub-location and its villages deleted' })
}
