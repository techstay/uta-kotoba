<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import AudioPlayer from '@/components/AudioPlayer.vue'
import LyricLine from '@/components/LyricLine.vue'
import SettingsBar from '@/components/SettingsBar.vue'
import { useSettings } from '@/composables/useSettings'
import { useI18n } from '@/core/i18n'
import { getSong } from '@/core/loader'
import { createMatcher } from '@/core/matcher'
import type { AnnotationEntry, Song } from '@/core/types'
import NotFoundView from './NotFoundView.vue'

const props = defineProps<{ slug: string }>()

const settings = useSettings()
const { t, lang } = useI18n()

const song = computed<Song | undefined>(() => getSong(props.slug))
const localizedTitle = computed(() => (song.value ? song.value.titles[lang.value] : undefined))
const annotations = computed<AnnotationEntry[]>(() => song.value?.annotations[lang.value] ?? [])
const annotationMap = computed(() => new Map(annotations.value.map((entry) => [entry.id, entry])))
const matcher = computed(() =>
  createMatcher(annotations.value.map(({ word, id }) => ({ word, id }))),
)

const renderedStanzas = computed(() => {
  const current = song.value
  if (!current) return []
  const match = matcher.value
  return current.stanzas.map((stanza, stanzaIndex) => ({
    key: `stanza-${stanzaIndex}`,
    no: String(stanzaIndex + 1).padStart(2, '0'),
    lines: stanza.lines.map((line, lineIndex) => {
      const anchorPrefix = `s${stanzaIndex}l${lineIndex}`
      return { key: anchorPrefix, line, segments: match(line.ja), anchorPrefix }
    }),
  }))
})

const stats = computed(() => {
  const counts = new Map<number, number>()
  const firstAnchor = new Map<number, string>()
  for (const stanza of renderedStanzas.value) {
    for (const item of stanza.lines) {
      item.segments.forEach((segment, index) => {
        if (segment.annotationId === undefined) return
        counts.set(segment.annotationId, (counts.get(segment.annotationId) ?? 0) + 1)
        if (!firstAnchor.has(segment.annotationId)) {
          firstAnchor.set(segment.annotationId, `${item.anchorPrefix}-${index}`)
        }
      })
    }
  }
  return { counts, firstAnchor }
})

const hasAnotherLanguage = computed(() => {
  const current = song.value
  if (!current) return false
  return Object.entries(current.annotations).some(
    ([code, entries]) => code !== lang.value && (entries?.length ?? 0) > 0,
  )
})

let flashTimer: number | undefined

const showBackToTop = ref(false)

function onScroll(): void {
  showBackToTop.value = window.scrollY > 360
}

function scrollToTop(): void {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' })
}

const vocabList = ref<HTMLElement | null>(null)
const activeVocabId = ref<number | null>(null)

function focusVocab(annotationId: number): void {
  activeVocabId.value = annotationId
  const list = vocabList.value
  const item = document.getElementById(`vocab-${annotationId}`)
  if (!list || !item) return
  const listRect = list.getBoundingClientRect()
  const itemRect = item.getBoundingClientRect()
  const top =
    list.scrollTop + (itemRect.top - listRect.top) - (list.clientHeight - itemRect.height) / 2
  list.scrollTo({ top: Math.max(0, top), behavior: 'smooth' })
}

async function jumpTo(annotationId: number): Promise<void> {
  activeVocabId.value = annotationId
  if (!settings.annotations) {
    settings.annotations = true
    await nextTick()
  }
  const anchor = stats.value.firstAnchor.get(annotationId)
  if (!anchor) return
  const element = document.getElementById(anchor)
  if (!element) return
  element.scrollIntoView({ behavior: 'smooth', block: 'center' })
  element.classList.remove('token-flash')
  void element.offsetWidth
  element.classList.add('token-flash')
  window.clearTimeout(flashTimer)
  flashTimer = window.setTimeout(() => element.classList.remove('token-flash'), 1700)
}

watch(
  () => props.slug,
  () => {
    window.clearTimeout(flashTimer)
    activeVocabId.value = null
  },
)

onMounted(() => {
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })
})

onBeforeUnmount(() => {
  window.clearTimeout(flashTimer)
  window.removeEventListener('scroll', onScroll)
})
</script>

