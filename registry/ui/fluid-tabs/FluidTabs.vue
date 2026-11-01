<script setup lang="ts">
import type { Component, HTMLAttributes } from 'vue'
import { animate, AnimatePresence, motion, useMotionValue, useReducedMotion, useTransform } from 'motion-v'
import { nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'
import { cn } from '@/lib/utils'

export interface FluidTabItem {
  value: string
  label: string
  icon?: Component
  disabled?: boolean
}

const props = defineProps<{
  items: FluidTabItem[]
  /** Accessible name of the tab list. */
  label?: string
  class?: HTMLAttributes['class']
  /** Classes for the tab list (the track). */
  listClass?: HTMLAttributes['class']
  /** Classes for the panel area. */
  panelClass?: HTMLAttributes['class']
}>()

const model = defineModel<string>()
if (model.value === undefined && props.items.length)
  model.value = props.items.find(i => !i.disabled)?.value

const uid = `vx-fluid-${useId()}`
const reduced = useReducedMotion()
const list = ref<HTMLElement>()
const ready = ref(false)
const direction = ref(1)

// Leading edge snaps ahead, trailing edge catches up: two springs.
const lead = { type: 'spring', stiffness: 520, damping: 38 } as const
const trail = { type: 'spring', stiffness: 170, damping: 22 } as const
const heightSpring = { type: 'spring', stiffness: 380, damping: 36 } as const

const left = useMotionValue(0)
const right = useMotionValue(0)
let rest = 1
const width = useTransform([left, right], ([l, r]: number[]) => r! - l!)
// A stretched blob gets a little thinner, like a drop of liquid.
const scaleY = useTransform(width, w => (reduced.value ? 1 : Math.max(0.78, Math.min(1, 1 - ((w - rest) / rest) * 0.14))))

function tabEl(value: string | undefined) {
  return list.value?.querySelector<HTMLElement>(`[data-value="${CSS.escape(value ?? '')}"]`)
}

function place(value: string | undefined, instant: boolean) {
  const el = tabEl(value)
  if (!el)
    return
  const l = el.offsetLeft
  const r = l + el.offsetWidth
  rest = el.offsetWidth
  if (instant || reduced.value) {
    left.jump(l)
    right.jump(r)
    return
  }
  const movingRight = l > left.get()
  animate(left, l, movingRight ? trail : lead)
  animate(right, r, movingRight ? lead : trail)
}

watch(model, (next, prev) => {
  const a = props.items.findIndex(i => i.value === prev)
  const b = props.items.findIndex(i => i.value === next)
  direction.value = b >= a ? 1 : -1
  place(next, false)
})

let listObserver: ResizeObserver | undefined
onMounted(async () => {
  await nextTick()
  place(model.value, true)
  ready.value = true
  listObserver = new ResizeObserver(() => place(model.value, true))
  listObserver.observe(list.value!)
})

// --- Panel height ------------------------------------------------------------
const height = ref<number | 'auto'>('auto')
let panelObserver: ResizeObserver | undefined
let observed: HTMLElement | null = null
function trackPanel(el: unknown, value: string | undefined) {
  const node = ((el as { $el?: unknown } | null)?.$el ?? el) as HTMLElement | null
  if (!(node instanceof HTMLElement) || value !== model.value || node === observed)
    return
  observed = node
  panelObserver?.disconnect()
  if (typeof ResizeObserver !== 'undefined') {
    panelObserver = new ResizeObserver(() => (height.value = node.offsetHeight))
    panelObserver.observe(node)
  }
}
onBeforeUnmount(() => {
  listObserver?.disconnect()
  panelObserver?.disconnect()
})

const panelVariants = {
  enter: (dir: number) => (reduced.value ? { opacity: 0 } : { opacity: 0, x: dir * 56, filter: 'blur(4px)' }),
  center: { opacity: 1, x: 0, filter: 'blur(0px)' },
  exit: (dir: number) => (reduced.value ? { opacity: 0 } : { opacity: 0, x: dir * -56, filter: 'blur(4px)' }),
}

function onKeydown(e: KeyboardEvent, index: number) {
  const enabled = props.items.map((item, i) => ({ item, i })).filter(({ item }) => !item.disabled)
  const pos = enabled.findIndex(({ i }) => i === index)
  let next: number | undefined
  if (e.key === 'ArrowRight')
    next = enabled[(pos + 1) % enabled.length]?.i
  else if (e.key === 'ArrowLeft')
    next = enabled[(pos - 1 + enabled.length) % enabled.length]?.i
  else if (e.key === 'Home')
    next = enabled[0]?.i
  else if (e.key === 'End')
    next = enabled.at(-1)?.i
  if (next === undefined)
    return
  e.preventDefault()
  model.value = props.items[next]!.value
  tabEl(props.items[next]!.value)?.focus()
}
</script>

<template>
  <div :class="cn('flex w-full flex-col gap-4', props.class)">
    <div
      ref="list"
      role="tablist"
      :aria-label="props.label"
      :class="cn('relative inline-flex w-fit max-w-full items-center gap-1 overflow-x-auto rounded-full bg-muted p-1 [scrollbar-width:none]', props.listClass)"
    >
      <motion.span
        aria-hidden="true"
        :class="cn('absolute inset-y-1 left-0 rounded-full bg-primary shadow-sm transition-opacity', ready ? 'opacity-100' : 'opacity-0')"
        :style="{ x: left, width, scaleY }"
      />
      <button
        v-for="(item, index) in props.items"
        :id="`${uid}-tab-${index}`"
        :key="item.value"
        type="button"
        role="tab"
        :data-value="item.value"
        :aria-selected="model === item.value"
        :aria-controls="`${uid}-panel`"
        :tabindex="model === item.value ? 0 : -1"
        :disabled="item.disabled"
        :class="cn(
          'relative z-10 inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium whitespace-nowrap outline-none transition-colors duration-200 focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4',
          model === item.value ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
        )"
        @click="model = item.value"
        @keydown="onKeydown($event, index)"
      >
        <slot name="trigger" :item="item" :active="model === item.value">
          <component :is="item.icon" v-if="item.icon" aria-hidden="true" />
          {{ item.label }}
        </slot>
      </button>
    </div>

    <motion.div
      :class="cn('relative overflow-hidden', props.panelClass)"
      :initial="false"
      :animate="{ height }"
      :transition="reduced ? { duration: 0 } : heightSpring"
    >
      <AnimatePresence :initial="false" mode="popLayout" :custom="direction">
        <motion.div
          :id="`${uid}-panel`"
          :key="model"
          :ref="(el: unknown) => trackPanel(el, model)"
          role="tabpanel"
          :aria-labelledby="`${uid}-tab-${props.items.findIndex(i => i.value === model)}`"
          tabindex="0"
          class="w-full rounded-lg outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          :variants="panelVariants"
          initial="enter"
          animate="center"
          exit="exit"
          :transition="heightSpring"
        >
          <slot v-if="model" :name="model" />
        </motion.div>
      </AnimatePresence>
    </motion.div>
  </div>
</template>
