<script setup lang="ts">
import { autoUpdate, flip, offset, shift, useFloating } from '@floating-ui/vue'
import { ref, shallowRef } from 'vue'
import type { AnnotationEntry } from '@/core/types'

const props = defineProps<{
  reference: HTMLElement | null
  annotation: AnnotationEntry
}>()

const referenceRef = shallowRef<HTMLElement | null>(props.reference)
const floatingRef = ref<HTMLElement | null>(null)

const { floatingStyles } = useFloating(referenceRef, floatingRef, {
  strategy: 'fixed',
  placement: 'top',
  transform: false,
  middleware: [offset(10), flip({ padding: 10 }), shift({ padding: 10 })],
  whileElementsMounted: autoUpdate,
})
</script>

<template>
  <div ref="floatingRef" class="tooltip-card" role="tooltip" :style="floatingStyles">
    <div class="flex flex-wrap items-baseline gap-x-2 gap-y-1">
      <span class="font-jp-serif text-lg leading-none text-ink">{{ annotation.word }}</span>
      <span
        v-if="annotation.reading && annotation.reading !== annotation.word"
        class="font-jp-serif text-xs text-ink-faint"
      >
        {{ annotation.reading }}
      </span>
      <span v-if="annotation.romaji" class="text-[0.66rem] tracking-wide text-ink-faint/90">
        {{ annotation.romaji }}
      </span>
      <span
        v-if="annotation.pos"
        class="rounded-full border border-line px-1.5 py-px text-[0.6rem] text-ink-faint"
      >
        {{ annotation.pos }}
      </span>
    </div>
    <p class="font-ui mt-2 text-sm leading-relaxed text-ink-soft">{{ annotation.meaning }}</p>
    <p
      v-if="annotation.note"
      class="font-ui mt-1.5 border-t border-line/70 pt-1.5 text-[0.72rem] leading-relaxed text-ink-faint"
    >
      {{ annotation.note }}
    </p>
  </div>
</template>
