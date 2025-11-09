/**
 * Content parsing utilities for plain text content with citations and embeds
 */

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

