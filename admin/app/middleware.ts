import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSession } from '../lib/auth'

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
  const session = await getSession(req)

  // Allow unauthenticated access in development if explicitly enabled
  if (process.env.NODE_ENV === 'development' && process.env.ALLOW_UNAUTHENTICATED === 'true') {
    return NextResponse.next()
  }

  // Check if user is authenticated
  if (!session?.user) {
    // For API routes, return 401
    if (req.nextUrl.pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // For admin pages, redirect to login
    const loginUrl = new URL('/admin/login', req.url)
    loginUrl.searchParams.set('from', req.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

