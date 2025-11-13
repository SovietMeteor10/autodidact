import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { calculateNodePath } from '@/lib/nodeHelpers'
import { createNodeSchema } from '@/lib/zod-schemas'
import { createErrorResponse, handleValidationError, handleUnknownError } from '@/lib/errors'
import { ZodError } from 'zod'

// Mark route as dynamic
export const dynamic = 'force-dynamic'

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

    // Handle content: preserve string for child nodes, use array for top/mid level
    // If content is undefined, default based on whether it's a child node
    let contentValue: any
    if (validated.content !== undefined) {
      contentValue = validated.content
    } else {
      // Default: empty array for top/mid level, empty string for child nodes
      // We can't determine node type here, so default to empty array
      contentValue = []
    }

    // Handle tags - for explicit many-to-many, we need to create NodeTag records separately
    const tagIds = body.tagIds || []

    // Create the node first
    const node = await prisma.node.create({
      data: {
        title: validated.title,
        slug: validated.slug,
        parentId: validated.parentId || null,
        path,
        content: contentValue,
        order,
      },
    })

    // Then create the tag relationships if any
    if (tagIds.length > 0) {
      await prisma.nodeTag.createMany({
        data: tagIds.map((tagId: string) => ({
          nodeId: node.id,
          tagId: tagId,
        })),
        skipDuplicates: true, // In case of duplicates
      })
    }

    // Fetch the node with all relations
    const nodeWithRelations = await prisma.node.findUnique({
      where: { id: node.id },
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
        tags: {
          select: {
            tag: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    })

    // Transform the tags to match the expected format
    const transformedNode = nodeWithRelations ? {
      ...nodeWithRelations,
      tags: nodeWithRelations.tags.map((nt: any) => nt.tag),
    } : node

    return NextResponse.json(transformedNode, { status: 201 })
  } catch (error) {
    if (error instanceof ZodError) {
      return handleValidationError(error)
    }
    return handleUnknownError(error)
  }
}

