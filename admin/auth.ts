// Force Node.js runtime (required for Prisma and bcrypt)
export const runtime = "nodejs"

import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/db"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import NextAuth from "next-auth"
import type { PrismaClient } from "@prisma/client"

// Helper to safely access user model with detailed error reporting
// Uses type assertion to avoid TypeScript errors during build
function getUserModel() {
  // Type assertion to access user model (TypeScript may not see it during build)
  const prismaWithUser = prisma as any
  
  // Check DATABASE_URL first
  if (!process.env.DATABASE_URL) {
    const errorMsg = 'DATABASE_URL environment variable is not set. Please configure it in Vercel environment variables.'
    console.error('[AUTH ERROR]', errorMsg)
    throw new Error(errorMsg)
  }
  
  const prismaModels = Object.keys(prisma).filter(k => !k.startsWith('$'))
  
  if (!prismaWithUser.user) {
    const errorMsg = `Prisma client missing User model. Available models: ${prismaModels.join(', ')}. This means the Prisma client was not generated with the User model from schema.prisma. Check that prebuild script runs correctly.`
    console.error('[AUTH ERROR]', errorMsg)
    console.error('[AUTH ERROR] Prisma client type:', typeof prisma)
    console.error('[AUTH ERROR] Prisma client keys:', Object.keys(prisma))
    throw new Error(errorMsg)
  }
  
  return prismaWithUser.user
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma as any),
  session: { strategy: "jwt" },
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // CRITICAL: Verify Node.js runtime before using Prisma
        if (typeof process === 'undefined' || !process.versions?.node) {
          console.error('[AUTH ERROR] Running in Edge runtime - Prisma cannot work here')
          console.error('[AUTH ERROR] DISABLE_ACCELERATE:', process.env.DISABLE_ACCELERATE)
          return null
        }

        if (!credentials?.email || !credentials?.password) {
          console.log('[AUTH DEBUG] Missing email or password')
          return null
        }

        // Normalize email to lowercase for case-insensitive matching
        const email = (credentials.email as string).toLowerCase().trim()
        const password = credentials.password as string

        console.log('[AUTH DEBUG] Attempting login for email:', email)
        console.log('[AUTH DEBUG] Runtime check - process.versions.node:', process.versions?.node)
        console.log('[AUTH DEBUG] DISABLE_ACCELERATE:', process.env.DISABLE_ACCELERATE)

        // Get user model with runtime check
        const userModel = getUserModel()
        const user = await userModel.findUnique({
          where: { email }
        })

        if (!user) {
          console.log('[AUTH DEBUG] User not found for email:', email)
          return null
        }

        if (!user.passwordHash) {
          console.log('[AUTH DEBUG] User found but has no passwordHash')
          return null
        }

        console.log('[AUTH DEBUG] User found, comparing password...')
        console.log('[AUTH DEBUG] Password hash exists:', !!user.passwordHash)
        console.log('[AUTH DEBUG] Hash length:', user.passwordHash?.length)

        const valid = await bcrypt.compare(password, user.passwordHash)

        if (!valid) {
          console.log('[AUTH DEBUG] Password comparison failed')
          return null
        }

        console.log('[AUTH DEBUG] Password valid, returning user')
        return {
          id: user.id,
          email: user.email,
          name: user.name,
        }
      }
    })
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.name = token.name as string
      }
      return session
    },
  },
})

