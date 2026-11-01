<script setup lang="ts">
import type { Component, HTMLAttributes } from 'vue'
import { AnimatePresence, motion, useReducedMotion } from 'motion-v'
import { computed, nextTick, onBeforeUnmount, ref, useId, watch } from 'vue'
import { cn } from '@/lib/utils'

export interface ModelPickerOption {
  value: string
  name: string
  description?: string
  /** `fast`, `reasoning` and `vision` get an icon; any other string shows as plain text. */
  badges?: string[]
  /** Icon component shown next to the name. */
  icon?: Component
  disabled?: boolean
}

const props = withDefaults(defineProps<{
  models: ModelPickerOption[]
  placeholder?: string
  /** Accessible name of the list. */
  label?: string
  /** Open below or above the trigger (above suits a composer at the bottom of the screen). */
  side?: 'bottom' | 'top'
  align?: 'start' | 'end'
  disabled?: boolean
  class?: HTMLAttributes['class']
}>(), {
  placeholder: 'Select a model',
  label: 'Model',
  side: 'bottom',
  align: 'start',
  disabled: false,
})

const model = defineModel<string>()

const reduced = useReducedMotion()
const uid = useId()
const listId = `vx-model-${uid}`
const optionId = (i: number) => `${listId}-${i}`

const root = ref<HTMLElement>()
const trigger = ref<HTMLButtonElement>()
const list = ref<HTMLElement>()
const open = ref(false)
const highlight = ref(-1)

const selectedIndex = computed(() => props.models.findIndex(m => m.value === model.value))
const selected = computed(() => props.models[selectedIndex.value])

function enabledIndexes() {
  return props.models.map((m, i) => (m.disabled ? -1 : i)).filter(i => i !== -1)
}

function show(at?: 'first' | 'last') {
  if (props.disabled)
    return
  const enabled = enabledIndexes()
  highlight.value = at === 'first' ? enabled[0]! : at === 'last' ? enabled.at(-1)! : selectedIndex.value >= 0 ? selectedIndex.value : (enabled[0] ?? -1)
  open.value = true
  nextTick(() => list.value?.focus())
}

function hide(refocus = true) {
  open.value = false
  if (refocus)
    nextTick(() => trigger.value?.focus())
}

let closeTimer: ReturnType<typeof setTimeout> | undefined
function choose(i: number) {
  const option = props.models[i]
  if (!option || option.disabled)
    return
  highlight.value = i
  model.value = option.value
  // Let the check mark glide to its new row before the menu closes.
  clearTimeout(closeTimer)
  closeTimer = setTimeout(hide, reduced.value ? 0 : 220)
}

function move(delta: number) {
  const enabled = enabledIndexes()
  if (!enabled.length)
    return
  const pos = enabled.indexOf(highlight.value)
  highlight.value = enabled[(pos + delta + enabled.length) % enabled.length]!
}

// Typeahead: typing "cl" jumps to the first model whose name starts with it.
let typed = ''
let typedTimer: ReturnType<typeof setTimeout> | undefined
function typeahead(char: string) {
  typed += char.toLowerCase()
  clearTimeout(typedTimer)
  typedTimer = setTimeout(() => (typed = ''), 600)
  const hit = props.models.findIndex(m => !m.disabled && m.name.toLowerCase().startsWith(typed))
  if (hit !== -1)
    highlight.value = hit
}

function onTriggerKeydown(e: KeyboardEvent) {
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault()
    show(e.key === 'ArrowUp' ? 'last' : undefined)
  }
}

function onListKeydown(e: KeyboardEvent) {
  const keys: Record<string, () => void> = {
    ArrowDown: () => move(1),
    ArrowUp: () => move(-1),
    Home: () => (highlight.value = enabledIndexes()[0] ?? -1),
    End: () => (highlight.value = enabledIndexes().at(-1) ?? -1),
    Enter: () => choose(highlight.value),
    ' ': () => (typed ? typeahead(' ') : choose(highlight.value)),
    Escape: () => hide(),
  }
  if (keys[e.key]) {
    e.preventDefault()
    keys[e.key]!()
  }
  else if (e.key === 'Tab') {
    hide(false)
  }
  else if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
    typeahead(e.key)
  }
}

