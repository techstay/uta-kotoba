import { describe, expect, it } from 'vitest'
import { countMatches, createMatcher } from '@/core/matcher'

describe('createMatcher', () => {
  it('prefers the longest annotation at each position', () => {
    const match = createMatcher([
      { word: '夏', id: 0 },
      { word: '夏休み', id: 1 },
    ])
    expect(match('夏休みの宿題')).toEqual([{ text: '夏休み', annotationId: 1 }, { text: 'の宿題' }])
  })

  it('highlights every occurrence of a repeated word', () => {
    const match = createMatcher([{ word: 'さくら', id: 0 }])
    expect(match('さくら さくら')).toEqual([
      { text: 'さくら', annotationId: 0 },
      { text: ' ' },
      { text: 'さくら', annotationId: 0 },
    ])
  })

  it('keeps unmatched text around matches', () => {
    const match = createMatcher([{ word: '空', id: 0 }])
    expect(match('やよいの空は')).toEqual([
      { text: 'やよいの' },
      { text: '空', annotationId: 0 },
      { text: 'は' },
    ])
  })

  it('returns a single plain segment when nothing matches', () => {
    const match = createMatcher([{ word: '故郷', id: 0 }])
    expect(match('忘れ難き山')).toEqual([{ text: '忘れ難き山' }])
  })

  it('ignores blank annotation words', () => {
    const match = createMatcher([{ word: '   ', id: 0 }])
    expect(match('夏')).toEqual([{ text: '夏' }])
  })

  it('handles non-BMP characters without splitting them', () => {
    const match = createMatcher([{ word: '𠮷', id: 0 }])
    expect(match('𠮷野家')).toEqual([{ text: '𠮷', annotationId: 0 }, { text: '野家' }])
  })
})

describe('countMatches', () => {
  it('counts how many times each annotation appears', () => {
    const counts = countMatches([
      { text: 'さくら', annotationId: 0 },
      { text: ' ' },
      { text: 'さくら', annotationId: 0 },
      { text: '空', annotationId: 1 },
    ])
    expect(counts.get(0)).toBe(2)
    expect(counts.get(1)).toBe(1)
    expect(counts.get(2)).toBeUndefined()
  })
})
