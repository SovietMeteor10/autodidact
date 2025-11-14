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