watch(highlight, (i) => {
  nextTick(() => document.getElementById(optionId(i))?.scrollIntoView({ block: 'nearest' }))
})

function onPointerDownOutside(e: PointerEvent) {
  if (!root.value?.contains(e.target as Node))
    hide(false)
}
watch(open, (isOpen) => {
  if (typeof document === 'undefined')
    return
  if (isOpen)
    document.addEventListener('pointerdown', onPointerDownOutside)
  else
    document.removeEventListener('pointerdown', onPointerDownOutside)
})
onBeforeUnmount(() => {
  clearTimeout(closeTimer)
  clearTimeout(typedTimer)
  if (typeof document !== 'undefined')
    document.removeEventListener('pointerdown', onPointerDownOutside)
})

const badgeMeta: Record<string, { label: string, tone: string, paths: string[] }> = {
  fast: { label: 'Fast', tone: 'text-chart-4', paths: ['M13 2 4 14h7l-1 8 9-12h-7Z'] },
  reasoning: { label: 'Reasoning', tone: 'text-chart-3', paths: ['M9 18h6M10 21h4', 'M12 3a6 6 0 0 0-3.5 10.9c.6.4.9 1 .9 1.7V16h5.2v-.4c0-.7.3-1.3.9-1.7A6 6 0 0 0 12 3Z'] },
  vision: { label: 'Vision', tone: 'text-chart-2', paths: ['M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z', 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z'] },
}

const spring = { type: 'spring', stiffness: 520, damping: 36 } as const
// Springs overshoot; a blur that overshoots past 0 is an invalid filter, so blur eases instead.
const enter = { ...spring, filter: { duration: 0.2, ease: 'easeOut' } } as const
const enterY = computed(() => (props.side === 'top' ? 6 : -6))
</script>

<template>
  <div ref="root" :class="cn('relative inline-block', props.class)">
    <button
      ref="trigger"
      type="button"
      aria-haspopup="listbox"
      :aria-expanded="open"
      :aria-controls="open ? listId : undefined"
      :aria-label="`${props.label}: ${selected?.name ?? props.placeholder}`"
      :disabled="props.disabled"
      class="inline-flex h-9 max-w-full items-center gap-2 rounded-lg border bg-background pl-2 pr-2.5 text-sm font-medium text-foreground outline-none transition-colors hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"
      @click="open ? hide() : show()"
      @keydown="onTriggerKeydown"
    >
      <span class="flex size-5 shrink-0 items-center justify-center rounded-md bg-muted text-foreground" aria-hidden="true">
        <component :is="selected.icon" v-if="selected?.icon" class="size-3.5" />
        <svg v-else class="size-3.5 text-brand" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.5c.5 4.8 2.7 7 7.5 7.5-4.8.5-7 2.7-7.5 7.5-.5-4.8-2.7-7-7.5-7.5 4.8-.5 7-2.7 7.5-7.5Z" /></svg>
      </span>
      <span class="relative inline-flex min-w-0 overflow-hidden">
        <AnimatePresence mode="popLayout" :initial="false">
          <motion.span
            :key="selected?.value ?? 'none'"
            :class="cn('truncate', !selected && 'text-muted-foreground')"
            :initial="{ opacity: 0, y: 8, filter: 'blur(3px)' }"
            :animate="{ opacity: 1, y: 0, filter: 'blur(0px)' }"
            :exit="{ opacity: 0, y: -8, filter: 'blur(3px)' }"
            :transition="enter"
          >
            {{ selected?.name ?? props.placeholder }}
          </motion.span>
        </AnimatePresence>
      </span>
      <motion.svg
        class="size-3.5 shrink-0 text-muted-foreground"
        viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"
        :animate="{ rotate: open ? 180 : 0 }"
        :transition="spring"
      >
        <path d="m6 9 6 6 6-6" />
      </motion.svg>
    </button>

    <AnimatePresence>
      <motion.div
        v-if="open"
        key="menu"
        :class="cn(
          'absolute z-50 w-96 max-w-[calc(100vw-2rem)] rounded-xl border bg-popover p-1.5 text-popover-foreground shadow-xl',
          props.side === 'top' ? 'bottom-full mb-2 origin-bottom' : 'top-full mt-2 origin-top',
          props.align === 'end' ? 'right-0' : 'left-0',
        )"
        :initial="{ opacity: 0, scale: 0.96, y: enterY, filter: 'blur(4px)' }"
        :animate="{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }"
        :exit="{ opacity: 0, scale: 0.97, y: enterY, filter: 'blur(2px)', transition: { duration: 0.12 } }"
        :transition="enter"
      >
        <ul
          :id="listId"
          ref="list"
          role="listbox"
          tabindex="-1"
          :aria-label="props.label"
          :aria-activedescendant="highlight >= 0 ? optionId(highlight) : undefined"
          class="m-0 flex max-h-96 list-none flex-col gap-0.5 overflow-y-auto p-0 outline-none"
          @keydown="onListKeydown"
        >
          <li
            v-for="(m, i) in props.models"
            :id="optionId(i)"
            :key="m.value"
            role="option"
            :aria-selected="m.value === model"
            :aria-disabled="m.disabled || undefined"
            :class="cn(
              'relative flex cursor-default select-none items-start gap-3 rounded-lg px-2.5 py-2',
              m.disabled && 'opacity-50',
            )"
            @pointermove="!m.disabled && (highlight = i)"
            @click="choose(i)"
          >
            <motion.span
              v-if="highlight === i"
              :layout-id="`${listId}-highlight`"
              aria-hidden="true"
              class="absolute inset-0 rounded-lg bg-accent"
              :transition="spring"
            />
            <span class="relative mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border bg-background" aria-hidden="true">
              <component :is="m.icon" v-if="m.icon" class="size-3.5" />
              <svg v-else class="size-3 text-muted-foreground" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.5c.5 4.8 2.7 7 7.5 7.5-4.8.5-7 2.7-7.5 7.5-.5-4.8-2.7-7-7.5-7.5 4.8-.5 7-2.7 7.5-7.5Z" /></svg>
            </span>
            <span class="relative flex min-w-0 flex-1 flex-col gap-1">
              <span class="flex flex-wrap items-center gap-1.5">
                <span class="text-sm font-medium leading-5">{{ m.name }}</span>
                <span
                  v-for="b in m.badges"
                  :key="b"
                  class="inline-flex h-[18px] items-center gap-1 rounded-full border bg-background px-1.5 text-[10px] font-medium leading-none text-muted-foreground"
                >
                  <svg v-if="badgeMeta[b]" :class="cn('size-2.5', badgeMeta[b]!.tone)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path v-for="(d, k) in badgeMeta[b]!.paths" :key="k" :d="d" />
                  </svg>
                  {{ badgeMeta[b]?.label ?? b }}
                </span>
              </span>
              <span v-if="m.description" class="text-xs leading-4 text-muted-foreground">{{ m.description }}</span>
            </span>
            <span class="relative mt-0.5 flex size-5 shrink-0 items-center justify-center" aria-hidden="true">
              <motion.svg
                v-if="m.value === model"
                :layout-id="`${listId}-check`"
                class="size-4 text-foreground"
                viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
                :transition="spring"
              >
                <path d="m5 12 5 5 9-10" />
              </motion.svg>
            </span>
          </li>
        </ul>
      </motion.div>
    </AnimatePresence>
  </div>
</template>
