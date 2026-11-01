<script setup lang="ts">
import type { Component, HTMLAttributes } from 'vue'
import { AnimatePresence, motion, useDomRef, useReducedMotion } from 'motion-v'
import { computed, nextTick, onBeforeUnmount, ref, useId, watch } from 'vue'
import { cn } from '@/lib/utils'

export interface RadialMenuItem {
  id: string
  label: string
  icon?: Component
  disabled?: boolean
}

const props = withDefaults(defineProps<{
  items: RadialMenuItem[]
  /** Distance from the centre of the button to the centre of each item (px). */
  radius?: number
  /** Angle of the first item in degrees (0 = right, -90 = top). */
  startAngle?: number
  /** Degrees the items spread over. 360 = full ring, 180 = half circle. */
  sweep?: number
  /** Accessible name for the trigger. */
  label?: string
  class?: HTMLAttributes['class']
}>(), {
  radius: 92,
  startAngle: -90,
  sweep: 360,
  label: 'Open menu',
})

const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ select: [item: RadialMenuItem] }>()

const uid = useId()
const reduced = useReducedMotion()
const bloom = { type: 'spring', stiffness: 360, damping: 22, mass: 0.8 } as const
const ITEM = 44

const root = ref<HTMLElement>()
// `ref` on a motion component gives the instance; useDomRef gives the element.
const trigger = useDomRef()
const highlighted = ref<string | null>(null) // roving tabindex
const hoverId = ref<string | null>(null)
const focusId = ref<string | null>(null)

const placed = computed(() => {
  const n = props.items.length
  const full = props.sweep >= 360
  const step = n > 1 ? props.sweep / (full ? n : n - 1) : 0
  return props.items.map((item, i) => {
    const deg = props.startAngle + i * step
    const rad = deg * Math.PI / 180
    const cos = Math.cos(rad)
    const sin = Math.sin(rad)
    return {
      item,
      i,
      x: cos * props.radius,
      y: sin * props.radius,
      cos,
      sin,
    }
  })
})
const enabled = computed(() => placed.value.filter(p => !p.item.disabled))
// Item whose label is showing: whichever of hover / focus happened last.
const labelId = ref<string | null>(null)
const active = computed(() => placed.value.find(p => p.item.id === labelId.value))
function onEnter(id: string) {
  hoverId.value = id
  labelId.value = id
}
function onLeave(id: string) {
  if (hoverId.value === id)
    hoverId.value = null
  if (labelId.value === id)
    labelId.value = focusId.value
}
function onFocus(id: string) {
  highlighted.value = id
  focusId.value = id
  labelId.value = id
}
function onBlur(id: string) {
  if (focusId.value === id)
    focusId.value = null
  if (labelId.value === id)
    labelId.value = hoverId.value
}
// The one item reachable with Tab.
const rovingId = computed(() => highlighted.value ?? enabled.value[0]?.item.id ?? null)

function itemEls() {
  return [...(root.value?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])]
}
function focusItem(id: string | undefined) {
  if (!id)
    return
  highlighted.value = id
  itemEls().find(el => el.dataset.id === id)?.focus()
}

async function toggle(focusFirst = false) {
  // A v-model bound prop only updates after the parent re-renders, so keep the new state locally.
  const next = !open.value
  open.value = next
  highlighted.value = enabled.value[0]?.item.id ?? null
  if (next && focusFirst) {
    await nextTick()
    focusItem(enabled.value[0]?.item.id)
  }
}
async function close(returnFocus = true) {
  open.value = false
  hoverId.value = null
  focusId.value = null
  labelId.value = null
  if (returnFocus) {
    await nextTick()
    ;(trigger.value as HTMLElement | null)?.focus()
  }
}
function choose(item: RadialMenuItem) {
  if (item.disabled)
    return
  emit('select', item)
  close()
}

function onTriggerKey(e: KeyboardEvent) {
  if (!['ArrowDown', 'ArrowUp', 'ArrowRight', 'ArrowLeft'].includes(e.key))
    return
  e.preventDefault()
  if (open.value)
    focusItem(rovingId.value ?? undefined)
  else
    toggle(true)
}
function onMenuKey(e: KeyboardEvent) {
  const list = enabled.value
  const pos = list.findIndex(p => p.item.id === rovingId.value)
  let next: number | undefined
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown')
    next = pos + 1
  else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp')
    next = pos - 1
  else if (e.key === 'Home')
    next = 0
  else if (e.key === 'End')
    next = list.length - 1
  else if (e.key === 'Tab') {
    close(false)
    return
  }
  if (next === undefined || !list.length)
    return
  e.preventDefault()
  focusItem(list[(next + list.length) % list.length]!.item.id)
}

// Close on outside pointer down.
function onDocPointer(e: PointerEvent) {
  if (root.value && !root.value.contains(e.target as Node))
    close(false)
}
watch(open, (isOpen) => {
  if (typeof document === 'undefined')
    return
  if (isOpen)
    document.addEventListener('pointerdown', onDocPointer)
  else
    document.removeEventListener('pointerdown', onDocPointer)
}, { immediate: true })
onBeforeUnmount(() => {
  if (typeof document !== 'undefined')
    document.removeEventListener('pointerdown', onDocPointer)
})

const ringSize = computed(() => props.radius * 2 + ITEM + 20)
</script>

