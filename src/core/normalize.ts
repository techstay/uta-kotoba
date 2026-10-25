/**
 * Normalizes text for forgiving search: full-width forms, case, katakana and
 * whitespace stop being obstacles.
 */
export function normalizeForSearch(input: string): string {
  return input
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\u30a1-\u30f6]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0x60))
    .replace(/[\s\u3000]+/g, '')
}
