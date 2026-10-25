<script setup lang="ts">
import { useSettings } from '@/composables/useSettings'
import { useI18n } from '@/core/i18n'
import { CONTENT_LANGS } from '@/core/types'

const settings = useSettings()
const { t } = useI18n()

const toggles = [
  { key: 'furigana', label: 'furigana' },
  { key: 'annotations', label: 'annotations' },
  { key: 'translations', label: 'translations' },
] as const
</script>

<template>
  <div
    class="settings-bar flex flex-wrap items-center gap-x-3 gap-y-2 border border-line bg-paper-raised/80 px-3 py-2.5 text-xs"
  >
    <div class="lang-switch">
      <button
        v-for="lang in CONTENT_LANGS"
        :key="lang"
        type="button"
        :aria-pressed="settings.lang === lang"
        @click="settings.lang = lang"
      >
        {{ lang === 'zh' ? '中文' : 'English' }}
      </button>
    </div>

    <span class="hidden h-4 w-px bg-line sm:block" aria-hidden="true" />

    <button
      v-for="toggle in toggles"
      :key="toggle.key"
      type="button"
      class="setting-key"
      :aria-pressed="settings[toggle.key]"
      @click="settings[toggle.key] = !settings[toggle.key]"
    >
      {{ t(toggle.label) }}
    </button>
  </div>
</template>
