import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { calculateNodePath } from '@/lib/nodeHelpers'

/**
 * POST /api/nodes
 * Create a new node
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, slug, parentId, content, order } = body

    // Validate required fields
    if (!title || !slug) {
      return NextResponse.json(
        { error: 'Title and slug are required' },
        { status: 400 }
      )
    }

    // Check if slug already exists under this parent
    const existing = await prisma.node.findFirst({
      where: {
        slug,
        parentId: parentId || null,
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'A node with this slug already exists under this parent' },
        { status: 409 }
      )
    }

    // Calculate path
    const path = await calculateNodePath(slug, parentId || null)

    // Create the node
    const node = await prisma.node.create({
      data: {
        title,
        slug,
        parentId: parentId || null,
        path,
        content: content || [],
        order: order ?? 0,
      },
      include: {
        children: {
          orderBy: { order: 'asc' },
        },
      },
    })

    return NextResponse.json(node, { status: 201 })
  } catch (error) {
    console.error('Error creating node:', error)
    return NextResponse.json(
      { error: 'Failed to create node' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/nodes
 * Get all nodes (optionally filtered)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const parentId = searchParams.get('parentId')

    const nodes = await prisma.node.findMany({
      where: parentId ? { parentId } : undefined,
      include: {
        children: {
          orderBy: { order: 'asc' },
        },
      },
      orderBy: [
        { order: 'asc' },
        { createdAt: 'asc' },
      ],
    })

    return NextResponse.json(nodes)
  } catch (error) {
    console.error('Error fetching nodes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch nodes' },
      { status: 500 }
    )
  }
}

