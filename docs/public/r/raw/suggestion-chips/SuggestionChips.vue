<script setup lang="ts">
import type { Component, HTMLAttributes } from 'vue'
import { AnimatePresence, motion, useReducedMotion } from 'motion-v'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { cn } from '@/lib/utils'

export interface SuggestionChipItem {
  /** Defaults to `label`. */
  id?: string
  label: string
  /** Second line, shown in the `grid` layout. */
  description?: string
  /** Text to put in the prompt. Defaults to `label` (+ `description`). */
  prompt?: string
  icon?: Component
}

const props = withDefaults(defineProps<{
  /** The pool of suggestions; `limit` of them are shown at a time. */
  suggestions: (string | SuggestionChipItem)[]
  /** How many suggestions are visible at once. */
  limit?: number
  layout?: 'row' | 'grid'
  /** Show a button that swaps in a different set from the pool. */
  shuffle?: boolean
  /** Element (or CSS selector) the chosen chip flies into, typically your prompt input. */
  target?: string | HTMLElement | null
  /** Accessible name of the group. */
  label?: string
  class?: HTMLAttributes['class']
}>(), {
  limit: 4,
  layout: 'row',
  shuffle: false,
  target: null,
  label: 'Suggested prompts',
})

const emit = defineEmits<{
  select: [suggestion: SuggestionChipItem & { prompt: string }]
}>()

const reduced = useReducedMotion()

type Chip = SuggestionChipItem & { key: string, prompt: string }
const pool = computed<Chip[]>(() => props.suggestions.map((s) => {
  const item = typeof s === 'string' ? { label: s } : s
  const prompt = item.prompt ?? (item.description ? `${item.label} ${item.description}` : item.label)
  return { ...item, key: item.id ?? item.label, prompt }
}))

// Deterministic first set (SSR-safe); shuffling only happens on click.
const shownKeys = ref<string[]>([])
watch([pool, () => props.limit], () => {
  shownKeys.value = pool.value.slice(0, props.limit).map(c => c.key)
}, { immediate: true })
const shown = computed(() => shownKeys.value.map(k => pool.value.find(c => c.key === k)).filter((c): c is Chip => !!c))

const spins = ref(0)
function reshuffle() {
  spins.value++
  const current = new Set(shownKeys.value)
  const fresh = pool.value.filter(c => !current.has(c.key))
  const rest = pool.value.filter(c => current.has(c.key))
  const shuffle = (a: Chip[]) => a.map(c => [Math.random(), c] as const).sort((x, y) => x[0] - y[0]).map(([, c]) => c)
  shownKeys.value = [...shuffle(fresh), ...shuffle(rest)].slice(0, props.limit).map(c => c.key)
}

// --- selection flight ----------------------------------------------------------
// The picked chip flies to `target` and fades; afterwards it re-enters under a new key.
const flight = ref<{ key: string, x: number, y: number } | null>(null)
const generation = ref<Record<string, number>>({})
let landTimer: ReturnType<typeof setTimeout> | undefined

function pick(chip: Chip, e: MouseEvent) {
  const { key: _key, ...item } = chip
  emit('select', item)
  if (reduced.value)
    return
  const el = e.currentTarget as HTMLElement
  const target = typeof props.target === 'string' ? document.querySelector(props.target) : props.target
  let x = 0
  let y = -24
  if (target) {
    const a = el.getBoundingClientRect()
    const b = target.getBoundingClientRect()
    x = b.left + 16 - a.left
    y = b.top + b.height / 2 - (a.top + a.height / 2)
  }
  flight.value = { key: chip.key, x, y }
  clearTimeout(landTimer)
  landTimer = setTimeout(() => {
    generation.value[chip.key] = (generation.value[chip.key] ?? 0) + 1
    flight.value = null
  }, 520)
}
onBeforeUnmount(() => clearTimeout(landTimer))

const spring = { type: 'spring', stiffness: 380, damping: 30 } as const
function animateFor(chip: Chip, i: number) {
  if (flight.value?.key === chip.key) {
    return {
      x: flight.value.x,
      y: flight.value.y,
      scale: 0.6,
      opacity: 0,
      filter: 'blur(3px)',
      transition: { duration: 0.45, ease: [0.55, 0, 0.85, 0.4] },
    }
  }
  return { x: 0, y: 0, scale: 1, opacity: 1, filter: 'blur(0px)', transition: { ...spring, delay: i * 0.05, filter: { duration: 0.25, ease: 'easeOut', delay: i * 0.05 } } }
}
</script>

<template>
  <div role="group" :aria-label="props.label" :class="cn('flex flex-col items-center gap-3', props.class)">
    <div
      :class="props.layout === 'grid'
        ? 'grid w-full grid-cols-1 gap-2 sm:grid-cols-2'
        : 'flex flex-wrap justify-center gap-2'"
    >
      <AnimatePresence mode="popLayout">
        <motion.button
          v-for="(chip, i) in shown"
          :key="`${chip.key}:${generation[chip.key] ?? 0}`"
          type="button"
          layout="position"
          :class="cn(
            'group/chip relative flex origin-left items-center gap-2 border bg-card text-sm text-foreground shadow-xs outline-none transition-[translate,scale,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-md focus-visible:ring-[3px] focus-visible:ring-ring/50 active:scale-[0.97]',
            props.layout === 'grid' ? 'w-full items-start rounded-xl px-3.5 py-3 text-left' : 'rounded-full px-3.5 py-2',
          )"
          :initial="{ opacity: 0, y: 10, scale: 0.96, filter: 'blur(4px)' }"
          :animate="animateFor(chip, i)"
          :exit="{ opacity: 0, scale: 0.92, filter: 'blur(4px)', transition: { duration: 0.15 } }"
          @click="pick(chip, $event)"
        >
          <component
            :is="chip.icon"
            v-if="chip.icon"
            :class="cn('size-4 shrink-0 text-muted-foreground transition-colors group-hover/chip:text-foreground', props.layout === 'grid' && 'mt-0.5')"
            aria-hidden="true"
          />
          <span v-if="props.layout === 'grid'" class="flex min-w-0 flex-col">
            <span class="font-medium">{{ chip.label }}</span>
            <span v-if="chip.description" class="text-muted-foreground">{{ chip.description }}</span>
          </span>
          <span v-else class="whitespace-nowrap">{{ chip.label }}</span>
        </motion.button>
      </AnimatePresence>
    </div>

    <button
      v-if="props.shuffle && pool.length > props.limit"
      type="button"
      class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
      @click="reshuffle"
    >
      <motion.svg
        class="size-3.5"
        viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"
        :animate="{ rotate: spins * 180 }"
        :transition="spring"
      >
        <path d="M3 12a9 9 0 0 1 15.5-6.2L21 8" /><path d="M21 3v5h-5" />
        <path d="M21 12a9 9 0 0 1-15.5 6.2L3 16" /><path d="M3 21v-5h5" />
      </motion.svg>
      Other ideas
    </button>
  </div>
</template>
