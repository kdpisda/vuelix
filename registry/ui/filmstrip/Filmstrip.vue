<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { animate, AnimatePresence, motion, useDomRef, useMotionValue, useMotionValueEvent, useReducedMotion } from 'motion-v'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'
import { cn } from '@/lib/utils'

export interface FilmstripItem {
  src: string
  alt: string
  /** Smaller image for the rail. Defaults to `src`. */
  thumb?: string
  caption?: string
}

const props = withDefaults(defineProps<{
  items: FilmstripItem[]
  /** Rail below the preview (horizontal) or beside it (vertical). */
  orientation?: 'horizontal' | 'vertical'
  /** Wrap around at either end. */
  loop?: boolean
  /** Thumbnail size in px (the long side). */
  thumbSize?: number
  /** Accessible name for the gallery. */
  label?: string
  class?: HTMLAttributes['class']
}>(), {
  orientation: 'horizontal',
  loop: true,
  thumbSize: 72,
  label: 'Gallery',
})

const index = defineModel<number>({ default: 0 })

const frameSpring = { type: 'spring', stiffness: 480, damping: 38 } as const
const slideSpring = { type: 'spring', stiffness: 300, damping: 34 } as const
const railSpring = { type: 'spring', stiffness: 260, damping: 32 } as const

const uid = useId()
const reduced = useReducedMotion()
const vertical = computed(() => props.orientation === 'vertical')
const axis = computed(() => (vertical.value ? 'y' : 'x'))
const thumbW = computed(() => (vertical.value ? props.thumbSize : Math.round(props.thumbSize * 1.3)))
const thumbH = computed(() => (vertical.value ? Math.round(props.thumbSize * 0.75) : props.thumbSize))

const direction = ref(1)
const current = computed(() => props.items[index.value])

function go(to: number) {
  const n = props.items.length
  if (!n)
    return
  let next = to
  if (props.loop)
    next = (to + n) % n
  else
    next = Math.min(n - 1, Math.max(0, to))
  if (next === index.value)
    return
  // Direction of travel: wrapping forward from the last item still moves "forward".
  direction.value = to > index.value ? 1 : -1
  index.value = next
}

watch(index, (now, before) => {
  if (before !== undefined && Math.abs(now - before) === 1)
    direction.value = now > before ? 1 : -1
})

// ── rail ────────────────────────────────────────────────────────────────────
const viewport = ref<HTMLElement>()
const track = useDomRef() // the rail is a motion component: grab its element
const railPos = useMotionValue(0)
const overflowing = ref(false)
// Fade an edge of the rail only when there are more thumbnails hidden past it.
const railMin = ref(0)
const fadeStart = ref(false)
const fadeEnd = ref(false)
function updateFades(p: number) {
  fadeStart.value = p < -2
  fadeEnd.value = p > railMin.value + 2
}
useMotionValueEvent(railPos, 'change', updateFades)
// Set while the rail is being dragged, so the release doesn't count as a thumbnail click.
const draggedRail = ref(false)
function onRailDragStart() {
  draggedRail.value = true
}

function bounds() {
  const v = viewport.value
  const t = track.value
  if (!v || !t)
    return null
  const size = vertical.value ? v.clientHeight : v.clientWidth
  const content = vertical.value ? t.scrollHeight : t.scrollWidth
  return { size, min: Math.min(0, size - content) }
}

/** Glide the rail so the active thumbnail sits near the middle. */
function centerActive(instant = false) {
  const b = bounds()
  const thumb = track.value?.children[index.value] as HTMLElement | undefined
  if (!b || !thumb)
    return
  overflowing.value = b.min < 0
  railMin.value = b.min
  updateFades(railPos.get())
  const offset = vertical.value ? thumb.offsetTop : thumb.offsetLeft
  const length = vertical.value ? thumb.offsetHeight : thumb.offsetWidth
  const target = Math.max(b.min, Math.min(0, b.size / 2 - (offset + length / 2)))
  if (instant || reduced.value)
    railPos.set(target)
  else
    animate(railPos, target, railSpring)
}

