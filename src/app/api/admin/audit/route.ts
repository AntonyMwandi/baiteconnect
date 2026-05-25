// src/app/api/admin/audit/route.ts
// GET /api/admin/audit — paginated audit log

import { NextRequest, NextResponse }  from 'next/server'
import prisma                          from '@/lib/prisma'
import { getSession, requireRole }     from '@/lib/auth'

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!requireRole(session, 'COUNTY_ADMIN', 'GOVERNOR_EXEC')) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const entityType = searchParams.get('entityType')
  const actorId    = searchParams.get('actorId')
  const page       = parseInt(searchParams.get('page')  ?? '1',  10)
  const limit      = Math.min(parseInt(searchParams.get('limit') ?? '30', 10), 100)

  const where: Record<string, unknown> = {}
  if (entityType) where.entityType = entityType
  if (actorId)    where.actorId    = actorId

  const [total, entries] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip:    (page - 1) * limit,
      take:    limit,
      include: {
        // We don't have a direct relation — join manually
      },
    }),
  ])

  // Enrich with actor names
  const actorIds = [...new Set(entries.map(e => e.actorId).filter(Boolean))] as string[]
  const actors   = actorIds.length > 0
    ? await prisma.user.findMany({
        where:  { id: { in: actorIds } },
        select: { id: true, fullName: true, phoneNumber: true },
      })
    : []
  const actorMap = Object.fromEntries(actors.map(a => [a.id, a]))

  const enriched = entries.map(e => ({
    ...e,
    metadata: e.metadata as Record<string, unknown> | null,
    actor: e.actorId ? actorMap[e.actorId] ?? null : null,
  }))

  return NextResponse.json({ success: true, data: { entries: enriched, total, page, limit } })
}
