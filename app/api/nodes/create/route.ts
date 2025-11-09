import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { calculateNodePath } from '@/lib/nodeHelpers'
import { createNodeSchema } from '@/lib/validation/nodes'
import { createErrorResponse, handleValidationError, handleUnknownError } from '@/lib/utils/errors'
import { ZodError } from 'zod'

/**
 * POST /api/nodes/create
 * Create a new node
 * 
 * Body:
 * {
 *   title: string (required)
 *   slug: string (required)
 *   parentId?: string (optional - for top-level, omit or null)
 *   content?: any[] (optional - content blocks)
 *   order?: number (optional - defaults to last child + 1)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validated = createNodeSchema.parse(body)

    // Check if slug already exists under this parent
    const existing = await prisma.node.findFirst({
      where: {
        slug: validated.slug,
        parentId: validated.parentId || null,
      },
    })

    if (existing) {
      return createErrorResponse(
        'A node with this slug already exists under this parent',
        409
      )
    }

    // Calculate order (default to last child + 1)
    let order = validated.order
    if (order === undefined) {
      const lastChild = await prisma.node.findFirst({
        where: { parentId: validated.parentId || null },
        orderBy: { order: 'desc' },
      })
      order = lastChild ? lastChild.order + 1 : 0
    }

    // Calculate path
    const path = await calculateNodePath(validated.slug, validated.parentId || null)

    // Create the node
    const node = await prisma.node.create({
      data: {
        title: validated.title,
        slug: validated.slug,
        parentId: validated.parentId || null,
        path,
        content: validated.content || [],
        order,
      },
      include: {
        children: {
          orderBy: { order: 'asc' },
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

    return NextResponse.json(node, { status: 201 })
  } catch (error) {
    if (error instanceof ZodError) {
      return handleValidationError(error)
    }
    return handleUnknownError(error)
  }
}

