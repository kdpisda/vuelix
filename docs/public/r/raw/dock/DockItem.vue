<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { AnimatePresence, motion, useDomRef, useSpring, useTransform } from 'motion-v'
import { inject, ref } from 'vue'
import { cn } from '@/lib/utils'
import { DOCK_KEY } from './context'

const props = defineProps<{
  label: string
  href?: string
  active?: boolean
  class?: HTMLAttributes['class']
}>()

const emit = defineEmits<{ click: [MouseEvent] }>()

const ctx = inject(DOCK_KEY)
if (!ctx)
  throw new Error('<DockItem> must be used inside <Dock>')

const el = useDomRef()
const hovered = ref(false)

const offset = useTransform(ctx.mouseX, (x) => {
  const rect = (el.value as HTMLElement | null)?.getBoundingClientRect()
  if (!rect || !Number.isFinite(x))
    return Number.POSITIVE_INFINITY
  return x - (rect.left + window.scrollX) - rect.width / 2
})

const target = useTransform(
  offset,
  [-ctx.distance, 0, ctx.distance],
  [ctx.baseSize, ctx.magnification, ctx.baseSize],
  { clamp: true },
)
const size = useSpring(target, { mass: 0.1, stiffness: 160, damping: 13 })
</script>

<template>
  <motion.div
    ref="el"
    :as="props.href ? 'a' : 'button'"
    :href="props.href"
    :type="props.href ? undefined : 'button'"
    :aria-label="props.label"
    :class="cn(
      'relative flex aspect-square items-center justify-center rounded-xl bg-muted text-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 [&_svg]:size-1/2',
      props.class,
    )"
    :style="{ width: size, height: size }"
    @pointerenter="hovered = true"
    @pointerleave="hovered = false"
    @focus="hovered = true"
    @blur="hovered = false"
    @click="emit('click', $event)"
  >
    <slot />
    <AnimatePresence>
      <motion.span
        v-if="hovered"
        role="presentation"
        class="pointer-events-none absolute -top-9 left-1/2 whitespace-nowrap rounded-md border bg-popover px-2 py-0.5 text-xs text-popover-foreground shadow-sm"
        :initial="{ opacity: 0, y: 6, x: '-50%' }"
        :animate="{ opacity: 1, y: 0, x: '-50%' }"
        :exit="{ opacity: 0, y: 2, x: '-50%' }"
        :transition="{ duration: 0.15 }"
      >
        {{ props.label }}
      </motion.span>
    </AnimatePresence>
    <span
      v-if="props.active"
      aria-hidden="true"
      class="absolute -bottom-2 left-1/2 size-1 -translate-x-1/2 rounded-full bg-foreground/70"
    />
  </motion.div>
</template>
