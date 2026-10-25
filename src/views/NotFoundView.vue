<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useI18n } from '@/core/i18n'

const { t } = useI18n()
</script>

<template>
  <div class="mx-auto flex max-w-6xl flex-col items-center px-5 py-24 text-center">
    <p class="font-label text-[0.62rem] tracking-[0.42em] text-ink-faint uppercase">404</p>
    <h1 class="font-display mt-4 text-3xl tracking-[0.04em]">{{ t('notFoundTitle') }}</h1>
    <p class="mt-3 max-w-sm text-sm leading-relaxed text-ink-soft">{{ t('notFoundBody') }}</p>
    <RouterLink to="/" class="ui-key mt-8 px-5 py-2 text-sm">
      {{ t('backToLibrary') }}
    </RouterLink>
  </div>
</template>
