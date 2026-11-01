<script setup lang="ts">
import type { Component, HTMLAttributes } from 'vue'
import { AnimatePresence, motion, useReducedMotion } from 'motion-v'
import { computed, ref, useId, watch } from 'vue'
import { cn } from '@/lib/utils'

export interface SpringSidebarItem {
  /** Unique id, used for `v-model:active`. */
  value: string
  label: string
  icon?: Component
  /** Render as a link. */
  href?: string
  /** Small count / tag; shrinks to a dot in rail mode. */
  badge?: string | number
  /** One level of nested items; the parent becomes a collapsible group. */
  children?: SpringSidebarItem[]
}

const props = withDefaults(defineProps<{
  items: SpringSidebarItem[]
  /** Expanded width in px. */
  width?: number
  /** Rail (collapsed) width in px. */
  railWidth?: number
  /** Accessible name of the navigation landmark. */
  label?: string
  class?: HTMLAttributes['class']
}>(), {
  width: 248,
  railWidth: 64,
  label: 'Main',
})

const collapsed = defineModel<boolean>('collapsed', { default: false })
const active = defineModel<string>('active')
const emit = defineEmits<{ select: [item: SpringSidebarItem] }>()

const uid = useId()
const indicatorId = `vx-sidebar-${uid}`
const nav = ref<HTMLElement | null>(null)
const reduced = useReducedMotion()

const spring = { type: 'spring', stiffness: 320, damping: 32, mass: 0.9 } as const
const glide = { type: 'spring', stiffness: 460, damping: 38 } as const

// Groups start open when they contain the active item.
const parentOf = (value?: string) => props.items.find(i => i.children?.some(c => c.value === value))
const openGroups = ref<string[]>(props.items.filter(i => i.children?.some(c => c.value === active.value)).map(i => i.value))

interface Row { item: SpringSidebarItem, level: 0 | 1, parent?: SpringSidebarItem }
const rows = computed<Row[]>(() => props.items.flatMap((item) => {
  const row: Row = { item, level: 0 }
  if (!item.children?.length || collapsed.value || !openGroups.value.includes(item.value))
    return [row]
  return [row, ...item.children.map(child => ({ item: child, level: 1 as const, parent: item }))]
}))

// When the active item is hidden inside a closed group (or the rail), the
// indicator rests on its parent instead.
const indicatorOn = computed(() => {
  const parent = parentOf(active.value)
  if (parent && (collapsed.value || !openGroups.value.includes(parent.value)))
    return parent.value
  return active.value
})

function toggleGroup(item: SpringSidebarItem, force?: boolean) {
  const isOpen = openGroups.value.includes(item.value)
  const next = force ?? !isOpen
  if (next === isOpen)
    return
  openGroups.value = next ? [...openGroups.value, item.value] : openGroups.value.filter(v => v !== item.value)
}

function onSelect(row: Row) {
  const { item } = row
  if (item.children?.length) {
    if (collapsed.value) {
      collapsed.value = false
      toggleGroup(item, true)
    }
    else {
      toggleGroup(item)
    }
    return
  }
  active.value = item.value
  emit('select', item)
}

// --- rail tooltips (teleported so the nav's overflow can't clip them) --------

const tip = ref<{ label: string, x: number, y: number } | null>(null)
function showTip(item: SpringSidebarItem, e: Event) {
  if (!collapsed.value)
    return
  const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
  tip.value = { label: item.label, x: r.right + 12, y: r.top + r.height / 2 }
}
function hideTip() {
  tip.value = null
}
watch(collapsed, hideTip)

// --- keyboard ------------------------------------------------------------------

function onKeydown(e: KeyboardEvent, row: Row) {
  const els = [...(nav.value?.querySelectorAll<HTMLElement>('[data-vx-nav]') ?? [])]
  const i = els.indexOf(e.currentTarget as HTMLElement)
  let next: HTMLElement | undefined
  if (e.key === 'ArrowDown')
    next = els[(i + 1) % els.length]
  else if (e.key === 'ArrowUp')
    next = els[(i - 1 + els.length) % els.length]
  else if (e.key === 'Home')
    next = els[0]
  else if (e.key === 'End')
    next = els.at(-1)
  else if (e.key === 'ArrowRight' && row.item.children?.length && !collapsed.value)
    toggleGroup(row.item, true)
  else if (e.key === 'ArrowLeft' && row.item.children?.length)
    toggleGroup(row.item, false)
  else if (e.key === 'ArrowLeft' && row.parent)
    next = els.find(el => el.dataset.vxNav === row.parent!.value)
  else
    return
  e.preventDefault()
  next?.focus()
}

const labelState = computed(() => (collapsed.value
  ? { opacity: 0, x: -6, filter: reduced.value ? 'blur(0px)' : 'blur(4px)' }
  : { opacity: 1, x: 0, filter: 'blur(0px)' }))
const labelTransition = computed(() => (collapsed.value
  ? { duration: 0.12 }
  : { duration: 0.22, delay: 0.08 }))
</script>

