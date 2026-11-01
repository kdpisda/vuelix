<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { AnimatePresence, motion, useReducedMotion } from 'motion-v'
import { computed, onBeforeUnmount, ref, useId, useSlots } from 'vue'
import { cn } from '@/lib/utils'

const props = withDefaults(defineProps<{
  /** The source as plain text — rendered as-is, and always what gets copied. */
  code: string
  /**
   * Already-highlighted HTML (from Shiki, highlight.js, …) to display instead of the plain text.
   * Must be trusted markup. A wrapping `<pre><code>` is stripped. You can also use the default slot.
   */
  html?: string
  filename?: string
  /** Badge in the header, e.g. `ts`, `vue`, `bash`. */
  language?: string
  lineNumbers?: boolean
  /** Number of the first line. */
  startLine?: number
  /** Lines to highlight, e.g. `[2, 3]` or `"2-4, 9"` (using displayed line numbers). */
  highlight?: number[] | string
  /** Collapse long code behind a fade with a "show all" toggle. */
  collapsible?: boolean
  /** Lines visible while collapsed. */
  collapsedLines?: number
  class?: HTMLAttributes['class']
}>(), {
  lineNumbers: true,
  startLine: 1,
  collapsible: false,
  collapsedLines: 12,
})

const slots = useSlots()
const uid = useId()
const reduced = useReducedMotion()

// Pixel metrics so collapse heights and highlight bands line up exactly.
const LINE = 24
const PAD = 12
const spring = { type: 'spring', stiffness: 260, damping: 30, mass: 0.8 } as const
const iconSpring = { type: 'spring', stiffness: 600, damping: 30 } as const

const lines = computed(() => props.code.replace(/\n$/, '').split('\n'))
const numbers = computed(() => lines.value.map((_, i) => i + props.startLine))

const marked = computed(() => {
  const set = new Set<number>()
  const h = props.highlight
  if (Array.isArray(h)) {
    h.forEach(n => set.add(n))
  }
  else if (h) {
    for (const part of h.split(',')) {
      const [a, b] = part.split('-').map(s => Number.parseInt(s.trim(), 10))
      if (a == null || Number.isNaN(a))
        continue
      for (let n = a; n <= (b != null && !Number.isNaN(b) ? b : a); n++)
        set.add(n)
    }
  }
  return set
})

const markup = computed(() => {
  if (!props.html)
    return undefined
  const inner = /<code[^>]*>([\s\S]*)<\/code>/i.exec(props.html)
  return (inner ? inner[1]! : props.html).replace(/\n$/, '')
})

const canCollapse = computed(() => props.collapsible && lines.value.length > props.collapsedLines + 2)
const expanded = ref(false)
const collapsed = computed(() => canCollapse.value && !expanded.value)
const collapsedHeight = computed(() => PAD + props.collapsedLines * LINE)

