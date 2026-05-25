// src/app/api/admin/mca-proposals/[id]/route.ts
import { NextRequest, NextResponse }            from 'next/server'
import prisma                                   from '@/lib/prisma'
import { getSession, requireRole, getClientIp } from '@/lib/auth'
import { writeAuditLog }                        from '@/lib/security'

type Params = { params: Promise<{ id: string }> }

export async function DELETE(request: NextRequest, { params }: Params) {
  const session = await getSession()
  if (!requireRole(session, 'COUNTY_ADMIN', 'GOVERNOR_EXEC')) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  await prisma.mcaProposal.delete({ where: { id } })
  await writeAuditLog({
    actorId: session!.userId, action: 'MCA_PROPOSAL_DELETED',
    entityType: 'McaProposal', entityId: id, ipAddress: getClientIp(request),
  })
  return NextResponse.json({ success: true, message: 'Proposal deleted' })
}
