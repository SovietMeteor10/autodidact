import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { calculateNodePath, updateDescendantPaths } from '@/lib/nodeHelpers'

// Mark route as dynamic
export const dynamic = 'force-dynamic'

/**
 * GET /api/nodes/[id]
 * Get a single node by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const node = await prisma.node.findUnique({
      where: { id: params.id },
      include: {
        children: {
          orderBy: { order: 'asc' },
        },
        parent: true,
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

    // Transform tags to match expected format
    const transformedNode = node ? {
      ...node,
      tags: node.tags.map((nt: any) => nt.tag),
    } : null

    if (!transformedNode) {
      return NextResponse.json(
        { error: 'Node not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(transformedNode)
  } catch (error) {
    console.error('Error fetching node:', error)
    return NextResponse.json(
      { error: 'Failed to fetch node' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/nodes/[id]
 * Update a node
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { title, slug, parentId, content, order } = body

    // Get current node
    const current = await prisma.node.findUnique({
      where: { id: params.id },
    })

    if (!current) {
      return NextResponse.json(
        { error: 'Node not found' },
        { status: 404 }
      )
    }

    // Check if slug is being changed and if it conflicts
    const newSlug = slug ?? current.slug
    const newParentId = parentId !== undefined ? (parentId || null) : current.parentId

    if (slug || parentId !== undefined) {
      const existing = await prisma.node.findFirst({
        where: {
          slug: newSlug,
          parentId: newParentId,
          NOT: { id: params.id },
        },
      })

      if (existing) {
        return NextResponse.json(
          { error: 'A node with this slug already exists under this parent' },
          { status: 409 }
        )
      }
    }

    // Calculate new path if slug or parent changed
    let newPath = current.path
    if (slug || parentId !== undefined) {
      newPath = await calculateNodePath(newSlug, newParentId)
    }

    // Update the node (without tags first)
    const updated = await prisma.node.update({
      where: { id: params.id },
      data: {
        ...(title !== undefined && { title }),
        ...(slug !== undefined && { slug: newSlug }),
        ...(parentId !== undefined && { parentId: newParentId }),
        ...(content !== undefined && { content }),
        ...(order !== undefined && { order }),
        ...(newPath !== current.path && { path: newPath }),
      },
      include: {
        children: {
          orderBy: { order: 'asc' },
        },
      },
    })

    // Handle tags separately for explicit many-to-many
    if (body.tagIds !== undefined) {
      const tagIds = body.tagIds || []
      
      // Delete all existing tag relationships
      await prisma.nodeTag.deleteMany({
        where: { nodeId: params.id },
      })

      // Create new tag relationships if any
      if (tagIds.length > 0) {
        await prisma.nodeTag.createMany({
          data: tagIds.map((tagId: string) => ({
            nodeId: params.id,
            tagId: tagId,
          })),
          skipDuplicates: true,
        })
      }
    }

    // Fetch the node with tags included
    const nodeWithTags = await prisma.node.findUnique({
      where: { id: params.id },
      include: {
        children: {
          orderBy: { order: 'asc' },
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
    const finalNode = nodeWithTags ? {
      ...nodeWithTags,
      tags: nodeWithTags.tags.map((nt: any) => nt.tag),
    } : updated

    // Update descendant paths if path changed
    if (newPath !== current.path) {
      await updateDescendantPaths(params.id, newPath)
    }

    return NextResponse.json(finalNode)
  } catch (error) {
    console.error('Error updating node:', error)
    return NextResponse.json(
      { error: 'Failed to update node' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/nodes/[id]
 * Delete a node and all its descendants
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const node = await prisma.node.findUnique({
      where: { id: params.id },
    })

    if (!node) {
      return NextResponse.json(
        { error: 'Node not found' },
        { status: 404 }
      )
    }

    // Delete all descendants (cascade delete)
    // Prisma doesn't support cascade delete on self-referential relations,
    // so we need to delete recursively
    await deleteNodeRecursive(params.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting node:', error)
    return NextResponse.json(
      { error: 'Failed to delete node' },
      { status: 500 }
    )
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

