<script setup lang="ts">
import type { Directive, HTMLAttributes } from 'vue'
import type { StreamBlock, StreamInline } from './markdown'
import { animate, motion, useReducedMotion } from 'motion-v'
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import { cn } from '@/lib/utils'
import { parseStreamMarkdown, plainBlock } from './markdown'

const props = withDefaults(defineProps<{
  /** The text received so far. Grow it over time and only the new part animates in. */
  text?: string
  /** Alternatively, an async iterable of chunks; the component consumes and accumulates it. */
  stream?: AsyncIterable<string>
  /** Show the blinking cursor (automatically on while a `stream` is being read). */
  streaming?: boolean
  /** Render a small Markdown subset: paragraphs, `#` headings, lists, **bold** and `code`. */
  markdown?: boolean
  /** How each new chunk enters. */
  animation?: 'blur' | 'fade' | 'none'
  /** Hide the cursor even while streaming. */
  hideCursor?: boolean
  /** Root element. */
  as?: string
  class?: HTMLAttributes['class']
}>(), {
  text: '',
  streaming: false,
  markdown: false,
  animation: 'blur',
  hideCursor: false,
  as: 'div',
})

const emit = defineEmits<{
  /** Fired when a `stream` has been fully consumed, with the final text. */
  done: [text: string]
}>()

const reduced = useReducedMotion()

// --- source: the `text` prop, or the accumulated `stream` ------------------
const buffer = ref('')
const reading = ref(false)
let readToken = 0

async function consume(stream: AsyncIterable<string> | undefined) {
  const token = ++readToken
  if (!stream) {
    reading.value = false
    return
  }
  buffer.value = ''
  reading.value = true
  try {
    for await (const chunk of stream) {
      if (token !== readToken)
        return
      buffer.value += chunk
    }
  }
  finally {
    if (token === readToken) {
      reading.value = false
      emit('done', buffer.value)
    }
  }
}

onMounted(() => consume(props.stream))
watch(() => props.stream, consume)
onBeforeUnmount(() => readToken++)

const source = computed(() => (props.stream ? buffer.value : props.text))
const isStreaming = computed(() => props.streaming || reading.value)

// --- chunk bookkeeping -------------------------------------------------------
// `boundaries` holds the source offset where every chunk began, so each chunk renders as
// its own span. Anything starting at or after `newFrom` arrived in the latest update and
// fades in; older spans that re-mount (e.g. when `**` closes) appear without animation.
const boundaries = shallowRef<number[]>([])
const newFrom = ref(props.streaming || props.stream ? 0 : props.text.length)

watch(source, (next, prev) => {
  if (next.startsWith(prev)) {
    if (next.length > prev.length) {
      boundaries.value = [...boundaries.value, prev.length]
      newFrom.value = prev.length
    }
  }
  else {
    // Replaced rather than extended: a new answer.
    boundaries.value = [0]
    newFrom.value = 0
  }
})

const blocks = computed<StreamBlock[]>(() =>
  props.markdown ? parseStreamMarkdown(source.value) : plainBlock(source.value),
)

function pieces(leaf: StreamInline) {
  const end = leaf.start + leaf.text.length
  const cuts = boundaries.value.filter(b => b > leaf.start && b < end)
  const out: { start: number, text: string }[] = []
  let from = leaf.start
  for (const cut of [...cuts, end]) {
    out.push({ start: from, text: leaf.text.slice(from - leaf.start, cut - leaf.start) })
    from = cut
  }
  return out
}

const enter = computed(() => ({
  blur: { opacity: [0, 1], filter: ['blur(6px)', 'blur(0px)'] },
  fade: { opacity: [0, 1] },
  none: null,
})[props.animation])

/** Fades a freshly mounted chunk in. Plain element animation — no component per chunk. */
const vReveal: Directive<HTMLElement, boolean> = {
  beforeMount(el, { value }) {
    if (value && enter.value && !reduced.value)
      el.style.opacity = '0'
  },
  mounted(el, { value }) {
    if (value && enter.value && !reduced.value)
      animate(el, enter.value, { duration: 0.45, ease: 'easeOut' })
  },
}

const blockTag = (b: StreamBlock) => (b.type === 'h' ? `h${Math.min((b.level ?? 1) + 2, 6)}` : b.type === 'plain' ? 'p' : b.type)
const rowTag = (b: StreamBlock) => (b.type === 'ul' || b.type === 'ol' ? 'li' : 'span')
const blockClass = (b: StreamBlock) => ({
  p: 'm-0',
  plain: 'm-0 whitespace-pre-wrap',
  h: cn('m-0 font-semibold tracking-tight text-foreground', b.level === 1 ? 'text-lg' : 'text-base'),
  ul: 'm-0 list-disc space-y-1 pl-5 marker:text-muted-foreground',
  ol: 'm-0 list-decimal space-y-1 pl-5 marker:text-muted-foreground',
})[b.type]
const leafTag = (l: StreamInline) => (l.kind === 'strong' ? 'strong' : l.kind === 'code' ? 'code' : 'span')
const leafClass = (l: StreamInline) =>
  l.kind === 'strong'
    ? 'font-semibold text-foreground'
    : l.kind === 'code'
      ? 'rounded-md border bg-muted box-decoration-clone px-1.5 py-px font-mono text-[0.85em] text-foreground'
      : undefined

const showCursor = computed(() => isStreaming.value && !props.hideCursor)
const isLast = (bi: number, ri: number) => bi === blocks.value.length - 1 && ri === blocks.value[bi]!.rows.length - 1

const blink = { duration: 1.05, repeat: Infinity, times: [0, 0.5, 0.5, 1], ease: 'linear' } as const
</script>

<template>
  <component
    :is="props.as"
    :class="cn('flex flex-col gap-3 text-sm leading-7 text-foreground/90', props.class)"
    aria-live="polite"
    :aria-busy="isStreaming"
  >
    <component
      :is="blockTag(block)"
      v-for="(block, bi) in blocks"
      :key="block.key"
      :class="blockClass(block)"
      :start="block.type === 'ol' && block.startNumber !== 1 ? block.startNumber : undefined"
    >
      <component :is="rowTag(block)" v-for="(row, ri) in block.rows" :key="row.key">
        <component :is="leafTag(leaf)" v-for="leaf in row.inlines" :key="`${leaf.kind}${leaf.start}`" :class="leafClass(leaf)">
          <span v-for="piece in pieces(leaf)" :key="piece.start" v-reveal="piece.start >= newFrom">{{ piece.text }}</span>
        </component>
        <motion.span
          v-if="showCursor && isLast(bi, ri)"
          aria-hidden="true"
          class="ml-0.5 inline-block h-[1.05em] w-[0.5em] translate-y-[0.18em] rounded-[3px] bg-foreground/80"
          :animate="reduced ? { opacity: 1 } : { opacity: [1, 1, 0, 0] }"
          :transition="reduced ? { duration: 0 } : blink"
        />
      </component>
    </component>
    <p v-if="showCursor && !blocks.length" class="m-0">
      <motion.span
        aria-hidden="true"
        class="inline-block h-[1.05em] w-[0.5em] translate-y-[0.18em] rounded-[3px] bg-foreground/80"
        :animate="reduced ? { opacity: 1 } : { opacity: [1, 1, 0, 0] }"
        :transition="reduced ? { duration: 0 } : blink"
      />
    </p>
  </component>
</template>
