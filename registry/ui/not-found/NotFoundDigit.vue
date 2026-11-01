<script setup lang="ts">
import type { MotionValue } from 'motion-v'
import { motion, useDomRef, useReducedMotion, useSpring, useTransform } from 'motion-v'
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { cn } from '@/lib/utils'

// One glyph of the big code. It drifts away from the pointer on a spring,
// bobs gently while idle and can be flung around (it snaps back).
const props = defineProps<{
  char: string
  index: number
  /** Pointer position relative to the section; Infinity when outside. */
  px: MotionValue<number>
  py: MotionValue<number>
  accent?: boolean
}>()

const reduced = useReducedMotion()
const el = useDomRef()
// Resting centre, measured from layout (offsets ignore transforms, so no feedback loop).
const center = ref({ x: 0, y: 0 })
const dragging = ref(false)
let ro: ResizeObserver | undefined

// Walk the offsetParent chain up to the section ([data-vx-nf-root]).
function measure() {
  let node = el.value as HTMLElement | null
  if (!node)
    return
  let x = node.offsetWidth / 2
  let y = node.offsetHeight / 2
  while (node && !node.hasAttribute('data-vx-nf-root')) {
    x += node.offsetLeft
    y += node.offsetTop
    node = node.offsetParent as HTMLElement | null
  }
  center.value = { x, y }
}
onMounted(() => {
  measure()
  const root = (el.value as HTMLElement | null)?.closest('[data-vx-nf-root]')
  if (root) {
    ro = new ResizeObserver(measure)
    ro.observe(root)
  }
})
onBeforeUnmount(() => ro?.disconnect())

const RANGE = 280
const PUSH = 90
function push([x, y]: number[]) {
  if (reduced.value || !Number.isFinite(x!) || !Number.isFinite(y!))
    return { dx: 0, dy: 0, force: 0 }
  const dx = center.value.x - x!
  const dy = center.value.y - y!
  const dist = Math.hypot(dx, dy) || 1
  const force = Math.max(0, 1 - dist / RANGE) ** 1.6
  return { dx: (dx / dist) * force * PUSH, dy: (dy / dist) * force * PUSH, force: Math.sign(dx) * force }
}
const cfg = { stiffness: 150, damping: 14, mass: 0.8 }
const x = useSpring(useTransform([props.px, props.py], v => push(v as number[]).dx), cfg)
const y = useSpring(useTransform([props.px, props.py], v => push(v as number[]).dy), cfg)
const rotate = useSpring(useTransform([props.px, props.py], v => push(v as number[]).force * 14), cfg)
</script>

<template>
  <motion.span
    :class="cn('relative inline-block', dragging && 'z-10')"
    :animate="reduced ? { y: 0 } : { y: [0, -10, 0] }"
    :transition="reduced ? { duration: 0 } : { duration: 3.6, repeat: Infinity, ease: 'easeInOut', delay: props.index * 0.45 }"
  >
    <motion.span ref="el" class="inline-block" :style="{ x, y, rotate }">
      <motion.span
        drag
        drag-snap-to-origin
        :drag-elastic="0.6"
        :while-drag="{ scale: 1.08, cursor: 'grabbing' }"
        :drag-transition="{ bounceStiffness: 260, bounceDamping: 12 }"
        @drag-start="dragging = true"
        @drag-end="dragging = false"
        :class="cn(
          'inline-block cursor-grab touch-none bg-gradient-to-b bg-clip-text px-[0.02em] text-transparent',
          props.accent ? 'from-brand to-chart-2' : 'from-foreground to-foreground/25',
        )"
      >{{ props.char }}</motion.span>
    </motion.span>
  </motion.span>
</template>
