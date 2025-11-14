/**
 * Content parsing utilities for plain text content with citations and embeds
 */

export interface ListItem {
  content: string
  nestedLists?: ListBlock[]
}

export interface ListBlock {
  type: 'bullet' | 'numeric' | 'arrow' | 'custom'
  customChar?: string
  items: ListItem[]
}

export interface ParsedContentSegment {
  type: 'text' | 'citation' | 'embed' | 'heading' | 'subheading' | 'subsubheading' | 'bullet' | 'link' | 'tag' | 'list' | 'numbering-control'
  content: string
  citationName?: string
  embedUrl?: string
  headingText?: string
  bulletText?: string
  linkText?: string
  linkUrl?: string
  tagPath?: string
  listBlock?: ListBlock
  numberingStyle?: 'numeric' | 'alphabetic' | 'none'
}

export interface ParsedContent {
  segments: ParsedContentSegment[]
  citations: string[] // Unique citation names in order of appearance
  embeds: string[] // Embed URLs in order of appearance
}

/**
 * Parse a list block (itemize, enumerate, or list with custom type)
 * Returns the parsed list block and the index after the end tag
 */
function parseListBlock(
  text: string,
  startIndex: number
): { listBlock: ListBlock; endIndex: number } | null {
  // Patterns for begin/end tags
  const beginItemizePattern = /\\begin\{itemize\}/
  const beginEnumeratePattern = /\\begin\{enumerate\}/
  const beginListPattern = /\\begin\{list\}\[([^\]]+)\]/
  const endItemizePattern = /\\end\{itemize\}/
  const endEnumeratePattern = /\\end\{enumerate\}/
  const endListPattern = /\\end\{list\}/
  const itemPattern = /\\item\{([^}]+)\}/

  // Find the begin tag at startIndex
  let listType: 'bullet' | 'numeric' | 'arrow' | 'custom' = 'bullet'
  let customChar: string | undefined = undefined
  let beginMatch: RegExpMatchArray | null = null
  let beginLength = 0
  let endPattern: RegExp = endItemizePattern // Initialize with default value

  // Try to match begin{itemize}
  const itemizeMatch = text.substring(startIndex).match(beginItemizePattern)
  if (itemizeMatch && itemizeMatch.index === 0) {
    listType = 'bullet'
    beginMatch = itemizeMatch
    beginLength = itemizeMatch[0].length
    endPattern = endItemizePattern
  } else {
    // Try to match begin{enumerate}
    const enumerateMatch = text.substring(startIndex).match(beginEnumeratePattern)
    if (enumerateMatch && enumerateMatch.index === 0) {
      listType = 'numeric'
      beginMatch = enumerateMatch
      beginLength = enumerateMatch[0].length
      endPattern = endEnumeratePattern
    } else {
      // Try to match begin{list}[type]
      const listMatch = text.substring(startIndex).match(beginListPattern)
      if (listMatch && listMatch.index === 0) {
        beginMatch = listMatch
        beginLength = listMatch[0].length
        endPattern = endListPattern
        const typeStr = listMatch[1].trim().toLowerCase()
        if (typeStr === 'arrow' || typeStr === '→') {
          listType = 'arrow'
        } else {
          listType = 'custom'
          customChar = listMatch[1].trim()
        }
      }
    }
  }

  if (!beginMatch) {
    return null
  }

  // Find the matching end tag (handle nested lists)
  let depth = 1
  let currentIndex = startIndex + beginLength
  const items: Array<{ content: string }> = []
  let currentItemContent: string[] = []
  let currentItemStart: number | null = null

  while (depth > 0 && currentIndex < text.length) {
    // Check for nested begin tags
    const nextBeginItemize = text.substring(currentIndex).search(beginItemizePattern)
    const nextBeginEnumerate = text.substring(currentIndex).search(beginEnumeratePattern)
    const nextBeginList = text.substring(currentIndex).search(beginListPattern)
    const nextEndItemize = text.substring(currentIndex).search(endItemizePattern)
    const nextEndEnumerate = text.substring(currentIndex).search(endEnumeratePattern)
    const nextEndList = text.substring(currentIndex).search(endListPattern)
    const nextItem = text.substring(currentIndex).search(itemPattern)

    // Find the earliest match
    const positions: Array<{ pos: number; type: 'begin' | 'end' | 'item' }> = []
    if (nextBeginItemize !== -1) positions.push({ pos: nextBeginItemize, type: 'begin' })
    if (nextBeginEnumerate !== -1) positions.push({ pos: nextBeginEnumerate, type: 'begin' })
    if (nextBeginList !== -1) positions.push({ pos: nextBeginList, type: 'begin' })
    if (nextEndItemize !== -1) positions.push({ pos: nextEndItemize, type: 'end' })
    if (nextEndEnumerate !== -1) positions.push({ pos: nextEndEnumerate, type: 'end' })
    if (nextEndList !== -1) positions.push({ pos: nextEndList, type: 'end' })
    if (nextItem !== -1) positions.push({ pos: nextItem, type: 'item' })

    if (positions.length === 0) break

    positions.sort((a, b) => a.pos - b.pos)
    const next = positions[0]
    const absolutePos = currentIndex + next.pos

    if (next.type === 'item') {
      // Save previous item if exists
      if (currentItemStart !== null) {
        // Add any text between previous item end and this item start
        if (absolutePos > currentItemStart) {
          currentItemContent.push(text.substring(currentItemStart, absolutePos))
        }
        items.push({ content: currentItemContent.join('').trim() })
        currentItemContent = []
      }
      // Extract item content from braces
      const itemMatch = text.substring(absolutePos).match(itemPattern)
      if (itemMatch) {
        // Get content from inside braces
        currentItemContent.push(itemMatch[1])
        // Start tracking any text after the \item{...} tag
        currentItemStart = absolutePos + itemMatch[0].length
        currentIndex = currentItemStart
      } else {
        currentIndex++
      }
    } else if (next.type === 'begin') {
      depth++
      // Skip past the begin tag
      const beginMatch = text.substring(absolutePos).match(beginItemizePattern) ||
                        text.substring(absolutePos).match(beginEnumeratePattern) ||
                        text.substring(absolutePos).match(beginListPattern)
      if (beginMatch) {
        currentIndex = absolutePos + beginMatch[0].length
      } else {
        currentIndex++
      }
    } else if (next.type === 'end') {
      depth--
      if (depth === 0) {
        // Save last item if exists
        if (currentItemStart !== null) {
          // Add any text between last item and end tag
          if (absolutePos > currentItemStart) {
            currentItemContent.push(text.substring(currentItemStart, absolutePos))
          }
          items.push({ content: currentItemContent.join('').trim() })
        }
        // Found matching end tag
        const endMatch = text.substring(absolutePos).match(endPattern)
        if (endMatch) {
          currentIndex = absolutePos + endMatch[0].length
        }
        break
      } else {
        // Nested end tag, skip past it
        const endMatch = text.substring(absolutePos).match(endItemizePattern) ||
                        text.substring(absolutePos).match(endEnumeratePattern) ||
                        text.substring(absolutePos).match(endListPattern)
        if (endMatch) {
          currentIndex = absolutePos + endMatch[0].length
        } else {
          currentIndex++
        }
      }
    } else {
      currentIndex++
    }
  }

  // Process items: parse nested lists in content
  const processedItems: ListItem[] = []
  for (const item of items) {
    const itemContent = item.content
    // Parse nested lists in item content
    const nestedLists: ListBlock[] = []
    let nestedIndex = 0
    while (nestedIndex < itemContent.length) {
      const nestedList = parseListBlock(itemContent, nestedIndex)
      if (nestedList) {
        nestedLists.push(nestedList.listBlock)
        nestedIndex = nestedList.endIndex
      } else {
        nestedIndex++
      }
    }
    processedItems.push({
      content: itemContent,
      nestedLists: nestedLists.length > 0 ? nestedLists : undefined,
    })
  }

  return {
    listBlock: {
      type: listType,
      customChar,
      items: processedItems,
    },
    endIndex: currentIndex,
  }
}

