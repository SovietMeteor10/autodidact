import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { deleteNodeSchema } from '@/lib/validation/nodes'
import { createErrorResponse, handleValidationError, handleUnknownError } from '@/lib/utils/errors'
import { ZodError } from 'zod'

/**
 * POST /api/nodes/delete
 * Delete a node
 * 
 * Body:
 * {
 *   id: string (required)
 *   force?: boolean (optional - if false, prevent deletion when children exist)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validated = deleteNodeSchema.parse(body)

    const node = await prisma.node.findUnique({
      where: { id: validated.id },
      include: {
        children: true,
      },
    })

    if (!node) {
      return createErrorResponse('Node not found', 404)
    }

    // Check if node has children
    if (node.children.length > 0 && !validated.force) {
      return createErrorResponse(
        'Cannot delete node with children. Use force=true to delete recursively.',
        400,
        {
          hasChildren: true,
          childrenCount: node.children.length,
        }
      )
    }

    // Delete recursively if force is true, otherwise just delete the node
    if (validated.force) {
      await deleteNodeRecursive(validated.id)
    } else {
      await prisma.node.delete({
        where: { id: validated.id },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof ZodError) {
      return handleValidationError(error)
    }
    return handleUnknownError(error)
  }
}

/**
 * Recursively delete a node and all its children
 */
async function deleteNodeRecursive(nodeId: string): Promise<void> {
  const node = await prisma.node.findUnique({
    where: { id: nodeId },
    include: { children: true },
  })

  if (!node) return

  // Delete all children first
  for (const child of node.children) {
    await deleteNodeRecursive(child.id)
  }

  // Then delete this node
  await prisma.node.delete({
    where: { id: nodeId },
  })
}

