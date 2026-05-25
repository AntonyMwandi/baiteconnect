// src/app/api/wards/[subCounty]/route.ts
// GET /api/wards/[subCounty] — wards filtered by sub-county for the memo form

import { NextRequest, NextResponse } from 'next/server'
import prisma                        from '@/lib/prisma'

type Params = { params: Promise<{ subCounty: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { subCounty } = await params
  const decoded       = decodeURIComponent(subCounty)

  const wards = await prisma.ward.findMany({
    where:   { subCounty: decoded, isActive: true },
    select:  { id: true, wardName: true, subCounty: true },
    orderBy: { wardName: 'asc' },
  })

  if (!wards.length) {
    return NextResponse.json({ success: false, error: `No wards found for sub-county: ${decoded}` }, { status: 404 })
  }

  return NextResponse.json({ success: true, data: wards })
}