<template>
  <motion.aside
    :class="cn(
      'relative flex h-full shrink-0 flex-col overflow-hidden border-r bg-card text-card-foreground',
      props.class,
    )"
    :initial="false"
    :animate="{ width: collapsed ? props.railWidth : props.width }"
    :transition="reduced ? { duration: 0 } : spring"
  >
    <div v-if="$slots.header" class="flex h-14 shrink-0 items-center px-3">
      <slot name="header" :collapsed="collapsed" />
    </div>

    <nav
      :id="`${uid}-nav`"
      ref="nav"
      :aria-label="props.label"
      class="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3 py-2"
    >
      <AnimatePresence as="ul" :initial="false" class="m-0 flex list-none flex-col p-0">
        <motion.li
          v-for="row in rows"
          :key="row.item.value"
          :class="cn('py-px', row.level === 1 && 'ml-5 overflow-hidden border-l pl-2')"
          :initial="row.level === 1 ? { height: 0, opacity: 0 } : { opacity: 0 }"
          :animate="row.level === 1 ? { height: 'auto', opacity: 1 } : { opacity: 1 }"
          :exit="row.level === 1 ? { height: 0, opacity: 0 } : { opacity: 0 }"
          :transition="reduced ? { duration: 0 } : spring"
        >
          <component
            :is="row.item.href && !row.item.children?.length ? 'a' : 'button'"
            :href="row.item.children?.length ? undefined : row.item.href"
            :type="row.item.href && !row.item.children?.length ? undefined : 'button'"
            :data-vx-nav="row.item.value"
            :aria-current="active === row.item.value ? 'page' : undefined"
            :aria-expanded="row.item.children?.length ? !collapsed && openGroups.includes(row.item.value) : undefined"
            :class="cn(
              'relative isolate flex w-full items-center gap-3 rounded-lg text-left text-sm no-underline outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50',
              row.level === 0 ? 'h-10 px-[11px]' : 'h-9 px-2.5 focus-visible:ring-inset',
              indicatorOn === row.item.value ? 'font-medium text-foreground' : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
            )"
            @click="onSelect(row)"
            @keydown="onKeydown($event, row)"
            @pointerenter="showTip(row.item, $event)"
            @pointerleave="hideTip"
            @focus="showTip(row.item, $event)"
            @blur="hideTip"
          >
            <motion.span
              v-if="indicatorOn === row.item.value"
              aria-hidden="true"
              :layout-id="indicatorId"
              class="absolute inset-0 -z-10 rounded-lg bg-accent"
              :transition="reduced ? { duration: 0 } : glide"
            >
              <span v-if="row.level === 0" class="absolute -left-3 inset-y-2 w-[3px] rounded-r-full bg-brand" />
            </motion.span>
            <span v-if="row.item.icon" class="relative flex size-[18px] shrink-0 items-center justify-center">
              <component :is="row.item.icon" class="size-[18px]" aria-hidden="true" />
              <motion.span
                v-if="row.item.badge !== undefined"
                aria-hidden="true"
                class="absolute -right-1 -top-1 size-2 rounded-full bg-brand ring-2 ring-card"
                :initial="false"
                :animate="{ scale: collapsed ? 1 : 0 }"
                :transition="spring"
              />
            </span>
            <motion.span
              class="flex min-w-0 flex-1 items-center gap-2 whitespace-nowrap"
              :initial="false"
              :animate="labelState"
              :transition="labelTransition"
            >
              <span class="truncate">{{ row.item.label }}</span>
              <span
                v-if="row.item.badge !== undefined"
                class="ml-auto rounded-full bg-muted px-1.5 text-[11px] font-medium leading-5 text-muted-foreground"
              >{{ row.item.badge }}</span>
              <motion.svg
                v-if="row.item.children?.length"
                :class="cn('size-3.5 shrink-0 text-muted-foreground', row.item.badge === undefined && 'ml-auto')"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
                :initial="false"
                :animate="{ rotate: openGroups.includes(row.item.value) ? 90 : 0 }"
                :transition="spring"
              >
                <path d="m9 18 6-6-6-6" />
              </motion.svg>
            </motion.span>
          </component>
        </motion.li>
      </AnimatePresence>
    </nav>

    <div class="shrink-0 border-t px-3 py-3">
      <slot name="footer" :collapsed="collapsed" />
      <button
        type="button"
        :aria-controls="`${uid}-nav`"
        :aria-expanded="!collapsed"
        :aria-label="collapsed ? 'Expand sidebar' : 'Collapse sidebar'"
        class="flex h-10 w-full items-center gap-3 rounded-lg px-[11px] text-sm text-muted-foreground outline-none transition-colors hover:bg-muted/60 hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
        @click="collapsed = !collapsed"
      >
        <motion.svg
          class="size-[18px] shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
          :initial="false"
          :animate="{ rotate: collapsed ? 180 : 0 }"
          :transition="spring"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 3v18" /><path d="m16 15-3-3 3-3" />
        </motion.svg>
        <motion.span class="whitespace-nowrap" :initial="false" :animate="labelState" :transition="labelTransition">
          Collapse
        </motion.span>
      </button>
    </div>
  </motion.aside>

  <Teleport to="body">
    <AnimatePresence>
      <motion.span
        v-if="tip"
        key="tip"
        aria-hidden="true"
        class="pointer-events-none fixed z-[95] -translate-y-1/2 whitespace-nowrap rounded-md bg-foreground px-2.5 py-1 text-xs font-medium text-background shadow-lg"
        :style="{ left: `${tip.x}px`, top: `${tip.y}px` }"
        :initial="{ opacity: 0, x: -6, scale: 0.9 }"
        :animate="{ opacity: 1, x: 0, scale: 1 }"
        :exit="{ opacity: 0, x: -4, scale: 0.95, transition: { duration: 0.1 } }"
        :transition="{ type: 'spring', stiffness: 520, damping: 30 }"
      >
        {{ tip.label }}
      </motion.span>
    </AnimatePresence>
  </Teleport>
</template>
