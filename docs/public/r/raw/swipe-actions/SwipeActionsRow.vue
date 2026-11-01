<script setup lang="ts">
import type { SwipeAction, SwipeSide } from './types'
import { animate, motion, useDomRef, useMotionValue, useReducedMotion, useTransform } from 'motion-v'
import { computed, nextTick, onBeforeUnmount, ref, useId, watch } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{
  leading: SwipeAction[]
  trailing: SwipeAction[]
  /** Accessible name of the row, used for the actions menu. */
  label: string
  fullSwipe: boolean
  /** Fraction of the row width past which a release triggers the primary action. */
  threshold: number
  /** False once another row opens, which closes this one. */
  active?: boolean
  disabled?: boolean
}>()

const emit = defineEmits<{
  action: [action: SwipeAction]
  menu: [open: boolean]
  open: [open: boolean]
}>()

const ACTION_WIDTH = 76
const SNAP = { type: 'spring', stiffness: 500, damping: 40 } as const
const FLING = { type: 'spring', stiffness: 260, damping: 32 } as const
const POP = { type: 'spring', stiffness: 600, damping: 18 } as const

const reduced = useReducedMotion()
const x = useMotionValue(0)
const clip = ref<HTMLElement>()
const armed = ref<SwipeSide | null>(null)

const leadWidth = computed(() => props.leading.length * ACTION_WIDTH)
const trailWidth = computed(() => props.trailing.length * ACTION_WIDTH)

// Tray widths and reveal progress follow the motion value — no re-render per frame.
const leadTray = useTransform(x, v => `${Math.max(0, v)}px`)
const trailTray = useTransform(x, v => `${Math.max(0, -v)}px`)
const leadProgress = useTransform(x, v => Math.min(1, Math.max(0, v / (leadWidth.value || 1))))
const trailProgress = useTransform(x, v => Math.min(1, Math.max(0, -v / (trailWidth.value || 1))))
const leadIconScale = useTransform(leadProgress, p => 0.5 + p * 0.5)
const trailIconScale = useTransform(trailProgress, p => 0.5 + p * 0.5)

// Trailing actions sit on the right; the primary (first) one is the outermost.
const trailingShown = computed(() => [...props.trailing].reverse())

let gesture: { x: number, y: number, origin: number, width: number, t: number, vx: number } | null = null
let dragging = false
let suppressClick = false
let gone = false
onBeforeUnmount(() => {
  gone = true
  closeMenu(false)
})

/** Soft limit: free travel up to `limit`, then resistance that never quite stops. */
function band(value: number, limit: number, width: number) {
  const sign = Math.sign(value)
  const abs = Math.abs(value)
  if (abs <= limit)
    return value
  const over = abs - limit
  // With full-swipe on, travel stays light so a long swipe can reach the threshold.
  const resisted = props.fullSwipe && limit > 0
    ? over * 0.85
    : (1 - 1 / ((over * 0.55) / width + 1)) * width * 0.35
  return sign * (limit + resisted)
}

function onPointerDown(e: PointerEvent) {
  if (props.disabled || e.button !== 0)
    return
  gesture = { x: e.clientX, y: e.clientY, origin: x.get(), width: clip.value?.offsetWidth ?? 320, t: e.timeStamp, vx: 0 }
  dragging = false
  emit('open', true)
}

function onPointerMove(e: PointerEvent) {
  if (!gesture)
    return
  const dx = e.clientX - gesture.x
  const dy = e.clientY - gesture.y
  if (!dragging) {
    if (Math.abs(dx) < 6 && Math.abs(dy) < 6)
      return
    // Mostly vertical: let the page scroll.
    if (Math.abs(dy) > Math.abs(dx)) {
      gesture = null
      return
    }
    dragging = true
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }
  const raw = gesture.origin + dx
  const limit = raw > 0 ? leadWidth.value : trailWidth.value
  const next = band(raw, limit, gesture.width)
  const dt = Math.max(1, e.timeStamp - gesture.t)
  gesture.vx = (next - x.get()) / dt
  gesture.t = e.timeStamp
  x.set(next)

  const reach = gesture.width * props.threshold
  const side: SwipeSide | null = !props.fullSwipe
    ? null
    : next > reach && props.leading.length
      ? 'leading'
      : next < -reach && props.trailing.length
        ? 'trailing'
        : null
  armed.value = side
}

