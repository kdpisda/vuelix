<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { AnimatePresence, motion, useReducedMotion } from 'motion-v'
import { computed, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'
import { cn } from '@/lib/utils'

export type ToolCallStatus = 'pending' | 'running' | 'success' | 'error'

const props = withDefaults(defineProps<{
  /** Tool / function name, e.g. `search_docs`. */
  name: string
  /** One-line summary shown under the name. */
  description?: string
  status?: ToolCallStatus
  /** Arguments the model passed. Objects are pretty-printed as JSON. */
  args?: unknown
  /** What the tool returned. Objects are pretty-printed as JSON. */
  result?: unknown
  /** Error message for `status="error"`. */
  error?: string
  /** Duration in ms. Without it, a live timer runs while `running` and freezes when it ends. */
  duration?: number
  class?: HTMLAttributes['class']
}>(), {
  status: 'running',
})

const open = defineModel<boolean>('open', { default: false })

const uid = useId()
const reduced = useReducedMotion()
const spring = { type: 'spring', stiffness: 380, damping: 30, mass: 0.8 } as const
const pop = { type: 'spring', stiffness: 600, damping: 24 } as const

// --- live timer (client only) ------------------------------------------------
const elapsed = ref<number>()
let startedAt = 0
let interval: ReturnType<typeof setInterval> | undefined
function track(status: ToolCallStatus) {
  if (status === 'running') {
    startedAt = performance.now()
    elapsed.value = 0
    clearInterval(interval)
    interval = setInterval(() => (elapsed.value = performance.now() - startedAt), 100)
  }
  else if (interval) {
    clearInterval(interval)
    interval = undefined
    elapsed.value = performance.now() - startedAt
  }
}
onMounted(() => track(props.status))
watch(() => props.status, track)
onBeforeUnmount(() => clearInterval(interval))

const ms = computed(() => props.duration ?? elapsed.value)
const durationText = computed(() => {
  const v = ms.value
  if (v == null || props.status === 'pending')
    return ''
  return v < 1000 ? `${Math.round(v)}ms` : `${(v / 1000).toFixed(1)}s`
})

const statusLabel: Record<ToolCallStatus, string> = {
  pending: 'Queued',
  running: 'Running',
  success: 'Completed',
  error: 'Failed',
}

// --- tiny JSON highlighter ---------------------------------------------------
interface Token { text: string, cls?: string }
function pretty(value: unknown): string {
  if (typeof value === 'string') {
    try {
      return JSON.stringify(JSON.parse(value), null, 2)
    }
    catch {
      return value
    }
  }
  return JSON.stringify(value, null, 2) ?? String(value)
}
function tokenize(value: unknown): Token[] {
  const text = pretty(value)
  const re = /("(?:\\.|[^"\\])*")(\s*:)?|\b(true|false|null)\b|(-?\b\d+(?:\.\d+)?(?:e[+-]?\d+)?\b)/gi
  const out: Token[] = []
  let last = 0
  for (const m of text.matchAll(re)) {
    if (m.index > last)
      out.push({ text: text.slice(last, m.index) })
    if (m[1] && m[2])
      out.push({ text: m[1], cls: 'text-foreground' }, { text: m[2] })
    else if (m[1])
      out.push({ text: m[1], cls: 'text-chart-1' })
    else if (m[3])
      out.push({ text: m[3], cls: 'text-chart-3' })
    else
      out.push({ text: m[0], cls: 'text-chart-4' })
    last = m.index + m[0].length
  }
  if (last < text.length)
    out.push({ text: text.slice(last) })
  return out
}

const argTokens = computed(() => (props.args === undefined ? [] : tokenize(props.args)))
const resultTokens = computed(() => (props.result === undefined ? [] : tokenize(props.result)))
</script>

