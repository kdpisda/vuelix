<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { AnimatePresence, motion, useReducedMotion } from 'motion-v'
import { computed, onBeforeUnmount, onMounted, ref, useId, watch, watchEffect } from 'vue'
import { cn } from '@/lib/utils'

export type AgentActivityKind = 'search' | 'read' | 'command' | 'edit' | 'think' | 'web' | 'other'
export type AgentActivityStatus = 'pending' | 'running' | 'done' | 'error'

export interface AgentActivityStep {
  id: string
  /** Picks the icon. */
  kind?: AgentActivityKind
  label: string
  /** Secondary line, rendered in mono: a path, a query, a command. */
  detail?: string
  status?: AgentActivityStatus
  /** Epoch ms when the step started; drives the live timer while running. */
  startedAt?: number
  /** Milliseconds the step took, shown once it's done. */
  duration?: number
  /** Sub-steps, shown in a collapsible list (one level deep). */
  children?: AgentActivityStep[]
}

const props = withDefaults(defineProps<{
  steps: AgentActivityStep[]
  /** What the agent is working on. */
  title?: string
  /** Epoch ms when the run started; drives the elapsed timer in the header. */
  startedAt?: number
  /** Epoch ms when the run finished. Defaults to "now" while running. */
  endedAt?: number
  /** Whether the run is still going. Defaults to "any step is pending or running". */
  running?: boolean
  class?: HTMLAttributes['class']
}>(), {
  title: 'Working',
  running: undefined,
})

const reduced = useReducedMotion()
const uid = useId()

const isRunning = computed(() =>
  props.running ?? props.steps.some(s => s.status === 'running' || s.status === 'pending'),
)

// --- clock ------------------------------------------------------------------
const now = ref(0)
let clock: ReturnType<typeof setInterval> | undefined
function syncClock() {
  clearInterval(clock)
  now.value = Date.now()
  if (isRunning.value)
    clock = setInterval(() => (now.value = Date.now()), 500)
}
onMounted(syncClock)
watch(isRunning, syncClock)
onBeforeUnmount(() => clearInterval(clock))

