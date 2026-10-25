import { reactive, watch } from 'vue'
import { CONTENT_LANGS, type ContentLang } from '@/core/types'

const STORAGE_KEY = 'uta-kotoba:settings'

export interface Settings {
  lang: ContentLang
  furigana: boolean
  annotations: boolean
  translations: boolean
}

const DEFAULTS: Settings = {
  lang: 'zh',
  furigana: true,
  annotations: true,
  translations: true,
}

function readSettings(): Settings {
  if (typeof localStorage === 'undefined') return { ...DEFAULTS }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULTS }
    const parsed = JSON.parse(raw) as Partial<Settings>
    return {
      lang: CONTENT_LANGS.find((lang) => lang === parsed.lang) ?? DEFAULTS.lang,
      furigana: typeof parsed.furigana === 'boolean' ? parsed.furigana : DEFAULTS.furigana,
      annotations:
        typeof parsed.annotations === 'boolean' ? parsed.annotations : DEFAULTS.annotations,
      translations:
        typeof parsed.translations === 'boolean' ? parsed.translations : DEFAULTS.translations,
    }
  } catch {
    return { ...DEFAULTS }
  }
}

export const settings = reactive<Settings>(readSettings())

watch(settings, () => {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // Storage can be unavailable in private mode; settings simply stay session-only.
  }
})

export function useSettings(): Settings {
  return settings
}
