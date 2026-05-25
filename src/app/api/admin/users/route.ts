// src/app/api/admin/users/route.ts
// GET /api/admin/users — paginated user listing for admin panel

import { NextRequest, NextResponse }  from 'next/server'
import prisma                          from '@/lib/prisma'
import { getSession, requireRole }     from '@/lib/auth'

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!requireRole(session, 'COUNTY_ADMIN', 'GOVERNOR_EXEC')) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const search     = searchParams.get('search')
  const role       = searchParams.get('role')
  const page       = parseInt(searchParams.get('page')  ?? '1',  10)
  const limit      = Math.min(parseInt(searchParams.get('limit') ?? '20', 10), 100)

  const where: Record<string, unknown> = {}
  if (role) where.role = role
  if (search) {
    where.OR = [
      { fullName:    { contains: search, mode: 'insensitive' } },
      { phoneNumber: { contains: search } },
    ]
  }

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      select: {
        id: true, fullName: true, phoneNumber: true, role: true,
        isPhoneVerified: true, assignedWardId: true, createdAt: true,
        managedWards: { select: { wardName: true, subCounty: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip:    (page - 1) * limit,
      take:    limit,
    }),
  ])

  return NextResponse.json({ success: true, data: { users, total, page, limit } })
}
