// CRITICAL: Import Prisma Client from admin's node_modules, not root
// This ensures we use the client generated from admin/prisma/schema.prisma
import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

// Validate DATABASE_URL before creating Prisma Client
if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL environment variable is not set. ' +
    'Please configure it in Vercel environment variables for the admin project.'
  )
}

// Validate DATABASE_URL format
const dbUrl = process.env.DATABASE_URL
if (!dbUrl.startsWith('postgresql://') && !dbUrl.startsWith('postgres://')) {
  console.error('[DB ERROR] DATABASE_URL format is invalid. Expected postgresql:// or postgres://')
  console.error('[DB ERROR] Current DATABASE_URL starts with:', dbUrl.substring(0, 20))
  throw new Error(
    'DATABASE_URL must start with postgresql:// or postgres://. ' +
    'Current value starts with: ' + dbUrl.substring(0, 20)
  )
}

// Prisma Client reads DATABASE_URL from environment variables automatically
// CRITICAL: DISABLE_ACCELERATE=1 must be set in Vercel environment variables
// Without it, Prisma will try to use Accelerate in Edge runtime, requiring prisma:// URLs
const disableAccelerate = process.env.DISABLE_ACCELERATE === '1' || process.env.DISABLE_ACCELERATE === 'true'

if (!disableAccelerate) {
  console.error('[DB ERROR] DISABLE_ACCELERATE is not set to "1" or "true"')
  console.error('[DB ERROR] Current value:', process.env.DISABLE_ACCELERATE)
  console.error('[DB ERROR] This will cause Prisma to require prisma:// URLs')
  console.error('[DB ERROR] Set DISABLE_ACCELERATE=1 in Vercel → Admin Project → Environment Variables')
}

// CRITICAL: Verify we're in Node.js runtime before creating Prisma Client
// Edge runtime doesn't have process.versions.node
if (typeof process === 'undefined' || !process.versions?.node) {
  const error = 'CRITICAL: Prisma Client cannot be created in Edge runtime. This module must run in Node.js runtime.'
  console.error('[DB ERROR]', error)
  throw new Error(error)
}

// Log runtime information
console.log('[DB INIT] Runtime check:')
console.log('[DB INIT] - typeof EdgeRuntime:', typeof (globalThis as any).EdgeRuntime)
console.log('[DB INIT] - process.versions.node:', process.versions?.node || 'not available')
console.log('[DB INIT] - DISABLE_ACCELERATE:', process.env.DISABLE_ACCELERATE)
console.log('[DB INIT] - DATABASE_URL starts with:', dbUrl.substring(0, 30))

// CRITICAL: Check Prisma client version and engine type
// This will show if Accelerate is still enabled in the generated client
try {
  const PrismaClientModule = require('@prisma/client')
  const prismaVersion = (PrismaClientModule as any).Prisma?.prismaVersion || 
                        (PrismaClientModule as any).prismaVersion ||
                        'unknown'
  console.log('[DB INIT] - Prisma client version:', JSON.stringify(prismaVersion))
  
  // Check if the client has Accelerate engine
  if (typeof prismaVersion === 'object' && prismaVersion.engine === 'accelerate') {
    console.error('[DB INIT] ❌ ERROR: Prisma client was generated with Accelerate engine!')
    console.error('[DB INIT] This means the schema used during generation had Accelerate enabled')
    console.error('[DB INIT] Clear Vercel build cache and redeploy')
  } else {
    console.log('[DB INIT] ✅ Prisma client engine:', prismaVersion.engine || 'standard')
  }
} catch (e) {
  console.warn('[DB INIT] Could not check Prisma version:', e)
}

// Create Prisma Client with explicit configuration to avoid Accelerate
// CRITICAL: Ensure DISABLE_ACCELERATE is set before creating the client
// Prisma checks this at client creation time, not at query time
if (!disableAccelerate) {
  throw new Error(
    'DISABLE_ACCELERATE must be set to "1" before creating Prisma Client. ' +
    'Current value: ' + (process.env.DISABLE_ACCELERATE || 'undefined')
  )
}

// Force Node.js runtime detection by ensuring process is available
if (typeof process === 'undefined') {
  throw new Error('Prisma Client requires Node.js runtime. Edge runtime is not supported.')
}

// Create Prisma Client
// NOTE: If this throws "URL must start with prisma://", it means the Prisma client
// was generated with Accelerate enabled. This happens when Vercel uses a cached
// Prisma client from a previous build. SOLUTION: Clear Vercel build cache and redeploy.
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn']
      : ['error'],
  })
  
// Note: Prisma client initialization happens lazily on first query
// If you see "URL must start with prisma://" errors, it means the Prisma client
// was generated with Accelerate enabled. Clear Vercel build cache and redeploy.

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

