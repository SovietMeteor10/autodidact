import { auth } from '@/auth'
import { NextResponse } from 'next/server'

/**
 * Helper function to protect API routes
 * Returns the session if authenticated, or null if not
 * Use this in API route handlers to check authentication
 */
export async function requireAuth() {
  const session = await auth()
  
  if (!session?.user) {
    return null
  }
  
  return session
}

/**
 * Helper to return 401 Unauthorized response
 */
export function unauthorizedResponse() {
  return NextResponse.json(
    { error: 'Unauthorized' },
    { status: 401 }
  )
}