// Warm the cache for the neighbours so the next slide never fades in blank.
function preload() {
  const n = props.items.length
  for (const d of [1, -1]) {
    const item = props.items[(index.value + d + n) % n]
    if (item)
      new Image().src = item.src
  }
}

watch(index, () => {
  preload()
  nextTick(() => centerActive())
})

let observer: ResizeObserver | undefined
onMounted(() => {
  preload()
  centerActive(true)
  observer = new ResizeObserver(() => centerActive(true))
  if (viewport.value)
    observer.observe(viewport.value)
})
onBeforeUnmount(() => observer?.disconnect())

function onThumbClick(i: number) {
  if (draggedRail.value)
    return
  go(i)
}

// ── keyboard ────────────────────────────────────────────────────────────────
function onKeydown(e: KeyboardEvent, focusTab: boolean) {
  const prev = vertical.value && focusTab ? 'ArrowUp' : 'ArrowLeft'
  const next = vertical.value && focusTab ? 'ArrowDown' : 'ArrowRight'
  const map: Record<string, number> = {
    [prev]: index.value - 1,
    [next]: index.value + 1,
    Home: 0,
    End: props.items.length - 1,
  }
  const to = map[e.key]
  if (to === undefined)
    return
  e.preventDefault()
  go(to)
  if (focusTab)
    nextTick(() => (track.value?.children[index.value] as HTMLElement | undefined)?.focus())
}

// ── swipe on the main preview ───────────────────────────────────────────────
let swipe: { x: number, y: number } | null = null
function onSwipeStart(e: PointerEvent) {
  swipe = { x: e.clientX, y: e.clientY }
}
function onSwipeEnd(e: PointerEvent) {
  if (!swipe)
    return
  const dx = e.clientX - swipe.x
  const dy = e.clientY - swipe.y
  swipe = null
  if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy))
    go(index.value + (dx < 0 ? 1 : -1))
}

const variants = {
  enter: (dir: number) => ({ x: `${dir * 16}%`, opacity: 0, scale: 1.03 }),
  center: { x: '0%', opacity: 1, scale: 1 },
  exit: (dir: number) => ({ x: `${dir * -16}%`, opacity: 0, scale: 0.98 }),
}
</script>

