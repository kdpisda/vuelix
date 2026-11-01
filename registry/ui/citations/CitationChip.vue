<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { AnimatePresence, motion } from 'motion-v'
import { computed, inject, onBeforeUnmount, ref, watch } from 'vue'
import { cn } from '@/lib/utils'
import { CITATIONS_KEY, sourceDomain } from './context'
import SourceIcon from './SourceIcon.vue'

const props = defineProps<{
  /** 1-based number of the source in the parent `<Citations>`' `sources`. */
  n: number
  class?: HTMLAttributes['class']
}>()

// The chip and its teleported card are two roots: forward extra attributes to the chip.
defineOptions({ inheritAttrs: false })

const ctx = inject(CITATIONS_KEY, null)
const source = computed(() => ctx?.sources.value[props.n - 1])
const domain = computed(() => (source.value ? sourceDomain(source.value) : ''))
const cardId = computed(() => `${ctx?.uid ?? 'vx-cite'}-card-${props.n}`)

const el = ref<HTMLElement>()
const open = ref(false)
const pos = ref<{ left: number, top?: number, bottom?: number, above: boolean }>({ left: 0, above: true })
let timer: ReturnType<typeof setTimeout> | undefined

const CARD_WIDTH = 288

function place() {
  if (!el.value)
    return
  const r = el.value.getBoundingClientRect()
  const left = Math.min(Math.max(8, r.left + r.width / 2 - CARD_WIDTH / 2), window.innerWidth - CARD_WIDTH - 8)
  const above = r.top > 200
  pos.value = above
    ? { left, bottom: window.innerHeight - r.top + 8, above }
    : { left, top: r.bottom + 8, above }
}

function show(delay = 90) {
  clearTimeout(timer)
  if (ctx)
    ctx.active.value = props.n
  timer = setTimeout(() => {
    place()
    open.value = true
  }, delay)
}

function hide(delay = 120) {
  clearTimeout(timer)
  timer = setTimeout(() => {
    open.value = false
    if (ctx?.active.value === props.n)
      ctx.active.value = null
  }, delay)
}

const close = () => hide(0)
watch(open, (isOpen) => {
  if (typeof window === 'undefined')
    return
  if (isOpen)
    window.addEventListener('scroll', close, { passive: true, capture: true })
  else
    window.removeEventListener('scroll', close, { capture: true })
})
onBeforeUnmount(() => {
  clearTimeout(timer)
  if (typeof window !== 'undefined')
    window.removeEventListener('scroll', close, { capture: true })
})

const highlighted = computed(() => open.value || ctx?.active.value === props.n)
</script>

<template>
  <component
    :is="source?.url ? 'a' : 'button'"
    v-bind="$attrs"
    ref="el"
    :href="source?.url"
    :target="source?.url ? '_blank' : undefined"
    :rel="source?.url ? 'noopener noreferrer' : undefined"
    :type="source?.url ? undefined : 'button'"
    :aria-label="source ? `Source ${props.n}: ${source.title}` : `Source ${props.n}`"
    :aria-describedby="open ? cardId : undefined"
    :class="cn(
      'relative -top-px mx-0.5 inline-flex h-[1.4em] min-w-[1.4em] items-center justify-center rounded-md px-1 align-middle text-[0.7rem] font-semibold tabular-nums leading-none no-underline ring-1 outline-none transition-[color,background-color,box-shadow,translate] duration-200 focus-visible:ring-[3px] focus-visible:ring-ring/50',
      highlighted
        ? '-translate-y-px bg-brand/15 ring-brand/50'
        : 'bg-muted ring-border',
      props.class,
    )"
    @pointerenter="show()"
    @pointerleave="hide()"
    @focus="show(0)"
    @blur="hide(0)"
    @keydown.esc="close"
  >
    <!-- colour on an inner span so global `a:hover` styles can't override it -->
    <span :class="highlighted ? 'text-foreground' : 'text-muted-foreground'">{{ props.n }}</span>
  </component>

  <Teleport to="body">
    <AnimatePresence>
      <motion.div
        v-if="open && source"
        :id="cardId"
        key="card"
        role="tooltip"
        class="fixed z-[100] flex w-72 flex-col gap-1.5 rounded-xl border bg-popover p-3.5 text-left text-popover-foreground shadow-xl"
        :style="{ left: `${pos.left}px`, top: pos.top !== undefined ? `${pos.top}px` : undefined, bottom: pos.bottom !== undefined ? `${pos.bottom}px` : undefined }"
        :initial="{ opacity: 0, y: pos.above ? 6 : -6, scale: 0.97, filter: 'blur(4px)' }"
        :animate="{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }"
        :exit="{ opacity: 0, y: pos.above ? 4 : -4, scale: 0.98, filter: 'blur(2px)', transition: { duration: 0.12 } }"
        :transition="{ type: 'spring', stiffness: 520, damping: 32, filter: { duration: 0.2, ease: 'easeOut' } }"
        @pointerenter="show(0)"
        @pointerleave="hide()"
      >
        <span class="flex items-center gap-2 text-xs text-muted-foreground">
          <SourceIcon :source="source" :n="props.n" />
          <span class="min-w-0 flex-1 truncate">{{ domain }}</span>
          <span class="rounded bg-muted px-1.5 py-px text-[10px] font-semibold tabular-nums">{{ props.n }}</span>
        </span>
        <span class="line-clamp-2 text-sm font-medium leading-snug">{{ source.title }}</span>
        <span v-if="source.snippet" class="line-clamp-3 text-xs leading-5 text-muted-foreground">{{ source.snippet }}</span>
      </motion.div>
    </AnimatePresence>
  </Teleport>
</template>