function formatDuration(ms: number) {
  const s = ms / 1000
  if (s < 10)
    return `${s.toFixed(1)}s`
  if (s < 60)
    return `${Math.round(s)}s`
  return `${Math.floor(s / 60)}m ${String(Math.round(s % 60)).padStart(2, '0')}s`
}
function formatClock(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

const elapsed = computed(() => {
  if (!props.startedAt || !now.value)
    return null
  return (props.endedAt ?? now.value) - props.startedAt
})

function stepTime(step: AgentActivityStep) {
  if (step.status === 'running' && step.startedAt && now.value)
    return now.value - step.startedAt >= 1000 ? formatDuration(now.value - step.startedAt) : ''
  if (step.status === 'done' && step.duration !== undefined)
    return formatDuration(step.duration)
  return ''
}

// --- sub-step disclosure ----------------------------------------------------
// Steps with children open while running and fold away when done, unless the user
// has toggled them — then their choice sticks.
const expanded = ref<Record<string, boolean>>({})
const touched = new Set<string>()
watchEffect(() => {
  for (const step of props.steps) {
    if (step.children?.length && !touched.has(step.id))
      expanded.value[step.id] = step.status === 'running' || step.status === 'error'
  }
})
function toggle(id: string) {
  touched.add(id)
  expanded.value[id] = !expanded.value[id]
}

const shimmerClass = 'bg-[linear-gradient(90deg,var(--color-foreground)_30%,var(--color-muted-foreground)_50%,var(--color-foreground)_70%)] bg-[length:250%_100%] bg-clip-text text-transparent'
const shimmer = computed(() => (reduced.value ? {} : { backgroundPosition: ['100% 0%', '0% 0%'] }))
const shimmerTransition = { duration: 1.6, repeat: Infinity, ease: 'linear' } as const
const spring = { type: 'spring', stiffness: 380, damping: 32 } as const
// Springs overshoot; a blur that overshoots past 0 is an invalid filter, so blur eases instead.
const enter = { ...spring, filter: { duration: 0.25, ease: 'easeOut' } } as const

const icons: Record<AgentActivityKind, string[]> = {
  search: ['M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14Z', 'm20 20-3.5-3.5'],
  read: ['M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z', 'M14 3v5h5', 'M9 13h6M9 17h4'],
  command: ['m5 8 4 4-4 4', 'M12 17h7', 'M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z'],
  edit: ['M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16Z', 'm13.5 6.5 4 4'],
  think: ['M12 3c.4 3.9 2.1 5.6 6 6-3.9.4-5.6 2.1-6 6-.4-3.9-2.1-5.6-6-6 3.9-.4 5.6-2.1 6-6Z', 'M18.5 15.5c.2 1.4.8 2 2.2 2.2-1.4.2-2 .8-2.2 2.2-.2-1.4-.8-2-2.2-2.2 1.4-.2 2-.8 2.2-2.2Z'],
  web: ['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z', 'M3 12h18', 'M12 3c2.5 2.6 3.7 5.6 3.7 9s-1.2 6.4-3.7 9c-2.5-2.6-3.7-5.6-3.7-9S9.5 5.6 12 3Z'],
  other: ['M12 8v8M8 12h8'],
}
</script>

<template>
  <div :class="cn('w-full rounded-2xl border bg-card text-card-foreground', props.class)">
    <!-- Header -->
    <div class="flex items-center gap-2.5 border-b px-4 py-3">
      <span class="relative flex size-4 items-center justify-center" aria-hidden="true">
        <AnimatePresence mode="popLayout" :initial="false">
          <motion.svg
            v-if="isRunning"
            key="spin"
            class="size-4 animate-spin text-brand"
            viewBox="0 0 24 24" fill="none"
            :initial="{ opacity: 0, scale: 0.5 }"
            :animate="{ opacity: 1, scale: 1 }"
            :exit="{ opacity: 0, scale: 0.5 }"
          >
            <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-opacity="0.25" stroke-width="3" />
            <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
          </motion.svg>
          <motion.span
            v-else
            key="check"
            class="flex size-4 items-center justify-center rounded-full bg-brand text-background"
            :initial="{ opacity: 0, scale: 0.5 }"
            :animate="{ opacity: 1, scale: 1 }"
            :exit="{ opacity: 0, scale: 0.5 }"
            :transition="{ type: 'spring', stiffness: 600, damping: 20 }"
          >
            <svg class="size-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5 9-10" /></svg>
          </motion.span>
        </AnimatePresence>
      </span>
      <h3 :id="`${uid}-title`" class="m-0 min-w-0 flex-1 truncate text-sm font-medium">
        {{ props.title }}
      </h3>
      <span v-if="elapsed !== null" class="text-xs tabular-nums text-muted-foreground" aria-hidden="true">
        {{ isRunning ? formatClock(elapsed) : `Worked for ${formatDuration(elapsed)}` }}
      </span>
    </div>

    <!-- Steps -->
    <ol
      role="log"
      :aria-labelledby="`${uid}-title`"
      :aria-busy="isRunning"
      class="m-0 flex list-none flex-col px-4 py-3"
    >
      <AnimatePresence :initial="false">
        <motion.li
          v-for="(step, i) in props.steps"
          :key="step.id"
          class="relative flex gap-3 pb-3 last:pb-0"
          :initial="{ opacity: 0, y: 10, filter: 'blur(4px)' }"
          :animate="{ opacity: 1, y: 0, filter: 'blur(0px)' }"
          :exit="{ opacity: 0, transition: { duration: 0.15 } }"
          :transition="enter"
        >
          <!-- timeline connector -->
          <span v-if="i < props.steps.length - 1" class="absolute bottom-0 left-3 top-7 w-px -translate-x-1/2 bg-border" aria-hidden="true" />

          <span
            :class="cn(
              'relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full border bg-card transition-colors duration-300',
              step.status === 'running' && 'border-brand/50 text-brand',
              (step.status === 'done' || !step.status) && 'text-muted-foreground',
              step.status === 'error' && 'border-destructive/40 bg-destructive/10 text-destructive',
              step.status === 'pending' && 'text-muted-foreground/50',
            )"
            aria-hidden="true"
          >
            <svg class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path v-for="(d, k) in icons[step.kind ?? 'other']" :key="k" :d="d" />
            </svg>
          </span>

          <div class="min-w-0 flex-1">
            <div class="flex min-h-6 items-center gap-2">
              <component
                :is="step.children?.length ? 'button' : 'span'"
                :type="step.children?.length ? 'button' : undefined"
                :aria-expanded="step.children?.length ? !!expanded[step.id] : undefined"
                :aria-controls="step.children?.length ? `${uid}-${step.id}-sub` : undefined"
                :class="cn(
                  'inline-flex min-w-0 items-center gap-1 rounded text-left text-sm',
                  step.children?.length && 'outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
                  step.status === 'pending' && 'text-muted-foreground',
                )"
                @click="step.children?.length && toggle(step.id)"
              >
                <motion.span
                  v-if="step.status === 'running'"
                  :class="cn('truncate', !reduced && shimmerClass)"
                  :animate="shimmer"
                  :transition="shimmerTransition"
                >{{ step.label }}</motion.span>
                <span v-else class="truncate">{{ step.label }}</span>
                <motion.svg
                  v-if="step.children?.length"
                  class="size-3.5 shrink-0 text-muted-foreground"
                  viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"
                  :animate="{ rotate: expanded[step.id] ? 90 : 0 }"
                  :transition="spring"
                >
                  <path d="m9 6 6 6-6 6" />
                </motion.svg>
              </component>
              <span class="ml-auto shrink-0 text-xs tabular-nums text-muted-foreground" aria-hidden="true">
                <span v-if="step.status === 'error'" class="font-medium text-destructive">Failed</span>
                <template v-else>{{ stepTime(step) }}</template>
              </span>
            </div>

            <p v-if="step.detail" class="m-0 truncate font-mono text-xs leading-5 text-muted-foreground">
              {{ step.detail }}
            </p>

            <AnimatePresence :initial="false">
              <motion.div
                v-if="step.children?.length && expanded[step.id]"
                :id="`${uid}-${step.id}-sub`"
                key="sub"
                class="overflow-hidden"
                :initial="{ height: 0, opacity: 0 }"
                :animate="{ height: 'auto', opacity: 1 }"
                :exit="{ height: 0, opacity: 0 }"
                :transition="spring"
              >
                <ul class="m-0 mt-1.5 flex list-none flex-col gap-1 rounded-lg bg-muted/60 p-0 px-2.5 py-2">
                  <AnimatePresence :initial="false">
                    <motion.li
                      v-for="child in step.children"
                      :key="child.id"
                      class="flex items-center gap-2 text-xs"
                      :initial="{ opacity: 0, x: -6 }"
                      :animate="{ opacity: 1, x: 0 }"
                      :transition="spring"
                    >
                      <svg v-if="child.status === 'running'" class="size-3 shrink-0 animate-spin text-brand" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-opacity="0.25" stroke-width="3.5" />
                        <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" />
                      </svg>
                      <svg v-else-if="child.status === 'error'" class="size-3 shrink-0 text-destructive" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
                      <svg v-else-if="child.status === 'done' || !child.status" class="size-3 shrink-0 text-brand" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12 5 5 9-10" /></svg>
                      <span v-else class="size-3 shrink-0 p-[3px]" aria-hidden="true"><span class="block size-full rounded-full bg-muted-foreground/40" /></span>
                      <span :class="cn('min-w-0 flex-1 truncate', child.status === 'pending' && 'text-muted-foreground')">
                        {{ child.label }}
                      </span>
                      <span v-if="child.detail" class="shrink-0 font-mono text-[11px] text-muted-foreground">{{ child.detail }}</span>
                      <span v-else class="shrink-0 tabular-nums text-muted-foreground" aria-hidden="true">{{ stepTime(child) }}</span>
                    </motion.li>
                  </AnimatePresence>
                </ul>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.li>
      </AnimatePresence>
    </ol>
  </div>
</template>
