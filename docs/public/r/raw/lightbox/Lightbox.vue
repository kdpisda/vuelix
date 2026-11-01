<script setup lang="ts">
import type { PanInfo } from 'motion-v'
import type { HTMLAttributes } from 'vue'
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useTransform } from 'motion-v'
import { computed, nextTick, onBeforeUnmount, ref, useId, watch } from 'vue'
import { cn } from '@/lib/utils'

export interface LightboxImage {
  /** Full-size image shown in the viewer. */
  src: string
  alt: string
  /** Smaller image for the grid. Defaults to `src`. */
  thumb?: string
  caption?: string
  /** Intrinsic size — used to keep the aspect ratio stable before the image loads. */
  width?: number
  height?: number
}

const props = withDefaults(defineProps<{
  images: LightboxImage[]
  /** Wrap around from the last image to the first. */
  loop?: boolean
  /** Accessible name for the viewer dialog. */
  label?: string
  /** Classes for the grid. */
  class?: HTMLAttributes['class']
  /** Classes for each thumbnail button. */
  thumbClass?: HTMLAttributes['class']
  /** Classes for the teleported full-screen viewer. */
  viewerClass?: HTMLAttributes['class']
}>(), {
  loop: true,
  label: 'Image viewer',
})

defineOptions({ inheritAttrs: false })

/** Index of the open image, or `null` when the viewer is closed. */
const index = defineModel<number | null>('index', { default: null })

const uid = useId()
const reduced = useReducedMotion()
const dialog = ref<HTMLElement | null>(null)
const grid = ref<HTMLElement | null>(null)

const spring = { type: 'spring', stiffness: 300, damping: 32, mass: 0.9 } as const
const slideSpring = { type: 'spring', stiffness: 360, damping: 36 } as const

// The image that was clicked shares a layout id with its thumbnail, so it
// morphs open and — if the viewer is closed on it — morphs back. Images
// reached by swiping slide in instead.
const origin = ref<number | null>(null)
const navigated = ref(false)
const direction = ref(0)
const closing = ref(false)
const returning = ref<number | null>(null)

let lastIndex = 0

const isOpen = computed(() => index.value !== null && !!props.images[index.value])
const current = computed(() => (index.value === null ? undefined : props.images[index.value]))
const sharedId = (i: number) => `vx-lightbox-${uid}-${i}`
const morphs = computed(() => !reduced.value && !navigated.value && index.value === origin.value)

function ratio(image: LightboxImage) {
  return image.width && image.height ? image.width / image.height : 3 / 2
}

function viewerStyle(image: LightboxImage) {
  const r = ratio(image)
  return {
    aspectRatio: `${r}`,
    width: `min(92vw, 1100px, calc((100dvh - 168px) * ${r}))`,
    borderRadius: '14px',
    backgroundImage: image.thumb ? `url("${image.thumb}")` : undefined,
  }
}

function openAt(i: number) {
  origin.value = i
  navigated.value = false
  direction.value = 0
  closing.value = false
  index.value = i
}

function go(step: number) {
  if (index.value === null || closing.value)
    return
  let next = index.value + step
  if (props.loop)
    next = (next + props.images.length) % props.images.length
  if (next < 0 || next >= props.images.length || next === index.value)
    return
  navigated.value = true
  direction.value = step
  index.value = next
}

function close() {
  if (index.value === null || closing.value)
    return
  const at = index.value
  lastIndex = at
  if (morphs.value) {
    // Unmount now; the thumbnail takes over and morphs back from here.
    returning.value = at
    index.value = null
    setTimeout(() => {
      if (returning.value === at)
        returning.value = null
    }, 700)
    return
  }
  closing.value = true
  setTimeout(() => {
    closing.value = false
    index.value = null
  }, reduced.value ? 0 : 180)
}

// Drag: sideways to change image, down to dismiss. The backdrop fades as you pull.
const dragY = useMotionValue(0)
const backdropOpacity = useTransform(dragY, [0, 320], [1, 0.25])
const chromeOpacity = useTransform(dragY, [0, 140], [1, 0])

