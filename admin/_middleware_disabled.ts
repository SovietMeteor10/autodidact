import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * MIDDLEWARE DISABLED
 * 
 * This middleware was disabled because Next.js middleware ALWAYS runs in Edge Runtime,
 * which forces Prisma Accelerate mode even when DISABLE_ACCELERATE=1 is set.
 * 
 * Auth protection is now handled in:
 * - Server components (using auth() from @/auth)
 * - API route handlers (using auth() from @/auth)
 * 
 * This ensures all Prisma operations run in Node.js runtime.
 */

// DISABLED - Uncomment to re-enable (but this will break Prisma)
/*
export const config = {
  matcher: [
    '/admin/:path*',
    '/api/nodes/:path*',
  ],
}

export function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname

  // Allow access to login page and auth API routes without authentication
  if (pathname === '/login' || pathname.startsWith('/api/auth/')) {
    return NextResponse.next()
  }

  // Allow unauthenticated access in development if explicitly enabled
  if (process.env.NODE_ENV === 'development' && process.env.ALLOW_UNAUTHENTICATED === 'true') {
    return NextResponse.next()
  }

  // Check for NextAuth session token cookie (lightweight check)
  // NextAuth sets these cookies automatically on successful login
  const sessionToken = req.cookies.get('next-auth.session-token') 
    || req.cookies.get('__Secure-next-auth.session-token')
    || req.cookies.get('authjs.session-token')
    || req.cookies.get('__Secure-authjs.session-token')

  if (!sessionToken) {
    // For API routes, return 401
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // For admin pages, redirect to login
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}
*/

