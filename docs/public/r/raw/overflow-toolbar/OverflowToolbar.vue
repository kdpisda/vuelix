<script setup lang="ts">
import type { Component, HTMLAttributes } from 'vue'
import { AnimatePresence, LayoutGroup, motion, useDomRef, useReducedMotion } from 'motion-v'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'
import { cn } from '@/lib/utils'

export interface OverflowToolbarItem {
  id: string
  label: string
  icon?: Component
  /** Toggle state: rendered as `aria-pressed` (bar) / `aria-checked` (menu). */
  pressed?: boolean
  disabled?: boolean
  /** A separator is drawn between items of different groups. */
  group?: string
  /** Show the label next to the icon in the bar (icon-only by default). */
  showLabel?: boolean
}

const props = withDefaults(defineProps<{
  items: OverflowToolbarItem[]
  /** Accessible name of the toolbar. */
  label?: string
  /** Accessible name of the overflow button. */
  moreLabel?: string
  class?: HTMLAttributes['class']
  /** Classes for the overflow menu. */
  menuClass?: HTMLAttributes['class']
}>(), {
  label: 'Toolbar',
  moreLabel: 'More actions',
})

const emit = defineEmits<{ action: [id: string] }>()

const uid = `vx-otb-${useId()}`
const reduced = useReducedMotion()
const root = ref<HTMLElement>()
const ghost = ref<HTMLElement>()
const moreButton = ref<HTMLButtonElement>()
const menu = useDomRef()

const spring = { type: 'spring', stiffness: 460, damping: 36 } as const
const GAP = 4

// ---------------------------------------------------------------------------
// Measure every item once (in an invisible ghost row), then fit as many as
// the toolbar can hold, keeping room for the "more" button.
// ---------------------------------------------------------------------------
const fit = ref(props.items.length)

function separatorBefore(index: number, list = props.items) {
  return index > 0 && list[index]!.group !== list[index - 1]!.group
}

function measure() {
  const el = root.value
  const row = ghost.value
  if (!el || !row)
    return
  const style = getComputedStyle(el)
  const available = el.clientWidth - Number.parseFloat(style.paddingLeft) - Number.parseFloat(style.paddingRight)
  const nodes = [...row.children] as HTMLElement[]
  const sepWidth = nodes.find(n => n.dataset.sep !== undefined)?.offsetWidth ?? 0
  const moreWidth = nodes.find(n => n.dataset.more !== undefined)?.offsetWidth ?? 32
  const widths = nodes.filter(n => n.dataset.item !== undefined).map(n => n.offsetWidth)

  let used = 0
  let count = 0
  for (let i = 0; i < widths.length; i++) {
    const extra = (count ? GAP : 0) + (separatorBefore(i) ? sepWidth + GAP : 0) + widths[i]!
    const rest = i < widths.length - 1 ? GAP + moreWidth : 0
    if (used + extra + rest > available)
      break
    used += extra
    count++
  }
  fit.value = count
}

let observer: ResizeObserver | undefined
onMounted(() => {
  measure()
  observer = new ResizeObserver(measure)
  observer.observe(root.value!)
  document.addEventListener('pointerdown', onPointerDown)
})
onBeforeUnmount(() => {
  observer?.disconnect()
  document.removeEventListener('pointerdown', onPointerDown)
})
watch(() => props.items.map(i => `${i.id}:${i.label}:${i.group}:${i.showLabel}`).join(), () => nextTick(measure))

const shown = computed(() => props.items.slice(0, fit.value))
const hidden = computed(() => props.items.slice(fit.value))

// ---------------------------------------------------------------------------
// Overflow menu
// ---------------------------------------------------------------------------
const open = ref(false)

watch(hidden, async (list) => {
  const hadFocus = root.value?.contains(document.activeElement)
  if (!list.length)
    open.value = false
  await nextTick()
  // The focused item may have just moved between the menu and the bar: keep focus in the toolbar.
  if (!hadFocus || root.value?.contains(document.activeElement))
    return
  if (open.value)
    menuItems()[0]?.focus()
  else
    root.value?.querySelector<HTMLElement>(`[data-key="${CSS.escape(tabStop.value ?? '')}"]`)?.focus()
})

function menuItems() {
  return [...((menu.value as HTMLElement | null)?.querySelectorAll<HTMLElement>('[data-menu-item]:not([aria-disabled="true"])') ?? [])]
}

async function openMenu(focusLast = false) {
  open.value = true
  await nextTick()
  const items = menuItems()
  items[focusLast ? items.length - 1 : 0]?.focus()
}

