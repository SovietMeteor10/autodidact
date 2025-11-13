import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Mark route as dynamic
export const dynamic = 'force-dynamic'

interface SearchResult {
  path: string
  title: string
  heading?: string
  headingType?: 'heading' | 'subheading' | 'subsubheading'
  tagName?: string
  resultType: 'heading' | 'tag'
}

/**
 * GET /api/search
 * Search for headings and tags across all nodes
 * Query params: ?q=searchterm
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ results: [] }, { status: 200 })
    }

    const searchTerm = query.trim().toLowerCase()

    const results: SearchResult[] = []

    // Search database tags (tags assigned to nodes)
    const tags = await prisma.tag.findMany({
      where: {
        name: {
          contains: searchTerm,
          mode: 'insensitive',
        },
      },
      include: {
        nodes: {
          include: {
            node: {
              select: {
                id: true,
                path: true,
                title: true,
              },
            },
          },
        },
      },
    })

    // Add tag results
    for (const tag of tags) {
      for (const nodeTag of tag.nodes) {
        results.push({
          path: nodeTag.node.path,
          title: nodeTag.node.title,
          tagName: tag.name,
          resultType: 'tag',
        })
      }
    }

    // Fetch all nodes with content for heading and content tag search
    const nodes = await prisma.node.findMany({
      select: {
        id: true,
        path: true,
        title: true,
        content: true,
      },
    })

    // Regex patterns for headings
    const headingPattern = /\\heading\{([^}]+)\}/gi
    const subheadingPattern = /\\subheading\{([^}]+)\}/gi
    const subsubheadingPattern = /\\subsubheading\{([^}]+)\}/gi

    for (const node of nodes) {
      // Handle both string and array content
      let contentText = ''
      
      if (typeof node.content === 'string') {
        contentText = node.content
      } else if (Array.isArray(node.content)) {
        // Extract text from content blocks
        contentText = node.content
          .map((block: any) => {
            if (typeof block === 'string') return block
            if (block && typeof block === 'object' && 'text' in block) {
              return block.text || ''
            }
            return ''
          })
          .join(' ')
      }

      if (!contentText) continue

      // Normalize content (handle escaped backslashes)
      const normalizedText = contentText.replace(/\\\\/g, '\\')

      // Search for headings
      let match
      
      // Search headings
      headingPattern.lastIndex = 0
      while ((match = headingPattern.exec(normalizedText)) !== null) {
        const headingText = match[1].toLowerCase()
        if (headingText.includes(searchTerm)) {
          results.push({
            path: node.path,
            title: node.title,
            heading: match[1],
            headingType: 'heading',
            resultType: 'heading',
          })
        }
      }

      // Search subheadings
      subheadingPattern.lastIndex = 0
      while ((match = subheadingPattern.exec(normalizedText)) !== null) {
        const headingText = match[1].toLowerCase()
        if (headingText.includes(searchTerm)) {
          results.push({
            path: node.path,
            title: node.title,
            heading: match[1],
            headingType: 'subheading',
            resultType: 'heading',
          })
        }
      }

      // Search subsubheadings
      subsubheadingPattern.lastIndex = 0
      while ((match = subsubheadingPattern.exec(normalizedText)) !== null) {
        const headingText = match[1].toLowerCase()
        if (headingText.includes(searchTerm)) {
          results.push({
            path: node.path,
            title: node.title,
            heading: match[1],
            headingType: 'subsubheading',
            resultType: 'heading',
          })
        }
      }

      // Search content tags (\tag{path})
      const tagPattern = /\\tag\{([^}]+)\}/gi
      tagPattern.lastIndex = 0
      while ((match = tagPattern.exec(normalizedText)) !== null) {
        const tagPath = match[1].toLowerCase()
        // Check if the tag path contains the search term
        if (tagPath.includes(searchTerm)) {
          // Find the node that this tag points to
          const targetNode = nodes.find(n => {
            const nodePath = n.path.toLowerCase()
            return nodePath === tagPath || nodePath.endsWith('/' + tagPath) || nodePath === '/' + tagPath
          })
          
          if (targetNode) {
            results.push({
              path: targetNode.path,
              title: targetNode.title,
              tagName: match[1],
              resultType: 'tag',
            })
          }
        }
      }
    }

    // Remove duplicates
    const uniqueResults = Array.from(
      new Map(
        results.map((result) => {
          const key = result.resultType === 'heading' 
            ? `${result.path}::heading::${result.heading}`
            : `${result.path}::tag::${result.tagName}`
          return [key, result]
        })
      ).values()
    )

    // Sort: tags first, then headings
    // For headings: by type priority (heading > subheading > subsubheading), then alphabetically
    // For tags: alphabetically by tag name
    uniqueResults.sort((a, b) => {
      // Tags come before headings
      if (a.resultType === 'tag' && b.resultType === 'heading') return -1
      if (a.resultType === 'heading' && b.resultType === 'tag') return 1
      
      if (a.resultType === 'tag' && b.resultType === 'tag') {
        return (a.tagName || '').localeCompare(b.tagName || '')
      }
      
      if (a.resultType === 'heading' && b.resultType === 'heading') {
        const typeOrder = { heading: 0, subheading: 1, subsubheading: 2 }
        const typeDiff = (typeOrder[a.headingType!] || 0) - (typeOrder[b.headingType!] || 0)
        if (typeDiff !== 0) return typeDiff
        return (a.heading || '').localeCompare(b.heading || '')
      }
      
      return 0
    })

    return NextResponse.json({ results: uniqueResults }, { status: 200 })
  } catch (error) {
    console.error('Error searching:', error)
    return NextResponse.json(
      { error: 'Failed to search' },
      { status: 500 }
    )
  }
}

