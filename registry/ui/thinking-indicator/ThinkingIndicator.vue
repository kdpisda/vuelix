<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { AnimatePresence, motion, useReducedMotion } from 'motion-v'
import { computed, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'
import { cn } from '@/lib/utils'

const props = withDefaults(defineProps<{
  variant?: 'dots' | 'shimmer' | 'orb' | 'scan' | 'reasoning'
  /** What the model is doing. Announced to screen readers; shown by every variant except `dots`. */
  label?: string
  /** `reasoning` only: still thinking? When it turns false the header becomes "Thought for Ns". */
  thinking?: boolean
  /** `reasoning` only: seconds spent thinking. Measured automatically when omitted. */
  duration?: number
  /** `reasoning` only: the reasoning text (or use the default slot). */
  reasoning?: string
  class?: HTMLAttributes['class']
}>(), {
  variant: 'dots',
  label: 'Thinking',
  thinking: true,
})

/** `reasoning` only: whether the reasoning panel is expanded. */
const open = defineModel<boolean>('open', { default: false })

const reduced = useReducedMotion()
const uid = useId()

// --- elapsed time (reasoning) ---------------------------------------------
const elapsed = ref(0)
let startedAt = 0
let tick: ReturnType<typeof setInterval> | undefined

function startClock() {
  stopClock()
  startedAt = Date.now()
  elapsed.value = 0
  tick = setInterval(() => (elapsed.value = Math.floor((Date.now() - startedAt) / 1000)), 250)
}
function stopClock() {
  clearInterval(tick)
  tick = undefined
}
onMounted(() => props.variant === 'reasoning' && props.thinking && startClock())
watch(() => props.thinking, (now) => {
  if (props.variant !== 'reasoning')
    return
  if (now)
    startClock()
  else
    stopClock()
})
onBeforeUnmount(stopClock)

const seconds = computed(() => props.duration ?? elapsed.value)
const formatTime = (s: number) => (s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`)
const announcement = computed(() => {
  if (props.variant !== 'reasoning' || props.thinking)
    return props.label
  return `Thought for ${seconds.value} second${seconds.value === 1 ? '' : 's'}`
})

const loop = (duration: number, extra: Record<string, unknown> = {}) =>
  reduced.value ? { duration: 0 } : { duration, repeat: Infinity, ease: 'easeInOut' as const, ...extra }

const shimmerClass = 'bg-[linear-gradient(90deg,var(--color-muted-foreground)_30%,var(--color-foreground)_50%,var(--color-muted-foreground)_70%)] bg-[length:250%_100%] bg-clip-text text-transparent'
const shimmerAnimate = computed(() => (reduced.value ? {} : { backgroundPosition: ['100% 0%', '0% 0%'] }))
const shimmerTransition = { duration: 1.8, repeat: Infinity, ease: 'linear' } as const

const bounce = { type: 'spring', stiffness: 420, damping: 32 } as const
// Springs overshoot; a blur that overshoots past 0 is an invalid filter, so blur eases instead.
const swap = { ...bounce, filter: { duration: 0.2, ease: 'easeOut' } } as const
</script>

<template>
  <!-- Reasoning: collapsible "Thought for Ns" panel -->
  <div v-if="props.variant === 'reasoning'" :class="cn('w-full text-sm', props.class)">
    <span class="sr-only" role="status">{{ announcement }}</span>
    <button
      type="button"
      :aria-expanded="open"
      :aria-controls="`${uid}-panel`"
      class="group -mx-1.5 inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      @click="open = !open"
    >
      <svg
        :class="cn('size-4 shrink-0 transition-colors', props.thinking ? 'text-brand' : 'text-muted-foreground group-hover:text-foreground')"
        viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"
      >
        <path d="M12 3c.4 3.9 2.1 5.6 6 6-3.9.4-5.6 2.1-6 6-.4-3.9-2.1-5.6-6-6 3.9-.4 5.6-2.1 6-6Z" />
        <path d="M19 15c.2 1.7.9 2.4 2.5 2.5-1.6.2-2.3.9-2.5 2.5-.2-1.6-.9-2.3-2.5-2.5 1.6-.1 2.3-.8 2.5-2.5Z" />
      </svg>
      <span class="relative inline-flex" aria-hidden="true">
        <AnimatePresence mode="popLayout" :initial="false">
          <motion.span
            v-if="props.thinking"
            key="thinking"
            class="inline-flex items-baseline gap-1.5"
            :initial="{ opacity: 0, y: 6, filter: 'blur(4px)' }"
            :animate="{ opacity: 1, y: 0, filter: 'blur(0px)' }"
            :exit="{ opacity: 0, y: -6, filter: 'blur(4px)' }"
            :transition="swap"
          >
            <motion.span
              :class="cn('font-medium', reduced ? 'text-muted-foreground' : shimmerClass)"
              :animate="shimmerAnimate"
              :transition="shimmerTransition"
            >{{ props.label }}</motion.span>
            <span class="text-xs tabular-nums text-muted-foreground">{{ formatTime(seconds) }}</span>
          </motion.span>
          <motion.span
            v-else
            key="done"
            class="font-medium text-muted-foreground transition-colors group-hover:text-foreground"
            :initial="{ opacity: 0, y: 6, filter: 'blur(4px)' }"
            :animate="{ opacity: 1, y: 0, filter: 'blur(0px)' }"
            :exit="{ opacity: 0, y: -6, filter: 'blur(4px)' }"
            :transition="swap"
          >
            Thought for {{ formatTime(seconds) }}
          </motion.span>
        </AnimatePresence>
      </span>
      <motion.svg
        class="size-3.5 shrink-0 text-muted-foreground"
        viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"
        :animate="{ rotate: open ? 90 : 0 }"
        :transition="bounce"
      >
        <path d="m9 6 6 6-6 6" />
      </motion.svg>
    </button>
    <AnimatePresence :initial="false">
      <motion.div
        v-if="open"
        :id="`${uid}-panel`"
        key="panel"
        class="overflow-hidden"
        :initial="{ height: 0, opacity: 0 }"
        :animate="{ height: 'auto', opacity: 1 }"
        :exit="{ height: 0, opacity: 0 }"
        :transition="{ type: 'spring', stiffness: 300, damping: 32 }"
      >
        <div class="mt-1.5 whitespace-pre-line border-l-2 py-0.5 pl-3.5 text-[13px] leading-6 text-muted-foreground">
          <slot>{{ props.reasoning }}</slot>
        </div>
      </motion.div>
    </AnimatePresence>
  </div>

  <!-- Compact loaders -->
  <div v-else role="status" :class="cn('inline-flex items-center gap-2.5 text-sm', props.class)">
    <span v-if="props.variant === 'dots'" class="flex h-4 items-center gap-1" aria-hidden="true">
      <motion.span
        v-for="i in 3"
        :key="i"
        class="size-1.5 rounded-full bg-foreground/70"
        :animate="reduced ? { opacity: 0.7 } : { y: [0, -4, 0], opacity: [0.35, 1, 0.35] }"
        :transition="loop(0.9, { delay: (i - 1) * 0.14 })"
      />
    </span>

    <span v-else-if="props.variant === 'orb'" class="relative flex size-5 items-center justify-center" aria-hidden="true">
      <motion.span
        class="absolute -inset-1 rounded-full bg-brand/30 blur-md"
        :animate="reduced ? { opacity: 0.6 } : { opacity: [0.35, 0.9, 0.35], scale: [0.85, 1.15, 0.85] }"
        :transition="loop(2)"
      />
      <motion.span
        class="absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,var(--color-chart-1),var(--color-chart-2),var(--color-chart-3),var(--color-chart-1))]"
        :animate="reduced ? {} : { rotate: 360, scale: [1, 0.88, 1] }"
        :transition="reduced ? { duration: 0 } : { rotate: { duration: 3, repeat: Infinity, ease: 'linear' }, scale: { duration: 2, repeat: Infinity, ease: 'easeInOut' } }"
      />
      <span class="absolute left-[28%] top-[22%] size-1.5 rounded-full bg-background/70 blur-[1px]" />
    </span>

    <span v-else-if="props.variant === 'scan'" class="relative h-1.5 w-24 overflow-hidden rounded-full bg-muted" aria-hidden="true">
      <motion.span
        class="absolute inset-y-0 left-0 w-2/5 rounded-full bg-gradient-to-r from-transparent via-brand to-transparent"
        :animate="reduced ? { x: '75%' } : { x: ['-100%', '250%'] }"
        :transition="loop(1.3, { repeatType: 'reverse' })"
      />
    </span>

    <motion.span
      v-if="props.variant === 'shimmer'"
      :class="cn('font-medium', reduced ? 'text-muted-foreground' : shimmerClass)"
      :animate="shimmerAnimate"
      :transition="shimmerTransition"
    >
      {{ props.label }}
    </motion.span>
    <span v-else-if="props.variant !== 'dots'" class="text-muted-foreground">{{ props.label }}</span>
    <span v-else class="sr-only">{{ props.label }}</span>
  </div>
</template>
