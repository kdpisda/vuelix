<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { ContextMenuAction, ContextMenuEntry } from './types'
import { AnimatePresence, motion, useDomRef, useReducedMotion } from 'motion-v'
import { computed, nextTick, onBeforeUnmount, ref, useId, watch } from 'vue'
import { cn } from '@/lib/utils'
import ContextMenuList from './ContextMenuList.vue'
import { isAction } from './types'

const props = withDefaults(defineProps<{
  /** Menu entries: actions, separators, labels; actions may have `children`. */
  items: ContextMenuEntry[]
  /** Hold time (ms) that opens the menu on touch / pen. */
  longPress?: number
  /** Disable the menu (the native one shows instead). */
  disabled?: boolean
  /** Accessible name for the menu. */
  label?: string
  /** Classes for the right-clickable area. */
  class?: HTMLAttributes['class']
  /** Classes for the floating menu surfaces. */
  contentClass?: HTMLAttributes['class']
}>(), {
  longPress: 500,
  label: 'Actions',
})

const emit = defineEmits<{
  select: [item: ContextMenuAction]
  'update:open': [open: boolean]
}>()

const uid = useId()
const reduced = useReducedMotion()
const area = ref<HTMLElement | null>(null)
const rootEl = useDomRef()
const subEl = useDomRef()

const pop = { type: 'spring', stiffness: 600, damping: 34, mass: 0.7 } as const
const slide = { type: 'spring', stiffness: 520, damping: 36 } as const
const PAD = 8

const open = ref(false)
const root = ref({ x: 0, y: 0, origin: 'top left', active: -1 })
const sub = ref({ index: -1, active: -1, x: 0, y: 0, flipped: false })

const subEntries = computed(() => {
  const parent = props.items[sub.value.index]
  return isAction(parent) ? parent.children ?? [] : []
})

let restoreFocus: HTMLElement | null = null
let suppressNativeUntil = 0
let openedAt = 0
let subTimer: ReturnType<typeof setTimeout> | undefined
let pressTimer: ReturnType<typeof setTimeout> | undefined
let pressStart = { x: 0, y: 0 }
let focusSubOnMount = false

// --- opening / closing ----------------------------------------------------

async function openAt(x: number, y: number, viaKeyboard = false) {
  if (props.disabled)
    return
  openedAt = Date.now()
  restoreFocus = (document.activeElement as HTMLElement | null) ?? area.value
  if (restoreFocus === document.body)
    restoreFocus = area.value
  sub.value = { index: -1, active: -1, x: 0, y: 0, flipped: false }
  root.value = { x, y, origin: 'top left', active: -1 }
  if (!open.value) {
    open.value = true
    emit('update:open', true)
    bind(true)
  }
  await nextTick()
  placeRoot(x, y)
  if (viaKeyboard)
    moveRoot(0, 1)
  else
    (rootEl.value as HTMLElement | null)?.focus({ preventScroll: true })
}

function close(returnFocus = true) {
  if (!open.value)
    return
  clearTimeout(subTimer)
  open.value = false
  emit('update:open', false)
  bind(false)
  if (returnFocus)
    restoreFocus?.focus({ preventScroll: true })
  restoreFocus = null
}

function placeRoot(x: number, y: number) {
  const el = rootEl.value as HTMLElement | null
  if (!el)
    return
  const w = el.offsetWidth
  const h = el.offsetHeight
  const vw = document.documentElement.clientWidth
  const vh = window.innerHeight
  // Open towards the side with room, like native menus: flip at the edges, then clamp.
  const flipX = x + w > vw - PAD
  const flipY = y + h > vh - PAD
  const left = Math.min(Math.max(flipX ? x - w : x, PAD), vw - w - PAD)
  const top = Math.min(Math.max(flipY ? y - h : y, PAD), vh - h - PAD)
  root.value = { ...root.value, x: left, y: top, origin: `${flipY ? 'bottom' : 'top'} ${flipX ? 'right' : 'left'}` }
}

// --- submenu ---------------------------------------------------------------

