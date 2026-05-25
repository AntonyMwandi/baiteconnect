// src/app/api/admin/users/[id]/route.ts
// PATCH /api/admin/users/[id] — update user role

import { NextRequest, NextResponse }            from 'next/server'
import { z }                                    from 'zod'
import prisma                                   from '@/lib/prisma'
import { getSession, requireRole, getClientIp } from '@/lib/auth'
import { writeAuditLog }                        from '@/lib/security'

const UpdateUserSchema = z.object({
  role:          z.enum(['CITIZEN','MCA','COUNTY_ADMIN','GOVERNOR_EXEC']).optional(),
  assignedWardId:z.number().int().positive().nullable().optional(),
})

type Params = { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, { params }: Params) {
  const session = await getSession()
  if (!requireRole(session, 'COUNTY_ADMIN', 'GOVERNOR_EXEC')) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const { id: userId } = await params

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = UpdateUserSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Validation failed' }, { status: 422 })
  }

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })

  const updated = await prisma.user.update({
    where: { id: userId },
    data:  parsed.data,
    select: { id: true, fullName: true, role: true, phoneNumber: true },
  })

  await writeAuditLog({
    actorId:    session!.userId,
    action:     'USER_ROLE_UPDATED',
    entityType: 'User',
    entityId:   userId,
    metadata:   { from: user.role, to: parsed.data.role },
    ipAddress:  getClientIp(request),
  })

  return NextResponse.json({ success: true, data: updated })
}
