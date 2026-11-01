<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { AnimatePresence, motion, useDomRef } from 'motion-v'
import { computed, nextTick, onBeforeUnmount, ref, useId, watch } from 'vue'
import { cn } from '@/lib/utils'

export interface ComboboxOption {
  value: string
  label: string
  /** Secondary text shown on the right of the option. */
  hint?: string
  disabled?: boolean
}

const props = withDefaults(defineProps<{
  options: ComboboxOption[]
  placeholder?: string
  /** Text shown when the query matches nothing. */
  emptyText?: string
  /** Accessible name when there is no visible `<label for>`. */
  ariaLabel?: string
  /** Renders a hidden input so the value is submitted with a form. */
  name?: string
  id?: string
  disabled?: boolean
  /** Custom matcher. Defaults to a case-insensitive substring match on the label. */
  filter?: (option: ComboboxOption, query: string) => boolean
  class?: HTMLAttributes['class']
}>(), {
  placeholder: 'Search…',
  emptyText: 'No results',
})

const model = defineModel<string>()
const emit = defineEmits<{ change: [value: string] }>()

const uid = useId()
const inputId = computed(() => props.id ?? `vx-combobox-${uid}`)
const listId = `vx-combobox-list-${uid}`
const optionId = (value: string) => `vx-combobox-opt-${uid}-${value.replace(/[^\w-]/g, '_')}`

const input = ref<HTMLInputElement>()
const root = ref<HTMLElement>()
const open = ref(false)
const query = ref('')
/** Only filter once the user has actually typed since opening. */
const typed = ref(false)
const activeValue = ref<string>()

const popSpring = { type: 'spring', stiffness: 520, damping: 34 } as const
const itemSpring = { type: 'spring', stiffness: 600, damping: 42 } as const

const selected = computed(() => props.options.find(o => o.value === model.value))

const results = computed(() => {
  const q = query.value.trim()
  if (!typed.value || !q)
    return props.options
  const match = props.filter ?? ((o: ComboboxOption, s: string) => o.label.toLowerCase().includes(s.toLowerCase()))
  return props.options.filter(o => match(o, q))
})

/** Split a label into [before, match, after] for highlighting. */
function parts(label: string) {
  const q = query.value.trim()
  const i = typed.value && q ? label.toLowerCase().indexOf(q.toLowerCase()) : -1
  if (i === -1)
    return [label, '', '']
  return [label.slice(0, i), label.slice(i, i + q.length), label.slice(i + q.length)]
}

function syncInputToSelection() {
  query.value = selected.value?.label ?? ''
  typed.value = false
}
watch(selected, syncInputToSelection, { immediate: true })

function firstEnabled() {
  return results.value.find(o => !o.disabled)?.value
}

function show() {
  if (props.disabled || open.value)
    return
  activeValue.value = selected.value && !selected.value.disabled ? selected.value.value : firstEnabled()
  open.value = true
}

function hide() {
  open.value = false
  syncInputToSelection()
}

function choose(option?: ComboboxOption) {
  if (!option || option.disabled)
    return
  if (option.value !== model.value) {
    model.value = option.value
    emit('change', option.value)
  }
  open.value = false
  syncInputToSelection()
}

function onInput(e: Event) {
  query.value = (e.target as HTMLInputElement).value
  typed.value = true
  if (!open.value)
    show()
  activeValue.value = firstEnabled()
}

function move(delta: number) {
  const enabled = results.value.filter(o => !o.disabled)
  if (!enabled.length)
    return
  const pos = enabled.findIndex(o => o.value === activeValue.value)
  let next: number
  if (!Number.isFinite(delta))
    next = delta > 0 ? enabled.length - 1 : 0
  else if (pos === -1)
    next = delta > 0 ? 0 : enabled.length - 1
  else
    next = (pos + delta + enabled.length) % enabled.length
  activeValue.value = enabled[next]!.value
}

function onKeydown(e: KeyboardEvent) {
  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault()
      if (!open.value)
        show()
      else move(1)
      break
    case 'ArrowUp':
      e.preventDefault()
      if (!open.value)
        show()
      else move(-1)
      break
    case 'Home':
    case 'End':
      if (open.value) {
        e.preventDefault()
        move(e.key === 'Home' ? -Infinity : Infinity)
      }
      break
    case 'Enter':
      if (open.value) {
        e.preventDefault()
        choose(results.value.find(o => o.value === activeValue.value))
      }
      break
    case 'Escape':
      if (open.value) {
        e.preventDefault()
        hide()
      }
      else if (query.value) {
        e.preventDefault()
        query.value = ''
        typed.value = true
      }
      break
    case 'Tab':
      if (open.value)
        hide()
      break
  }
}

function onFocusOut(e: FocusEvent) {
  if (!root.value?.contains(e.relatedTarget as Node | null))
    hide()
}

function toggle() {
  if (open.value) {
    hide()
  }
  else {
    input.value?.focus()
    show()
  }
}

// Measure the list so its wrapper can spring to the new height as results change.
const listEl = useDomRef()
const listHeight = ref<number | 'auto'>('auto')
let observer: ResizeObserver | undefined
watch(listEl, (el) => {
  observer?.disconnect()
  if (!(el instanceof HTMLElement) || typeof ResizeObserver === 'undefined')
    return
  listHeight.value = 'auto'
  observer = new ResizeObserver(() => (listHeight.value = el.offsetHeight))
  observer.observe(el)
})
onBeforeUnmount(() => observer?.disconnect())

