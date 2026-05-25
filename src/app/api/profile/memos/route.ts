// src/app/api/profile/memos/route.ts
// GET /api/profile/memos — fetch the logged-in user's own memoranda

import { NextRequest, NextResponse } from 'next/server'
import prisma                        from '@/lib/prisma'
import { getSession }                from '@/lib/auth'

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
  }

  const memos = await prisma.memorandum.findMany({
    where:   { userId: session.userId },
    include: { ward: { select: { wardName: true, subCounty: true } } },
    orderBy: { createdAt: 'desc' },
    // Never expose SHADOW_BANNED status to the citizen — show as PENDING
    select: {
      id:               true,
      referenceCode:    true,
      fiscalYear:       true,
      sectorCategory:   true,
      moderationStatus: true,
      createdAt:        true,
      ward:             true,
    },
  })

  // Mask shadow ban from citizen view
  const sanitised = memos.map(m => ({
    ...m,
    moderationStatus: m.moderationStatus === 'SHADOW_BANNED' ? 'PENDING' : m.moderationStatus,
  }))

  return NextResponse.json({ success: true, data: sanitised })
}
