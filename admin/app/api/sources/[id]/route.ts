import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

/**
 * PUT /api/sources/[id]
 * Update a source
 * Body: { name?: string, link?: string }
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { name, link } = body

    // Check if source exists
    const existing = await prisma.source.findUnique({
      where: { id: params.id },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Source not found' },
        { status: 404 }
      )
    }

    // If name is being updated, check for conflicts
    if (name && name !== existing.name) {
      const nameConflict = await prisma.source.findUnique({
        where: { name },
      })

      if (nameConflict) {
        return NextResponse.json(
          { error: 'A source with this name already exists' },
          { status: 409 }
        )
      }
    }

    const updated = await prisma.source.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(link && { link }),
      },
    })

    return NextResponse.json(updated, { status: 200 })
  } catch (error) {
    console.error('Error updating source:', error)
    return NextResponse.json(
      { error: 'Failed to update source' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/sources/[id]
 * Delete a source
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if source exists
    const existing = await prisma.source.findUnique({
      where: { id: params.id },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Source not found' },
        { status: 404 }
      )
    }

    await prisma.source.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Error deleting source:', error)
    return NextResponse.json(
      { error: 'Failed to delete source' },
      { status: 500 }
    )
  }
}