function onPointerUp() {
  if (!gesture)
    return
  const { vx, width } = gesture
  gesture = null
  if (!dragging)
    return
  dragging = false
  suppressClick = true
  setTimeout(() => (suppressClick = false))

  if (armed.value) {
    const side = armed.value
    const action = side === 'leading' ? props.leading[0]! : props.trailing[0]!
    commit(action, side, width)
    return
  }
  const v = x.get()
  const flick = Math.abs(vx) > 0.5
  if (v < 0 && props.trailing.length && (v < -trailWidth.value / 2 || (flick && vx < 0)))
    snapTo(-trailWidth.value)
  else if (v > 0 && props.leading.length && (v > leadWidth.value / 2 || (flick && vx > 0)))
    snapTo(leadWidth.value)
  else
    snapTo(0)
}

function snapTo(target: number) {
  emit('open', target !== 0)
  animate(x, target, reduced.value ? { duration: 0 } : SNAP)
}

watch(() => props.active, (active) => {
  if (!active && x.get() !== 0 && !gesture)
    snapTo(0)
})

/** Slide the row all the way out, then report the action. */
async function commit(action: SwipeAction, side: SwipeSide, width: number) {
  const target = side === 'leading' ? width : -width
  if (!reduced.value)
    await animate(x, target, FLING)
  emit('action', action)
  await nextTick()
  // Still here? The parent kept the item (e.g. "pin"), so slide back.
  if (!gone)
    setTimeout(() => {
      armed.value = null
      if (!gone)
        snapTo(0)
    }, 120)
}

function run(action: SwipeAction) {
  emit('action', action)
  nextTick(() => {
    if (!gone)
      snapTo(0)
  })
}

function onContentClick(e: MouseEvent) {
  if (suppressClick) {
    e.stopPropagation()
    e.preventDefault()
    return
  }
  if (x.get() !== 0) {
    e.stopPropagation()
    e.preventDefault()
    snapTo(0)
  }
}

// ---------------------------------------------------------------------------
// Keyboard alternative: an actions menu
// ---------------------------------------------------------------------------
const menuId = `vx-swipe-menu-${useId()}`
const menuOpen = ref(false)
const menuUp = ref(false)
const trigger = ref<HTMLButtonElement>()
const menu = useDomRef()
const allActions = computed(() => [...props.leading, ...props.trailing])

function onDocPointer(e: PointerEvent) {
  const t = e.target as Node
  if (!(menu.value as HTMLElement | null)?.contains(t) && !trigger.value?.contains(t))
    closeMenu(false)
}

async function openMenu() {
  if (typeof window === 'undefined' || !trigger.value)
    return
  snapTo(0)
  const rect = trigger.value.getBoundingClientRect()
  menuUp.value = window.innerHeight - rect.bottom < allActions.value.length * 40 + 24
  menuOpen.value = true
  emit('menu', true)
  document.addEventListener('pointerdown', onDocPointer, true)
  await nextTick()
  focusItem(0)
}

function closeMenu(returnFocus = true) {
  if (!menuOpen.value)
    return
  menuOpen.value = false
  emit('menu', false)
  if (typeof document !== 'undefined')
    document.removeEventListener('pointerdown', onDocPointer, true)
  if (returnFocus)
    trigger.value?.focus()
}

function focusItem(i: number) {
  const items = (menu.value as HTMLElement | null)?.querySelectorAll<HTMLElement>('[role="menuitem"]')
  if (!items?.length)
    return
  items[(i + items.length) % items.length]!.focus()
}

function onMenuKeydown(e: KeyboardEvent) {
  const items = [...((menu.value as HTMLElement | null)?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])]
  const i = items.indexOf(document.activeElement as HTMLElement)
  const keys: Record<string, () => void> = {
    ArrowDown: () => focusItem(i + 1),
    ArrowUp: () => focusItem(i - 1),
    Home: () => focusItem(0),
    End: () => focusItem(items.length - 1),
    Escape: () => closeMenu(),
    Tab: () => closeMenu(false),
  }
  const fn = keys[e.key]
  if (!fn)
    return
  if (e.key !== 'Tab')
    e.preventDefault()
  fn()
}

function pick(action: SwipeAction) {
  closeMenu()
  emit('action', action)
}

function onRowKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && x.get() !== 0)
    snapTo(0)
}

const tones = {
  default: 'bg-primary text-primary-foreground',
  brand: 'bg-brand text-background',
  muted: 'bg-muted-foreground text-background',
  destructive: 'bg-destructive text-white',
}
</script>

