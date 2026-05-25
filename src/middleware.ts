// src/middleware.ts
// Server-side route guard — runs on every request before rendering
// Protects /admin/* routes by verifying the JWT session cookie

import { NextRequest, NextResponse } from 'next/server'
import { verifySession }             from '@/lib/auth'

const PUBLIC_ADMIN_PATHS = ['/admin/login']
const ADMIN_ROLES        = ['COUNTY_ADMIN', 'GOVERNOR_EXEC', 'MCA']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Only guard /admin routes
  if (!pathname.startsWith('/admin')) return NextResponse.next()

  // Login page is always public
  if (PUBLIC_ADMIN_PATHS.includes(pathname)) return NextResponse.next()

  const token   = request.cookies.get('baiteconnect-session')?.value
  const session = token ? await verifySession(token) : null

  // No session → redirect to login
  if (!session) {
    const loginUrl = new URL('/admin/login', request.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Wrong role → redirect to login with denied param
  if (!ADMIN_ROLES.includes(session.role)) {
    const loginUrl = new URL('/admin/login', request.url)
    loginUrl.searchParams.set('denied', '1')
    return NextResponse.redirect(loginUrl)
  }

  // Inject user info as headers for server components
  const response = NextResponse.next()
  response.headers.set('x-user-id',   session.userId)
  response.headers.set('x-user-role', session.role)
  return response
}

export const config = {
  matcher: ['/admin/:path*'],
}
