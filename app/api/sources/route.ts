import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

/**
 * GET /api/sources
 * List all sources (for frontend)
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