function openSub(index: number, focusFirst = false) {
  clearTimeout(subTimer)
  if (sub.value.index === index) {
    if (focusFirst)
      moveSub(0, 1)
    return
  }
  const rootRect = (rootEl.value as HTMLElement | null)?.getBoundingClientRect()
  // Guess the side before mount so the slide starts in the right direction.
  const flipped = !!rootRect && rootRect.right + 200 > document.documentElement.clientWidth - PAD
  sub.value = { index, active: -1, x: rootRect?.right ?? 0, y: rootRect?.top ?? 0, flipped }
  focusSubOnMount = focusFirst
}

function keepSub() {
  clearTimeout(subTimer)
}

// The submenu mounts after the previous one has exited (mode="wait"),
// so measure and focus it once its element exists.
watch(() => subEl.value as HTMLElement | null, (el) => {
  if (!el)
    return
  placeSub()
  if (focusSubOnMount)
    moveSub(0, 1)
  focusSubOnMount = false
}, { flush: 'post' })

function onRootPointerleave() {
  if (sub.value.index === -1)
    root.value.active = -1
}

function closeSub() {
  clearTimeout(subTimer)
  sub.value = { ...sub.value, index: -1, active: -1 }
}

function placeSub() {
  const menu = rootEl.value as HTMLElement | null
  const el = subEl.value as HTMLElement | null
  const row = menu?.querySelector<HTMLElement>(`[data-index="${sub.value.index}"]`)
  if (!menu || !el || !row)
    return
  const m = menu.getBoundingClientRect()
  const r = row.getBoundingClientRect()
  const w = el.offsetWidth
  const h = el.offsetHeight
  const vw = document.documentElement.clientWidth
  const vh = window.innerHeight
  const flipped = m.right - 4 + w > vw - PAD
  const x = flipped ? Math.max(m.left - w + 4, PAD) : m.right - 4
  // Line the first row of the submenu up with its parent row (p-1 + border = 5px).
  const y = Math.min(Math.max(r.top - 5, PAD), vh - h - PAD)
  sub.value = { ...sub.value, x, y, flipped }
}

// --- focus + highlight -----------------------------------------------------

function focusRow(menu: HTMLElement | null, index: number) {
  menu?.querySelector<HTMLElement>(`[data-index="${index}"]`)?.focus({ preventScroll: true })
}

function step(entries: ContextMenuEntry[], from: number, dir: 1 | -1) {
  const n = entries.length
  for (let k = 1; k <= n; k++) {
    const i = (((from + dir * k) % n) + n) % n
    const e = entries[i]
    if (isAction(e) && !e.disabled)
      return i
  }
  return -1
}

function moveRoot(from: number, dir: 1 | -1) {
  const i = step(props.items, from - dir, dir)
  root.value.active = i
  focusRow(rootEl.value as HTMLElement | null, i)
}

function moveSub(from: number, dir: 1 | -1) {
  const i = step(subEntries.value, from - dir, dir)
  sub.value.active = i
  focusRow(subEl.value as HTMLElement | null, i)
}

function hoverRoot(index: number) {
  if (root.value.active === index)
    return
  const entry = props.items[index]
  const usable = isAction(entry) && !entry.disabled
  root.value.active = usable ? index : -1
  if (usable)
    focusRow(rootEl.value as HTMLElement | null, index)
  clearTimeout(subTimer)
  if (usable && entry.children?.length)
    subTimer = setTimeout(() => openSub(index), 90)
  else if (sub.value.index !== -1)
    subTimer = setTimeout(closeSub, 260) // grace period to travel into the submenu
}

function hoverSub(index: number) {
  clearTimeout(subTimer)
  if (sub.value.active === index)
    return
  const entry = subEntries.value[index]
  const usable = isAction(entry) && !entry.disabled
  sub.value.active = usable ? index : -1
  root.value.active = -1
  if (usable)
    focusRow(subEl.value as HTMLElement | null, index)
}

function activate(entries: ContextMenuEntry[], index: number, level: 0 | 1) {
  const entry = entries[index]
  if (!isAction(entry) || entry.disabled)
    return
  if (entry.children?.length) {
    if (level === 0)
      openSub(index, true)
    return
  }
  close()
  entry.onSelect?.()
  emit('select', entry)
}

// --- typeahead -------------------------------------------------------------

let typed = ''
let typedTimer: ReturnType<typeof setTimeout> | undefined
function typeahead(key: string, entries: ContextMenuEntry[], current: number) {
  clearTimeout(typedTimer)
  typed += key.toLowerCase()
  typedTimer = setTimeout(() => (typed = ''), 600)
  const n = entries.length
  for (let k = 1; k <= n; k++) {
    const i = (current + k) % n
    const e = entries[i]
    if (isAction(e) && !e.disabled && e.label.toLowerCase().startsWith(typed))
      return i
  }
  return -1
}

