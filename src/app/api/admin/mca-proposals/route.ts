// src/app/api/admin/mca-proposals/route.ts
// GET  /api/admin/mca-proposals  — list proposals
// POST /api/admin/mca-proposals  — file new proposal

import { NextRequest, NextResponse }            from 'next/server'
import { z }                                    from 'zod'
import prisma                                   from '@/lib/prisma'
import { getSession, requireRole, getClientIp } from '@/lib/auth'
import { writeAuditLog }                        from '@/lib/security'
import { CURRENT_FISCAL_YEAR }                  from '@/types'

const CreateSchema = z.object({
  wardId:        z.number().int().positive(),
  fiscalYear:    z.string().default(CURRENT_FISCAL_YEAR),
  title:         z.string().min(5).max(150),
  description:   z.string().max(2000).optional(),
  sector:        z.enum(['Health','Agriculture','Roads & Infrastructure','Water & Environment','General Public Service']),
  estimatedCost: z.number().positive().optional(),
})

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!requireRole(session, 'COUNTY_ADMIN', 'GOVERNOR_EXEC', 'MCA')) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const fiscalYear = searchParams.get('fiscalYear') ?? CURRENT_FISCAL_YEAR
  const wardId     = searchParams.get('wardId')

  const where: Record<string, unknown> = { fiscalYear }
  if (wardId) where.wardId = parseInt(wardId, 10)

  const proposals = await prisma.mcaProposal.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ success: true, data: proposals })
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!requireRole(session, 'COUNTY_ADMIN', 'GOVERNOR_EXEC', 'MCA')) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = CreateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Validation failed', details: parsed.error.flatten() }, { status: 422 })
  }

  const ward = await prisma.ward.findUnique({ where: { id: parsed.data.wardId } })
  if (!ward) return NextResponse.json({ success: false, error: 'Ward not found' }, { status: 404 })

  const proposal = await prisma.mcaProposal.create({ data: parsed.data })

  await writeAuditLog({
    actorId:    session!.userId,
    action:     'MCA_PROPOSAL_FILED',
    entityType: 'McaProposal',
    entityId:   proposal.id,
    metadata:   { wardName: ward.wardName, sector: parsed.data.sector, fiscalYear: parsed.data.fiscalYear },
    ipAddress:  getClientIp(request),
  })

  return NextResponse.json({ success: true, data: proposal }, { status: 201 })
}