// A drag that ends on the backdrop area would also fire a click; ignore it.
let lastDragEnd = 0
function onBackdropClick() {
  if (performance.now() - lastDragEnd > 250)
    close()
}

function onDragEnd(_: PointerEvent, info: PanInfo) {
  lastDragEnd = performance.now()
  const { offset, velocity } = info
  if (Math.abs(offset.x) > Math.abs(offset.y)) {
    if (offset.x < -80 || velocity.x < -500)
      go(1)
    else if (offset.x > 80 || velocity.x > 500)
      go(-1)
  }
  else if (offset.y > 110 || velocity.y > 600) {
    close()
  }
}

const slideVariants = {
  enter: (dir: number) => (dir === 0 ? { x: 0, opacity: 1, scale: 1 } : { x: `${dir * 55}%`, opacity: 0, scale: 0.94 }),
  center: { x: 0, opacity: 1, scale: 1 },
  leave: { opacity: 0, scale: 0.92, transition: { duration: 0.18 } },
  exit: (dir: number) => ({ x: `${dir * -55}%`, opacity: 0, scale: 0.94 }),
}

function focusables() {
  return [...(dialog.value?.querySelectorAll<HTMLElement>('button:not([disabled])') ?? [])]
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape')
    close()
  else if (e.key === 'ArrowRight')
    go(1)
  else if (e.key === 'ArrowLeft')
    go(-1)
  else if (e.key === 'Tab') {
    // Keep focus inside the viewer.
    const items = focusables()
    if (!items.length)
      return
    const first = items[0]!
    const last = items.at(-1)!
    if (e.shiftKey && (document.activeElement === first || document.activeElement === dialog.value)) {
      last.focus()
    }
    else if (!e.shiftKey && document.activeElement === last) {
      first.focus()
    }
    else {
      return
    }
  }
  else {
    return
  }
  e.preventDefault()
}

function preload(i: number) {
  const image = props.images[(i + props.images.length) % props.images.length]
  if (image)
    new Image().src = image.src
}

watch(isOpen, async (open, wasOpen) => {
  if (typeof document === 'undefined')
    return
  if (open) {
    document.documentElement.style.overflow = 'hidden'
    dragY.jump(0)
    await nextTick()
    dialog.value?.focus({ preventScroll: true })
  }
  else if (wasOpen) {
    document.documentElement.style.overflow = ''
    await nextTick()
    const thumbs = grid.value?.querySelectorAll<HTMLElement>('[data-lightbox-thumb]')
    thumbs?.[lastIndex]?.focus({ preventScroll: true })
  }
})

watch(index, (i) => {
  if (i === null || typeof window === 'undefined')
    return
  preload(i + 1)
  preload(i - 1)
})

onBeforeUnmount(() => {
  if (typeof document !== 'undefined' && isOpen.value)
    document.documentElement.style.overflow = ''
})
</script>

