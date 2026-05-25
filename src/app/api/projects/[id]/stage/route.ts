// src/app/api/projects/[id]/stage/route.ts
// PATCH /api/projects/[id]/stage — update project stage (admin only)

import { NextRequest, NextResponse }             from 'next/server'
import { z }                                     from 'zod'
import prisma                                    from '@/lib/prisma'
import { getSession, requireRole, getClientIp }  from '@/lib/auth'
import { writeAuditLog }                         from '@/lib/security'
import { sendProjectUpdateSms }                  from '@/lib/sms'

const StageUpdateSchema = z.object({
  stage:  z.enum(['ALLOCATED', 'TENDERED', 'ONGOING', 'COMPLETED']),
  notes:  z.string().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params

  const session = await getSession()
  if (!requireRole(session, 'COUNTY_ADMIN', 'GOVERNOR_EXEC')) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 })
  }

  const parsed = StageUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Validation failed' }, { status: 422 })
  }

  const project = await prisma.project.findUnique({
    where:   { id: projectId },
    include: { ward: true },
  })
  if (!project) {
    return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 })
  }

  // Update project stage + append history
  const [updated] = await prisma.$transaction([
    prisma.project.update({
      where: { id: projectId },
      data:  { currentStage: parsed.data.stage, updatedAt: new Date() },
    }),
    prisma.projectStageHistory.create({
      data: {
        projectId,
        stage:     parsed.data.stage,
        notes:     parsed.data.notes ?? null,
        updatedBy: session!.userId,
      },
    }),
  ])

  await writeAuditLog({
    actorId:    session!.userId,
    action:     'PROJECT_STAGE_UPDATED',
    entityType: 'Project',
    entityId:   projectId,
    metadata:   { from: project.currentStage, to: parsed.data.stage },
    ipAddress:  getClientIp(request),
  })

  // Notify all users who filed reports on this project
  const reporters = await prisma.whistleblowerReport.findMany({
    where:   { projectId },
    include: { user: { select: { phoneNumber: true, fullName: true } } },
    distinct: ['userId'],
  })

  const stageLabels: Record<string, string> = {
    ALLOCATED: 'Budget Allocated',
    TENDERED:  'Tender Awarded',
    ONGOING:   'Construction Ongoing',
    COMPLETED: 'Project Completed',
  }

  for (const reporter of reporters) {
    sendProjectUpdateSms(
      reporter.user.phoneNumber,
      reporter.user.fullName.split(' ')[0],
      project.title,
      stageLabels[parsed.data.stage] ?? parsed.data.stage
    ).catch(e => console.error('[SMS stage update]', e))
  }

  return NextResponse.json({
    success: true,
    data:    { projectId, newStage: parsed.data.stage, notified: reporters.length },
    message: `Project stage updated to ${parsed.data.stage}`,
  })
}
