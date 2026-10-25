<script setup lang="ts">
import { computed } from 'vue'
import { useSettings } from '@/composables/useSettings'
import type { AnnotationEntry, LyricLine, MatchSegment } from '@/core/types'
import WordToken from './WordToken.vue'

const props = defineProps<{
  line: LyricLine
  segments: MatchSegment[]
  annotations: Map<number, AnnotationEntry>
  anchorPrefix: string
}>()

const settings = useSettings()

const emit = defineEmits<{ select: [id: number] }>()

interface TokenSpan {
  kind: 'token'
  key: string
  text: string
  annotation: AnnotationEntry
  anchor: string
}

interface PlainSpan {
  kind: 'plain'
  key: string
  text: string
}

type RenderedSpan = TokenSpan | PlainSpan

const rendered = computed<RenderedSpan[]>(() =>
  props.segments.map((segment, index) => {
    const anchor = `${props.anchorPrefix}-${index}`
    const annotation =
      segment.annotationId === undefined ? undefined : props.annotations.get(segment.annotationId)
    if (annotation) {
      return { kind: 'token', key: anchor, text: segment.text, annotation, anchor }
    }
    return { kind: 'plain', key: anchor, text: segment.text }
  }),
)

const translation = computed(() => props.line.translations[settings.lang])
</script>

<template>
  <div class="lyric-block">
    <p
      class="lyric-ruby font-jp-serif text-[1.1rem] leading-[2.1] tracking-[0.01em] text-ink sm:text-[1.28rem]"
    >
      <template v-for="span in rendered" :key="span.key">
        <WordToken
          v-if="settings.annotations && span.kind === 'token'"
          :surface="span.text"
          :annotation="span.annotation"
          :anchor="span.anchor"
          @select="emit('select', span.annotation.id)"
        />
        <span v-else>{{ span.text }}</span>
      </template>
    </p>
    <p
      v-if="settings.translations && translation"
      class="lyric-translation mt-0.5 text-[0.78rem] leading-relaxed text-ink-faint"
    >
      {{ translation }}
    </p>
  </div>
</template>
