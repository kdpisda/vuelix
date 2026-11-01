<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { AnimatePresence, motion } from 'motion-v'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'
import { cn } from '@/lib/utils'

export interface MultiSelectOption {
  value: string
  label: string
  disabled?: boolean
}

const props = withDefaults(defineProps<{
  options: MultiSelectOption[]
  placeholder?: string
  /** Maximum number of selections. */
  max?: number
  /** Accessible name when there is no visible `<label for>`. */
  ariaLabel?: string
  /** Renders one hidden input per selected value so they are submitted with a form. */
  name?: string
  id?: string
  disabled?: boolean
  class?: HTMLAttributes['class']
}>(), {
  placeholder: 'Select…',
})

const model = defineModel<string[]>({ default: () => [] })

const uid = useId()
const inputId = computed(() => props.id ?? `vx-multi-${uid}`)
const listId = `vx-multi-list-${uid}`
const optionId = (i: number) => `vx-multi-opt-${uid}-${i}`

const root = ref<HTMLElement>()
const input = ref<HTMLInputElement>()
const open = ref(false)
const query = ref('')
const active = ref(-1)

const popSpring = { type: 'spring', stiffness: 520, damping: 34 } as const
const chipSpring = { type: 'spring', stiffness: 560, damping: 32 } as const

const selectedOptions = computed(() =>
  model.value.map(v => props.options.find(o => o.value === v) ?? { value: v, label: v }),
)
const atMax = computed(() => props.max !== undefined && model.value.length >= props.max)

/** Indexes into `options` that match the current query. */
const visible = computed(() => {
  const q = query.value.trim().toLowerCase()
  return props.options.flatMap((o, i) => (!q || o.label.toLowerCase().includes(q) ? [i] : []))
})

const isSelected = (value: string) => model.value.includes(value)
const isBlocked = (o: MultiSelectOption) => !!o.disabled || (atMax.value && !isSelected(o.value))

function show() {
  if (props.disabled || open.value)
    return
  active.value = visible.value.find(i => !isBlocked(props.options[i]!)) ?? -1
  open.value = true
}

function hide() {
  open.value = false
  query.value = ''
}

function toggle(index: number) {
  const option = props.options[index]
  if (!option || isBlocked(option))
    return
  model.value = isSelected(option.value)
    ? model.value.filter(v => v !== option.value)
    : [...model.value, option.value]
  active.value = index
  // A finished search makes way for the next one.
  query.value = ''
}

function remove(value: string) {
  model.value = model.value.filter(v => v !== value)
  input.value?.focus()
}

function move(delta: number) {
  const enabled = visible.value.filter(i => !isBlocked(props.options[i]!))
  if (!enabled.length)
    return
  const pos = enabled.indexOf(active.value)
  let next: number
  if (!Number.isFinite(delta))
    next = delta > 0 ? enabled.length - 1 : 0
  else if (pos === -1)
    next = delta > 0 ? 0 : enabled.length - 1
  else
    next = (pos + delta + enabled.length) % enabled.length
  active.value = enabled[next]!
}

function onKeydown(e: KeyboardEvent) {
  switch (e.key) {
    case 'ArrowDown':
    case 'ArrowUp':
      e.preventDefault()
      if (!open.value)
        show()
      else move(e.key === 'ArrowDown' ? 1 : -1)
      break
    case 'Home':
    case 'End':
      if (open.value && !query.value) {
        e.preventDefault()
        move(e.key === 'Home' ? -Infinity : Infinity)
      }
      break
    case 'Enter':
      if (open.value && active.value >= 0) {
        e.preventDefault()
        toggle(active.value)
      }
      else if (!open.value) {
        e.preventDefault()
        show()
      }
      break
    case 'Backspace':
      if (!query.value && model.value.length) {
        e.preventDefault()
        model.value = model.value.slice(0, -1)
      }
      break
    case 'Escape':
      if (open.value) {
        e.preventDefault()
        hide()
      }
      break
    case 'Tab':
      hide()
      break
  }
}

function onInput(e: Event) {
  query.value = (e.target as HTMLInputElement).value
  if (!open.value)
    show()
  active.value = visible.value.find(i => !isBlocked(props.options[i]!)) ?? -1
}

function onFieldPointerDown(e: PointerEvent) {
  if (props.disabled)
    return
  // Clicking anywhere on the field focuses the input and toggles the list.
  if (e.target !== input.value)
    e.preventDefault()
  input.value?.focus()
  if (open.value && e.target !== input.value)
    hide()
  else
    show()
}

watch(active, async (i) => {
  if (!open.value || i < 0)
    return
  await nextTick()
  root.value?.querySelector<HTMLElement>(`#${CSS.escape(optionId(i))}`)?.scrollIntoView({ block: 'nearest' })
})

function onPointerDownOutside(e: PointerEvent) {
  if (open.value && root.value && !root.value.contains(e.target as Node))
    hide()
}
onMounted(() => document.addEventListener('pointerdown', onPointerDownOutside))
onBeforeUnmount(() => document.removeEventListener('pointerdown', onPointerDownOutside))
</script>