<template>
  <div
    ref="root"
    :class="cn('relative inline-flex size-14 items-center justify-center', props.class)"
    @keydown.esc="open && close()"
  >
    <!-- Bloom backdrop -->
    <AnimatePresence>
      <motion.div
        v-if="open"
        key="ring"
        aria-hidden="true"
        class="pointer-events-none absolute left-1/2 top-1/2 rounded-full border bg-muted/50 backdrop-blur-sm"
        :style="{ width: `${ringSize}px`, height: `${ringSize}px`, marginLeft: `${-ringSize / 2}px`, marginTop: `${-ringSize / 2}px` }"
        :initial="{ scale: 0.2, opacity: 0 }"
        :animate="{ scale: 1, opacity: 1 }"
        :exit="{ scale: reduced ? 1 : 0.3, opacity: 0, transition: { duration: reduced ? 0 : 0.22, delay: reduced ? 0 : 0.06 } }"
        :transition="reduced ? { duration: 0 } : { type: 'spring', stiffness: 260, damping: 24 }"
      />
    </AnimatePresence>

    <!-- Items -->
    <div
      :id="`${uid}-menu`"
      role="menu"
      :aria-label="props.label"
      :aria-hidden="!open || undefined"
      class="absolute left-1/2 top-1/2 size-0"
      @keydown="onMenuKey"
    >
      <AnimatePresence>
        <template v-if="open">
          <motion.button
            v-for="p in placed"
            :key="p.item.id"
            type="button"
            role="menuitem"
            :data-id="p.item.id"
            :tabindex="rovingId === p.item.id ? 0 : -1"
            :aria-label="p.item.label"
            :aria-disabled="p.item.disabled || undefined"
            :class="cn(
              'absolute flex items-center justify-center rounded-full border bg-popover text-popover-foreground shadow-md outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50 [&_svg]:size-[18px]',
              p.item.disabled ? 'cursor-not-allowed opacity-40' : 'hover:bg-accent',
              focusId === p.item.id && !p.item.disabled && 'bg-accent',
            )"
            :style="{ width: `${ITEM}px`, height: `${ITEM}px`, left: `${-ITEM / 2}px`, top: `${-ITEM / 2}px` }"
            :initial="{ x: 0, y: 0, scale: 0.3, rotate: -120, opacity: 0 }"
            :animate="{
              x: p.x,
              y: p.y,
              scale: 1,
              rotate: 0,
              opacity: 1,
              transition: reduced ? { duration: 0 } : { ...bloom, delay: p.i * 0.035 },
            }"
            :exit="{
              x: 0,
              y: 0,
              scale: 0.3,
              rotate: reduced ? 0 : -90,
              opacity: 0,
              transition: reduced ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 32, delay: (placed.length - 1 - p.i) * 0.02 },
            }"
            :while-hover="reduced || p.item.disabled ? undefined : { scale: 1.12 }"
            :while-press="reduced || p.item.disabled ? undefined : { scale: 0.94 }"
            @click="choose(p.item)"
            @pointerenter="onEnter(p.item.id)"
            @pointerleave="onLeave(p.item.id)"
            @focus="onFocus(p.item.id)"
            @blur="onBlur(p.item.id)"
          >
            <slot name="item" :item="p.item">
              <component :is="p.item.icon" v-if="p.item.icon" aria-hidden="true" />
              <span v-else class="text-xs font-semibold" aria-hidden="true">{{ p.item.label.slice(0, 2) }}</span>
            </slot>
          </motion.button>
        </template>
      </AnimatePresence>

      <!-- Label for the hovered / focused item, pushed outward along its angle -->
      <AnimatePresence>
        <motion.span
          v-if="open && active"
          :key="active.item.id"
          aria-hidden="true"
          class="pointer-events-none absolute left-0 top-0 whitespace-nowrap rounded-md border bg-popover px-2 py-0.5 text-xs font-medium text-popover-foreground shadow-sm"
          :style="{
            translate: `calc(-50% + ${active.cos * 50}%) calc(-50% + ${active.sin * 50}%)`,
          }"
          :initial="{
            x: active.cos * (props.radius + ITEM / 2 + 4),
            y: active.sin * (props.radius + ITEM / 2 + 4),
            opacity: 0,
            scale: 0.9,
          }"
          :animate="{
            x: active.cos * (props.radius + ITEM / 2 + 10),
            y: active.sin * (props.radius + ITEM / 2 + 10),
            opacity: 1,
            scale: 1,
          }"
          :exit="{ opacity: 0, scale: 0.9, transition: { duration: 0.1 } }"
          :transition="{ type: 'spring', stiffness: 500, damping: 32 }"
        >
          {{ active.item.label }}
        </motion.span>
      </AnimatePresence>
    </div>

    <!-- Trigger -->
    <motion.button
      ref="trigger"
      type="button"
      :aria-label="props.label"
      aria-haspopup="menu"
      :aria-expanded="open"
      :aria-controls="`${uid}-menu`"
      class="relative z-10 inline-flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      :while-press="{ scale: 0.92 }"
      :animate="{ scale: open ? 0.92 : 1 }"
      :transition="bloom"
      @click="toggle($event.detail === 0)"
      @keydown="onTriggerKey"
    >
      <motion.span
        class="inline-flex"
        :animate="{ rotate: open ? 135 : 0 }"
        :transition="reduced ? { duration: 0 } : bloom"
      >
        <slot name="icon">
          <svg class="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
        </slot>
      </motion.span>
    </motion.button>
  </div>
</template>
