<script setup lang="ts">
import type { Component, HTMLAttributes } from 'vue'
import { AnimatePresence, motion, useDomRef, useReducedMotion } from 'motion-v'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { cn } from '@/lib/utils'

export interface ActionBarAction {
  id: string
  label: string
  icon?: Component
  /** Red styling; use for actions that lose data. */
  destructive?: boolean
  /** Ask first. `true` or the question to show, e.g. `'Delete 3 files?'`. */
  confirm?: boolean | string
  /** Label of the confirming button (defaults to `label`). */
  confirmLabel?: string
  disabled?: boolean
}

const props = withDefaults(defineProps<{
  /** Number of selected items. The bar shows while it's above 0. */
  count: number
  actions: ActionBarAction[]
  /** Word after the count. */
  noun?: string
  /** `fixed` floats over the viewport; `absolute` floats over the nearest positioned parent. */
  strategy?: 'fixed' | 'absolute'
  /** Accessible name of the toolbar. */
  label?: string
  class?: HTMLAttributes['class']
}>(), {
  noun: 'selected',
  strategy: 'fixed',
  label: 'Bulk actions',
})

const emit = defineEmits<{
  /** An action ran (after confirmation, when it asks for one). */
  action: [id: string]
  /** The clear button or Escape was pressed. */
  clear: []
}>()

const reduced = useReducedMotion()
const visible = computed(() => props.count > 0)
const revealed = ref(false)
const confirming = ref<ActionBarAction | null>(null)
const focusKey = ref<string>('clear')
const toolbar = useDomRef()

const lift = { type: 'spring', stiffness: 420, damping: 30 } as const
const grow = { type: 'spring', stiffness: 360, damping: 30 } as const
const snap = { type: 'spring', stiffness: 600, damping: 34 } as const

// --- Reveal: the bar lands compact, then grows to show its actions --------
// Runs on the client only (watch + onMounted), so SSR and hydration agree.
let revealTimer: ReturnType<typeof setTimeout> | undefined
function sync(isVisible: boolean) {
  clearTimeout(revealTimer)
  confirming.value = null
  if (!isVisible) {
    revealed.value = false
    return
  }
  if (reduced.value)
    revealed.value = true
  else
    revealTimer = setTimeout(() => (revealed.value = true), 160)
}
watch(visible, sync)
onMounted(() => sync(visible.value))
onBeforeUnmount(() => clearTimeout(revealTimer))

// --- Rolling count ---------------------------------------------------------
const direction = ref(1)
watch(() => props.count, (next, prev) => {
  if (next && prev)
    direction.value = next > prev ? 1 : -1
})
const digits = computed(() => {
  const s = String(Math.max(0, props.count))
  // Key each digit by its place value so only the digits that change roll.
  return s.split('').map((d, i) => ({ d, key: `${s.length - i}:${d}` }))
})
const roll = {
  enter: (dir: number) => ({ y: reduced.value ? 0 : dir * 14, opacity: 0 }),
  center: { y: 0, opacity: 1 },
  exit: (dir: number) => ({ y: reduced.value ? 0 : dir * -14, opacity: 0 }),
}

// --- Measured shell --------------------------------------------------------
const size = ref<{ width: number, height: number } | null>(null)
let observer: ResizeObserver | undefined
let observed: HTMLElement | null = null
// Function refs run on every render, so only (re)subscribe when the node changes.
function track(el: unknown) {
  const node = ((el as { $el?: unknown } | null)?.$el ?? el) as HTMLElement | null
  if (!(node instanceof HTMLElement) || node === observed)
    return
  observed = node
  observer?.disconnect()
  const measure = () => {
    const { offsetWidth: width, offsetHeight: height } = node
    if (size.value?.width !== width || size.value?.height !== height)
      size.value = { width, height }
  }
  measure()
  if (typeof ResizeObserver !== 'undefined') {
    observer = new ResizeObserver(measure)
    observer.observe(node)
  }
}
onBeforeUnmount(() => observer?.disconnect())

// --- Actions + confirm step ------------------------------------------------
function question(action: ActionBarAction) {
  if (typeof action.confirm === 'string')
    return action.confirm
  return `${action.label} ${props.count} ${props.count === 1 ? 'item' : 'items'}?`
}

function focus(key: string) {
  focusKey.value = key
  nextTick(() => (toolbar.value as HTMLElement | null)?.querySelector<HTMLElement>(`[data-key="${CSS.escape(key)}"]`)?.focus())
}

function run(action: ActionBarAction) {
  if (action.disabled)
    return
  if (action.confirm) {
    confirming.value = action
    focus('c:cancel')
    return
  }
  emit('action', action.id)
}

function cancel() {
  const action = confirming.value
  confirming.value = null
  if (action)
    focus(`a:${action.id}`)
}

function confirm() {
  const action = confirming.value
  confirming.value = null
  if (action) {
    focus(`a:${action.id}`)
    emit('action', action.id)
  }
}

// --- Roving tabindex -------------------------------------------------------
const keys = computed(() => {
  if (confirming.value)
    return ['clear', 'c:cancel', 'c:confirm']
  return ['clear', ...(revealed.value ? props.actions.filter(a => !a.disabled).map(a => `a:${a.id}`) : [])]
})

function onKeydown(e: KeyboardEvent) {
  const list = keys.value
  const at = Math.max(0, list.indexOf(focusKey.value))
  let next: string | undefined
  if (e.key === 'ArrowRight')
    next = list[(at + 1) % list.length]
  else if (e.key === 'ArrowLeft')
    next = list[(at - 1 + list.length) % list.length]
  else if (e.key === 'Home')
    next = list[0]
  else if (e.key === 'End')
    next = list.at(-1)
  else if (e.key === 'Escape') {
    e.preventDefault()
    if (confirming.value)
      cancel()
    else
      emit('clear')
    return
  }
  if (next === undefined)
    return
  e.preventDefault()
  focus(next)
}