<template>
  <div ref="root" :class="cn('relative w-full', props.class)">
    <template v-if="props.name">
      <input v-for="v in model" :key="v" type="hidden" :name="props.name" :value="v">
    </template>
    <div
      :class="cn(
        'relative flex min-h-10 w-full cursor-text flex-wrap items-center gap-1.5 rounded-lg border bg-background py-1.5 pl-1.5 pr-9 text-sm shadow-xs transition-[color,box-shadow,border-color]',
        open ? 'border-ring ring-[3px] ring-ring/30' : 'hover:border-ring/60 has-[input:focus-visible]:border-ring has-[input:focus-visible]:ring-[3px] has-[input:focus-visible]:ring-ring/50',
        props.disabled && 'pointer-events-none opacity-50',
      )"
      @pointerdown="onFieldPointerDown"
    >
      <AnimatePresence mode="popLayout" :initial="false">
        <motion.span
          v-for="option in selectedOptions"
          :key="option.value"
          layout
          class="inline-flex h-7 items-center gap-1 rounded-md bg-secondary pl-2 pr-1 text-xs font-medium text-secondary-foreground"
          :initial="{ opacity: 0, scale: 0.5 }"
          :animate="{ opacity: 1, scale: 1 }"
          :exit="{ opacity: 0, scale: 0.5, transition: { duration: 0.14 } }"
          :transition="chipSpring"
        >
          {{ option.label }}
          <button
            type="button"
            tabindex="-1"
            :aria-label="`Remove ${option.label}`"
            class="flex size-5 items-center justify-center rounded text-muted-foreground outline-none transition-colors hover:bg-background hover:text-foreground"
            @pointerdown.stop.prevent
            @click.stop="remove(option.value)"
          >
            <svg class="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </motion.span>
      </AnimatePresence>
      <motion.div layout class="flex min-w-24 flex-1" :transition="chipSpring">
        <input
          :id="inputId"
          ref="input"
          type="text"
          role="combobox"
          autocomplete="off"
          spellcheck="false"
          aria-autocomplete="list"
          :aria-label="props.ariaLabel"
          :aria-expanded="open"
          :aria-controls="listId"
          :aria-activedescendant="open && active >= 0 && visible.includes(active) ? optionId(active) : undefined"
          :value="query"
          :placeholder="model.length ? '' : props.placeholder"
          :disabled="props.disabled"
          class="h-7 w-full min-w-0 bg-transparent px-1.5 text-sm text-foreground outline-none placeholder:text-muted-foreground"
          @input="onInput"
          @keydown="onKeydown"
        >
      </motion.div>
      <motion.svg
        class="pointer-events-none absolute right-3 top-5 -mt-2 size-4 text-muted-foreground"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
        :initial="false"
        :animate="{ rotate: open ? 180 : 0 }"
        :transition="popSpring"
      >
        <path d="m6 9 6 6 6-6" />
      </motion.svg>
    </div>

    <AnimatePresence>
      <motion.ul
        v-if="open"
        :id="listId"
        key="list"
        role="listbox"
        aria-multiselectable="true"
        :aria-labelledby="props.ariaLabel ? undefined : inputId"
        :aria-label="props.ariaLabel"
        class="absolute inset-x-0 top-full z-50 m-0 mt-2 max-h-64 origin-top list-none overflow-y-auto rounded-xl border bg-popover p-1 text-popover-foreground shadow-lg"
        :initial="{ opacity: 0, scale: 0.96, y: -6 }"
        :animate="{ opacity: 1, scale: 1, y: 0 }"
        :exit="{ opacity: 0, scale: 0.97, y: -4, transition: { duration: 0.12 } }"
        :transition="popSpring"
        @mousedown.prevent
      >
        <li
          v-for="i in visible"
          :id="optionId(i)"
          :key="props.options[i]!.value"
          role="option"
          :aria-selected="isSelected(props.options[i]!.value)"
          :aria-disabled="isBlocked(props.options[i]!) || undefined"
          :class="cn(
            'flex cursor-default select-none items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors',
            i === active ? 'bg-accent text-accent-foreground' : 'text-popover-foreground',
            isBlocked(props.options[i]!) && 'pointer-events-none opacity-40',
          )"
          @pointermove="!isBlocked(props.options[i]!) && (active = i)"
          @click="toggle(i)"
        >
          <span
            aria-hidden="true"
            :class="cn(
              'flex size-4 shrink-0 items-center justify-center rounded-[5px] border transition-colors duration-150',
              isSelected(props.options[i]!.value) ? 'border-primary bg-primary text-primary-foreground' : 'border-input bg-background',
            )"
          >
            <svg class="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
              <motion.path
                d="M5 12.5l4.5 4.5L19 7.5"
                :initial="false"
                :animate="{ pathLength: isSelected(props.options[i]!.value) ? 1 : 0, opacity: isSelected(props.options[i]!.value) ? 1 : 0 }"
                :transition="{ duration: 0.22, ease: 'easeOut' }"
              />
            </svg>
          </span>
          <span class="truncate">
            <slot name="option" :option="props.options[i]!" :selected="isSelected(props.options[i]!.value)">
              {{ props.options[i]!.label }}
            </slot>
          </span>
        </li>
        <li v-if="!visible.length" role="presentation" class="px-2.5 py-6 text-center text-sm text-muted-foreground">
          No matches
        </li>
      </motion.ul>
    </AnimatePresence>
  </div>
</template>
