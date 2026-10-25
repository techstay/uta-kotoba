<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from '@/core/i18n'
import type { AudioConfig } from '@/core/types'

const props = defineProps<{
  audio?: AudioConfig
  title: string
}>()

const { t } = useI18n()

// loaded 只置真一次：收起时用 v-show 隐藏面板而不是卸载 iframe，音乐可以继续播放。
const loaded = ref(false)
const expanded = ref(false)

const embedSrc = computed(() => buildEmbedUrl(props.audio))
const externalUrl = computed(() => buildExternalUrl(props.audio))
const isNativeAudio = computed(() => props.audio?.provider === 'audio')
const embedHeight = computed(() =>
  props.audio?.provider === 'netease' ? 'h-[86px]' : 'aspect-video',
)

function open(): void {
  if (!embedSrc.value) return
  loaded.value = true
  expanded.value = true
}

function collapse(): void {
  expanded.value = false
}

function buildEmbedUrl(audio?: AudioConfig): string | null {
  if (!audio) return null
  switch (audio.provider) {
    case 'bilibili':
      return audio.id
        ? `https://player.bilibili.com/player.html?bvid=${encodeURIComponent(audio.id)}&autoplay=1&high_quality=1&danmaku=0`
        : null
    case 'youtube': {
      if (!audio.id) return null
      const params = new URLSearchParams({ autoplay: '1', rel: '0' })
      if (audio.start) params.set('start', String(audio.start))
      return `https://www.youtube.com/embed/${encodeURIComponent(audio.id)}?${params.toString()}`
    }
    case 'netease':
      return audio.id
        ? `https://music.163.com/outchain/player?type=2&id=${encodeURIComponent(audio.id)}&auto=1&height=66`
        : null
    case 'audio':
      return audio.url ?? null
    default:
      return null
  }
}

function buildExternalUrl(audio?: AudioConfig): string | null {
  if (!audio) return null
  switch (audio.provider) {
    case 'bilibili':
      return audio.id ? `https://www.bilibili.com/video/${encodeURIComponent(audio.id)}` : null
    case 'youtube':
      return audio.id ? `https://www.youtube.com/watch?v=${encodeURIComponent(audio.id)}` : null
    case 'netease':
      return audio.id ? `https://music.163.com/#/song?id=${encodeURIComponent(audio.id)}` : null
    case 'audio':
      return audio.url ?? null
    default:
      return null
  }
}
</script>

<template>
  <template v-if="embedSrc">
    <section v-if="loaded" v-show="expanded" class="audio-panel ui-panel w-full p-3 sm:p-4">
      <div class="flex items-center justify-between gap-3">
        <span class="ui-label">{{ t('audio') }}</span>
        <div class="flex items-center gap-2.5">
          <a
            v-if="externalUrl"
            :href="externalUrl"
            target="_blank"
            rel="noreferrer noopener"
            class="text-[0.65rem] text-ink-faint underline-offset-2 hover:text-accent hover:underline"
          >
            {{ t('openExternal') }} ↗
          </a>
          <button
            type="button"
            class="audio-dock-toggle"
            :aria-label="t('collapsePlayer')"
            :title="t('collapsePlayer')"
            @click="collapse"
          >
            <svg viewBox="0 0 24 24" class="size-3.5" aria-hidden="true">
              <path
                d="M6 9l6 6 6-6"
                fill="none"
                stroke="currentColor"
                stroke-width="2.4"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>

      <audio v-if="isNativeAudio" :src="embedSrc" class="mt-3 w-full" controls autoplay />
      <iframe
        v-else
        :src="embedSrc"
        :class="['mt-3 w-full rounded-xl border border-line', embedHeight]"
        :title="`${t('audio')} · ${title}`"
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
        allowfullscreen
        referrerpolicy="no-referrer"
      />
    </section>

    <button
      v-if="!expanded"
      type="button"
      class="audio-fab"
      :aria-label="t('expandPlayer')"
      :title="t('expandPlayer')"
      @click="open"
    >
      <span class="audio-play">
        <svg
          v-if="loaded"
          viewBox="0 0 24 24"
          class="size-4"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M9 18V5l12-2v13" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="18" cy="16" r="3" />
        </svg>
        <svg v-else viewBox="0 0 24 24" class="ml-0.5 size-4 fill-current" aria-hidden="true">
          <path d="M8 5.14v13.72L19 12 8 5.14Z" />
        </svg>
      </span>
      <span class="min-w-0 text-left">
        <span class="block text-sm leading-tight text-ink">{{ t('audio') }}</span>
        <span class="mt-0.5 hidden max-w-[8.5rem] truncate text-[0.66rem] text-ink-faint sm:block">
          {{ title }}
        </span>
      </span>
    </button>
  </template>
</template>
