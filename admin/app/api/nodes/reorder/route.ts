import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { reorderNodesSchema } from '@/lib/zod-schemas'
import { createErrorResponse, handleValidationError, handleUnknownError } from '@/lib/errors'
import { ZodError } from 'zod'

// Mark route as dynamic
export const dynamic = 'force-dynamic'

/**
 * POST /api/nodes/reorder
 * Reorder children of a parent node (for drag-and-drop)
 * 
 * Body:
 * {
 *   parentId: string (required)
 *   orderedIds: string[] (required - array of child IDs in desired order)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validated = reorderNodesSchema.parse(body)

    // Verify parent exists
    const parent = await prisma.node.findUnique({
      where: { id: validated.parentId },
      include: { children: true },
    })

    if (!parent) {
      return createErrorResponse('Parent node not found', 404)
    }

    // Verify all child IDs belong to this parent
    const parentChildIds = new Set(parent.children.map(c => c.id))
    const invalidIds = validated.orderedIds.filter((id: string) => !parentChildIds.has(id))

    if (invalidIds.length > 0) {
      return createErrorResponse(
        `Invalid child IDs: ${invalidIds.join(', ')}`,
        400
      )
    }

    // Verify all children are included
    if (validated.orderedIds.length !== parent.children.length) {
      return createErrorResponse(
        'orderedIds must include all children',
        400
      )
    }

    // Update order for each child in a transaction
    await prisma.$transaction(
      validated.orderedIds.map((childId: string, index: number) =>
        prisma.node.update({
          where: { id: childId },
          data: { order: index },
        })
      )
    )

    // Fetch updated children
    const children = await prisma.node.findMany({
      where: { parentId: validated.parentId },
      orderBy: { order: 'asc' },
      select: {
        id: true,
        title: true,
        slug: true,
        path: true,
        order: true,
      },
    })

    return NextResponse.json({ children })
  } catch (error) {
    if (error instanceof ZodError) {
      return handleValidationError(error)
    }
    return handleUnknownError(error)
  }
}