const copied = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined
async function copy() {
  try {
    await navigator.clipboard?.writeText(props.code)
  }
  catch {}
  copied.value = true
  clearTimeout(timer)
  timer = setTimeout(() => (copied.value = false), 1800)
}
onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <figure :class="cn('m-0 w-full overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm', props.class)">
    <figcaption class="flex h-10 items-center gap-2 border-b bg-muted/40 pl-3.5 pr-1.5">
      <svg class="size-3.5 shrink-0 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 3v4a1 1 0 0 0 1 1h4" /><path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2Z" /><path d="m10 13-2 2 2 2" /><path d="m14 17 2-2-2-2" /></svg>
      <span class="min-w-0 flex-1 truncate font-mono text-xs text-foreground">{{ props.filename ?? 'Code' }}</span>
      <span v-if="props.language" class="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {{ props.language }}
      </span>
      <slot name="actions" />
      <button
        type="button"
        class="relative inline-flex size-7 items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
        :aria-label="copied ? 'Copied' : 'Copy code'"
        @click="copy"
      >
        <AnimatePresence mode="popLayout" :initial="false">
          <motion.svg
            v-if="copied"
            key="check"
            class="size-3.5 text-brand"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
            :initial="{ scale: 0.3, opacity: 0, rotate: -45 }"
            :animate="{ scale: 1, opacity: 1, rotate: 0 }"
            :exit="{ scale: 0.3, opacity: 0 }"
            :transition="iconSpring"
          >
            <motion.path d="M5 12.5 10 17 19 7" :initial="{ pathLength: reduced ? 1 : 0 }" :animate="{ pathLength: 1 }" :transition="{ duration: 0.25, delay: 0.05 }" />
          </motion.svg>
          <motion.svg
            v-else
            key="copy"
            class="size-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
            :initial="{ scale: 0.3, opacity: 0 }"
            :animate="{ scale: 1, opacity: 1 }"
            :exit="{ scale: 0.3, opacity: 0, rotate: 45 }"
            :transition="iconSpring"
          >
            <rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" />
          </motion.svg>
        </AnimatePresence>
      </button>
      <span class="sr-only" role="status">{{ copied ? 'Copied to clipboard' : '' }}</span>
    </figcaption>

    <motion.div
      :id="`${uid}-body`"
      class="relative overflow-hidden"
      :initial="false"
      :animate="{ height: collapsed ? collapsedHeight : 'auto' }"
      :transition="reduced ? { duration: 0 } : spring"
    >
      <div
        class="overflow-x-auto outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-inset"
        tabindex="0"
        role="region"
        :aria-label="props.filename ? `Code: ${props.filename}` : 'Code'"
      >
        <div class="relative flex w-max min-w-full font-mono text-[13px]" :style="{ lineHeight: `${LINE}px`, paddingBlock: `${PAD}px` }">
          <!-- highlighted line bands -->
          <div
            v-for="(n, i) in numbers.filter(n => marked.has(n))"
            :key="`band-${i}`"
            aria-hidden="true"
            class="pointer-events-none absolute inset-x-0 bg-brand/10"
            :style="{ top: `${PAD + (n - props.startLine) * LINE}px`, height: `${LINE}px` }"
          />
          <div
            v-if="props.lineNumbers"
            aria-hidden="true"
            class="sticky left-0 z-10 shrink-0 select-none bg-card text-right tabular-nums text-muted-foreground/60"
          >
            <div
              v-for="n in numbers"
              :key="n"
              :class="cn('relative pl-4 pr-4', marked.has(n) && 'bg-brand/10 font-medium text-brand before:absolute before:inset-y-0 before:left-0 before:w-0.5 before:bg-brand')"
            >
              {{ n }}
            </div>
          </div>
          <pre :class="cn('relative m-0 flex-1 overflow-visible bg-transparent pr-6 text-foreground', props.lineNumbers ? 'pl-1' : 'pl-4')"><code v-if="markup" class="font-[inherit]" v-html="markup" /><code v-else-if="slots.default" class="font-[inherit]"><slot /></code><code v-else class="font-[inherit]">{{ lines.join('\n') }}</code></pre>
        </div>
      </div>

      <AnimatePresence>
        <motion.div
          v-if="collapsed"
          aria-hidden="true"
          class="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-20 bg-linear-to-t from-card via-card/80 to-transparent"
          :initial="{ opacity: 0 }"
          :animate="{ opacity: 1 }"
          :exit="{ opacity: 0 }"
        />
      </AnimatePresence>
    </motion.div>

    <button
      v-if="canCollapse"
      type="button"
      class="flex w-full items-center justify-center gap-1.5 border-t bg-muted/30 py-2 text-xs font-medium text-muted-foreground outline-none transition-colors hover:bg-muted/60 hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-inset"
      :aria-expanded="expanded"
      :aria-controls="`${uid}-body`"
      @click="expanded = !expanded"
    >
      {{ expanded ? 'Show less' : `Show all ${lines.length} lines` }}
      <motion.svg
        class="size-3.5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
        :animate="{ rotate: expanded ? 180 : 0 }"
        :transition="spring"
      >
        <path d="m6 9 6 6 6-6" />
      </motion.svg>
    </button>
  </figure>
</template>
