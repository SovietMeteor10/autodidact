/**
 * Content parsing utilities for plain text content with citations and embeds
 */

export interface ParsedContentSegment {
  type: 'text' | 'citation' | 'embed' | 'heading' | 'subheading' | 'subsubheading' | 'bullet' | 'link' | 'tag' | 'numbering-control'
  content: string
  citationName?: string
  embedUrl?: string
  headingText?: string
  bulletText?: string
  linkText?: string
  linkUrl?: string
  tagPath?: string
  numberingStyle?: 'numeric' | 'alphabetic' | 'none'
}

export interface ParsedContent {
  segments: ParsedContentSegment[]
  citations: string[] // Unique citation names in order of appearance
  embeds: string[] // Embed URLs in order of appearance
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
    type: 'cite' | 'embed' | 'heading' | 'subheading' | 'subsubheading' | 'bullet' | 'link' | 'tag' | 'numbering-control'
    index: number
    content: string
    name: string
    linkText?: string
    linkUrl?: string
    numberingStyle?: 'numeric' | 'alphabetic' | 'none'
  }> = []

  // Find all citation matches
  let match
  citePattern.lastIndex = 0
  while ((match = citePattern.exec(normalizedText)) !== null) {
    matches.push({
      type: 'cite',
      index: match.index,
      content: match[0],
      name: match[1],
    })
    if (!seenCitations.has(match[1])) {
      citations.push(match[1])
      seenCitations.add(match[1])
    }
  }

  // Find all embed matches (with backslash)
  embedPattern.lastIndex = 0
  while ((match = embedPattern.exec(normalizedText)) !== null) {
    matches.push({
      type: 'embed',
      index: match.index,
      content: match[0],
      name: match[1],
    })
    embeds.push(match[1])
  }

  // Find embed matches without backslash (legacy format)
  // Check original text for embed{...} pattern (without backslash)
  embedPatternNoSlash.lastIndex = 0
  while ((match = embedPatternNoSlash.exec(text)) !== null) {
    // Check if there's a backslash before this match (if so, skip it - it's \embed{...})
    const charBefore = match.index > 0 ? text[match.index - 1] : ''
    if (charBefore === '\\') {
      continue // Skip this match, it's \embed{...} which is already handled
    }
    
    const url = match[1]
    const matchIndex = match.index
    const embedContent = match[0]
    
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
    matches.push({
      type: 'heading',
      index: match.index,
      content: match[0],
      name: match[1],
    })
  }

  // Find all subheading matches
  subheadingPattern.lastIndex = 0
  while ((match = subheadingPattern.exec(normalizedText)) !== null) {
    matches.push({
      type: 'subheading',
      index: match.index,
      content: match[0],
      name: match[1],
    })
  }

  // Find all subsubheading matches
  subsubheadingPattern.lastIndex = 0
  while ((match = subsubheadingPattern.exec(normalizedText)) !== null) {
    matches.push({
      type: 'subsubheading',
      index: match.index,
      content: match[0],
      name: match[1],
    })
  }

  // Find all bullet matches
  bulletPattern.lastIndex = 0
  while ((match = bulletPattern.exec(normalizedText)) !== null) {
    matches.push({
      type: 'bullet',
      index: match.index,
      content: match[0],
      name: match[1],
    })
  }

  // Find all link matches: \link{text, url}
  linkPattern.lastIndex = 0
  while ((match = linkPattern.exec(normalizedText)) !== null) {
    matches.push({
      type: 'link',
      index: match.index,
      content: match[0],
      name: match[2], // URL
      linkText: match[1].trim(), // Text
      linkUrl: match[2].trim(), // URL
    })
  }

  // Find all tag matches: \tag{path}
  tagPattern.lastIndex = 0
  while ((match = tagPattern.exec(normalizedText)) !== null) {
    matches.push({
      type: 'tag',
      index: match.index,
      content: match[0],
      name: match[1].trim(), // Path
    })
  }

  // Find all numbering control matches: {numeric = false}, {style = "alphabetic"}, etc.
  numberingControlPattern.lastIndex = 0
  while ((match = numberingControlPattern.exec(normalizedText)) !== null) {
    const key = match[1].trim().toLowerCase()
    const value = match[2].trim().toLowerCase().replace(/['"]/g, '') // Remove quotes
    
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
        index: match.index,
        content: match[0],
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

  let match
  while ((match = citePattern.exec(text)) !== null) {
    if (!seen.has(match[1])) {
      citations.push(match[1])
      seen.add(match[1])
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

  let match
  while ((match = embedPattern.exec(text)) !== null) {
    embeds.push(match[1])
  }

  return embeds
}

