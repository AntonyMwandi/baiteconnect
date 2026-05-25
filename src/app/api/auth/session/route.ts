// src/app/api/auth/session/route.ts
// POST /api/auth/session  — create session after OTP verify (sets HttpOnly cookie)
// GET  /api/auth/session  — return current session info
// DELETE /api/auth/session — logout (clears cookie)

import { NextRequest, NextResponse } from 'next/server'
import { createSession, verifySession, getClientIp } from '@/lib/auth'
import { writeAuditLog } from '@/lib/security'
import prisma from '@/lib/prisma'

const COOKIE_NAME = 'baiteconnect-session'
const COOKIE_OPTS = {
  httpOnly:  true,
  secure:    process.env.NODE_ENV === 'production',
  sameSite:  'lax' as const,
  path:      '/',
  maxAge:    60 * 60 * 24 * 7, // 7 days
}

// ── POST — create session ─────────────────────────────────────
export async function POST(request: NextRequest) {
  let body: { userId?: string; phoneNumber?: string } = {}
  try { body = await request.json() } catch { /* empty body ok */ }

  const { userId, phoneNumber } = body
  if (!userId && !phoneNumber) {
    return NextResponse.json({ success: false, error: 'userId or phoneNumber required' }, { status: 400 })
  }

  // Load user
  const user = userId
    ? await prisma.user.findUnique({ where: { id: userId } })
    : await prisma.user.findUnique({ where: { phoneNumber: phoneNumber! } })

  if (!user) {
    return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
  }
  if (!user.isPhoneVerified) {
    return NextResponse.json({ success: false, error: 'Phone not verified' }, { status: 403 })
  }

  const token = await createSession({
    userId:      user.id,
    role:        user.role,
    wardId:      user.assignedWardId ?? undefined,
    phoneNumber: user.phoneNumber,
    fullName:    user.fullName,
  })

  await writeAuditLog({
    actorId:    user.id,
    action:     'SESSION_CREATED',
    entityType: 'User',
    entityId:   user.id,
    metadata:   { role: user.role },
    ipAddress:  getClientIp(request),
  })

  const res = NextResponse.json({
    success: true,
    data: {
      userId:   user.id,
      role:     user.role,
      fullName: user.fullName,
    },
  })
  res.cookies.set(COOKIE_NAME, token, COOKIE_OPTS)
  return res
}

// ── GET — read current session ────────────────────────────────
export async function GET(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value
  if (!token) {
    return NextResponse.json({ success: false, error: 'No session' }, { status: 401 })
  }

  const session = await verifySession(token)
  if (!session) {
    const res = NextResponse.json({ success: false, error: 'Invalid session' }, { status: 401 })
    res.cookies.delete(COOKIE_NAME)
    return res
  }

  // Refresh user data from DB to pick up any role changes
  const user = await prisma.user.findUnique({
    where:  { id: session.userId },
    select: { id: true, fullName: true, role: true, phoneNumber: true, assignedWardId: true, isPhoneVerified: true },
  })

  if (!user) {
    const res = NextResponse.json({ success: false, error: 'User no longer exists' }, { status: 401 })
    res.cookies.delete(COOKIE_NAME)
    return res
  }

  return NextResponse.json({
    success: true,
    data: {
      userId:        user.id,
      role:          user.role,
      fullName:      user.fullName,
      phoneNumber:   user.phoneNumber,
      assignedWardId:user.assignedWardId,
    },
  })
}

// ── DELETE — logout ───────────────────────────────────────────
export async function DELETE(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value
  if (token) {
    const session = await verifySession(token)
    if (session) {
      await writeAuditLog({
        actorId:    session.userId,
        action:     'SESSION_DESTROYED',
        entityType: 'User',
        entityId:   session.userId,
        ipAddress:  getClientIp(request),
      })
    }
  }

  const res = NextResponse.json({ success: true, message: 'Logged out' })
  res.cookies.set(COOKIE_NAME, '', { ...COOKIE_OPTS, maxAge: 0 })
  return res
}