// --- keyboard --------------------------------------------------------------

function onRootKeydown(e: KeyboardEvent) {
  const { active } = root.value
  switch (e.key) {
    case 'ArrowDown': moveRoot(active + 1, 1); break
    case 'ArrowUp': moveRoot(active === -1 ? props.items.length - 1 : active - 1, -1); break
    case 'Home': moveRoot(0, 1); break
    case 'End': moveRoot(props.items.length - 1, -1); break
    case 'ArrowRight': {
      const entry = props.items[active]
      if (isAction(entry) && entry.children?.length && !entry.disabled)
        openSub(active, true)
      break
    }
    case 'Enter':
    case ' ':
      if (active !== -1)
        activate(props.items, active, 0)
      break
    case 'Escape': close(); break
    case 'Tab': close(); break
    default:
      if (e.key.length === 1 && !e.metaKey && !e.ctrlKey) {
        const i = typeahead(e.key, props.items, active)
        if (i !== -1) {
          root.value.active = i
          focusRow(rootEl.value as HTMLElement | null, i)
        }
      }
      return
  }
  e.preventDefault()
  e.stopPropagation()
}

function onSubKeydown(e: KeyboardEvent) {
  const { active } = sub.value
  const n = subEntries.value.length
  switch (e.key) {
    case 'ArrowDown': moveSub(active + 1, 1); break
    case 'ArrowUp': moveSub(active === -1 ? n - 1 : active - 1, -1); break
    case 'Home': moveSub(0, 1); break
    case 'End': moveSub(n - 1, -1); break
    case 'ArrowLeft':
    case 'Escape': {
      const parent = sub.value.index
      closeSub()
      root.value.active = parent
      focusRow(rootEl.value as HTMLElement | null, parent)
      break
    }
    case 'Enter':
    case ' ':
      if (active !== -1)
        activate(subEntries.value, active, 1)
      break
    case 'Tab': close(); break
    default:
      if (e.key.length === 1 && !e.metaKey && !e.ctrlKey) {
        const i = typeahead(e.key, subEntries.value, active)
        if (i !== -1) {
          sub.value.active = i
          focusRow(subEl.value as HTMLElement | null, i)
        }
      }
      return
  }
  e.preventDefault()
  e.stopPropagation()
}

// --- triggers --------------------------------------------------------------

function onContextmenu(e: MouseEvent) {
  if (props.disabled)
    return
  e.preventDefault()
  if (Date.now() < suppressNativeUntil)
    return
  openAt(e.clientX, e.clientY)
}

function onAreaKeydown(e: KeyboardEvent) {
  if (e.key === 'ContextMenu' || (e.shiftKey && e.key === 'F10')) {
    e.preventDefault()
    const r = area.value!.getBoundingClientRect()
    suppressNativeUntil = Date.now() + 400
    openAt(r.left + Math.min(24, r.width / 2), r.top + Math.min(24, r.height / 2), true)
  }
}

function cancelPress() {
  clearTimeout(pressTimer)
}

function onPointerdown(e: PointerEvent) {
  if (e.pointerType === 'mouse' || props.disabled)
    return
  pressStart = { x: e.clientX, y: e.clientY }
  cancelPress()
  pressTimer = setTimeout(() => {
    // Some browsers also fire `contextmenu` for a long-press — ignore that one.
    suppressNativeUntil = Date.now() + 800
    openAt(pressStart.x, pressStart.y)
  }, props.longPress)
}

function onPointermove(e: PointerEvent) {
  if (Math.hypot(e.clientX - pressStart.x, e.clientY - pressStart.y) > 10)
    cancelPress()
}

// --- global listeners while open -------------------------------------------

function onDocumentPointerdown(e: PointerEvent) {
  const t = e.target as Node
  if ((rootEl.value as HTMLElement | null)?.contains(t) || (subEl.value as HTMLElement | null)?.contains(t))
    return
  close(false)
}

function dismiss() {
  // Right-clicking focuses the area, which may scroll it into view — not a dismiss.
  if (Date.now() - openedAt < 250)
    return
  close(false)
}

