export const CONTENT_LANGS = ['zh', 'en'] as const

export type ContentLang = (typeof CONTENT_LANGS)[number]

export type AudioProvider = 'bilibili' | 'youtube' | 'netease' | 'audio'

export interface AudioConfig {
  provider: AudioProvider
  /** Video / track id used by the provider. Not needed for `audio`. */
  id?: string
  /** Direct media or iframe URL. Used by `audio`. */
  url?: string
  /** Start offset in seconds. */
  start?: number
}

export interface Annotation {
  /** Surface form exactly as it appears in the lyrics. This is the matching key. */
  word: string
  /** Kana reading. Also used as the furigana above the word. */
  reading?: string
  /** Optional romanization, shown in the tooltip only. */
  romaji?: string
  pos?: string
  meaning: string
  note?: string
}

export interface AnnotationEntry extends Annotation {
  /** Index inside the annotation list of the active language. */
  id: number
}

export interface SongMeta {
  title: string
  artist: string
  tags: string[]
  difficulty?: string
  audio?: AudioConfig
  source?: string
}

export interface LyricLine {
  ja: string
  translations: Partial<Record<ContentLang, string>>
}

export interface LyricStanza {
  lines: LyricLine[]
}

export interface Song {
  slug: string
  meta: SongMeta
  /** Japanese title plus optional localized titles. */
  titles: Partial<Record<ContentLang, string>> & { ja: string }
  stanzas: LyricStanza[]
  annotations: Partial<Record<ContentLang, AnnotationEntry[]>>
  searchText: string
}

export interface MatchSegment {
  text: string
  annotationId?: number
}
