// src/app/api/health/route.ts
// GET /api/health — system health check for uptime monitoring

import { NextResponse } from 'next/server'
import prisma           from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const start = Date.now()

  const checks: Record<string, { status: 'ok' | 'error'; latencyMs?: number; message?: string }> = {}

  // Database check
  try {
    await prisma.$queryRaw`SELECT 1`
    checks.database = { status: 'ok', latencyMs: Date.now() - start }
  } catch (e: unknown) {
    checks.database = { status: 'error', message: e instanceof Error ? e.message : 'DB unreachable' }
  }

  // Ward count check (confirms seed ran)
  try {
    const wardCount = await prisma.ward.count()
    checks.wards = {
      status: wardCount === 45 ? 'ok' : 'error',
      message: `${wardCount} wards in database (expected 45)`,
    }
  } catch {
    checks.wards = { status: 'error', message: 'Could not count wards' }
  }

  // PostGIS check
  try {
    const result = await prisma.$queryRaw<Array<{ postgis_version: string }>>`SELECT PostGIS_Version() AS postgis_version`
    checks.postgis = { status: 'ok', message: result[0]?.postgis_version ?? 'installed' }
  } catch {
    checks.postgis = { status: 'error', message: 'PostGIS not available' }
  }

  const allOk       = Object.values(checks).every(c => c.status === 'ok')
  const totalLatency = Date.now() - start

  return NextResponse.json(
    {
      status:       allOk ? 'healthy' : 'degraded',
      app:          'BaiteConnect',
      version:      '2.0.0',
      environment:  process.env.NODE_ENV,
      totalLatencyMs: totalLatency,
      checks,
      timestamp:    new Date().toISOString(),
    },
    { status: allOk ? 200 : 503 }
  )
}