watch(activeValue, async (v) => {
  if (!open.value || v === undefined)
    return
  await nextTick()
  root.value?.querySelector<HTMLElement>(`#${CSS.escape(optionId(v))}`)?.scrollIntoView({ block: 'nearest' })
})
</script>

<template>
  <div ref="root" :class="cn('relative w-full', props.class)" @focusout="onFocusOut">
    <input v-if="props.name" type="hidden" :name="props.name" :value="model ?? ''">
    <div class="relative">
      <svg class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
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
        :aria-activedescendant="open && activeValue !== undefined && results.some(o => o.value === activeValue) ? optionId(activeValue) : undefined"
        :value="query"
        :placeholder="props.placeholder"
        :disabled="props.disabled"
        :class="cn(
          'h-10 w-full rounded-lg border bg-background pl-9 pr-9 text-sm text-foreground shadow-xs outline-none transition-[color,box-shadow,border-color] placeholder:text-muted-foreground hover:border-ring/60 focus:border-ring focus:ring-[3px] focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50',
        )"
        @input="onInput"
        @keydown="onKeydown"
        @click="show"
      >
      <button
        type="button"
        tabindex="-1"
        :aria-label="open ? 'Hide options' : 'Show options'"
        :disabled="props.disabled"
        class="absolute right-1.5 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none"
        @mousedown.prevent
        @click="toggle"
      >
        <motion.svg
          class="size-4"
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
      </button>
    </div>
    <!-- Announces the result count while typing. -->
    <span class="sr-only" aria-live="polite">{{ open && typed ? (results.length ? `${results.length} result${results.length === 1 ? '' : 's'}` : props.emptyText) : '' }}</span>

    <AnimatePresence>
      <motion.div
        v-if="open"
        key="popover"
        class="absolute inset-x-0 top-full z-50 mt-2 origin-top overflow-hidden rounded-xl border bg-popover text-popover-foreground shadow-lg"
        :initial="{ opacity: 0, scale: 0.96, y: -6 }"
        :animate="{ opacity: 1, scale: 1, y: 0 }"
        :exit="{ opacity: 0, scale: 0.97, y: -4, transition: { duration: 0.12 } }"
        :transition="popSpring"
        @mousedown.prevent
      >
        <!-- Springs to the list's measured height so the popover grows/shrinks with the results. -->
        <motion.div
          class="overflow-hidden"
          :initial="false"
          :animate="{ height: listHeight }"
          :transition="itemSpring"
        >
          <motion.ul
            :id="listId"
            ref="listEl"
            layout-scroll
            role="listbox"
            :aria-labelledby="props.ariaLabel ? undefined : inputId"
            :aria-label="props.ariaLabel"
            class="relative m-0 max-h-64 list-none overflow-y-auto overflow-x-hidden p-1"
          >
            <AnimatePresence mode="popLayout" :initial="false">
              <motion.li
                v-for="option in results"
                :id="optionId(option.value)"
                :key="option.value"
                layout="position"
                role="option"
                :aria-selected="option.value === model"
                :aria-disabled="option.disabled || undefined"
                :class="cn(
                  'flex cursor-default select-none items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition-colors',
                  option.value === activeValue ? 'bg-accent text-accent-foreground' : 'text-popover-foreground',
                  option.disabled && 'pointer-events-none opacity-40',
                )"
                :initial="{ opacity: 0, x: -8, filter: 'blur(2px)' }"
                :animate="{ opacity: 1, x: 0, filter: 'blur(0px)' }"
                :exit="{ opacity: 0, scale: 0.96, transition: { duration: 0.12 } }"
                :transition="itemSpring"
                @pointermove="!option.disabled && (activeValue = option.value)"
                @click="choose(option)"
              >
                <svg
                  class="size-4 shrink-0"
                  :class="option.value === model ? 'opacity-100' : 'opacity-0'"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                ><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
                <span class="min-w-0 flex-1 truncate">
                  <slot name="option" :option="option" :query="query">
                    <template v-for="(part, k) in parts(option.label)" :key="k">
                      <mark v-if="k === 1 && part" class="rounded-[3px] bg-brand/25 px-px text-inherit">{{ part }}</mark>
                      <template v-else>{{ part }}</template>
                    </template>
                  </slot>
                </span>
                <span v-if="option.hint" class="shrink-0 text-xs text-muted-foreground">{{ option.hint }}</span>
              </motion.li>
              <motion.li
                v-if="!results.length"
                key="__empty"
                role="presentation"
                class="px-2.5 py-6 text-center text-sm text-muted-foreground"
                :initial="{ opacity: 0, y: 4 }"
                :animate="{ opacity: 1, y: 0 }"
                :exit="{ opacity: 0, transition: { duration: 0.1 } }"
                :transition="itemSpring"
              >
                <slot name="empty" :query="query">
                  {{ props.emptyText }} for “{{ query.trim() }}”
                </slot>
              </motion.li>
            </AnimatePresence>
          </motion.ul>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  </div>
</template>
