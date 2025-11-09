import { NextRequest } from 'next/server'

/**
 * Session user type
 */
export interface SessionUser {
  id: string
  email?: string
  name?: string
}

/**
 * Session type
 */
export interface Session {
  user: SessionUser
}

/**
 * Get session from request
 * 
 * TODO: Implement proper authentication
 * Options:
 * - JWT tokens in cookies
 * - Supabase Auth
 * - Clerk
 * - Lucia Auth
 * - NextAuth.js
 * 
 * For now, returns a mock session for development.
 * In production, this should validate tokens/cookies.
 */
export async function getSession(req: NextRequest): Promise<Session | null> {
  // Development: Allow all requests
  // TODO: Remove this in production
  if (process.env.NODE_ENV === 'development') {
    // Check for a simple auth header or cookie
    const authHeader = req.headers.get('authorization')
    const authCookie = req.cookies.get('admin-auth')
    
    // For now, accept any request in development
    // In production, validate the token/cookie here
    if (authHeader || authCookie || process.env.ALLOW_UNAUTHENTICATED === 'true') {
      return {
        user: {
          id: 'admin',
          email: 'admin@autodidact.fun',
          name: 'Admin',
        },
      }
    }
  }

  // Production: Validate session
  // Example with JWT:
  // const token = req.cookies.get('auth-token')?.value
  // if (!token) return null
  // const decoded = await verifyJWT(token)
  // return { user: decoded }

  return null
}

/**
 * Check if user is authenticated
 */
export async function requireAuth(req: NextRequest): Promise<Session> {
  const session = await getSession(req)
  
  if (!session) {
    throw new Error('Unauthorized')
  }
  
  return session
}

