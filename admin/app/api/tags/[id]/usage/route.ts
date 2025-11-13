import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Mark route as dynamic
export const dynamic = 'force-dynamic'

/**
 * GET /api/tags/[id]/usage
 * Get usage count for a tag (how many nodes use it)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const count = await prisma.nodeTag.count({
      where: { tagId: params.id },
    })

    return NextResponse.json({ nodeCount: count }, { status: 200 })
  } catch (error) {
    console.error('Error fetching tag usage:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tag usage' },
      { status: 500 }
    )
  }
}