/**
 * Parse plain text content to extract citations and embeds
 * Citations: \cite{name}
 * Embeds: \embed{url}
 */
export function parseContent(text: string): ParsedContent {
  const segments: ParsedContentSegment[] = []
  const citations: string[] = []
  const embeds: string[] = []
  const seenCitations = new Set<string>()

  // Normalize: replace double backslashes with single backslash for parsing
  // This handles cases where content is stored with escaped backslashes
  const normalizedText = text.replace(/\\\\/g, '\\')

  // Regex patterns - simpler patterns that work with normalized text
  // Also handle embed without backslash (legacy format: embed{...})
  const citePattern = /\\cite\{([^}]+)\}/g
  const embedPattern = /\\embed\{([^}]+)\}/g
  // Simple pattern for embed without backslash - match embed{...} but not \embed{...}
  // We'll filter out matches that have a backslash before them
  const embedPatternNoSlash = /embed\{([^}]+)\}/g
  const headingPattern = /\\heading\{([^}]+)\}/g
  const subheadingPattern = /\\subheading\{([^}]+)\}/g
  const subsubheadingPattern = /\\subsubheading\{([^}]+)\}/g
  const bulletPattern = /\\item\{([^}]+)\}/g
  // Link pattern: \link{text, url}
  const linkPattern = /\\link\{([^,]+),\s*([^}]+)\}/g
  // Tag pattern: \tag{path} - links to another node
  const tagPattern = /\\tag\{([^}]+)\}/g
  // Numbering control pattern: {numeric = false}, {numeric=false}, {numeric = true}, etc.
  // Also supports {style = "alphabetic"} or {style = "numeric"}
  const numberingControlPattern = /\{(\w+)\s*=\s*([^}]+)\}/g

  let lastIndex = 0
  const matches: Array<{ 
    type: 'cite' | 'embed' | 'heading' | 'subheading' | 'subsubheading' | 'bullet' | 'link' | 'tag' | 'list' | 'numbering-control'
    index: number
    content: string
    name?: string
    linkText?: string
    linkUrl?: string
    listBlock?: ListBlock
    numberingStyle?: 'numeric' | 'alphabetic' | 'none'
  }> = []

  // First, find all list blocks
  const beginItemizePattern = /\\begin\{itemize\}/g
  const beginEnumeratePattern = /\\begin\{enumerate\}/g
  const beginListPattern = /\\begin\{list\}\[([^\]]+)\]/g
  
  let listMatch: RegExpExecArray | null = null
  beginItemizePattern.lastIndex = 0
  while ((listMatch = beginItemizePattern.exec(normalizedText)) !== null) {
    const currentListMatch = listMatch // Non-null alias for TypeScript
    const listResult = parseListBlock(normalizedText, currentListMatch.index)
    if (listResult) {
      matches.push({
        type: 'list',
        index: currentListMatch.index,
        content: normalizedText.substring(currentListMatch.index, listResult.endIndex),
        listBlock: listResult.listBlock,
      })
    }
  }
  
  beginEnumeratePattern.lastIndex = 0
  while ((listMatch = beginEnumeratePattern.exec(normalizedText)) !== null) {
    const currentListMatch = listMatch // Non-null alias for TypeScript
    // Check if this is already part of a list block we found
    const alreadyInList = matches.some(m => 
      m.type === 'list' && m.index <= currentListMatch.index && 
      currentListMatch.index < m.index + m.content.length
    )
    if (!alreadyInList) {
      const listResult = parseListBlock(normalizedText, currentListMatch.index)
      if (listResult) {
        matches.push({
          type: 'list',
          index: currentListMatch.index,
          content: normalizedText.substring(currentListMatch.index, listResult.endIndex),
          listBlock: listResult.listBlock,
        })
      }
    }
  }
  
  beginListPattern.lastIndex = 0
  while ((listMatch = beginListPattern.exec(normalizedText)) !== null) {
    const currentListMatch = listMatch // Non-null alias for TypeScript
    // Check if this is already part of a list block we found
    const alreadyInList = matches.some(m => 
      m.type === 'list' && m.index <= currentListMatch.index && 
      currentListMatch.index < m.index + m.content.length
    )
    if (!alreadyInList) {
      const listResult = parseListBlock(normalizedText, currentListMatch.index)
      if (listResult) {
        matches.push({
          type: 'list',
          index: currentListMatch.index,
          content: normalizedText.substring(currentListMatch.index, listResult.endIndex),
          listBlock: listResult.listBlock,
        })
      }
    }
  }

  // Find all citation matches (but skip those inside list blocks)
  let match: RegExpExecArray | null = null
  citePattern.lastIndex = 0
  while ((match = citePattern.exec(normalizedText)) !== null) {
    const currentMatch = match // Non-null alias for TypeScript
    // Check if this citation is inside a list block
    const insideList = matches.some(m => 
      m.type === 'list' && m.index <= currentMatch.index && 
      currentMatch.index < m.index + m.content.length
    )
    if (!insideList) {
      matches.push({
        type: 'cite',
        index: currentMatch.index,
        content: currentMatch[0],
        name: currentMatch[1],
      })
      if (!seenCitations.has(currentMatch[1])) {
        citations.push(currentMatch[1])
        seenCitations.add(currentMatch[1])
      }
    }
  }

  // Find all embed matches (with backslash, but skip those inside list blocks)
  embedPattern.lastIndex = 0
  while ((match = embedPattern.exec(normalizedText)) !== null) {
    const currentMatch = match // Non-null alias for TypeScript
    // Check if this embed is inside a list block
    const insideList = matches.some(m => 
      m.type === 'list' && m.index <= currentMatch.index && 
      currentMatch.index < m.index + m.content.length
    )
    if (!insideList) {
      matches.push({
        type: 'embed',
        index: currentMatch.index,
        content: currentMatch[0],
        name: currentMatch[1],
      })
      embeds.push(currentMatch[1])
    }
  }

  // Find embed matches without backslash (legacy format)
  // Check original text for embed{...} pattern (without backslash)
  embedPatternNoSlash.lastIndex = 0
  while ((match = embedPatternNoSlash.exec(text)) !== null) {
    const currentMatch = match // Non-null alias for TypeScript
    // Check if there's a backslash before this match (if so, skip it - it's \embed{...})
    const charBefore = currentMatch.index > 0 ? text[currentMatch.index - 1] : ''
    if (charBefore === '\\') {
      continue // Skip this match, it's \embed{...} which is already handled
    }
    
    const url = currentMatch[1]
    const matchIndex = currentMatch.index
    const embedContent = currentMatch[0]
    
    // Only add if not already found with backslash at this position
    const existingIndex = matches.findIndex(
      m => m.type === 'embed' && Math.abs(m.index - matchIndex) < 10
    )
    if (existingIndex === -1) {
      matches.push({
        type: 'embed',
        index: matchIndex,
        content: embedContent,
        name: url,
      })
      embeds.push(url)
    }
  }

  // Find all heading matches
  headingPattern.lastIndex = 0
  while ((match = headingPattern.exec(normalizedText)) !== null) {
    const currentMatch = match // Non-null alias for TypeScript
    matches.push({
      type: 'heading',
      index: currentMatch.index,
      content: currentMatch[0],
      name: currentMatch[1],
    })
  }

  // Find all subheading matches
  subheadingPattern.lastIndex = 0
  while ((match = subheadingPattern.exec(normalizedText)) !== null) {
    const currentMatch = match // Non-null alias for TypeScript
    matches.push({
      type: 'subheading',
      index: currentMatch.index,
      content: currentMatch[0],
      name: currentMatch[1],
    })
  }

  // Find all subsubheading matches
  subsubheadingPattern.lastIndex = 0
  while ((match = subsubheadingPattern.exec(normalizedText)) !== null) {
    const currentMatch = match // Non-null alias for TypeScript
    matches.push({
      type: 'subsubheading',
      index: currentMatch.index,
      content: currentMatch[0],
      name: currentMatch[1],
    })
  }

  // Find all bullet matches
  bulletPattern.lastIndex = 0
  while ((match = bulletPattern.exec(normalizedText)) !== null) {
    const currentMatch = match // Non-null alias for TypeScript
    matches.push({
      type: 'bullet',
      index: currentMatch.index,
      content: currentMatch[0],
      name: currentMatch[1],
    })
  }

  // Find all link matches: \link{text, url}
  linkPattern.lastIndex = 0
  while ((match = linkPattern.exec(normalizedText)) !== null) {
    const currentMatch = match // Non-null alias for TypeScript
    matches.push({
      type: 'link',
      index: currentMatch.index,
      content: currentMatch[0],
      name: currentMatch[2], // URL
      linkText: currentMatch[1].trim(), // Text
      linkUrl: currentMatch[2].trim(), // URL
    })
  }

  // Find all tag matches: \tag{path}
  tagPattern.lastIndex = 0
  while ((match = tagPattern.exec(normalizedText)) !== null) {
    const currentMatch = match // Non-null alias for TypeScript
    matches.push({
      type: 'tag',
      index: currentMatch.index,
      content: currentMatch[0],
      name: currentMatch[1].trim(), // Path
    })
  }

  // Find all numbering control matches: {numeric = false}, {style = "alphabetic"}, etc.
  numberingControlPattern.lastIndex = 0
  while ((match = numberingControlPattern.exec(normalizedText)) !== null) {
    const currentMatch = match // Non-null alias for TypeScript
    const key = currentMatch[1].trim().toLowerCase()
    const value = currentMatch[2].trim().toLowerCase().replace(/['"]/g, '') // Remove quotes
    
    let numberingStyle: 'numeric' | 'alphabetic' | 'none' | undefined
    
    if (key === 'numeric') {
      // {numeric = false} or {numeric = true}
      if (value === 'false') {
        numberingStyle = 'none'
      } else {
        numberingStyle = 'numeric'
      }
    } else if (key === 'style') {
      // {style = "numeric"} or {style = "alphabetic"} or {style = "none"}
      if (value === 'numeric') {
        numberingStyle = 'numeric'
      } else if (value === 'alphabetic') {
        numberingStyle = 'alphabetic'
      } else if (value === 'none' || value === 'false') {
        numberingStyle = 'none'
      }
    }
    
    if (numberingStyle !== undefined) {
      matches.push({
        type: 'numbering-control',
        index: currentMatch.index,
        content: currentMatch[0],
        name: key,
        numberingStyle,
      })
    }
  }

  // Sort matches by index
  matches.sort((a, b) => a.index - b.index)

  // Build segments using normalizedText for consistent indices
  for (const match of matches) {
    // Add text before this match
    if (match.index > lastIndex) {
      const textSegment = normalizedText.substring(lastIndex, match.index)
      if (textSegment) {
        segments.push({
          type: 'text',
          content: textSegment,
        })
      }
    }

    // Add the match
    if (match.type === 'cite') {
      segments.push({
        type: 'citation',
        content: match.content,
        citationName: match.name,
      })
    } else if (match.type === 'embed') {
      segments.push({
        type: 'embed',
        content: match.content,
        embedUrl: match.name,
      })
    } else if (match.type === 'heading') {
      segments.push({
        type: 'heading',
        content: match.content,
        headingText: match.name,
      })
    } else if (match.type === 'subheading') {
      segments.push({
        type: 'subheading',
        content: match.content,
        headingText: match.name,
      })
    } else if (match.type === 'subsubheading') {
      segments.push({
        type: 'subsubheading',
        content: match.content,
        headingText: match.name,
      })
    } else if (match.type === 'bullet') {
      segments.push({
        type: 'bullet',
        content: match.content,
        bulletText: match.name,
      })
    } else if (match.type === 'link') {
      segments.push({
        type: 'link',
        content: match.content,
        linkText: match.linkText || match.name,
        linkUrl: match.linkUrl || match.name,
      })
    } else if (match.type === 'tag') {
      segments.push({
        type: 'tag',
        content: match.content,
        tagPath: match.name,
      })
    } else if (match.type === 'list') {
      segments.push({
        type: 'list',
        content: match.content,
        listBlock: match.listBlock,
      })
    } else if (match.type === 'numbering-control') {
      segments.push({
        type: 'numbering-control',
        content: match.content,
        numberingStyle: match.numberingStyle,
      })
    }

    lastIndex = match.index + match.content.length
  }

  // Add remaining text
  if (lastIndex < normalizedText.length) {
    const textSegment = normalizedText.substring(lastIndex)
    if (textSegment) {
      segments.push({
        type: 'text',
        content: textSegment,
      })
    }
  }

  // If no matches, return entire text as single segment
  if (segments.length === 0) {
    segments.push({
      type: 'text',
      content: normalizedText,
    })
  }
  
  // Clean up text segments: remove any leftover citation/embed patterns that weren't matched
  segments.forEach(segment => {
    if (segment.type === 'text') {
      // Remove any remaining citation/embed/heading/link/tag patterns that might have been missed
      // Also remove numbering control patterns
      segment.content = segment.content.replace(/\\(cite|embed|heading|subheading|subsubheading|item|link|tag)\{[^}]+\}/g, '')
      segment.content = segment.content.replace(/\{\w+\s*=\s*[^}]+\}/g, '')
    }
  })

  return {
    segments,
    citations,
    embeds,
  }
}

/**
 * Extract all citation names from text
 */
export function extractCitations(text: string): string[] {
  const citations: string[] = []
  const seen = new Set<string>()
  const citePattern = /\\cite\{([^}]+)\}/g

  let match: RegExpExecArray | null = null
  while ((match = citePattern.exec(text)) !== null) {
    const currentMatch = match // Non-null alias for TypeScript
    if (!seen.has(currentMatch[1])) {
      citations.push(currentMatch[1])
      seen.add(currentMatch[1])
    }
  }

  return citations
}

/**
 * Extract all embed URLs from text
 */
export function extractEmbeds(text: string): string[] {
  const embeds: string[] = []
  const embedPattern = /\\embed\{([^}]+)\}/g

  let match: RegExpExecArray | null = null
  while ((match = embedPattern.exec(text)) !== null) {
    const currentMatch = match // Non-null alias for TypeScript
    embeds.push(currentMatch[1])
  }

  return embeds
}

