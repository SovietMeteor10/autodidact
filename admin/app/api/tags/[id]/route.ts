import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Mark route as dynamic
export const dynamic = 'force-dynamic'

/**
 * PUT /api/tags/[id]
 * Update a tag
 * Body: { name: string }
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { name } = body

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { error: 'Tag name is required' },
        { status: 400 }
      )
    }

    const trimmedName = name.trim()

    // Check if tag exists
    const existing = await prisma.tag.findUnique({
      where: { id: params.id },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Tag not found' },
        { status: 404 }
      )
    }

    // If name is being updated, check for conflicts
    if (trimmedName !== existing.name) {
      const nameConflict = await prisma.tag.findUnique({
        where: { name: trimmedName },
      })

      if (nameConflict) {
        return NextResponse.json(
          { error: 'A tag with this name already exists' },
          { status: 409 }
        )
      }
    }

    const updated = await prisma.tag.update({
      where: { id: params.id },
      data: {
        name: trimmedName,
      },
    })

    return NextResponse.json(updated, { status: 200 })
  } catch (error) {
    console.error('Error updating tag:', error)
    return NextResponse.json(
      { error: 'Failed to update tag' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/tags/[id]
 * Delete a tag
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if tag exists
    const existing = await prisma.tag.findUnique({
      where: { id: params.id },
      include: {
        nodes: {
          select: {
            nodeId: true,
          },
        },
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Tag not found' },
        { status: 404 }
      )
    }

    // Check if tag is being used by any nodes
    if (existing.nodes.length > 0) {
      return NextResponse.json(
        { 
          error: `Cannot delete tag. It is currently used by ${existing.nodes.length} node(s). Please remove the tag from all nodes first.`,
          nodeCount: existing.nodes.length,
        },
        { status: 409 }
      )
    }

    // Delete the tag (NodeTag records will be cascade deleted automatically)
    await prisma.tag.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Error deleting tag:', error)
    return NextResponse.json(
      { error: 'Failed to delete tag' },
      { status: 500 }
    )
  }
}