function closeMenu(refocus = true) {
  open.value = false
  if (refocus)
    nextTick(() => moreButton.value?.focus())
}

function onMenuKeydown(e: KeyboardEvent) {
  const items = menuItems()
  const at = items.indexOf(document.activeElement as HTMLElement)
  let next: number | undefined
  if (e.key === 'ArrowDown')
    next = (at + 1) % items.length
  else if (e.key === 'ArrowUp')
    next = (at - 1 + items.length) % items.length
  else if (e.key === 'Home')
    next = 0
  else if (e.key === 'End')
    next = items.length - 1
  else if (e.key === 'Escape') {
    e.preventDefault()
    e.stopPropagation()
    closeMenu()
    return
  }
  else if (e.key === 'Tab') {
    closeMenu(false)
    return
  }
  if (next === undefined)
    return
  e.preventDefault()
  e.stopPropagation()
  items[next]?.focus()
}

function onPointerDown(e: PointerEvent) {
  if (open.value && root.value && !root.value.contains(e.target as Node))
    closeMenu(false)
}

function trigger(item: OverflowToolbarItem, fromMenu = false) {
  if (item.disabled)
    return
  emit('action', item.id)
  if (fromMenu)
    closeMenu()
}

// ---------------------------------------------------------------------------
// Roving tabindex across the bar (shown items + the "more" button)
// ---------------------------------------------------------------------------
const focusKey = ref<string>()
const keys = computed(() => [
  ...shown.value.filter(i => !i.disabled).map(i => i.id),
  ...(hidden.value.length ? [`${uid}-more`] : []),
])
const tabStop = computed(() => (focusKey.value && keys.value.includes(focusKey.value) ? focusKey.value : keys.value[0]))

function onBarKeydown(e: KeyboardEvent) {
  if ((e.target as HTMLElement).closest('[role="menu"]'))
    return
  const list = keys.value
  const at = Math.max(0, list.indexOf(tabStop.value ?? ''))
  let next: string | undefined
  if (e.key === 'ArrowRight')
    next = list[(at + 1) % list.length]
  else if (e.key === 'ArrowLeft')
    next = list[(at - 1 + list.length) % list.length]
  else if (e.key === 'Home')
    next = list[0]
  else if (e.key === 'End')
    next = list.at(-1)
  else if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && tabStop.value === `${uid}-more`) {
    e.preventDefault()
    openMenu(e.key === 'ArrowUp')
    return
  }
  if (next === undefined)
    return
  e.preventDefault()
  focusKey.value = next
  root.value?.querySelector<HTMLElement>(`[data-key="${CSS.escape(next)}"]`)?.focus()
}

const itemClass = 'inline-flex h-8 min-w-8 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-2 text-sm font-medium whitespace-nowrap text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-40 aria-pressed:bg-accent aria-pressed:text-foreground [&_svg]:size-4 [&_svg]:shrink-0'
</script>