<template>
  <div class="relative" @keydown="onRowKeydown">
    <div ref="clip" class="relative overflow-hidden">
      <!-- Leading tray (revealed by swiping right) -->
      <motion.div
        v-if="props.leading.length"
        aria-hidden="true"
        class="absolute inset-y-0 left-0 flex overflow-hidden"
        :style="{ width: leadTray }"
      >
        <motion.button
          v-for="(action, i) in props.leading"
          :key="action.id"
          type="button"
          tabindex="-1"
          :class="cn('flex min-w-0 basis-0 flex-col items-center justify-center gap-1 overflow-hidden text-xs font-medium', tones[action.tone ?? 'default'], action.class)"
          :animate="{ flexGrow: armed === 'leading' ? (i === 0 ? 1 : 0.0001) : 1 }"
          :transition="SNAP"
          @click="run(action)"
        >
          <motion.span class="flex flex-col items-center gap-1" :style="{ scale: leadIconScale, opacity: leadProgress }">
            <motion.span
              class="flex"
              :animate="{ scale: armed === 'leading' && i === 0 ? 1.2 : 1 }"
              :transition="POP"
            >
              <component :is="action.icon" v-if="action.icon" class="size-5" />
            </motion.span>
            <span class="whitespace-nowrap">{{ action.label }}</span>
          </motion.span>
        </motion.button>
      </motion.div>

      <!-- Trailing tray (revealed by swiping left) -->
      <motion.div
        v-if="props.trailing.length"
        aria-hidden="true"
        class="absolute inset-y-0 right-0 flex overflow-hidden"
        :style="{ width: trailTray }"
      >
        <motion.button
          v-for="(action, i) in trailingShown"
          :key="action.id"
          type="button"
          tabindex="-1"
          :class="cn('flex min-w-0 basis-0 flex-col items-center justify-center gap-1 overflow-hidden text-xs font-medium', tones[action.tone ?? 'default'], action.class)"
          :animate="{ flexGrow: armed === 'trailing' ? (i === trailingShown.length - 1 ? 1 : 0.0001) : 1 }"
          :transition="SNAP"
          @click="run(action)"
        >
          <motion.span class="flex flex-col items-center gap-1" :style="{ scale: trailIconScale, opacity: trailProgress }">
            <motion.span
              class="flex"
              :animate="{ scale: armed === 'trailing' && i === trailingShown.length - 1 ? 1.2 : 1 }"
              :transition="POP"
            >
              <component :is="action.icon" v-if="action.icon" class="size-5" />
            </motion.span>
            <span class="whitespace-nowrap">{{ action.label }}</span>
          </motion.span>
        </motion.button>
      </motion.div>

      <!-- Foreground content -->
      <motion.div
        :class="cn('relative flex touch-pan-y items-center bg-card', !props.disabled && 'cursor-grab active:cursor-grabbing')"
        :style="{ x }"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointercancel="onPointerUp"
        @click.capture="onContentClick"
      >
        <div class="min-w-0 flex-1 select-none">
          <slot />
        </div>
        <button
          v-if="allActions.length"
          ref="trigger"
          type="button"
          :aria-label="`Actions for ${props.label}`"
          aria-haspopup="menu"
          :aria-expanded="menuOpen"
          :aria-controls="menuOpen ? menuId : undefined"
          :disabled="props.disabled"
          class="mr-3 inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
          @pointerdown.stop
          @click="menuOpen ? closeMenu() : openMenu()"
        >
          <svg class="size-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.75" /><circle cx="12" cy="12" r="1.75" /><circle cx="19" cy="12" r="1.75" /></svg>
        </button>
      </motion.div>
    </div>

    <motion.div
      v-if="menuOpen"
      :id="menuId"
      ref="menu"
      role="menu"
      :aria-label="`Actions for ${props.label}`"
      :class="cn(
        'absolute right-12 z-20 min-w-40 rounded-xl border bg-popover p-1 text-popover-foreground shadow-lg',
        menuUp ? 'bottom-2 origin-bottom-right' : 'top-2 origin-top-right',
      )"
      :initial="{ opacity: 0, scale: 0.92, y: menuUp ? 6 : -6 }"
      :animate="{ opacity: 1, scale: 1, y: 0 }"
      :transition="{ type: 'spring', stiffness: 500, damping: 32 }"
      @keydown="onMenuKeydown"
    >
      <button
        v-for="action in allActions"
        :key="action.id"
        type="button"
        role="menuitem"
        tabindex="-1"
        :class="cn(
          'flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm outline-none transition-colors hover:bg-accent focus-visible:bg-accent',
          action.tone === 'destructive' && 'text-destructive',
        )"
        @click="pick(action)"
      >
        <component :is="action.icon" v-if="action.icon" class="size-4 opacity-80" />
        {{ action.label }}
      </button>
    </motion.div>
  </div>
</template>
