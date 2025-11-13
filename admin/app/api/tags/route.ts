import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Mark route as dynamic
export const dynamic = 'force-dynamic'

/**
 * GET /api/tags
 * List all tags, optionally filtered by search query
 * Query params: ?search=term
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search')

    const where = search
      ? {
          name: {
            contains: search,
            mode: 'insensitive' as const,
          },
        }
      : {}

    const tags = await prisma.tag.findMany({
      where,
      orderBy: { name: 'asc' },
      ...(search ? { take: 20 } : {}), // Limit results for autocomplete only when searching
    })

    return NextResponse.json(tags, { status: 200 })
  } catch (error) {
    console.error('Error fetching tags:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tags' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/tags
 * Create a new tag
 * Body: { name: string }
 */
export async function POST(request: NextRequest) {
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

    // Check if tag with this name already exists
    const existing = await prisma.tag.findUnique({
      where: { name: trimmedName },
    })

    if (existing) {
      return NextResponse.json(existing, { status: 200 })
    }

    const tag = await prisma.tag.create({
      data: {
        name: trimmedName,
      },
    })

    return NextResponse.json(tag, { status: 201 })
  } catch (error) {
    console.error('Error creating tag:', error)
    return NextResponse.json(
      { error: 'Failed to create tag' },
      { status: 500 }
    )
  }
}

