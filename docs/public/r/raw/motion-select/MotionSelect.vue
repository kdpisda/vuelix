<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { AnimatePresence, motion } from 'motion-v'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'
import { cn } from '@/lib/utils'

export interface MotionSelectOption {
  value: string
  label: string
  disabled?: boolean
}

const props = withDefaults(defineProps<{
  options: MotionSelectOption[]
  /** Shown in the trigger while nothing is selected. */
  placeholder?: string
  /** Accessible name when there is no visible `<label for>`. */
  ariaLabel?: string
  /** Renders a hidden input so the value is submitted with a form. */
  name?: string
  id?: string
  disabled?: boolean
  class?: HTMLAttributes['class']
}>(), {
  placeholder: 'Select an option',
})

const model = defineModel<string>()
const emit = defineEmits<{ change: [value: string] }>()

const uid = useId()
const triggerId = computed(() => props.id ?? `vx-select-${uid}`)
const listId = `vx-select-list-${uid}`
const highlightId = `vx-select-hl-${uid}`
const optionId = (i: number) => `vx-select-opt-${uid}-${i}`

const root = ref<HTMLElement>()
const open = ref(false)
const active = ref(-1)

const popSpring = { type: 'spring', stiffness: 520, damping: 34 } as const
const glideSpring = { type: 'spring', stiffness: 600, damping: 40 } as const

const selectedIndex = computed(() => props.options.findIndex(o => o.value === model.value))
const selected = computed(() => props.options[selectedIndex.value])

function enabledIndexes() {
  return props.options.flatMap((o, i) => (o.disabled ? [] : [i]))
}

function show(at?: 'first' | 'last') {
  if (props.disabled || open.value)
    return
  const enabled = enabledIndexes()
  if (at === 'first')
    active.value = enabled[0] ?? -1
  else if (at === 'last')
    active.value = enabled.at(-1) ?? -1
  else
    active.value = selectedIndex.value >= 0 ? selectedIndex.value : (enabled[0] ?? -1)
  open.value = true
}

function hide() {
  open.value = false
}

function choose(index: number) {
  const option = props.options[index]
  if (!option || option.disabled)
    return
  if (option.value !== model.value) {
    model.value = option.value
    emit('change', option.value)
  }
  hide()
}

function move(delta: number) {
  const enabled = enabledIndexes()
  if (!enabled.length)
    return
  if (!Number.isFinite(delta)) {
    active.value = delta > 0 ? enabled.at(-1)! : enabled[0]!
    return
  }
  const pos = enabled.indexOf(active.value)
  const next = pos === -1
    ? (delta > 0 ? enabled[0] : enabled.at(-1))
    : enabled[Math.min(Math.max(pos + delta, 0), enabled.length - 1)]
  active.value = next!
}

// Typeahead: typing letters jumps to the next option starting with them.
let query = ''
let queryTimer: ReturnType<typeof setTimeout> | undefined
function typeahead(char: string) {
  clearTimeout(queryTimer)
  queryTimer = setTimeout(() => (query = ''), 600)
  query += char.toLowerCase()
  const repeated = query.length > 1 && [...query].every(c => c === query[0])
  const needle = repeated ? query[0]! : query
  const n = props.options.length
  const start = active.value + (repeated || query.length === 1 ? 1 : 0)
  for (let k = 0; k < n; k++) {
    const i = (Math.max(start, 0) + k) % n
    const o = props.options[i]!
    if (!o.disabled && o.label.toLowerCase().startsWith(needle)) {
      active.value = i
      return
    }
  }
}

