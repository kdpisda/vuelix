<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { AnimatePresence, motion } from 'motion-v'
import { computed, ref } from 'vue'
import { cn } from '@/lib/utils'
import { dismissToast, pauseToasts, resumeToasts, useToast } from './use-toast'

const props = withDefaults(defineProps<{
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center' | 'top-right' | 'top-left' | 'top-center'
  /** How many toasts stay visible in the collapsed stack. */
  visible?: number
  /** Gap between toasts when the stack is expanded. */
  gap?: number
  class?: HTMLAttributes['class']
}>(), {
  position: 'bottom-right',
  visible: 3,
  gap: 12,
})

const { toasts } = useToast()
const expanded = ref(false)
const heights = ref<Record<number, number>>({})

const isTop = computed(() => props.position.startsWith('top'))
const ordered = computed(() => [...toasts].reverse()) // newest first

function measure(id: number, el: unknown) {
  if (el instanceof HTMLElement)
    heights.value[id] = el.offsetHeight
}

function layoutFor(index: number) {
  const dir = isTop.value ? 1 : -1
  if (expanded.value) {
    let offset = 0
    for (let i = 0; i < index; i++)
      offset += (heights.value[ordered.value[i]!.id] ?? 64) + props.gap
    return { y: offset * dir, scale: 1, opacity: 1 }
  }
  const hidden = index >= props.visible
  return {
    y: index * 14 * dir,
    scale: 1 - index * 0.05,
    opacity: hidden ? 0 : 1 - index * 0.12,
  }
}

function onEnter() {
  expanded.value = true
  pauseToasts()
}
function onLeave() {
  expanded.value = false
  resumeToasts()
}

const positions = {
  'bottom-right': 'bottom-4 right-4 items-end',
  'bottom-left': 'bottom-4 left-4 items-start',
  'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2 items-center',
  'top-right': 'top-4 right-4 items-end',
  'top-left': 'top-4 left-4 items-start',
  'top-center': 'top-4 left-1/2 -translate-x-1/2 items-center',
}

const dots = {
  default: 'bg-foreground/40',
  success: 'bg-emerald-500',
  error: 'bg-red-500',
  info: 'bg-sky-500',
}
</script>

<template>
  <section
    aria-label="Notifications"
    aria-live="polite"
    :class="cn('fixed z-[100] flex w-[min(360px,calc(100vw-2rem))] flex-col', positions[props.position], props.class)"
    @pointerenter="onEnter"
    @pointerleave="onLeave"
    @focusin="onEnter"
    @focusout="onLeave"
  >
    <ol class="relative m-0 w-full list-none p-0">
      <AnimatePresence>
        <motion.li
          v-for="(t, i) in ordered"
          :key="t.id"
          :ref="(el: any) => measure(t.id, el?.$el ?? el)"
          role="status"
          :class="cn(
            'absolute inset-x-0 flex items-start gap-3 rounded-xl border bg-popover p-4 text-popover-foreground shadow-lg',
            isTop ? 'top-0 origin-bottom after:-bottom-3' : 'bottom-0 origin-top after:-top-3',
            // invisible bridge across the gap so hover doesn't flicker while expanded
            'after:absolute after:inset-x-0 after:h-3 after:content-[\'\']',
          )"
          :style="{ zIndex: ordered.length - i, pointerEvents: !expanded && i >= props.visible ? 'none' : 'auto' }"
          :initial="{ opacity: 0, y: isTop ? -40 : 40, scale: 0.95 }"
          :animate="layoutFor(i)"
          :exit="{ opacity: 0, scale: 0.9, transition: { duration: 0.18 } }"
          :transition="{ type: 'spring', stiffness: 400, damping: 32 }"
        >
          <span :class="cn('mt-1.5 size-2 shrink-0 rounded-full', dots[t.variant])" aria-hidden="true" />
          <div class="min-w-0 flex-1">
            <p class="m-0 text-sm font-medium leading-5">
              {{ t.title }}
            </p>
            <p v-if="t.description" class="m-0 mt-0.5 text-sm leading-5 text-muted-foreground">
              {{ t.description }}
            </p>
          </div>
          <button
            type="button"
            class="-m-1 rounded-md p-1 text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
            aria-label="Dismiss notification"
            @click="dismissToast(t.id)"
          >
            <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </motion.li>
      </AnimatePresence>
    </ol>
  </section>
</template>
