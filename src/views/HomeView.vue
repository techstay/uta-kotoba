<script setup lang="ts">
import { computed, ref } from 'vue'
import SongCard from '@/components/SongCard.vue'
import { useI18n } from '@/core/i18n'
import { songs } from '@/core/loader'
import { normalizeForSearch } from '@/core/normalize'
import { CONTENT_LANGS } from '@/core/types'

const { t, lang } = useI18n()

const query = ref('')

const filtered = computed(() => {
  const needle = normalizeForSearch(query.value.trim())
  if (!needle) return songs
  return songs.filter((song) => song.searchText.includes(needle))
})

const totalWords = computed(() =>
  songs.reduce((sum, song) => sum + (song.annotations[lang.value]?.length ?? 0), 0),
)
</script>

<template>
  <div class="mx-auto max-w-6xl px-5 pt-8 pb-10 sm:pt-12">
    <section
      class="hero-panel ui-panel relative overflow-hidden rounded-3xl px-6 py-9 sm:px-10 sm:py-12"
    >
      <span class="tape hero-tape" aria-hidden="true" />

      <div class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-center">
        <div class="hero-copy">
          <p class="hero-kicker ui-label">
            <span aria-hidden="true">✦</span>
            {{ t('appNameLatin') }}
          </p>
          <h1 class="hero-title mt-4 font-jp-serif text-4xl leading-tight sm:text-5xl">
            {{ t('appName') }}
          </h1>
          <p class="hero-tagline mt-4 max-w-xl text-sm leading-relaxed text-ink-soft sm:text-base">
            {{ t('tagline') }}
          </p>

          <div class="hero-search mt-7 flex max-w-md items-center gap-3">
            <div class="relative w-full">
              <svg
                viewBox="0 0 24 24"
                class="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 fill-none stroke-ink-faint stroke-2"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.2-3.2" stroke-linecap="round" />
              </svg>
              <input
                v-model="query"
                type="search"
                :placeholder="t('searchPlaceholder')"
                :aria-label="t('searchPlaceholder')"
                class="w-full rounded-full border border-line bg-paper py-2.5 pr-10 pl-10 text-sm text-ink placeholder:text-ink-faint/80 focus:border-accent/60 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
              />
              <button
                v-if="query"
                type="button"
                class="absolute top-1/2 right-3 grid size-5 -translate-y-1/2 place-items-center rounded-full text-ink-faint transition-colors hover:bg-accent-soft/70 hover:text-accent"
                :aria-label="t('clearSearch')"
                @click="query = ''"
              >
                <svg
                  viewBox="0 0 24 24"
                  class="size-3.5 fill-none stroke-current stroke-2"
                  aria-hidden="true"
                >
                  <path d="M6 6l12 12M18 6L6 18" stroke-linecap="round" />
                </svg>
              </button>
            </div>
          </div>

          <dl class="hero-stats">
            <div class="stat">
              <dt class="ui-label">{{ t('statSongs') }}</dt>
              <dd class="stat-no">{{ songs.length }}</dd>
            </div>
            <div class="stat">
              <dt class="ui-label">{{ t('statWords') }}</dt>
              <dd class="stat-no">{{ totalWords }}</dd>
            </div>
            <div class="stat">
              <dt class="ui-label">{{ t('statLangs') }}</dt>
              <dd class="stat-no">{{ CONTENT_LANGS.length }}</dd>
            </div>
          </dl>
        </div>

        <div class="hero-art hidden lg:grid" aria-hidden="true">
          <div class="hero-disc">
            <span class="hero-disc-label">歌</span>
          </div>
          <span class="hero-vertical">歌詞で学ぶ日本語</span>
          <span class="hero-sticker">歌詞ノート</span>
        </div>
      </div>
    </section>

    <div class="mt-10 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="ui-label">Library · 01</p>
        <h2 class="font-display mt-1.5 text-xl tracking-[0.06em]">{{ t('library') }}</h2>
      </div>
      <span class="chip px-3 py-1 text-[0.68rem]">{{ t('results', { n: filtered.length }) }}</span>
    </div>

    <div v-if="filtered.length" class="song-grid mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <SongCard
        v-for="(song, index) in filtered"
        :key="song.slug"
        :song="song"
        :index="index + 1"
      />
    </div>

    <div v-else class="ui-panel mt-5 border-dashed px-6 py-14 text-center">
      <p class="font-display text-lg text-ink-soft">
        {{ query ? t('noResults') : t('emptyLibrary') }}
      </p>
      <p class="mt-2 text-xs leading-relaxed text-ink-faint">
        {{ query ? t('noResultsHint') : t('emptyLibraryHint') }}
      </p>
    </div>
  </div>
</template>
