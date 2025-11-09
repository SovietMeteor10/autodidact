import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

/**
 * GET /api/sources
 * List all sources
 */
export async function GET(request: NextRequest) {
  try {
    const sources = await prisma.source.findMany({
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(sources, { status: 200 })
  } catch (error) {
    console.error('Error fetching sources:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sources' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/sources
 * Create a new source
 * Body: { name: string, link: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, link } = body

    if (!name || !link) {
      return NextResponse.json(
        { error: 'Name and link are required' },
        { status: 400 }
      )
    }

    // Check if source with this name already exists
    const existing = await prisma.source.findUnique({
      where: { name },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'A source with this name already exists' },
        { status: 409 }
      )
    }

    const source = await prisma.source.create({
      data: {
        name,
        link,
      },
    })

    return NextResponse.json(source, { status: 201 })
  } catch (error) {
    console.error('Error creating source:', error)
    return NextResponse.json(
      { error: 'Failed to create source' },
      { status: 500 }
    )
  }
}

