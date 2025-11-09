import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { calculateNodePath } from '@/lib/nodeHelpers'

/**
 * GET /api/nodes/[id]/children
 * Get all children of a node
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify parent exists
    const parent = await prisma.node.findUnique({
      where: { id: params.id },
    })

    if (!parent) {
      return NextResponse.json(
        { error: 'Parent node not found' },
        { status: 404 }
      )
    }

    // Get all children
    const children = await prisma.node.findMany({
      where: { parentId: params.id },
      include: {
        children: {
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { order: 'asc' },
    })

    return NextResponse.json(children)
  } catch (error) {
    console.error('Error fetching children:', error)
    return NextResponse.json(
      { error: 'Failed to fetch children' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/nodes/[id]/children
 * Create a child node under this parent
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { title, slug, content, order } = body

    // Validate required fields
    if (!title || !slug) {
      return NextResponse.json(
        { error: 'Title and slug are required' },
        { status: 400 }
      )
    }

    // Verify parent exists
    const parent = await prisma.node.findUnique({
      where: { id: params.id },
    })

    if (!parent) {
      return NextResponse.json(
        { error: 'Parent node not found' },
        { status: 404 }
      )
    }

    // Check if slug already exists under this parent
    const existing = await prisma.node.findFirst({
      where: {
        slug,
        parentId: params.id,
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'A node with this slug already exists under this parent' },
        { status: 409 }
      )
    }

    // Calculate path
    const path = await calculateNodePath(slug, params.id)

    // Create the child node
    const node = await prisma.node.create({
      data: {
        title,
        slug,
        parentId: params.id,
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
    console.error('Error creating child node:', error)
    return NextResponse.json(
      { error: 'Failed to create child node' },
      { status: 500 }
    )
  }
}