function onKeydown(e: KeyboardEvent) {
  if (props.disabled)
    return
  const { key } = e
  if (!open.value) {
    if (key === 'ArrowDown' || key === 'Enter' || key === ' ') {
      e.preventDefault()
      show()
    }
    else if (key === 'ArrowUp') {
      e.preventDefault()
      show()
    }
    else if (key === 'Home' || key === 'End') {
      e.preventDefault()
      show(key === 'Home' ? 'first' : 'last')
    }
    else if (key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      show()
      typeahead(key)
    }
    return
  }
  switch (key) {
    case 'ArrowDown': e.preventDefault(); move(1); break
    case 'ArrowUp': e.preventDefault(); move(-1); break
    case 'Home': e.preventDefault(); move(-Infinity); break
    case 'End': e.preventDefault(); move(Infinity); break
    case 'PageDown': e.preventDefault(); move(10); break
    case 'PageUp': e.preventDefault(); move(-10); break
    case 'Enter':
    case ' ':
      e.preventDefault()
      if (key === ' ' && query)
        typeahead(key)
      else
        choose(active.value)
      break
    case 'Escape': e.preventDefault(); hide(); break
    case 'Tab': hide(); break
    default:
      if (key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey)
        typeahead(key)
  }
}

// Keep the highlighted option in view while navigating with the keyboard.
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
onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onPointerDownOutside)
  clearTimeout(queryTimer)
})
</script>

<template>
  <div ref="root" :class="cn('relative w-full', props.class)">
    <input v-if="props.name" type="hidden" :name="props.name" :value="model ?? ''">
    <button
      :id="triggerId"
      type="button"
      role="combobox"
      aria-haspopup="listbox"
      :aria-label="props.ariaLabel"
      :aria-expanded="open"
      :aria-controls="listId"
      :aria-activedescendant="open && active >= 0 ? optionId(active) : undefined"
      :disabled="props.disabled"
      :class="cn(
        'flex h-10 w-full items-center justify-between gap-2 rounded-lg border bg-background px-3 text-left text-sm shadow-xs outline-none transition-[color,box-shadow,border-color] hover:border-ring/60 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50',
        open && 'border-ring ring-[3px] ring-ring/30',
      )"
      @click="open ? hide() : show()"
      @keydown="onKeydown"
    >
      <span :class="cn('truncate', !selected && 'text-muted-foreground')">
        <slot name="value" :option="selected">{{ selected?.label ?? props.placeholder }}</slot>
      </span>
      <motion.svg
        class="size-4 shrink-0 text-muted-foreground"
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

    <AnimatePresence>
      <motion.ul
        v-if="open"
        :id="listId"
        key="list"
        role="listbox"
        tabindex="-1"
        :aria-labelledby="triggerId"
        class="absolute inset-x-0 top-full z-50 m-0 mt-2 max-h-64 origin-top list-none overflow-y-auto rounded-xl border bg-popover p-1 text-popover-foreground shadow-lg outline-none"
        :initial="{ opacity: 0, scale: 0.95, y: -6 }"
        :animate="{ opacity: 1, scale: 1, y: 0 }"
        :exit="{ opacity: 0, scale: 0.96, y: -4, transition: { duration: 0.12 } }"
        :transition="popSpring"
        @mousedown.prevent
      >
        <li
          v-for="(option, i) in props.options"
          :id="optionId(i)"
          :key="option.value"
          role="option"
          :aria-selected="option.value === model"
          :aria-disabled="option.disabled || undefined"
          :class="cn(
            'relative isolate flex cursor-default select-none items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-sm transition-colors',
            i === active ? 'text-accent-foreground' : 'text-popover-foreground',
            option.disabled && 'pointer-events-none opacity-40',
          )"
          @pointermove="!option.disabled && (active = i)"
          @click="choose(i)"
        >
          <motion.span
            v-if="i === active"
            :layout-id="highlightId"
            aria-hidden="true"
            class="absolute inset-0 -z-10 rounded-lg bg-accent"
            :transition="glideSpring"
          />
          <span class="truncate">
            <slot name="option" :option="option" :selected="option.value === model" :active="i === active">
              {{ option.label }}
            </slot>
          </span>
          <svg
            v-if="option.value === model"
            class="size-4 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <motion.path
              d="M5 12.5l4.5 4.5L19 7.5"
              :initial="{ pathLength: 0 }"
              :animate="{ pathLength: 1 }"
              :transition="{ duration: 0.3, delay: 0.08, ease: 'easeOut' }"
            />
          </svg>
        </li>
      </motion.ul>
    </AnimatePresence>
  </div>
</template>
