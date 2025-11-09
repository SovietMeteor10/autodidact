import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { calculateNodePath, updateDescendantPaths } from '@/lib/nodeHelpers'
import { updateNodeSchema } from '@/lib/validation/nodes'
import { createErrorResponse, handleValidationError, handleUnknownError } from '@/lib/utils/errors'
import { ZodError } from 'zod'

/**
 * POST /api/nodes/update
 * Update a node's metadata and/or content
 * 
 * Body:
 * {
 *   id: string (required)
 *   title?: string
 *   slug?: string
 *   parentId?: string | null
 *   content?: any[]
 *   order?: number
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validated = updateNodeSchema.parse(body)

    // Get current node
    const current = await prisma.node.findUnique({
      where: { id: validated.id },
    })

    if (!current) {
      return createErrorResponse('Node not found', 404)
    }

    // Check if slug is being changed and if it conflicts
    const newSlug = validated.slug !== undefined ? validated.slug : current.slug
    const newParentId = validated.parentId !== undefined 
      ? (validated.parentId || null) 
      : current.parentId

    if (validated.slug !== undefined || validated.parentId !== undefined) {
      const existing = await prisma.node.findFirst({
        where: {
          slug: newSlug,
          parentId: newParentId,
          NOT: { id: validated.id },
        },
      })

      if (existing) {
        return createErrorResponse(
          'A node with this slug already exists under this parent',
          409
        )
      }
    }

    // Calculate new path if slug or parent changed
    let newPath = current.path
    if (validated.slug !== undefined || validated.parentId !== undefined) {
      newPath = await calculateNodePath(newSlug, newParentId)
    }

    // Build update data
    const updateData: any = {}
    if (validated.title !== undefined) updateData.title = validated.title
    if (validated.slug !== undefined) updateData.slug = newSlug
    if (validated.parentId !== undefined) updateData.parentId = newParentId
    if (validated.content !== undefined) updateData.content = validated.content
    if (validated.order !== undefined) updateData.order = validated.order
    if (newPath !== current.path) updateData.path = newPath

    // Update the node
    const updated = await prisma.node.update({
      where: { id: validated.id },
      data: updateData,
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

    // Update descendant paths if path changed
    if (newPath !== current.path) {
      await updateDescendantPaths(validated.id, newPath)
    }

    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof ZodError) {
      return handleValidationError(error)
    }
    return handleUnknownError(error)
  }
}

