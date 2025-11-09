import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getNodeSchema } from '@/lib/zod-schemas'
import { createErrorResponse, handleValidationError, handleUnknownError } from '@/lib/errors'
import { ZodError } from 'zod'

// Mark route as dynamic
export const dynamic = 'force-dynamic'

/**
 * GET /api/nodes/get
 * Get a single node by ID or path
 * 
 * Query params:
 * - id: node ID
 * - path: node path (alternative to id)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id') || undefined
    const path = searchParams.get('path') || undefined

    // Validate query parameters
    const validated = getNodeSchema.parse({ id, path })

    const where = validated.id ? { id: validated.id } : { path: validated.path! }

    const node = await prisma.node.findUnique({
      where,
      include: {
        children: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            title: true,
            slug: true,
            path: true,
            order: true,
          },
        },
        parent: {
          select: {
            id: true,
            title: true,
            slug: true,
            path: true,
          },
        },
      },
    })

    if (!node) {
      return createErrorResponse('Node not found', 404)
    }

    return NextResponse.json(node)
  } catch (error) {
    if (error instanceof ZodError) {
      return handleValidationError(error)
    }
    return handleUnknownError(error)
  }
}

