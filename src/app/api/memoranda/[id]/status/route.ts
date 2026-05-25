// src/app/api/memoranda/[id]/status/route.ts
// PATCH /api/memoranda/[id]/status — admin approve/flag/shadow-ban

import { NextRequest, NextResponse }            from 'next/server'
import { z }                                    from 'zod'
import prisma                                   from '@/lib/prisma'
import { getSession, requireRole, getClientIp } from '@/lib/auth'
import { writeAuditLog }                        from '@/lib/security'

const Schema = z.object({
  status: z.enum(['APPROVED','UNDER_REVIEW','SHADOW_BANNED','PENDING']),
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
    return NextResponse.json({ success: false, error: 'Invalid status value' }, { status: 422 })
  }

  const memo = await prisma.memorandum.findUnique({ where: { id } })
  if (!memo) return NextResponse.json({ success: false, error: 'Memo not found' }, { status: 404 })

  const updated = await prisma.memorandum.update({
    where: { id },
    data:  { moderationStatus: parsed.data.status },
  })

  await writeAuditLog({
    actorId:    session!.userId,
    action:     'MEMO_STATUS_UPDATED',
    entityType: 'Memorandum',
    entityId:   id,
    metadata:   { from: memo.moderationStatus, to: parsed.data.status },
    ipAddress:  getClientIp(request),
  })

  return NextResponse.json({ success: true, data: { id, status: updated.moderationStatus } })
}
