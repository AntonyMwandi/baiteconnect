// src/app/api/wards/route.ts
// GET /api/wards — list all 45 wards with submission counts for leaderboard

import { NextRequest, NextResponse } from 'next/server'
import prisma                        from '@/lib/prisma'
import { CURRENT_FISCAL_YEAR }       from '@/types'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const subCounty  = searchParams.get('subCounty')
  const fiscalYear = searchParams.get('fiscalYear') ?? CURRENT_FISCAL_YEAR

  const where: Record<string, unknown> = {}
  if (subCounty) where.subCounty = subCounty

  const wards = await prisma.ward.findMany({
    where,
    include: {
      _count: {
        select: {
          memoranda: {
            where: {
              fiscalYear,
              moderationStatus: 'APPROVED',
            },
          },
        },
      },
      mcaUser: {
        select: { fullName: true },
      },
    },
    orderBy: { wardName: 'asc' },
  })

  // Sort by submission count descending and attach rank
  const ranked = [...wards]
    .sort((a, b) => b._count.memoranda - a._count.memoranda)
    .map((ward, idx) => ({
      id:              ward.id,
      wardName:        ward.wardName,
      subCounty:       ward.subCounty,
      mcaName:         ward.mcaUser?.fullName ?? null,
      submissionCount: ward._count.memoranda,
      rank:            idx + 1,
    }))

  return NextResponse.json({ success: true, data: ranked })
}
