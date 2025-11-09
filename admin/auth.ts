// Force Node.js runtime (required for Prisma and bcrypt)
export const runtime = "nodejs"

import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/db"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import NextAuth from "next-auth"
import type { PrismaClient } from "@prisma/client"

// Type assertion to ensure User model is available
// This is needed because Prisma client types may not be fully generated during build
const typedPrisma = prisma as PrismaClient & {
  user: {
    findUnique: (args: { where: { email: string } }) => Promise<{
      id: string
      email: string | null
      name: string | null
      passwordHash: string | null
    } | null>
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma as any),
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await typedPrisma.user.findUnique({
          where: { email: credentials.email as string }
        })

        if (!user || !user.passwordHash) {
          return null
        }

        const valid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        )

        if (!valid) {
          return null
        }

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

