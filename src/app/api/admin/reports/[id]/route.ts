// src/app/api/admin/reports/[id]/route.ts
// PATCH /api/admin/reports/[id] — update report status, assign MYS cohort

import { NextRequest, NextResponse }            from 'next/server'
import { z }                                    from 'zod'
import prisma                                   from '@/lib/prisma'
import { getSession, requireRole, getClientIp } from '@/lib/auth'
import { writeAuditLog }                        from '@/lib/security'

const Schema = z.object({
  status:            z.enum(['UNDER_REVIEW','MYS_DISPATCHED','RESOLVED']),
  mysCohortAssigned: z.string().max(50).optional(),
  adminNotes:        z.string().max(1000).optional(),
})

type Params = { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, { params }: Params) {
  const session = await getSession()
  if (!requireRole(session, 'COUNTY_ADMIN', 'GOVERNOR_EXEC')) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = Schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Validation failed' }, { status: 422 })
  }

  const report = await prisma.whistleblowerReport.findUnique({ where: { id } })
  if (!report) return NextResponse.json({ success: false, error: 'Report not found' }, { status: 404 })

  const updated = await prisma.whistleblowerReport.update({
    where: { id },
    data:  {
      status:            parsed.data.status,
      mysCohortAssigned: parsed.data.mysCohortAssigned ?? report.mysCohortAssigned,
      adminNotes:        parsed.data.adminNotes        ?? report.adminNotes,
    },
  })

  await writeAuditLog({
    actorId:    session!.userId,
    action:     'WHISTLEBLOWER_REPORT_UPDATED',
    entityType: 'WhistleblowerReport',
    entityId:   id,
    metadata:   { from: report.status, to: parsed.data.status, cohort: parsed.data.mysCohortAssigned },
    ipAddress:  getClientIp(request),
  })

  return NextResponse.json({ success: true, data: updated })
}