const tab = (key: string) => (key === focusKey.value || (!keys.value.includes(focusKey.value) && key === 'clear') ? 0 : -1)

const button = 'inline-flex h-9 shrink-0 cursor-pointer items-center gap-2 rounded-xl px-3 text-sm font-medium outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0'
</script>

<template>
  <AnimatePresence>
    <motion.div
      v-if="visible"
      key="bar"
      :class="cn(
        'inset-x-0 z-50 mx-auto w-fit',
        props.strategy === 'fixed' ? 'fixed bottom-6' : 'absolute bottom-4',
        props.class,
      )"
      :initial="{ opacity: 0, y: reduced ? 0 : 32, scale: reduced ? 1 : 0.9 }"
      :animate="{ opacity: 1, y: 0, scale: 1 }"
      :exit="{ opacity: 0, y: reduced ? 0 : 24, scale: reduced ? 1 : 0.95, transition: { duration: 0.18 } }"
      :transition="lift"
    >
      <motion.div
        ref="toolbar"
        role="toolbar"
        aria-orientation="horizontal"
        :aria-label="props.label"
        class="overflow-hidden rounded-2xl border bg-popover text-popover-foreground shadow-xl"
        :initial="false"
        :animate="size ?? {}"
        :transition="reduced ? { duration: 0 } : grow"
        @keydown="onKeydown"
      >
        <div :ref="track" class="relative flex w-max items-center gap-1 p-1.5">
          <button
            type="button"
            data-key="clear"
            :tabindex="tab('clear')"
            aria-label="Clear selection"
            :class="cn(button, 'size-9 justify-center px-0 text-muted-foreground hover:bg-accent hover:text-foreground', confirming && 'max-sm:hidden')"
            @focus="focusKey = 'clear'"
            @click="emit('clear')"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>

          <span :class="cn('flex items-center gap-1.5 pr-2 text-sm font-medium', confirming && 'max-sm:hidden')">
            <span class="relative inline-flex h-5 overflow-hidden tabular-nums" aria-hidden="true">
              <AnimatePresence mode="popLayout" :initial="false" :custom="direction">
                <motion.span
                  v-for="digit in digits"
                  :key="digit.key"
                  class="inline-block"
                  :variants="roll"
                  initial="enter"
                  animate="center"
                  exit="exit"
                  :transition="snap"
                >{{ digit.d }}</motion.span>
              </AnimatePresence>
            </span>
            <span class="text-muted-foreground">{{ props.noun }}</span>
            <span class="sr-only" aria-live="polite">{{ props.count }} {{ props.noun }}</span>
          </span>

          <AnimatePresence mode="popLayout" :initial="false">
            <motion.div
              v-if="revealed && !confirming"
              key="actions"
              class="flex items-center gap-1 border-l pl-1.5"
              :initial="{ opacity: 0, x: reduced ? 0 : -8, filter: reduced ? 'blur(0px)' : 'blur(4px)' }"
              :animate="{ opacity: 1, x: 0, filter: 'blur(0px)' }"
              :exit="{ opacity: 0, filter: reduced ? 'blur(0px)' : 'blur(4px)', transition: { duration: 0.12 } }"
              :transition="grow"
            >
              <button
                v-for="action in props.actions"
                :key="action.id"
                type="button"
                :data-key="`a:${action.id}`"
                :tabindex="tab(`a:${action.id}`)"
                :disabled="action.disabled"
                :class="cn(
                  button,
                  action.destructive
                    ? 'text-destructive hover:bg-destructive/10'
                    : 'text-foreground hover:bg-accent',
                )"
                @focus="focusKey = `a:${action.id}`"
                @click="run(action)"
              >
                <component :is="action.icon" v-if="action.icon" aria-hidden="true" />
                <span :class="action.icon && 'max-sm:sr-only'">{{ action.label }}</span>
              </button>
            </motion.div>

            <motion.div
              v-else-if="confirming"
              key="confirm"
              class="flex items-center gap-1 border-l pl-3 max-sm:border-l-0 max-sm:pl-1.5"
              :initial="{ opacity: 0, y: reduced ? 0 : 10, filter: reduced ? 'blur(0px)' : 'blur(4px)' }"
              :animate="{ opacity: 1, y: 0, filter: 'blur(0px)' }"
              :exit="{ opacity: 0, y: reduced ? 0 : -10, filter: reduced ? 'blur(0px)' : 'blur(4px)', transition: { duration: 0.12 } }"
              :transition="grow"
            >
              <span class="mr-2 text-sm font-medium" role="alert">{{ question(confirming) }}</span>
              <button
                type="button"
                data-key="c:cancel"
                :tabindex="tab('c:cancel')"
                :class="cn(button, 'text-foreground hover:bg-accent')"
                @focus="focusKey = 'c:cancel'"
                @click="cancel"
              >
                Cancel
              </button>
              <button
                type="button"
                data-key="c:confirm"
                :tabindex="tab('c:confirm')"
                :class="cn(button, confirming.destructive ? 'bg-destructive text-white hover:bg-destructive/90' : 'bg-primary text-primary-foreground hover:bg-primary/90')"
                @focus="focusKey = 'c:confirm'"
                @click="confirm"
              >
                <component :is="confirming.icon" v-if="confirming.icon" aria-hidden="true" />
                {{ confirming.confirmLabel ?? confirming.label }}
              </button>
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  </AnimatePresence>
</template>
