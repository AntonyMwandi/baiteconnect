// src/app/api/admin/reports/route.ts
// GET /api/admin/reports — list all whistleblower reports for admin

import { NextRequest, NextResponse }  from 'next/server'
import prisma                          from '@/lib/prisma'
import { getSession, requireRole }     from '@/lib/auth'

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!requireRole(session, 'COUNTY_ADMIN', 'GOVERNOR_EXEC')) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')

  const where: Record<string, unknown> = {}
  if (status) where.status = status

  const reports = await prisma.whistleblowerReport.findMany({
    where,
    include: {
      project: { include: { ward: { select: { wardName: true, subCounty: true } } } },
      user:    { select: { fullName: true, phoneNumber: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ success: true, data: reports })
}
