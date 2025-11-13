/**
 * Heading numbering utilities
 * Assigns sequential numbers to headings based on hierarchy
 * Supports numeric (1, 1.1, 1.1.1) and alphabetic (A, a, etc.) styles
 */

export type HeadingNumberingStyle = 'numeric' | 'alphabetic' | 'none'

export interface HeadingNumberer {
  getNumber(level: 1 | 2 | 3): string | null
  reset(): void
}

/**
 * Create a heading numberer with the specified style
 */
export function createHeadingNumberer(style: HeadingNumberingStyle = 'numeric'): HeadingNumberer {
  const counters = [0, 0, 0] // For levels 1, 2, 3

  return {
    getNumber(level: 1 | 2 | 3): string | null {
      if (style === 'none') {
        return null
      }

      // Increment the counter for this level
      counters[level - 1]++

      // Reset deeper level counters when a higher level increments
      if (level === 1) {
        counters[1] = 0
        counters[2] = 0
      } else if (level === 2) {
        counters[2] = 0
      }

      // Build the number string based on style
      if (style === 'numeric') {
        const parts: number[] = []
        if (level >= 1 && counters[0] > 0) parts.push(counters[0])
        if (level >= 2 && counters[1] > 0) parts.push(counters[1])
        if (level >= 3 && counters[2] > 0) parts.push(counters[2])
        return parts.join('.')
      } else if (style === 'alphabetic') {
        const parts: string[] = []
        if (level >= 1 && counters[0] > 0) {
          parts.push(numberToLetter(counters[0], true)) // Uppercase for level 1
        }
        if (level >= 2 && counters[1] > 0) {
          parts.push(numberToLetter(counters[1], false)) // Lowercase for level 2
        }
        if (level >= 3 && counters[2] > 0) {
          parts.push(numberToLetter(counters[2], false)) // Lowercase for level 3
        }
        return parts.join('.')
      }

      return null
    },
    reset(): void {
      counters[0] = 0
      counters[1] = 0
      counters[2] = 0
    },
  }
}

/**
 * Convert a number to a letter (1 -> A, 2 -> B, etc.)
 * Supports uppercase and lowercase
 * For numbers > 26, cycles through A-Z (27 -> A, 28 -> B, etc.)
 */
function numberToLetter(num: number, uppercase: boolean = true): string {
  const base = uppercase ? 65 : 97 // ASCII: A=65, a=97
  // Convert to 0-based index, then modulo 26 to cycle
  const index = (num - 1) % 26
  return String.fromCharCode(base + index)
}

