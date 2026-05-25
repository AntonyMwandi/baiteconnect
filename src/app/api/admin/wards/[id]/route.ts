// src/app/api/admin/wards/[id]/route.ts
// GET   /api/admin/wards/[id]  — single ward detail
// PATCH /api/admin/wards/[id]  — update ward (name, sub-county, MCA assignment)
// DELETE /api/admin/wards/[id] — soft-delete / deactivate ward

import { NextRequest, NextResponse }            from 'next/server'
import { z }                                    from 'zod'
import prisma                                   from '@/lib/prisma'
import { getSession, requireRole, getClientIp } from '@/lib/auth'
import { writeAuditLog }                        from '@/lib/security'

const UpdateWardSchema = z.object({
  wardName:   z.string().min(2).max(50).optional(),
  subCounty:  z.string().min(2).max(50).optional(),
  mcaUserId:  z.string().uuid().nullable().optional(),
  isActive:   z.boolean().optional(),
})

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const wardId = parseInt(id, 10)
  if (isNaN(wardId)) return NextResponse.json({ success: false, error: 'Invalid ward ID' }, { status: 400 })

  const ward = await prisma.ward.findUnique({
    where:   { id: wardId },
    include: {
      mcaUser:      { select: { id: true, fullName: true, phoneNumber: true } },
      memoranda:    { select: { id: true, fiscalYear: true, moderationStatus: true, createdAt: true }, orderBy: { createdAt: 'desc' }, take: 10 },
      projects:     { select: { id: true, title: true, currentStage: true, allocatedBudget: true }, orderBy: { updatedAt: 'desc' } },
    },
  })

  if (!ward) return NextResponse.json({ success: false, error: 'Ward not found' }, { status: 404 })

  // Fetch sub-locations
  const subLocations = await prisma.subLocation.findMany({
    where:   { wardId },
    include: { villages: true },
    orderBy: { name: 'asc' },
  })

  return NextResponse.json({ success: true, data: { ...ward, subLocations } })
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const session = await getSession()
  if (!requireRole(session, 'COUNTY_ADMIN', 'GOVERNOR_EXEC')) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const wardId = parseInt(id, 10)
  if (isNaN(wardId)) return NextResponse.json({ success: false, error: 'Invalid ward ID' }, { status: 400 })

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = UpdateWardSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Validation failed', details: parsed.error.flatten() }, { status: 422 })
  }

  // Validate MCA user exists and has MCA role if assigning
  if (parsed.data.mcaUserId) {
    const mcaUser = await prisma.user.findUnique({ where: { id: parsed.data.mcaUserId } })
    if (!mcaUser) return NextResponse.json({ success: false, error: 'MCA user not found' }, { status: 404 })
    if (!['MCA', 'COUNTY_ADMIN', 'GOVERNOR_EXEC'].includes(mcaUser.role)) {
      return NextResponse.json({ success: false, error: 'Assigned user must have MCA or admin role' }, { status: 422 })
    }
  }

  const updated = await prisma.ward.update({
    where: { id: wardId },
    data:  parsed.data,
  })

  await writeAuditLog({
    actorId:    session!.userId,
    action:     'WARD_UPDATED',
    entityType: 'Ward',
    entityId:   String(wardId),
    metadata:   parsed.data,
    ipAddress:  getClientIp(request),
  })

  return NextResponse.json({ success: true, data: updated })
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const session = await getSession()
  if (!requireRole(session, 'COUNTY_ADMIN', 'GOVERNOR_EXEC')) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const wardId = parseInt(id, 10)
  if (isNaN(wardId)) return NextResponse.json({ success: false, error: 'Invalid ward ID' }, { status: 400 })

  // Safety: prevent deletion of wards with active memoranda or projects
  const usageCount = await prisma.memorandum.count({ where: { wardId } })
  if (usageCount > 0) {
    return NextResponse.json(
      { success: false, error: `Cannot delete ward — it has ${usageCount} memoranda. Deactivate it instead using PATCH { isActive: false }.` },
      { status: 409 }
    )
  }

  await prisma.ward.delete({ where: { id: wardId } })

  await writeAuditLog({
    actorId:    session!.userId,
    action:     'WARD_DELETED',
    entityType: 'Ward',
    entityId:   String(wardId),
    ipAddress:  getClientIp(request),
  })

  return NextResponse.json({ success: true, message: 'Ward deleted successfully' })
}