<template>
  <div
    ref="root"
    role="toolbar"
    aria-orientation="horizontal"
    :aria-label="props.label"
    :class="cn('relative flex w-full min-w-0 items-center gap-1 rounded-xl border bg-background p-1 text-foreground shadow-sm', props.class)"
    @keydown="onBarKeydown"
  >
    <!-- Invisible measuring row: same markup as the bar, never interactive. -->
    <div ref="ghost" aria-hidden="true" inert class="pointer-events-none invisible absolute left-0 top-0 flex h-0 items-center overflow-hidden">
      <span v-for="item in props.items" :key="item.id" data-item :class="itemClass">
        <component :is="item.icon" v-if="item.icon" />
        <span v-if="item.showLabel || !item.icon">{{ item.label }}</span>
      </span>
      <span data-sep class="mx-0.5 h-5 w-px shrink-0" />
      <span data-more :class="itemClass" />
    </div>

    <LayoutGroup :id="uid">
      <div class="flex min-w-0 flex-1 items-center gap-1">
        <AnimatePresence :initial="false" mode="popLayout">
          <motion.div
            v-for="(item, index) in shown"
            :key="item.id"
            class="flex shrink-0 items-center gap-1"
            :layout="!reduced"
            :initial="{ opacity: 0, scale: reduced ? 1 : 0.6 }"
            :animate="{ opacity: 1, scale: 1 }"
            :exit="{ opacity: 0, scale: reduced ? 1 : 0.6, x: reduced ? 0 : 12 }"
            :transition="spring"
          >
            <span v-if="separatorBefore(index, shown)" aria-hidden="true" class="mx-0.5 h-5 w-px shrink-0 bg-border" />
            <motion.button
              type="button"
              :layout-id="reduced ? undefined : `${uid}-${item.id}`"
              :data-key="item.id"
              :tabindex="tabStop === item.id ? 0 : -1"
              :disabled="item.disabled"
              :aria-pressed="item.pressed ?? undefined"
              :aria-label="item.showLabel || !item.icon ? undefined : item.label"
              :title="item.showLabel || !item.icon ? undefined : item.label"
              :class="itemClass"
              :transition="spring"
              @focus="focusKey = item.id"
              @click="trigger(item)"
            >
              <component :is="item.icon" v-if="item.icon" aria-hidden="true" />
              <span v-if="item.showLabel || !item.icon">{{ item.label }}</span>
            </motion.button>
          </motion.div>
        </AnimatePresence>
      </div>

      <AnimatePresence :initial="false">
        <motion.div
          v-if="hidden.length"
          key="more"
          class="relative shrink-0"
          :initial="{ opacity: 0, scale: 0.6 }"
          :animate="{ opacity: 1, scale: 1 }"
          :exit="{ opacity: 0, scale: 0.6 }"
          :transition="spring"
        >
          <button
            ref="moreButton"
            type="button"
            :data-key="`${uid}-more`"
            :tabindex="tabStop === `${uid}-more` ? 0 : -1"
            :aria-label="`${props.moreLabel} (${hidden.length})`"
            aria-haspopup="menu"
            :aria-expanded="open"
            :aria-controls="open ? `${uid}-menu` : undefined"
            :class="cn(itemClass, open && 'bg-accent text-foreground')"
            @focus="focusKey = `${uid}-more`"
            @click="open ? closeMenu() : openMenu()"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.75" /><circle cx="12" cy="12" r="1.75" /><circle cx="19" cy="12" r="1.75" /></svg>
            <AnimatePresence mode="popLayout" :initial="false">
              <motion.span
                :key="hidden.length"
                aria-hidden="true"
                class="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-foreground text-[10px] font-semibold tabular-nums text-background"
                :initial="{ scale: 0.4, opacity: 0 }"
                :animate="{ scale: 1, opacity: 1 }"
                :exit="{ scale: 0.4, opacity: 0 }"
                :transition="spring"
              >
                {{ hidden.length }}
              </motion.span>
            </AnimatePresence>
          </button>

          <AnimatePresence>
            <motion.div
              v-if="open"
              :id="`${uid}-menu`"
              ref="menu"
              role="menu"
              :aria-label="props.moreLabel"
              :class="cn('absolute right-0 top-full z-50 mt-2 max-h-[min(19rem,70vh)] min-w-48 overflow-y-auto overscroll-contain rounded-xl border bg-popover p-1 text-popover-foreground shadow-lg', props.menuClass)"
              style="transform-origin: top right"
              :initial="{ opacity: 0, scale: reduced ? 1 : 0.92, y: reduced ? 0 : -4 }"
              :animate="{ opacity: 1, scale: 1, y: 0 }"
              :exit="{ opacity: 0, scale: reduced ? 1 : 0.96, transition: { duration: 0.12 } }"
              :transition="spring"
              @keydown="onMenuKeydown"
            >
              <template v-for="(item, index) in hidden" :key="item.id">
                <div v-if="separatorBefore(index, hidden)" role="separator" class="-mx-1 my-1 h-px bg-border" />
                <motion.button
                  type="button"
                  data-menu-item
                  :layout-id="reduced ? undefined : `${uid}-${item.id}`"
                  :role="item.pressed === undefined ? 'menuitem' : 'menuitemcheckbox'"
                  :aria-checked="item.pressed ?? undefined"
                  :aria-disabled="item.disabled || undefined"
                  tabindex="-1"
                  class="flex h-8 w-full cursor-pointer items-center gap-2.5 rounded-lg px-2 text-left text-sm text-foreground outline-none hover:bg-accent focus-visible:bg-accent aria-disabled:pointer-events-none aria-disabled:opacity-40 [&_svg]:size-4 [&_svg]:shrink-0"
                  :initial="{ opacity: 0, x: reduced ? 0 : 8 }"
                  :animate="{ opacity: 1, x: 0, transition: { ...spring, delay: reduced ? 0 : 0.02 * index } }"
                  :transition="spring"
                  @click="trigger(item, true)"
                >
                  <component :is="item.icon" v-if="item.icon" class="text-muted-foreground" aria-hidden="true" />
                  <span class="flex-1">{{ item.label }}</span>
                  <svg v-if="item.pressed" class="text-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
                </motion.button>
              </template>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>
    </LayoutGroup>
  </div>
</template>
