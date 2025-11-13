import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Mark route as dynamic
export const dynamic = 'force-dynamic'

/**
 * GET /api/tags/[id]/nodes
 * Get all nodes that have this tag
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const nodeTags = await prisma.nodeTag.findMany({
      where: { tagId: params.id },
      include: {
        node: {
          select: {
            id: true,
            title: true,
            path: true,
            slug: true,
          },
        },
      },
      orderBy: {
        node: {
          title: 'asc',
        },
      },
    })

    const nodes = nodeTags.map(nt => nt.node)

    return NextResponse.json({ nodes }, { status: 200 })
  } catch (error) {
    console.error('Error fetching tag nodes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tag nodes' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/tags/[id]/nodes
 * Add or remove nodes from a tag
 * Body: { nodeIds: string[], action: 'add' | 'remove' }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { nodeIds, action } = body

    if (!Array.isArray(nodeIds) || !action || !['add', 'remove'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid request body. Expected { nodeIds: string[], action: "add" | "remove" }' },
        { status: 400 }
      )
    }

    // Verify tag exists
    const tag = await prisma.tag.findUnique({
      where: { id: params.id },
    })

    if (!tag) {
      return NextResponse.json(
        { error: 'Tag not found' },
        { status: 404 }
      )
    }

    if (action === 'add') {
      // Add nodes to tag (skip duplicates)
      await prisma.nodeTag.createMany({
        data: nodeIds.map((nodeId: string) => ({
          tagId: params.id,
          nodeId,
        })),
        skipDuplicates: true,
      })
    } else if (action === 'remove') {
      // Remove nodes from tag
      await prisma.nodeTag.deleteMany({
        where: {
          tagId: params.id,
          nodeId: {
            in: nodeIds,
          },
        },
      })
    }

    // Return updated list of nodes
    const nodeTags = await prisma.nodeTag.findMany({
      where: { tagId: params.id },
      include: {
        node: {
          select: {
            id: true,
            title: true,
            path: true,
            slug: true,
          },
        },
      },
      orderBy: {
        node: {
          title: 'asc',
        },
      },
    })

    const nodes = nodeTags.map(nt => nt.node)

    return NextResponse.json({ nodes }, { status: 200 })
  } catch (error) {
    console.error('Error updating tag nodes:', error)
    return NextResponse.json(
      { error: 'Failed to update tag nodes' },
      { status: 500 }
    )
  }
}

