/**
 * Citation numbering utilities
 * Assigns sequential numbers [1], [2], etc. to citations based on order of first appearance
 */

/**
 * Create a mapping of citation names to their numbers
 * Citations are numbered based on order of first appearance in text
 */
export function numberCitations(citations: string[]): Map<string, number> {
  const mapping = new Map<string, number>()
  citations.forEach((name, index) => {
    mapping.set(name, index + 1)
  })
  return mapping
}

