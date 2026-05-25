// src/app/api/projects/[id]/report/route.ts
// POST /api/projects/[id]/report — submit a whistleblower report

import { NextRequest, NextResponse }  from 'next/server'
import { z }                          from 'zod'
import prisma                         from '@/lib/prisma'
import { checkRateLimit, validateGeoLocation,
         isWithinMeruBounds, writeAuditLog }  from '@/lib/security'
import { sendWhistleblowerAck }               from '@/lib/sms'
import { getClientIp }                        from '@/lib/auth'

const ReportSchema = z.object({
  userId:          z.string().uuid(),
  reportText:      z.string().min(20).max(2000),
  photoEvidenceUrl:z.string().url('A geo-tagged photo URL is required'),
  evidenceLat:     z.number().min(-90).max(90),
  evidenceLng:     z.number().min(-180).max(180),
  phoneNumber:     z.string().optional(),
  firstName:       z.string().optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params
  const ip                = getClientIp(request)

  // Rate limit per IP
  const rate = await checkRateLimit(`whistleblow:${ip}`)
  if (!rate.allowed) {
    return NextResponse.json({ success: false, error: 'Too many reports. Please wait.' }, { status: 429 })
  }

  // Validate project exists
  const project = await prisma.project.findUnique({
    where:   { id: projectId },
    include: { ward: true },
  })
  if (!project) {
    return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 })
  }

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 })
  }

  const parsed = ReportSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Validation failed', details: parsed.error.flatten() }, { status: 422 })
  }

  const { userId, reportText, photoEvidenceUrl, evidenceLat, evidenceLng } = parsed.data

  // Verify user exists
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) {
    return NextResponse.json({ success: false, error: 'User not found. Please verify your identity first.' }, { status: 403 })
  }

  // Geo validation — reporter must be within Meru County bounds
  if (!isWithinMeruBounds(evidenceLat, evidenceLng)) {
    return NextResponse.json(
      { success: false, error: 'Your location appears to be outside Meru County. Please submit from the project site.' },
      { status: 422 }
    )
  }

  // PostGIS ward check
  const geoResult = await validateGeoLocation(evidenceLat, evidenceLng, project.wardId)

  // Create the report
  const report = await prisma.whistleblowerReport.create({
    data: {
      projectId,
      userId,
      reportText,
      photoEvidenceUrl,
      evidenceLat,
      evidenceLng,
      status: 'UNDER_REVIEW',
    },
  })

  // Check if project should be flagged for audit (3+ active reports)
  const activeReports = await prisma.whistleblowerReport.count({
    where: { projectId, status: { not: 'RESOLVED' } },
  })

  await writeAuditLog({
    actorId:    userId,
    action:     'WHISTLEBLOWER_REPORT_FILED',
    entityType: 'WhistleblowerReport',
    entityId:   report.id,
    metadata:   {
      projectTitle:    project.title,
      wardName:        project.ward.wardName,
      withinWard:      geoResult.isWithinWard,
      totalActiveReports: activeReports,
    },
    ipAddress: ip,
  })

  // SMS acknowledgement
  if (parsed.data.phoneNumber && parsed.data.firstName) {
    sendWhistleblowerAck(parsed.data.phoneNumber, parsed.data.firstName, project.title)
      .catch(e => console.error('[SMS whistleblow]', e))
  }

  return NextResponse.json({
    success: true,
    data: {
      reportId:           report.id,
      projectTitle:       project.title,
      wardName:           project.ward.wardName,
      activeReportCount:  activeReports,
      projectFlaggedForAudit: activeReports >= 3,
    },
    message: 'Your report has been escalated to the County Project Delivery Unit.',
  }, { status: 201 })
}
