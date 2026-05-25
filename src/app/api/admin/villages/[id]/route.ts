// src/app/api/admin/villages/[id]/route.ts
// PATCH  /api/admin/villages/[id]
// DELETE /api/admin/villages/[id]

import { NextRequest, NextResponse }            from 'next/server'
import { z }                                    from 'zod'
import prisma                                   from '@/lib/prisma'
import { getSession, requireRole, getClientIp } from '@/lib/auth'
import { writeAuditLog }                        from '@/lib/security'

const UpdateVillageSchema = z.object({
  name:          z.string().min(2).max(100).optional(),
  latitude:      z.number().optional(),
  longitude:     z.number().optional(),
  estimatedPop:  z.number().int().positive().optional(),
  notes:         z.string().max(500).optional(),
})

type Params = { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, { params }: Params) {
  const session = await getSession()
  if (!requireRole(session, 'COUNTY_ADMIN', 'GOVERNOR_EXEC')) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const villageId = parseInt(id, 10)
  if (isNaN(villageId)) return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 })

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = UpdateVillageSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Validation failed' }, { status: 422 })
  }

  const updated = await prisma.village.update({
    where: { id: villageId },
    data:  parsed.data,
  })

  await writeAuditLog({
    actorId: session!.userId, action: 'VILLAGE_UPDATED',
    entityType: 'Village', entityId: String(villageId),
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
  const villageId = parseInt(id, 10)
  if (isNaN(villageId)) return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 })

  await prisma.village.delete({ where: { id: villageId } })

  await writeAuditLog({
    actorId: session!.userId, action: 'VILLAGE_DELETED',
    entityType: 'Village', entityId: String(villageId),
    ipAddress: getClientIp(request),
  })

  return NextResponse.json({ success: true, message: 'Village deleted' })
}