<template>
  <ul
    ref="grid"
    v-bind="$attrs"
    :class="cn('m-0 grid w-full list-none grid-cols-2 gap-2 p-0 sm:grid-cols-3', props.class)"
  >
    <li v-for="(image, i) in props.images" :key="image.src" class="m-0">
      <button
        type="button"
        data-lightbox-thumb
        :aria-label="`View ${image.alt}`"
        aria-haspopup="dialog"
        :class="cn(
          'group/thumb relative block w-full cursor-zoom-in rounded-lg outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
          returning === i && 'z-[95]',
          props.thumbClass,
        )"
        @click="openAt(i)"
      >
        <motion.img
          :layout-id="sharedId(i)"
          :src="image.thumb ?? image.src"
          :alt="image.alt"
          draggable="false"
          class="block w-full bg-muted object-cover transition-[filter] duration-300 group-hover/thumb:brightness-110"
          :style="{ aspectRatio: `${ratio(image)}`, borderRadius: '8px' }"
          :transition="spring"
        />
      </button>
    </li>
  </ul>

  <Teleport to="body">
    <AnimatePresence>
      <motion.div
        v-if="isOpen"
        key="backdrop"
        aria-hidden="true"
        class="fixed inset-0 z-[90]"
        :initial="{ opacity: 0 }"
        :animate="{ opacity: closing ? 0 : 1 }"
        :exit="{ opacity: 0 }"
        :transition="{ duration: 0.25 }"
      >
        <motion.div class="absolute inset-0 bg-background/90 backdrop-blur-xl" :style="{ opacity: backdropOpacity }" />
      </motion.div>
    </AnimatePresence>

    <div
      v-if="isOpen && current && index !== null"
      ref="dialog"
      role="dialog"
      aria-modal="true"
      :aria-label="props.label"
      tabindex="-1"
      :class="cn('fixed inset-0 z-[91] flex flex-col text-foreground outline-none', props.viewerClass)"
      @keydown="onKeydown"
    >
      <!-- Top bar -->
      <motion.div
        class="h-14 shrink-0"
        :initial="{ opacity: 0, y: -8 }"
        :animate="{ opacity: closing ? 0 : 1, y: 0 }"
        :transition="{ delay: closing ? 0 : 0.1 }"
      >
        <motion.div class="flex h-full items-center justify-between px-4" :style="{ opacity: chromeOpacity }">
          <span class="text-sm tabular-nums text-muted-foreground">{{ index + 1 }} / {{ props.images.length }}</span>
          <button
            type="button"
            aria-label="Close viewer"
            class="inline-flex size-9 items-center justify-center rounded-full border bg-background/70 text-foreground outline-none backdrop-blur transition-colors hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50"
            @click="close"
          >
            <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </motion.div>
      </motion.div>

      <!-- Stage -->
      <div class="relative min-h-0 flex-1" @click.self="onBackdropClick">
        <AnimatePresence :custom="direction" :initial="false">
          <motion.div
            :key="index"
            class="absolute inset-0 flex touch-none items-center justify-center px-4"
            :custom="direction"
            :variants="slideVariants"
            initial="enter"
            :animate="closing ? 'leave' : 'center'"
            exit="exit"
            :transition="reduced ? { duration: 0 } : slideSpring"
            drag
            drag-direction-lock
            drag-snap-to-origin
            :drag-elastic="0.7"
            :style="{ y: dragY }"
            @drag-end="onDragEnd"
            @click.self="onBackdropClick"
          >
            <motion.img
              :layout-id="morphs ? sharedId(index) : undefined"
              :src="current.src"
              :alt="current.alt"
              draggable="false"
              class="block max-w-none cursor-grab select-none active:cursor-grabbing bg-cover bg-center object-cover shadow-2xl"
              :style="viewerStyle(current)"
              :transition="spring"
            />
          </motion.div>
        </AnimatePresence>

        <motion.div
          v-if="props.images.length > 1"
          class="pointer-events-none absolute inset-0 [&>button]:pointer-events-auto"
          :style="{ opacity: chromeOpacity }"
        >
          <button
            v-if="props.loop || index > 0"
            type="button"
            aria-label="Previous image"
            class="absolute left-3 top-1/2 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-full border bg-background/70 text-foreground shadow-sm outline-none backdrop-blur transition-colors hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50"
            @click="go(-1)"
          >
            <svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
          </button>
          <button
            v-if="props.loop || index < props.images.length - 1"
            type="button"
            aria-label="Next image"
            class="absolute right-3 top-1/2 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-full border bg-background/70 text-foreground shadow-sm outline-none backdrop-blur transition-colors hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50"
            @click="go(1)"
          >
            <svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
          </button>
        </motion.div>
      </div>

      <!-- Caption -->
      <motion.div class="flex h-[88px] shrink-0 items-start justify-center px-6 pt-4 text-center" :style="{ opacity: chromeOpacity }">
        <AnimatePresence mode="wait" :initial="false">
          <motion.p
            :key="index"
            aria-live="polite"
            class="m-0 max-w-xl text-sm leading-6 text-muted-foreground"
            :initial="{ opacity: 0, y: 6 }"
            :animate="{ opacity: closing ? 0 : 1, y: 0 }"
            :exit="{ opacity: 0, y: -6 }"
            :transition="{ duration: 0.2 }"
          >
            {{ current.caption ?? current.alt }}
          </motion.p>
        </AnimatePresence>
      </motion.div>
    </div>
  </Teleport>
</template>
