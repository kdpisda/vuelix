<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { AnimatePresence, motion, useReducedMotion } from 'motion-v'
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { cn } from '@/lib/utils'

const props = withDefaults(defineProps<{
  /** Accessible name of the conversation log. */
  label?: string
  /** Distance from the bottom (px) that still counts as "at the latest message". */
  threshold?: number
  /** Distance from the top (px) that fires `reach-top`, e.g. to load older messages. */
  topThreshold?: number
  /** Text of the jump pill. */
  jumpLabel?: string
  class?: HTMLAttributes['class']
  /** Classes for the inner content column. */
  contentClass?: HTMLAttributes['class']
}>(), {
  label: 'Conversation',
  threshold: 48,
  topThreshold: 80,
  jumpLabel: 'Jump to latest',
})

const emit = defineEmits<{
  /** The user scrolled near the top — load older messages and prepend them. */
  'reach-top': []
}>()

const viewport = ref<HTMLElement>()
const content = ref<HTMLElement>()
const reduced = useReducedMotion()

/** Following the bottom: new content keeps the view pinned to the latest message. */
const stuck = ref(true)
/** Content arrived while the user was reading further up. */
const unseen = ref(false)

const pill = { type: 'spring', stiffness: 520, damping: 30, mass: 0.7 } as const

let lastTop = 0
let topArmed = true
// Manual scroll anchoring (Safari has no `overflow-anchor`): remember which element sits in
// the middle of the viewport and keep it there when content is inserted above it.
// (The middle, not the top — the top is usually the "loading older…" row, which never moves.)
let anchor: { el: Element, offset: number } | null = null

function distanceFromBottom(el: HTMLElement) {
  return el.scrollHeight - el.scrollTop - el.clientHeight
}

function saveAnchor() {
  const el = viewport.value
  const box = content.value
  if (!el || !box)
    return
  const top = el.getBoundingClientRect().top
  const middle = top + el.clientHeight / 2
  const children = Array.from(box.children)
  for (const child of children) {
    const r = child.getBoundingClientRect()
    if (r.bottom >= middle || child === children[children.length - 1]) {
      anchor = { el: child, offset: r.top - top }
      return
    }
  }
  anchor = null
}

function pin() {
  const el = viewport.value
  if (el)
    el.scrollTop = el.scrollHeight
}

function onScroll() {
  const el = viewport.value
  if (!el)
    return
  const top = el.scrollTop
  if (distanceFromBottom(el) <= props.threshold) {
    stuck.value = true
    unseen.value = false
  }
  // Only an upward scroll (wheel, touch, keys, scrollbar) releases the pin — programmatic
  // scrolls toward the bottom never do.
  else if (top < lastTop - 1) {
    stuck.value = false
  }
  lastTop = top
  saveAnchor()

  if (top <= props.topThreshold) {
    if (topArmed) {
      topArmed = false
      emit('reach-top')
    }
  }
  else {
    topArmed = true
  }
}

let observer: ResizeObserver | undefined
onMounted(() => {
  pin()
  lastTop = viewport.value?.scrollTop ?? 0
  saveAnchor()
  observer = new ResizeObserver(() => {
    const el = viewport.value
    if (!el)
      return
    if (stuck.value) {
      pin()
    }
    else {
      if (anchor?.el.isConnected) {
        const offset = anchor.el.getBoundingClientRect().top - el.getBoundingClientRect().top
        const delta = offset - anchor.offset
        if (Math.abs(delta) > 0.5)
          el.scrollTop += delta
      }
      if (distanceFromBottom(el) > props.threshold)
        unseen.value = true
    }
    lastTop = el.scrollTop
    topArmed = el.scrollTop > props.topThreshold
    saveAnchor()
  })
  if (content.value)
    observer.observe(content.value)
})
onBeforeUnmount(() => observer?.disconnect())

/** Scroll to the latest message and re-pin. */
function scrollToBottom(behavior: ScrollBehavior = 'smooth') {
  const el = viewport.value
  if (!el)
    return
  stuck.value = true
  unseen.value = false
  el.scrollTo({ top: el.scrollHeight, behavior: reduced.value ? 'auto' : behavior })
}

defineExpose({ scrollToBottom, isAtBottom: stuck })
</script>

<template>
  <div :class="cn('relative flex min-h-0 flex-col', props.class)">
    <div
      ref="viewport"
      role="log"
      :aria-label="props.label"
      aria-live="polite"
      aria-relevant="additions"
      tabindex="0"
      class="min-h-0 flex-1 overflow-y-auto overscroll-contain outline-none [overflow-anchor:none] focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-inset"
      @scroll.passive="onScroll"
    >
      <div ref="content" :class="cn('flex flex-col gap-4 p-4', props.contentClass)">
        <slot name="top" />
        <slot />
      </div>
    </div>

    <div class="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center">
      <AnimatePresence>
        <motion.button
          v-if="!stuck"
          key="jump"
          type="button"
          class="pointer-events-auto inline-flex h-8 items-center gap-1.5 rounded-full border bg-popover pl-2.5 pr-3 text-xs font-medium text-popover-foreground shadow-lg outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          :initial="{ opacity: 0, y: 16, scale: 0.8 }"
          :animate="{ opacity: 1, y: 0, scale: 1 }"
          :exit="{ opacity: 0, y: 12, scale: 0.85, transition: { duration: 0.15 } }"
          :while-hover="{ y: -2 }"
          :while-press="{ scale: 0.94 }"
          :transition="pill"
          @click="scrollToBottom()"
        >
          <span class="relative grid size-4 place-items-center">
            <svg class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5v14" /><path d="m19 12-7 7-7-7" /></svg>
          </span>
          <slot name="jump" :unseen="unseen">{{ props.jumpLabel }}</slot>
          <motion.span
            v-if="unseen"
            class="size-1.5 rounded-full bg-brand"
            :initial="{ scale: 0 }"
            :animate="{ scale: 1 }"
            :transition="pill"
          >
            <span class="sr-only">(new messages)</span>
          </motion.span>
        </motion.button>
      </AnimatePresence>
    </div>
  </div>
</template>
