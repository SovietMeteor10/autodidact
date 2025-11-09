import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from './auth'

/**
 * Middleware configuration
 * Protects admin routes and API endpoints
 */
export const config = {
  matcher: [
    '/admin/:path*',
    '/api/nodes/:path*',
  ],
}

/**
 * Middleware to protect admin routes
 */
export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname

  // Allow access to login page and auth API routes without authentication
  if (pathname === '/login' || pathname.startsWith('/api/auth/')) {
    return NextResponse.next()
  }

  // Allow unauthenticated access in development if explicitly enabled
  if (process.env.NODE_ENV === 'development' && process.env.ALLOW_UNAUTHENTICATED === 'true') {
    return NextResponse.next()
  }

  // Check if user is authenticated using NextAuth
  const session = await auth()

  if (!session?.user) {
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

