// src/app/api/projects/route.ts
// GET  /api/projects — public project listing
// POST /api/projects — admin create project

import { NextRequest, NextResponse }             from 'next/server'
import { z }                                     from 'zod'
import prisma                                    from '@/lib/prisma'
import { getSession, requireRole, getClientIp }  from '@/lib/auth'
import { writeAuditLog }                         from '@/lib/security'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const wardId = searchParams.get('wardId')
  const stage  = searchParams.get('stage')

  const where: Record<string, unknown> = {}
  if (wardId) where.wardId = parseInt(wardId, 10)
  if (stage)  where.currentStage = stage

  const projects = await prisma.project.findMany({
    where,
    include: {
      ward:         { select: { wardName: true, subCounty: true } },
      stageHistory: { orderBy: { createdAt: 'asc' } },
      _count:       { select: { whistleReports: { where: { status: { not: 'RESOLVED' } } } } },
    },
    orderBy: { updatedAt: 'desc' },
  })

  const enriched = projects.map(p => ({
    ...p,
    allocatedBudget:    Number(p.allocatedBudget),
    activeReportCount:  p._count.whistleReports,
    displayStatus:      p._count.whistleReports >= 3 ? 'UNDER_AUDIT' : p.currentStage,
  }))

  return NextResponse.json({ success: true, data: enriched })
}

const CreateProjectSchema = z.object({
  wardId:          z.number().int().positive(),
  title:           z.string().min(5).max(150),
  description:     z.string().optional(),
  allocatedBudget: z.number().positive(),
  currentStage:    z.enum(['ALLOCATED', 'TENDERED', 'ONGOING', 'COMPLETED']).default('ALLOCATED'),
  contractorName:  z.string().optional(),
  mcaPriorityMatch:z.boolean().default(false),
  latitude:        z.number().optional(),
  longitude:       z.number().optional(),
})

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!requireRole(session, 'COUNTY_ADMIN', 'GOVERNOR_EXEC')) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = CreateProjectSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Validation failed', details: parsed.error.flatten() }, { status: 422 })
  }

  const ward = await prisma.ward.findUnique({ where: { id: parsed.data.wardId } })
  if (!ward) {
    return NextResponse.json({ success: false, error: 'Ward not found' }, { status: 404 })
  }

  const project = await prisma.project.create({
    data: {
      ...parsed.data,
      stageHistory: {
        create: { stage: parsed.data.currentStage, notes: 'Project created', updatedBy: session!.userId },
      },
    },
    include: { ward: true, stageHistory: true },
  })

  await writeAuditLog({
    actorId:    session!.userId,
    action:     'PROJECT_CREATED',
    entityType: 'Project',
    entityId:   project.id,
    ipAddress:  getClientIp(request),
  })

  return NextResponse.json({ success: true, data: project }, { status: 201 })
}
