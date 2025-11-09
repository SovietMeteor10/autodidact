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
// Don't pass datasourceUrl explicitly - it should come from the schema
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn']
      : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

