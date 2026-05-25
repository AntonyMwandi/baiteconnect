// src/lib/auth.ts
// BaiteConnect — JWT-based session management

import { SignJWT, jwtVerify } from 'jose'
import { cookies }            from 'next/headers'
import type { UserRole }      from '@/types'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'dev-secret-replace-in-production-use-64-chars'
)

export interface SessionPayload {
  userId:      string
  role:        UserRole
  wardId?:     number
  phoneNumber: string
  fullName?:   string
  iat?:        number
  exp?:        number
}

export async function createSession(payload: Omit<SessionPayload, 'iat' | 'exp'>): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET)
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as SessionPayload
  } catch {
    return null
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  const token       = cookieStore.get('baiteconnect-session')?.value
  if (!token) return null
  return verifySession(token)
}

export function getClientIp(request: Request): string {
  return (
    request.headers.get('cf-connecting-ip') ??
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    '0.0.0.0'
  )
}

export function requireRole(session: SessionPayload | null, ...roles: UserRole[]): boolean {
  if (!session) return false
  return roles.includes(session.role)
}