<template>
  <div
    role="region"
    aria-roledescription="carousel"
    :aria-label="props.label"
    :class="cn('flex gap-3', vertical ? 'flex-row' : 'flex-col', props.class)"
  >
    <!-- Main preview -->
    <div
      :id="`${uid}-panel`"
      role="tabpanel"
      tabindex="0"
      :aria-label="current ? `${index + 1} of ${props.items.length}: ${current.alt}` : undefined"
      class="group relative isolate aspect-[16/10] min-w-0 flex-1 touch-pan-y select-none overflow-hidden rounded-2xl bg-muted outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      @keydown="onKeydown($event, false)"
      @pointerdown="onSwipeStart"
      @pointerup="onSwipeEnd"
      @pointercancel="swipe = null"
    >
      <AnimatePresence :initial="false" :custom="direction">
        <motion.img
          v-if="current"
          :key="index"
          :src="current.src"
          :alt="current.alt"
          draggable="false"
          class="absolute inset-0 size-full object-cover"
          :custom="direction"
          :variants="variants"
          initial="enter"
          animate="center"
          exit="exit"
          :transition="reduced ? { duration: 0.15 } : slideSpring"
        />
      </AnimatePresence>

      <div
        v-if="current?.caption"
        class="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/60 to-transparent px-4 pb-3 pt-10"
      >
        <AnimatePresence mode="wait" :initial="false">
          <motion.p
            :key="index"
            class="m-0 text-sm font-medium text-white"
            :initial="{ opacity: 0, y: 6 }"
            :animate="{ opacity: 1, y: 0 }"
            :exit="{ opacity: 0, y: -4 }"
            :transition="{ duration: 0.18 }"
          >
            {{ current.caption }}
          </motion.p>
        </AnimatePresence>
      </div>
      <span class="absolute right-3 top-3 z-10 rounded-full bg-black/45 px-2 py-0.5 text-[11px] font-medium tabular-nums text-white backdrop-blur" aria-hidden="true">
        {{ index + 1 }} / {{ props.items.length }}
      </span>

      <button
        type="button"
        aria-label="Previous image"
        :disabled="!props.loop && index === 0"
        class="absolute left-3 top-1/2 z-10 inline-flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-background/80 text-foreground opacity-0 shadow-sm outline-none backdrop-blur transition-opacity hover:bg-background focus-visible:opacity-100 focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:hidden group-hover:opacity-100"
        @pointerdown.stop
        @click="go(index - 1)"
      >
        <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
      </button>
      <button
        type="button"
        aria-label="Next image"
        :disabled="!props.loop && index === props.items.length - 1"
        class="absolute right-3 top-1/2 z-10 inline-flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-background/80 text-foreground opacity-0 shadow-sm outline-none backdrop-blur transition-opacity hover:bg-background focus-visible:opacity-100 focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:hidden group-hover:opacity-100"
        @pointerdown.stop
        @click="go(index + 1)"
      >
        <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
      </button>
    </div>

    <!-- Rail -->
    <div
      ref="viewport"
      :class="cn(
        'relative shrink-0 overflow-hidden',
        vertical ? 'self-stretch' : 'w-full',
        overflowing && fadeStart && '[--fade-a:24px]',
        overflowing && fadeEnd && '[--fade-b:24px]',
        vertical
          ? '[mask-image:linear-gradient(to_bottom,transparent,black_var(--fade-a,0px),black_calc(100%-var(--fade-b,0px)),transparent)]'
          : '[mask-image:linear-gradient(to_right,transparent,black_var(--fade-a,0px),black_calc(100%-var(--fade-b,0px)),transparent)]',
      )"
      :style="vertical ? { width: `${thumbW + 8}px` } : { height: `${thumbH + 8}px` }"
    >
      <motion.div
        ref="track"
        role="tablist"
        :aria-label="`${props.label} thumbnails`"
        :aria-orientation="props.orientation"
        :class="cn(
          'absolute flex gap-2 p-1',
          vertical ? 'inset-x-0 top-0 flex-col' : 'inset-y-0 left-0 w-max',
          overflowing && 'cursor-grab active:cursor-grabbing',
        )"
        :style="{ [axis]: railPos }"
        :drag="overflowing ? axis : false"
        :drag-constraints="viewport"
        :drag-elastic="0.12"
        @pointerdown="draggedRail = false"
        @drag-start="onRailDragStart"
      >
        <button
          v-for="(item, i) in props.items"
          :key="item.src"
          type="button"
          role="tab"
          :aria-selected="i === index"
          :aria-controls="`${uid}-panel`"
          :aria-label="item.alt"
          :tabindex="i === index ? 0 : -1"
          class="group/thumb relative shrink-0 rounded-lg outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          :style="{ width: `${thumbW}px`, height: `${thumbH}px` }"
          @click="onThumbClick(i)"
          @keydown="onKeydown($event, true)"
        >
          <img
            :src="item.thumb ?? item.src"
            alt=""
            draggable="false"
            loading="lazy"
            :class="cn(
              'pointer-events-none size-full rounded-lg object-cover transition-[opacity,filter] duration-300',
              i === index ? 'opacity-100' : 'opacity-50 saturate-50 group-hover/thumb:opacity-80',
            )"
          >
          <motion.span
            v-if="i === index"
            :layout-id="`${uid}-frame`"
            aria-hidden="true"
            class="pointer-events-none absolute -inset-[3px] rounded-[11px] border-2 border-foreground"
            :transition="reduced ? { duration: 0 } : frameSpring"
          />
        </button>
      </motion.div>
    </div>
  </div>
</template>
