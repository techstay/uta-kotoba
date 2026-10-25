import type { MatchSegment } from './types'

export interface MatchCandidate {
  word: string
  id: number
}

/**
 * Builds a matcher for one song and one language.
 *
 * The longest surface form wins at every position, so 「夏休み」 is preferred
 * over 「夏」 when both are annotated. Annotations that never appear simply
 * never match.
 */
export function createMatcher(entries: MatchCandidate[]): (line: string) => MatchSegment[] {
  const candidates = entries
    .filter((entry) => entry.word.trim().length > 0)
    .map((entry) => ({ id: entry.id, chars: Array.from(entry.word) }))
    .sort((a, b) => b.chars.length - a.chars.length)

  return (line: string): MatchSegment[] => {
    const chars = Array.from(line)
    const segments: MatchSegment[] = []
    let plain = ''
    let cursor = 0

    const flush = () => {
      if (plain) {
        segments.push({ text: plain })
        plain = ''
      }
    }

    while (cursor < chars.length) {
      const hit = candidates.find((candidate) => matchesAt(chars, cursor, candidate.chars))
      if (hit) {
        flush()
        segments.push({ text: hit.chars.join(''), annotationId: hit.id })
        cursor += hit.chars.length
      } else {
        plain += chars[cursor]
        cursor += 1
      }
    }

    flush()
    return segments
  }
}

function matchesAt(source: string[], start: number, target: string[]): boolean {
  if (start + target.length > source.length) return false
  for (let index = 0; index < target.length; index += 1) {
    if (source[start + index] !== target[index]) return false
  }
  return true
}

/** Counts how many times each annotation id occurs in the rendered segments. */
export function countMatches(segments: MatchSegment[]): Map<number, number> {
  const counts = new Map<number, number>()
  for (const segment of segments) {
    if (segment.annotationId === undefined) continue
    counts.set(segment.annotationId, (counts.get(segment.annotationId) ?? 0) + 1)
  }
  return counts
}
