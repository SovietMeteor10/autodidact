import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

/**
 * GET /api/nodes/parent-options
 * Get all nodes that can be parents (non-child nodes: top level and mid level)
 * Returns nodes where parentId IS NULL OR where parent's parentId IS NULL
 */
export async function GET(request: NextRequest) {
  try {
    // Get all top-level nodes (parentId is null)
    const topLevelNodes = await prisma.node.findMany({
      where: { parentId: null },
      select: {
        id: true,
        title: true,
        path: true,
      },
      orderBy: { order: 'asc' },
    })

    // Get all mid-level nodes (parentId is not null, but parent's parentId is null)
    // First, get all nodes with a parent
    const nodesWithParent = await prisma.node.findMany({
      where: {
        parentId: { not: null },
      },
      select: {
        id: true,
        title: true,
        path: true,
        parent: {
          select: {
            parentId: true,
          },
        },
      },
    })

    // Filter to only mid-level nodes (where parent's parentId is null)
    const midLevelNodes = nodesWithParent
      .filter((node) => node.parent?.parentId === null)
      .map(({ parent, ...rest }) => rest)

    // Combine and return
    const allParentOptions = [...topLevelNodes, ...midLevelNodes].sort((a, b) =>
      a.title.localeCompare(b.title)
    )

    return NextResponse.json(allParentOptions, { status: 200 })
  } catch (error) {
    console.error('Error fetching parent options:', error)
    return NextResponse.json(
      { error: 'Failed to fetch parent options' },
      { status: 500 }
    )
  }
}

