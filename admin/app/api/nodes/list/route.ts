import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { listNodesSchema } from '@/lib/zod-schemas'
import { createErrorResponse, handleUnknownError } from '@/lib/errors'

/**
 * GET /api/nodes/list
 * List all nodes or children of a specific parent
 * 
 * Query params:
 * - parentId: optional - filter by parent ID
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const parentId = searchParams.get('parentId') || undefined

    // Validate query parameters
    const validated = listNodesSchema.parse({ parentId })

    const nodes = await prisma.node.findMany({
      where: validated.parentId ? { parentId: validated.parentId } : undefined,
      select: {
        id: true,
        title: true,
        slug: true,
        path: true,
        order: true,
        parentId: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [
        { order: 'asc' },
        { createdAt: 'asc' },
      ],
    })

    return NextResponse.json(nodes)
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return createErrorResponse('Invalid query parameters', 400)
    }
    return handleUnknownError(error)
  }
}

