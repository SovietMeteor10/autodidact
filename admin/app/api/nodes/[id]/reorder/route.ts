import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

/**
 * PUT /api/nodes/[id]/reorder
 * Reorder the children of a node
 * Body: { childIds: string[] } - array of child IDs in the desired order
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { childIds } = body

    if (!Array.isArray(childIds)) {
      return NextResponse.json(
        { error: 'childIds must be an array' },
        { status: 400 }
      )
    }

    // Verify parent exists
    const parent = await prisma.node.findUnique({
      where: { id: params.id },
      include: { children: true },
    })

    if (!parent) {
      return NextResponse.json(
        { error: 'Parent node not found' },
        { status: 404 }
      )
    }

    // Verify all child IDs belong to this parent
    const parentChildIds = new Set(parent.children.map(c => c.id))
    const invalidIds = childIds.filter(id => !parentChildIds.has(id))

    if (invalidIds.length > 0) {
      return NextResponse.json(
        { error: `Invalid child IDs: ${invalidIds.join(', ')}` },
        { status: 400 }
      )
    }

    // Update order for each child
    await prisma.$transaction(
      childIds.map((childId, index) =>
        prisma.node.update({
          where: { id: childId },
          data: { order: index },
        })
      )
    )

    // Fetch updated children
    const children = await prisma.node.findMany({
      where: { parentId: params.id },
      orderBy: { order: 'asc' },
    })

    return NextResponse.json({ children })
  } catch (error) {
    console.error('Error reordering children:', error)
    return NextResponse.json(
      { error: 'Failed to reorder children' },
      { status: 500 }
    )
  }
}