function bind(on: boolean) {
  if (typeof document === 'undefined')
    return
  if (on) {
    document.addEventListener('pointerdown', onDocumentPointerdown, true)
    window.addEventListener('resize', dismiss)
    window.addEventListener('blur', dismiss)
    window.addEventListener('scroll', dismiss, true)
  }
  else {
    document.removeEventListener('pointerdown', onDocumentPointerdown, true)
    window.removeEventListener('resize', dismiss)
    window.removeEventListener('blur', dismiss)
    window.removeEventListener('scroll', dismiss, true)
  }
}

onBeforeUnmount(() => {
  clearTimeout(subTimer)
  clearTimeout(pressTimer)
  clearTimeout(typedTimer)
  bind(false)
})

defineExpose({ openAt, close })
</script>

<template>
  <div
    ref="area"
    tabindex="0"
    :class="cn(
      'select-none outline-none [-webkit-touch-callout:none] focus-visible:ring-[3px] focus-visible:ring-ring/50',
      props.class,
    )"
    @contextmenu="onContextmenu"
    @keydown="onAreaKeydown"
    @pointerdown="onPointerdown"
    @pointermove="onPointermove"
    @pointerup="cancelPress"
    @pointercancel="cancelPress"
    @pointerleave="cancelPress"
  >
    <slot />
  </div>

  <Teleport to="body">
    <AnimatePresence>
      <motion.div
        v-if="open"
        ref="rootEl"
        key="root"
        role="menu"
        :aria-label="props.label"
        aria-orientation="vertical"
        tabindex="-1"
        :class="cn(
          'fixed z-[96] min-w-52 rounded-xl border bg-popover p-1 text-popover-foreground shadow-xl outline-none',
          props.contentClass,
        )"
        :style="{ left: `${root.x}px`, top: `${root.y}px`, transformOrigin: root.origin }"
        :initial="reduced ? { opacity: 0 } : { opacity: 0, scale: 0.9 }"
        :animate="{ opacity: 1, scale: 1 }"
        :exit="{ opacity: 0, scale: reduced ? 1 : 0.96, transition: { duration: 0.12 } }"
        :transition="pop"
        @keydown="onRootKeydown"
        @pointerleave="onRootPointerleave"
        @contextmenu.prevent
      >
        <ContextMenuList
          :entries="props.items"
          :highlighted="root.active !== -1 ? root.active : sub.index"
          :expanded="sub.index"
          :layout-id="`vx-ctx-${uid}-root`"
          :id-prefix="`${uid}-r`"
          :reduced="reduced"
          @hover="hoverRoot"
          @activate="activate(props.items, $event, 0)"
        />
      </motion.div>
    </AnimatePresence>
    <AnimatePresence mode="wait">
      <motion.div
        v-if="open && sub.index !== -1"
        ref="subEl"
        :key="`sub-${sub.index}`"
        role="menu"
        :aria-label="(props.items[sub.index] as ContextMenuAction | undefined)?.label"
        aria-orientation="vertical"
        tabindex="-1"
        :class="cn(
          'fixed z-[97] min-w-44 rounded-xl border bg-popover p-1 text-popover-foreground shadow-xl outline-none',
          props.contentClass,
        )"
        :style="{ left: `${sub.x}px`, top: `${sub.y}px`, transformOrigin: sub.flipped ? 'top right' : 'top left' }"
        :initial="reduced ? { opacity: 0 } : { opacity: 0, x: sub.flipped ? 12 : -12, scale: 0.96 }"
        :animate="{ opacity: 1, x: 0, scale: 1 }"
        :exit="{ opacity: 0, x: reduced ? 0 : sub.flipped ? 8 : -8, transition: { duration: 0.1 } }"
        :transition="slide"
        @keydown="onSubKeydown"
        @pointerenter="keepSub"
        @pointerleave="sub.active = -1"
        @contextmenu.prevent
      >
        <ContextMenuList
          :entries="subEntries"
          :highlighted="sub.active"
          :expanded="-1"
          :layout-id="`vx-ctx-${uid}-sub`"
          :id-prefix="`${uid}-s`"
          :reduced="reduced"
          @hover="hoverSub"
          @activate="activate(subEntries, $event, 1)"
        />
      </motion.div>
    </AnimatePresence>
  </Teleport>
</template>
