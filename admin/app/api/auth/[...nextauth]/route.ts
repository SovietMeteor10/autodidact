import { handlers } from "@/auth"

// Force Node.js runtime (required for Prisma and bcrypt)
export const runtime = "nodejs"

export const { GET, POST } = handlers

