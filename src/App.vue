<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import { useSettings } from '@/composables/useSettings'
import { useI18n } from '@/core/i18n'
import { CONTENT_LANGS } from '@/core/types'

const settings = useSettings()
const { t } = useI18n()
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <div class="screen-frame" aria-hidden="true">
      <span class="tape tape-a" />
      <span class="tape tape-b tape-teal" />
    </div>

    <header
      class="app-header sticky top-0 z-40 border-b border-line/70 bg-paper/85 backdrop-blur supports-[backdrop-filter]:bg-paper/70"
    >
      <div
        class="app-header-inner mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 pt-5 pb-3"
      >
        <RouterLink to="/" class="brand group" :aria-label="t('appName')">
          <span class="brand-mark" aria-hidden="true">歌</span>
          <span class="flex flex-col">
            <span class="app-logo font-jp-serif text-lg leading-none tracking-[0.08em] text-ink">
              {{ t('appName') }}
            </span>
            <span class="brand-latin mt-1">{{ t('appNameLatin') }}</span>
          </span>
        </RouterLink>

        <div class="flex items-center gap-2">
          <div class="lang-switch" role="group" aria-label="Gloss language">
            <button
              v-for="lang in CONTENT_LANGS"
              :key="lang"
              type="button"
              :aria-pressed="settings.lang === lang"
              :title="lang === 'zh' ? '中文释义' : 'English glosses'"
              @click="settings.lang = lang"
            >
              {{ lang === 'zh' ? '中' : 'EN' }}
            </button>
          </div>
        </div>
      </div>
    </header>

    <main class="flex-1">
      <RouterView />
    </main>

    <footer class="app-footer mt-16 border-t border-line/80">
      <div
        class="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-5 pt-6 pb-24 text-[0.7rem] text-ink-faint"
      >
        <span>{{ t('footerNote') }}</span>
        <span class="font-label text-[0.6rem] tracking-[0.16em] uppercase">
          {{ t('appNameLatin') }} · Vue 3 + Vite
        </span>
      </div>
    </footer>
  </div>
</template>