<template>
  <div
    :class="cn(
      'w-full overflow-hidden rounded-xl border bg-card text-card-foreground shadow-xs transition-colors duration-300',
      props.status === 'error' && 'border-destructive/40',
      props.class,
    )"
  >
    <div class="relative">
      <h3 class="m-0 text-base">
        <button
          type="button"
          class="flex w-full items-center gap-3 px-3 py-2.5 text-left outline-none transition-colors hover:bg-muted/40 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-inset"
          :aria-expanded="open"
          :aria-controls="`${uid}-panel`"
          @click="open = !open"
        >
          <span class="grid size-7 shrink-0 place-items-center rounded-md border bg-muted/60 text-muted-foreground" aria-hidden="true">
            <slot name="icon">
              <svg class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.8-3.8a6 6 0 0 1-7.9 7.9l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 7.9-7.9l-3.8 3.8Z" /></svg>
            </slot>
          </span>

          <span class="min-w-0 flex-1">
            <span class="block truncate font-mono text-[13px] font-medium leading-5">{{ props.name }}</span>
            <span v-if="props.description" class="block truncate text-xs leading-4 text-muted-foreground">{{ props.description }}</span>
          </span>

          <span v-if="durationText" class="shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground">{{ durationText }}</span>

          <span class="relative grid size-5 shrink-0 place-items-center" aria-hidden="true">
            <AnimatePresence mode="popLayout" :initial="false">
              <motion.span
                v-if="props.status === 'pending'"
                key="pending"
                class="size-2 rounded-full bg-muted-foreground/40"
                :initial="{ scale: 0 }"
                :animate="{ scale: 1 }"
                :exit="{ scale: 0 }"
                :transition="pop"
              />
              <motion.span
                v-else-if="props.status === 'running'"
                key="running"
                class="grid size-4 place-items-center"
                :initial="{ scale: 0.4, opacity: 0 }"
                :animate="{ scale: 1, opacity: 1 }"
                :exit="{ scale: 0.4, opacity: 0 }"
                :transition="pop"
              >
                <!-- CSS spin: infinite motion animations would never let the exit finish -->
                <svg class="size-4 text-chart-2 motion-safe:animate-spin" viewBox="0 0 20 20" fill="none">
                  <circle cx="10" cy="10" r="7.5" stroke="currentColor" stroke-opacity="0.2" stroke-width="2.25" />
                  <path d="M10 2.5a7.5 7.5 0 0 1 7.5 7.5" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" />
                </svg>
              </motion.span>
              <motion.span
                v-else-if="props.status === 'success'"
                key="success"
                class="grid size-4.5 place-items-center rounded-full bg-brand text-background"
                :initial="{ scale: 0.2 }"
                :animate="{ scale: 1 }"
                :exit="{ scale: 0.2, opacity: 0 }"
                :transition="pop"
              >
                <svg class="size-3" viewBox="0 0 12 12" fill="none">
                  <motion.path
                    d="M2.5 6.2 5 8.6 9.5 3.6"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    :initial="{ pathLength: reduced ? 1 : 0 }"
                    :animate="{ pathLength: 1 }"
                    :transition="{ duration: 0.3, delay: 0.1 }"
                  />
                </svg>
              </motion.span>
              <motion.span
                v-else
                key="error"
                class="grid size-4.5 place-items-center rounded-full bg-destructive text-background"
                :initial="{ scale: 0.2 }"
                :animate="reduced ? { scale: 1 } : { scale: 1, x: [0, -3, 3, -2, 0] }"
                :exit="{ scale: 0.2, opacity: 0 }"
                :transition="{ scale: pop, x: { duration: 0.4, delay: 0.1 } }"
              >
                <svg class="size-2.5" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M2.5 2.5l5 5M7.5 2.5l-5 5" /></svg>
              </motion.span>
            </AnimatePresence>
          </span>
          <span class="sr-only">{{ statusLabel[props.status] }}</span>

          <motion.svg
            class="size-4 shrink-0 text-muted-foreground"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
            :animate="{ rotate: open ? 180 : 0 }"
            :transition="spring"
          >
            <path d="m6 9 6 6 6-6" />
          </motion.svg>
        </button>
      </h3>
      <span class="sr-only" role="status">{{ props.status === 'pending' ? '' : `${props.name}: ${statusLabel[props.status]}` }}</span>

      <!-- indeterminate sweep under the header while running -->
      <div v-if="props.status === 'running' && !reduced" class="pointer-events-none absolute inset-x-0 bottom-0 h-px overflow-hidden" aria-hidden="true">
        <motion.div
          class="h-full w-1/3 bg-linear-to-r from-transparent via-chart-2 to-transparent"
          :initial="{ x: '-100%' }"
          :animate="{ x: '300%' }"
          :transition="{ duration: 1.3, repeat: Infinity, ease: 'easeInOut' }"
        />
      </div>
    </div>

    <AnimatePresence :initial="false">
      <motion.div
        v-if="open"
        :id="`${uid}-panel`"
        role="region"
        :aria-label="`${props.name} details`"
        :initial="{ height: 0, opacity: 0 }"
        :animate="{ height: 'auto', opacity: 1 }"
        :exit="{ height: 0, opacity: 0 }"
        :transition="reduced ? { duration: 0 } : spring"
      >
        <div class="flex flex-col gap-3 border-t px-3 py-3">
          <section v-if="props.args !== undefined">
            <h4 class="m-0 mb-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Arguments
            </h4>
            <pre class="m-0 max-h-52 overflow-auto rounded-lg bg-muted/50 p-3 font-mono text-xs leading-5 text-foreground/80"><code><span v-for="(t, i) in argTokens" :key="i" :class="t.cls">{{ t.text }}</span></code></pre>
          </section>

          <section>
            <h4 class="m-0 mb-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {{ props.status === 'error' ? 'Error' : 'Result' }}
            </h4>
            <p v-if="props.status === 'error'" class="m-0 whitespace-pre-wrap break-words rounded-lg bg-destructive/10 p-3 font-mono text-xs leading-5 text-destructive">
              {{ props.error ?? 'The tool call failed.' }}
            </p>
            <pre v-else-if="props.result !== undefined" class="m-0 max-h-52 overflow-auto rounded-lg bg-muted/50 p-3 font-mono text-xs leading-5 text-foreground/80"><code><span v-for="(t, i) in resultTokens" :key="i" :class="t.cls">{{ t.text }}</span></code></pre>
            <div v-else class="flex flex-col gap-2 rounded-lg bg-muted/50 p-3">
              <span class="sr-only">Waiting for result</span>
              <span class="h-2.5 w-3/4 rounded-full bg-muted-foreground/15 motion-safe:animate-pulse" />
              <span class="h-2.5 w-1/2 rounded-full bg-muted-foreground/15 motion-safe:animate-pulse" />
            </div>
          </section>
        </div>
      </motion.div>
    </AnimatePresence>
  </div>
</template>
