import { parse } from 'yaml'
import { normalizeForSearch } from './normalize'
import {
  type Annotation,
  type AnnotationEntry,
  type AudioConfig,
  type AudioProvider,
  CONTENT_LANGS,
  type ContentLang,
  type LyricStanza,
  type Song,
  type SongMeta,
} from './types'

const songFiles = import.meta.glob('/data/songs/*/song.yaml', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

const lyricFiles = import.meta.glob('/data/songs/*/lyrics.txt', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

const annotationFiles = import.meta.glob('/data/songs/*/annotations.*.yaml', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

const translationFiles = import.meta.glob('/data/songs/*/translations.*.yaml', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

const AUDIO_PROVIDERS: AudioProvider[] = ['bilibili', 'youtube', 'netease', 'audio']

interface SongFiles {
  meta?: string
  lyrics?: string
  annotations: Partial<Record<ContentLang, string>>
  translations: Partial<Record<ContentLang, string>>
}

function warn(message: string): void {
  if (import.meta.env.DEV) {
    console.warn(`[uta-kotoba] ${message}`)
  }
}

function slugFromPath(path: string): string {
  return path.match(/\/data\/songs\/([^/]+)\//)?.[1] ?? path
}

function langFromPath(path: string): ContentLang | undefined {
  const code = path.match(/\.([a-z]{2})\.yaml$/)?.[1]
  return CONTENT_LANGS.find((lang) => lang === code)
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string').map((item) => item.trim())
}

function parseMeta(text: string, slug: string): SongMeta | null {
  let raw: unknown
  try {
    raw = parse(text)
  } catch (error) {
    warn(`song.yaml 解析失败（${slug}）：${String(error)}`)
    return null
  }
  if (!raw || typeof raw !== 'object') {
    warn(`song.yaml 内容为空或格式错误（${slug}）`)
    return null
  }

  const record = raw as Record<string, unknown>
  const title = asString(record.title)
  if (!title) {
    warn(`song.yaml 缺少 title（${slug}）`)
    return null
  }

  return {
    title,
    artist: asString(record.artist) ?? 'Unknown',
    tags: asStringArray(record.tags),
    difficulty: asString(record.difficulty),
    source: asString(record.source),
    audio: parseAudio(record.audio, slug),
  }
}

function parseAudio(value: unknown, slug: string): AudioConfig | undefined {
  if (!value || typeof value !== 'object') return undefined
  const record = value as Record<string, unknown>
  const provider = asString(record.provider) as AudioProvider | undefined
  if (!provider || !AUDIO_PROVIDERS.includes(provider)) {
    warn(`audio.provider 无效（${slug}）`)
    return undefined
  }
  const id = asString(record.id)
  const url = asString(record.url)
  if (provider === 'audio' ? !url : !id) {
    warn(`audio 配置不完整（${slug}）`)
    return undefined
  }
  const start = typeof record.start === 'number' ? record.start : undefined
  return { provider, id, url, start }
}

function parseStanzas(text: string, slug: string): LyricStanza[] {
  const blocks = text
    .replace(/\r\n/g, '\n')
    .trim()
    .split(/\n{2,}/)
    .map((block) =>
      block
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean),
    )
    .filter((block) => block.length > 0)

  if (blocks.length === 0) {
    warn(`lyrics.txt 为空（${slug}）`)
  }

  return blocks.map((block) => ({
    lines: block.map((ja) => ({ ja, translations: {} })),
  }))
}

function parseTranslations(text: string, slug: string, lang: ContentLang): string[] {
  let raw: unknown
  try {
    raw = parse(text)
  } catch (error) {
    warn(`translations.${lang}.yaml 解析失败（${slug}）：${String(error)}`)
    return []
  }
  if (!Array.isArray(raw)) {
    warn(`translations.${lang}.yaml 应为字符串数组（${slug}）`)
    return []
  }
  return raw.map((item) => (typeof item === 'string' ? item.trim() : ''))
}

function parseAnnotations(text: string, slug: string, lang: ContentLang): AnnotationEntry[] {
  let raw: unknown
  try {
    raw = parse(text)
  } catch (error) {
    warn(`annotations.${lang}.yaml 解析失败（${slug}）：${String(error)}`)
    return []
  }
  if (!Array.isArray(raw)) {
    warn(`annotations.${lang}.yaml 应为注释列表（${slug}）`)
    return []
  }

  const entries: AnnotationEntry[] = []
  const seen = new Set<string>()

  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const record = item as Record<string, unknown>
    const word = asString(record.word)
    const meaning = asString(record.meaning)
    if (!word || !meaning) {
      warn(`annotations.${lang}.yaml 存在缺少 word/meaning 的条目（${slug}）`)
      continue
    }
    if (seen.has(word)) {
      warn(`annotations.${lang}.yaml 中「${word}」重复，后续条目被忽略（${slug}）`)
      continue
    }
    seen.add(word)

    const annotation: Annotation = {
      word,
      meaning,
      reading: asString(record.reading),
      romaji: asString(record.romaji),
      pos: asString(record.pos),
      note: asString(record.note),
    }
    entries.push({ ...annotation, id: entries.length })
  }

  return entries
}

const grouped = new Map<string, SongFiles>()

function bucket(path: string): SongFiles {
  const slug = slugFromPath(path)
  let files = grouped.get(slug)
  if (!files) {
    files = { annotations: {}, translations: {} }
    grouped.set(slug, files)
  }
  return files
}

for (const [path, text] of Object.entries(songFiles)) bucket(path).meta = text
for (const [path, text] of Object.entries(lyricFiles)) bucket(path).lyrics = text
for (const [path, text] of Object.entries(annotationFiles)) {
  const lang = langFromPath(path)
  if (!lang) {
    warn(`忽略不支持的注释语言：${path}`)
    continue
  }
  bucket(path).annotations[lang] = text
}
for (const [path, text] of Object.entries(translationFiles)) {
  const lang = langFromPath(path)
  if (!lang) {
    warn(`忽略不支持的翻译语言：${path}`)
    continue
  }
  bucket(path).translations[lang] = text
}

function buildSong(slug: string, files: SongFiles): Song | null {
  if (!files.meta) {
    warn(`缺少 song.yaml（${slug}）`)
    return null
  }
  if (!files.lyrics) {
    warn(`缺少 lyrics.txt（${slug}）`)
    return null
  }

  const meta = parseMeta(files.meta, slug)
  if (!meta) return null

  const stanzas = parseStanzas(files.lyrics, slug)
  const flatLines = stanzas.flatMap((stanza) => stanza.lines)

  const annotations: Partial<Record<ContentLang, AnnotationEntry[]>> = {}
  for (const lang of CONTENT_LANGS) {
    const text = files.annotations[lang]
    if (!text) continue
    const entries = parseAnnotations(text, slug, lang)
    annotations[lang] = entries
  }

  for (const lang of CONTENT_LANGS) {
    const text = files.translations[lang]
    if (!text) continue
    const translations = parseTranslations(text, slug, lang)
    if (translations.length !== flatLines.length) {
      warn(
        `translations.${lang}.yaml 行数（${translations.length}）与歌词非空行数（${flatLines.length}）不一致（${slug}）`,
      )
    }
    translations.forEach((translation, index) => {
      const line = flatLines[index]
      if (line && translation) line.translations[lang] = translation
    })
  }

  const titles: Song['titles'] = { ja: meta.title }
  const titleZh = asStringFromMeta(files.meta, 'title_zh')
  const titleEn = asStringFromMeta(files.meta, 'title_en')
  if (titleZh) titles.zh = titleZh
  if (titleEn) titles.en = titleEn

  const searchText = normalizeForSearch(
    [
      meta.title,
      titles.zh,
      titles.en,
      meta.artist,
      meta.tags.join(' '),
      flatLines.map((line) => line.ja).join(' '),
      ...Object.values(annotations).flatMap((entries) =>
        (entries ?? []).flatMap((entry) => [
          entry.word,
          entry.meaning,
          entry.reading,
          entry.romaji,
          entry.note,
        ]),
      ),
    ]
      .filter(Boolean)
      .join(' '),
  )

  return { slug, meta, titles, stanzas, annotations, searchText }
}

function asStringFromMeta(text: string, key: string): string | undefined {
  try {
    const raw = parse(text)
    if (!raw || typeof raw !== 'object') return undefined
    return asString((raw as Record<string, unknown>)[key])
  } catch {
    return undefined
  }
}

export const songs: Song[] = Array.from(grouped.entries())
  .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
  .map(([slug, files]) => buildSong(slug, files))
  .filter((song): song is Song => song !== null)

export function getSong(slug: string): Song | undefined {
  return songs.find((song) => song.slug === slug)
}
