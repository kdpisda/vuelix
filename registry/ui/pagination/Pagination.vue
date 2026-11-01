<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { AnimatePresence, motion, useReducedMotion } from 'motion-v'
import { computed, nextTick, ref, useId, watch } from 'vue'
import { cn } from '@/lib/utils'

const props = withDefaults(defineProps<{
  /** Total number of pages. */
  total: number
  /** Pages shown on each side of the current one. */
  siblings?: number
  /** Accessible name of the navigation landmark. */
  label?: string
  class?: HTMLAttributes['class']
}>(), {
  siblings: 1,
  label: 'Pagination',
})

const page = defineModel<number>('page', { default: 1 })

const pillId = `vx-pagination-${useId()}`
const list = ref<HTMLElement | null>(null)
const reduced = useReducedMotion()

const pill = { type: 'spring', stiffness: 480, damping: 36 } as const
const roll = { type: 'spring', stiffness: 520, damping: 38 } as const

const current = computed(() => Math.min(Math.max(page.value, 1), Math.max(props.total, 1)))

// +1 when moving forward (numbers roll up), -1 when going back (roll down).
const direction = ref(1)
watch(current, (next, prev) => {
  direction.value = next >= prev ? 1 : -1
}, { flush: 'sync' })

interface Slot { kind: 'page' | 'jump', page: number, key: string }

/**
 * A fixed number of slots (2·siblings + 5) once there are enough pages, so
 * each position keeps its button and only the number inside it rolls.
 */
const slots = computed<Slot[]>(() => {
  const total = Math.max(props.total, 1)
  const s = Math.max(0, props.siblings)
  const count = 2 * s + 5
  const pageSlot = (p: number): Slot => ({ kind: 'page', page: p, key: String(p) })
  if (total <= count)
    return Array.from({ length: total }, (_, i) => pageSlot(i + 1))

  const cur = current.value
  const left = Math.max(cur - s, 1)
  const right = Math.min(cur + s, total)
  const showLeftJump = left > 3
  const showRightJump = right < total - 2
  const edge = 3 + 2 * s
  const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => pageSlot(from + i))
  const leftJump: Slot = { kind: 'jump', page: Math.max(1, cur - (2 * s + 1)), key: '…' }
  const rightJump: Slot = { kind: 'jump', page: Math.min(total, cur + (2 * s + 1)), key: '…' }

  if (!showLeftJump)
    return [...range(1, edge), rightJump, pageSlot(total)]
  if (!showRightJump)
    return [pageSlot(1), leftJump, ...range(total - edge + 1, total)]
  return [pageSlot(1), leftJump, ...range(left, right), rightJump, pageSlot(total)]
})

const rollVariants = {
  enter: (dir: number) => ({ y: reduced.value ? 0 : `${dir * 90}%`, opacity: 0 }),
  center: { y: 0, opacity: 1 },
  exit: (dir: number) => ({ y: reduced.value ? 0 : `${dir * -90}%`, opacity: 0 }),
}

async function go(p: number, focus = false) {
  const next = Math.min(Math.max(p, 1), props.total)
  if (next !== current.value)
    page.value = next
  if (focus) {
    await nextTick()
    list.value?.querySelector<HTMLElement>('[aria-current="page"]')?.focus()
  }
}

function onKeydown(e: KeyboardEvent) {
  const map: Record<string, number> = {
    ArrowLeft: current.value - 1,
    ArrowRight: current.value + 1,
    Home: 1,
    End: props.total,
  }
  if (!(e.key in map))
    return
  e.preventDefault()
  go(map[e.key]!, true)
}

const button = 'relative inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-sm font-medium tabular-nums outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50'
</script>

<template>
  <nav :aria-label="props.label" :class="cn('flex justify-center', props.class)">
    <ul ref="list" class="m-0 flex list-none items-center gap-1 p-0" @keydown="onKeydown">
      <li>
        <button
          type="button"
          :class="cn(button, 'text-muted-foreground hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40')"
          aria-label="Previous page"
          :disabled="current <= 1"
          @click="go(current - 1)"
        >
          <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
        </button>
      </li>
      <li v-for="(slot, i) in slots" :key="i">
        <button
          type="button"
          :class="cn(
            button,
            'isolate',
            slot.kind === 'page' && slot.page === current
              ? 'text-primary-foreground'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground',
          )"
          :aria-current="slot.kind === 'page' && slot.page === current ? 'page' : undefined"
          :aria-label="slot.kind === 'jump' ? `Jump to page ${slot.page}` : `Page ${slot.page}`"
          @click="go(slot.page, $event.detail === 0)"
        >
          <motion.span
            v-if="slot.kind === 'page' && slot.page === current"
            aria-hidden="true"
            :layout-id="pillId"
            class="absolute inset-0 -z-10 rounded-lg bg-primary shadow-sm"
            :transition="reduced ? { duration: 0 } : pill"
          />
          <span class="grid overflow-hidden" aria-hidden="true">
            <AnimatePresence :initial="false" :custom="direction">
              <motion.span
                :key="slot.key"
                class="col-start-1 row-start-1 block"
                :variants="rollVariants"
                initial="enter"
                animate="center"
                exit="exit"
                :transition="roll"
              >
                {{ slot.kind === 'jump' ? '…' : slot.page }}
              </motion.span>
            </AnimatePresence>
          </span>
        </button>
      </li>
      <li>
        <button
          type="button"
          :class="cn(button, 'text-muted-foreground hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40')"
          aria-label="Next page"
          :disabled="current >= props.total"
          @click="go(current + 1)"
        >
          <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
        </button>
      </li>
    </ul>
  </nav>
</template>
