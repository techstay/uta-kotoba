<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '@/core/i18n'
import type { Song } from '@/core/types'

const props = defineProps<{ song: Song; index?: number }>()

const { t, lang } = useI18n()

const localizedTitle = computed(() => props.song.titles[lang.value])
const firstLine = computed(() => props.song.stanzas[0]?.lines[0]?.ja ?? '')
const annotations = computed(() => props.song.annotations[lang.value] ?? [])
const previewWords = computed(() => annotations.value.slice(0, 4))
const annotationCount = computed(() => annotations.value.length)
const order = computed(() => String(props.index ?? 0).padStart(2, '0'))
</script>

<template>
  <RouterLink
    :to="{ name: 'song', params: { slug: song.slug } }"
    class="song-card ui-panel group flex h-full flex-col p-5"
  >
    <div class="flex items-start justify-between gap-3">
      <span class="card-index" aria-hidden="true">{{ order }}</span>
      <span v-if="song.meta.difficulty" class="chip">{{ song.meta.difficulty }}</span>
    </div>

    <p class="ui-label mt-4 truncate">{{ song.meta.artist }}</p>
    <h3
      class="card-title mt-1.5 font-jp-serif text-lg leading-snug text-ink transition-colors group-hover:text-accent"
    >
      {{ song.meta.title }}
    </h3>
    <p
      v-if="localizedTitle && localizedTitle !== song.meta.title"
      class="mt-1 truncate text-xs text-ink-soft"
    >
      {{ localizedTitle }}
    </p>

    <p class="card-line mt-3 line-clamp-2 font-jp-serif text-sm leading-relaxed text-ink-soft">
      {{ firstLine }}
    </p>

    <div v-if="previewWords.length" class="mt-3 flex flex-wrap gap-1.5">
      <span
        v-for="entry in previewWords"
        :key="entry.id"
        class="vocab-chip rounded-md bg-accent-soft/60 px-1.5 py-0.5 text-[0.65rem] text-accent"
      >
        {{ entry.word }}
      </span>
    </div>

    <div class="mt-auto flex items-end justify-between gap-3 pt-5">
      <div class="flex min-w-0 flex-wrap gap-1.5">
        <span v-for="tag in song.meta.tags" :key="tag" class="chip">{{ tag }}</span>
      </div>
      <div class="flex shrink-0 items-center gap-2">
        <span class="text-[0.64rem] text-ink-faint">
          {{ t('vocabularyCount', { n: annotationCount }) }}
        </span>
        <span class="arrow-key" aria-hidden="true">
          <svg viewBox="0 0 24 24" class="size-3.5 fill-none stroke-current stroke-2">
            <path d="M7 17 17 7M9 7h8v8" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </span>
      </div>
    </div>
  </RouterLink>
</template>
