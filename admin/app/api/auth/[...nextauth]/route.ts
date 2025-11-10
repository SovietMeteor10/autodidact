// CRITICAL: Force Node.js runtime - MUST be first line
// Edge runtime forces Prisma Accelerate which requires prisma:// URLs
export const runtime = "nodejs"

import { handlers } from "@/auth"

// Verify we're in Node.js runtime (not Edge)
// Edge runtime doesn't have process.versions.node
if (typeof process === 'undefined' || !process.versions?.node) {
  const error = 'CRITICAL: This route is running in Edge runtime. Prisma requires Node.js runtime. Ensure middleware is disabled and runtime="nodejs" is set.'
  console.error('[AUTH ERROR]', error)
  throw new Error(error)
}

export const { GET, POST } = handlers

