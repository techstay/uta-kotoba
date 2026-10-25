<script setup lang="ts">
import { computed, onBeforeUnmount, ref, useId, watch } from 'vue'
import { useSettings } from '@/composables/useSettings'
import type { AnnotationEntry } from '@/core/types'
import WordTooltip from './WordTooltip.vue'

const props = defineProps<{
  surface: string
  annotation: AnnotationEntry
  anchor: string
}>()

const settings = useSettings()

const emit = defineEmits<{ select: [id: number] }>()

const host = ref<HTMLSpanElement | null>(null)
const trigger = ref<HTMLButtonElement | null>(null)
const open = ref(false)
const tooltipId = useId()

const hasKanji = computed(() => /[\u3400-\u4dbf\u4e00-\u9fff]/.test(props.surface))
const useRuby = computed(
  () => settings.furigana && hasKanji.value && Boolean(props.annotation.reading),
)

function close(): void {
  open.value = false
}

function onPointerEnter(event: PointerEvent): void {
  if (event.pointerType === 'mouse') open.value = true
}

function onPointerLeave(event: PointerEvent): void {
  if (event.pointerType === 'mouse') open.value = false
}

function onClick(event: MouseEvent): void {
  emit('select', props.annotation.id)
  const pointerType = (event as PointerEvent).pointerType
  if (pointerType === 'mouse' || !pointerType) {
    open.value = true
    return
  }
  open.value = !open.value
}

function onDocumentPointerDown(event: PointerEvent): void {
  if (host.value && !host.value.contains(event.target as Node)) close()
}

watch(open, (value) => {
  if (typeof document === 'undefined') return
  if (value) {
    document.addEventListener('pointerdown', onDocumentPointerDown, true)
  } else {
    document.removeEventListener('pointerdown', onDocumentPointerDown, true)
  }
})

onBeforeUnmount(() => {
  if (typeof document === 'undefined') return
  document.removeEventListener('pointerdown', onDocumentPointerDown, true)
})
</script>

<template>
  <span ref="host" class="inline-block whitespace-nowrap">
    <button
      :id="anchor"
      ref="trigger"
      type="button"
      class="word-token"
      :aria-expanded="open"
      :aria-describedby="open ? tooltipId : undefined"
      @pointerenter="onPointerEnter"
      @pointerleave="onPointerLeave"
      @click="onClick"
      @focus="open = true"
      @blur="close"
      @keydown.esc.stop="close"
    >
      <ruby v-if="useRuby"
        >{{ surface }}<rt>{{ annotation.reading }}</rt></ruby
      >
      <template v-else>{{ surface }}</template>
    </button>
    <WordTooltip
      v-if="open && trigger"
      :id="tooltipId"
      :reference="trigger"
      :annotation="annotation"
    />
  </span>
</template>
