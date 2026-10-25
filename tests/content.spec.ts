import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { parse } from 'yaml'
import { songs } from '@/core/loader'
import { createMatcher } from '@/core/matcher'
import { CONTENT_LANGS } from '@/core/types'

const SONGS_DIR = fileURLToPath(new URL('../data/songs', import.meta.url))
const AUDIO_PROVIDERS = ['bilibili', 'youtube', 'netease', 'audio']
const KANA_ONLY = /^[\u3040-\u309f\u30a0-\u30ff]+$/

function songDirs(): string[] {
  return readdirSync(SONGS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
}

function readYaml(file: string): unknown {
  return parse(readFileSync(file, 'utf8'))
}

function lyricLines(dir: string): string[] {
  const text = readFileSync(path.join(dir, 'lyrics.txt'), 'utf8').replace(/\r\n/g, '\n').trim()
  return text.split(/\n{2,}/).flatMap((block) =>
    block
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean),
  )
}

describe('song content', () => {
  const dirs = songDirs()

  it('loads every song directory', () => {
    expect(dirs.length).toBeGreaterThan(0)
    expect(songs.map((song) => song.slug).sort()).toEqual(dirs)
  })

  it('has valid metadata, lyrics and audio config', () => {
    for (const slug of dirs) {
      const dir = path.join(SONGS_DIR, slug)
      expect(existsSync(path.join(dir, 'song.yaml')), `${slug}: missing song.yaml`).toBe(true)
      expect(existsSync(path.join(dir, 'lyrics.txt')), `${slug}: missing lyrics.txt`).toBe(true)

      const meta = readYaml(path.join(dir, 'song.yaml')) as Record<string, unknown> | null
      expect(meta, `${slug}: empty song.yaml`).toBeTruthy()
      expect(typeof meta?.title, `${slug}: title must be a string`).toBe('string')
      expect(String(meta?.title).trim(), `${slug}: title must not be blank`).not.toBe('')
      expect(typeof meta?.artist, `${slug}: artist must be a string`).toBe('string')
      expect(String(meta?.artist).trim(), `${slug}: artist must not be blank`).not.toBe('')
      expect(lyricLines(dir).length, `${slug}: lyrics.txt is empty`).toBeGreaterThan(0)

      const audio = meta?.audio
      if (audio !== undefined) {
        expect(audio && typeof audio === 'object', `${slug}: audio must be an object`).toBe(true)
        const record = audio as Record<string, unknown>
        expect(AUDIO_PROVIDERS, `${slug}: invalid audio.provider`).toContain(record.provider)
        if (record.provider === 'audio') {
          expect(typeof record.url, `${slug}: audio.url is required`).toBe('string')
        } else {
          expect(typeof record.id, `${slug}: audio.id is required`).toBe('string')
        }
        if (record.start !== undefined) {
          expect(typeof record.start, `${slug}: audio.start must be a number`).toBe('number')
        }
      }
    }
  })

  it('has valid annotations', () => {
    for (const slug of dirs) {
      for (const lang of CONTENT_LANGS) {
        const file = path.join(SONGS_DIR, slug, `annotations.${lang}.yaml`)
        if (!existsSync(file)) continue
        const raw = readYaml(file)
        expect(Array.isArray(raw), `${slug}/${lang}: annotations must be a list`).toBe(true)

        const seen = new Set<string>()
        for (const [index, item] of (raw as unknown[]).entries()) {
          expect(
            item && typeof item === 'object',
            `${slug}/${lang} #${index}: entry must be an object`,
          ).toBe(true)
          const entry = item as Record<string, unknown>
          const word = typeof entry.word === 'string' ? entry.word.trim() : ''
          const meaning = typeof entry.meaning === 'string' ? entry.meaning.trim() : ''

          expect(word, `${slug}/${lang} #${index}: word is required`).not.toBe('')
          expect(meaning, `${slug}/${lang} #${index}: meaning is required`).not.toBe('')
          expect(seen.has(word), `${slug}/${lang}: duplicate word 「${word}」`).toBe(false)
          seen.add(word)

          if (entry.reading !== undefined) {
            expect(
              typeof entry.reading,
              `${slug}/${lang}: 「${word}」reading must be a string`,
            ).toBe('string')
            expect(
              String(entry.reading),
              `${slug}/${lang}: 「${word}」reading must be kana only`,
            ).toMatch(KANA_ONLY)
          }
        }
      }
    }
  })

  it('matches every annotation at least once', () => {
    for (const song of songs) {
      for (const lang of CONTENT_LANGS) {
        const entries = song.annotations[lang]
        if (!entries?.length) continue

        const matcher = createMatcher(entries.map(({ word, id }) => ({ word, id })))
        const matched = new Set<number>()
        for (const stanza of song.stanzas) {
          for (const line of stanza.lines) {
            for (const segment of matcher(line.ja)) {
              if (segment.annotationId !== undefined) matched.add(segment.annotationId)
            }
          }
        }

        const missing = entries.filter((entry) => !matched.has(entry.id)).map((entry) => entry.word)
        expect(missing, `${song.slug}/${lang}: annotations never matched`).toEqual([])
      }
    }
  })

  it('keeps translations aligned with lyric lines', () => {
    for (const slug of dirs) {
      const lineCount = lyricLines(path.join(SONGS_DIR, slug)).length
      for (const lang of CONTENT_LANGS) {
        const file = path.join(SONGS_DIR, slug, `translations.${lang}.yaml`)
        if (!existsSync(file)) continue
        const raw = readYaml(file)
        expect(Array.isArray(raw), `${slug}/${lang}: translations must be a list`).toBe(true)

        const list = raw as unknown[]
        expect(list.length, `${slug}/${lang}: translation line count`).toBe(lineCount)
        expect(
          list.every((item) => typeof item === 'string'),
          `${slug}/${lang}: every translation must be a string`,
        ).toBe(true)
      }
    }
  })
})