<template>
  <div class="mx-auto max-w-6xl px-5 pt-6 pb-16">
    <template v-if="song">
      <RouterLink
        to="/"
        class="back-fab"
        :aria-label="t('backToLibrary')"
        :title="t('backToLibrary')"
      >
        <svg viewBox="0 0 24 24" class="back-fab-icon" aria-hidden="true">
          <path
            d="M19 12H5M11 18l-6-6 6-6"
            fill="none"
            stroke="currentColor"
            stroke-width="2.2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        <span class="back-fab-label">{{ t('backToLibrary') }}</span>
      </RouterLink>

      <header class="ui-panel mt-4 overflow-hidden p-5 sm:p-7">
        <div class="min-w-0">
          <p class="ui-label">{{ song.meta.artist }}</p>
          <h1 class="mt-2 font-jp-serif text-3xl leading-tight tracking-[0.04em] sm:text-4xl">
            {{ song.meta.title }}
          </h1>
          <p
            v-if="localizedTitle && localizedTitle !== song.meta.title"
            class="mt-1.5 text-sm text-ink-soft"
          >
            {{ localizedTitle }}
          </p>

          <div class="mt-4 flex flex-wrap items-center gap-1.5">
            <span
              v-if="song.meta.difficulty"
              class="chip border-accent/40 bg-accent-soft/50 text-accent"
            >
              {{ t('difficulty') }} {{ song.meta.difficulty }}
            </span>
            <span v-for="tag in song.meta.tags" :key="tag" class="chip">
              {{ tag }}
            </span>
          </div>
        </div>
      </header>

      <div class="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start lg:gap-8">
        <div class="min-w-0">
          <div class="sticky top-[4.75rem] z-30 -mx-1 px-1 py-1">
            <SettingsBar />
          </div>

          <p
            v-if="!annotations.length && hasAnotherLanguage"
            class="mt-4 rounded-xl border border-dashed border-line px-4 py-3 text-xs text-ink-faint"
          >
            {{ t('missingLanguage') }}
          </p>

          <div class="mt-6 space-y-8">
            <section v-for="stanza in renderedStanzas" :key="stanza.key">
              <div class="stanza-head">
                <span class="stanza-no">{{ stanza.no }}</span>
                <span class="stanza-rule" aria-hidden="true" />
              </div>
              <div class="space-y-4">
                <LyricLine
                  v-for="item in stanza.lines"
                  :key="item.key"
                  :line="item.line"
                  :segments="item.segments"
                  :annotations="annotationMap"
                  :anchor-prefix="item.anchorPrefix"
                  @select="focusVocab"
                />
              </div>
            </section>
          </div>
        </div>

        <aside
          class="vocab-panel ui-panel flex flex-col p-4 lg:sticky lg:top-[4.75rem] lg:max-h-[calc(100vh-6rem)]"
        >
          <div class="flex items-baseline justify-between gap-3">
            <div>
              <p class="ui-label">Vocabulary</p>
              <h2 class="font-display mt-1 text-base tracking-[0.06em]">{{ t('vocabulary') }}</h2>
            </div>
            <span class="chip">{{ t('vocabularyCount', { n: annotations.length }) }}</span>
          </div>
          <p v-if="annotations.length" class="mt-2 text-[0.66rem] leading-relaxed text-ink-faint">
            {{ t('vocabularyHint') }}
          </p>

          <ul
            v-if="annotations.length"
            ref="vocabList"
            class="vocab-list -mx-1 mt-2 min-h-0 flex-1 divide-y divide-line/60 overflow-y-auto pr-1"
          >
            <li v-for="entry in annotations" :id="`vocab-${entry.id}`" :key="entry.id">
              <button
                type="button"
                class="vocab-item group"
                :class="{ 'vocab-item-active': activeVocabId === entry.id }"
                @click="jumpTo(entry.id)"
              >
                <span class="vocab-no" aria-hidden="true">
                  {{ String(entry.id + 1).padStart(2, '0') }}
                </span>
                <span class="min-w-0 flex-1">
                  <span class="flex items-baseline justify-between gap-2">
                    <span class="font-jp-serif text-[0.95rem] text-ink group-hover:text-accent">
                      {{ entry.word }}
                    </span>
                    <span
                      v-if="entry.reading && entry.reading !== entry.word"
                      class="font-jp-serif shrink-0 text-[0.64rem] text-ink-faint"
                    >
                      {{ entry.reading }}
                    </span>
                  </span>
                  <span class="font-ui mt-0.5 block text-[0.74rem] leading-snug text-ink-soft">
                    {{ entry.meaning }}
                  </span>
                  <span class="font-ui mt-1 block text-[0.6rem] text-ink-faint">
                    {{ t('occurrences', { n: stats.counts.get(entry.id) ?? 0 }) }}
                  </span>
                </span>
              </button>
            </li>
          </ul>

          <p
            v-else
            class="mt-3 rounded-lg border border-dashed border-line px-3 py-6 text-center text-xs text-ink-faint"
          >
            {{ t('noVocabulary') }}
          </p>
        </aside>
      </div>

      <div class="floating-dock">
        <button
          v-if="showBackToTop"
          type="button"
          class="to-top-fab"
          :aria-label="t('backToTop')"
          :title="t('backToTop')"
          @click="scrollToTop"
        >
          <svg viewBox="0 0 24 24" class="size-5" aria-hidden="true">
            <path
              d="M12 19V5M6 11l6-6 6 6"
              fill="none"
              stroke="currentColor"
              stroke-width="2.2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
        <AudioPlayer :audio="song.meta.audio" :title="song.meta.title" />
      </div>
    </template>

    <NotFoundView v-else />
  </div>
</template>
