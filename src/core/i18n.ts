import { type ComputedRef, computed } from 'vue'
import { useSettings } from '@/composables/useSettings'
import type { ContentLang } from '@/core/types'

const messages = {
  zh: {
    appName: '歌言葉',
    appNameLatin: 'Uta-Kotoba',
    tagline: '把喜欢的歌词，一句一句读成自己的语言。',
    library: '歌词库',
    searchPlaceholder: '搜索歌名、歌手、标签，或歌词里的一个词…',
    clearSearch: '清空搜索',
    results: '共 {n} 首歌',
    songCount: '{n} 首',
    statSongs: '曲目',
    statWords: '生词',
    statLangs: '释义语言',
    emptyLibrary: '歌词库还空着',
    emptyLibraryHint: '往 data/songs 放一个歌曲目录，这里就有内容了。',
    noResults: '没有找到匹配的歌',
    noResultsHint: '换个关键词试试，比如歌手名、标签或一个生词。',
    backToLibrary: '返回歌词库',
    audio: '试听',
    audioUnavailable: '暂无音频',
    audioUnavailableHint: '在 song.yaml 里补上 audio 配置即可开启试听。',
    play: '点击播放',
    playerLoading: '正在加载播放器…',
    openExternal: '在站外打开',
    expandPlayer: '展开播放器',
    collapsePlayer: '收起播放器',
    backToTop: '回到顶部',
    vocabulary: '生词',
    vocabularyCount: '{n} 个词',
    vocabularyHint: '点击词条可跳到歌词中的位置。',
    noVocabulary: '这首歌还没有生词注释',
    missingLanguage: '当前语言下还没有这首歌的注释，换个语言看看。',
    furigana: '假名',
    annotations: '释义',
    translations: '翻译',
    reading: '读音',
    difficulty: '难度',
    tags: '标签',
    source: '来源',
    close: '关闭',
    notFoundTitle: '找不到这一页',
    notFoundBody: '链接可能拼错了，或者这首歌已经搬走。',
    footerNote: '歌词与释义仅用于日语学习。',
    occurrences: '出现 {n} 次',
    showSettings: '显示设置',
  },
  en: {
    appName: 'Uta-Kotoba',
    appNameLatin: '歌言葉',
    tagline: 'Read the lyrics you love, one line at a time.',
    library: 'Library',
    searchPlaceholder: 'Search titles, artists, tags, or a word from the lyrics…',
    clearSearch: 'Clear search',
    results: '{n} songs',
    songCount: '{n} songs',
    statSongs: 'Songs',
    statWords: 'Glossed words',
    statLangs: 'Gloss languages',
    emptyLibrary: 'The library is empty',
    emptyLibraryHint: 'Drop a song folder into data/songs and it will show up here.',
    noResults: 'No songs matched',
    noResultsHint: 'Try another keyword — an artist, a tag, or a vocabulary word.',
    backToLibrary: 'Back to library',
    audio: 'Listen',
    audioUnavailable: 'No audio yet',
    audioUnavailableHint: 'Add an audio block to song.yaml to enable playback.',
    play: 'Click to play',
    playerLoading: 'Loading player…',
    openExternal: 'Open externally',
    expandPlayer: 'Open player',
    collapsePlayer: 'Minimize player',
    backToTop: 'Back to top',
    vocabulary: 'Vocabulary',
    vocabularyCount: '{n} words',
    vocabularyHint: 'Click a word to jump to its place in the lyrics.',
    noVocabulary: 'No vocabulary notes for this song yet',
    missingLanguage: 'No notes for this song in the current language.',
    furigana: 'Furigana',
    annotations: 'Glosses',
    translations: 'Translation',
    reading: 'Reading',
    difficulty: 'Level',
    tags: 'Tags',
    source: 'Source',
    close: 'Close',
    notFoundTitle: 'Page not found',
    notFoundBody: 'The link may be wrong, or this song has moved.',
    footerNote: 'Lyrics and glosses are provided for language study only.',
    occurrences: 'appears {n}×',
    showSettings: 'Display settings',
  },
} as const satisfies Record<ContentLang, Record<string, string>>

export type MessageKey = keyof (typeof messages)['zh']

export function useI18n(): {
  t: (key: MessageKey, params?: Record<string, string | number>) => string
  lang: ComputedRef<ContentLang>
} {
  const settings = useSettings()
  const t = (key: MessageKey, params?: Record<string, string | number>): string => {
    let text: string = messages[settings.lang][key] ?? messages.zh[key]
    if (params) {
      for (const [name, value] of Object.entries(params)) {
        text = text.replaceAll(`{${name}}`, String(value))
      }
    }
    return text
  }
  const lang = computed(() => settings.lang)
  return { t, lang }
}
