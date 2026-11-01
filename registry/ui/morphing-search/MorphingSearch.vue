<script setup lang="ts">
import type { Component, HTMLAttributes } from 'vue'
import { AnimatePresence, motion, useReducedMotion } from 'motion-v'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'
import { cn } from '@/lib/utils'

export interface MorphingSearchSuggestion {
  value: string
  label: string
  /** Muted text on the right (a category, a count…). */
  hint?: string
  icon?: Component
}

const props = withDefaults(defineProps<{
  /** Recent searches, shown while the query is empty. */
  recent?: string[]
  /** Suggestions, filtered by the query. */
  suggestions?: MorphingSearchSuggestion[]
  placeholder?: string
  /** Accessible name of the collapsed button and the input. */
  label?: string
  /** Which side the field grows from. */
  align?: 'start' | 'end'
  /** Classes for the root (its width is the expanded width). */
  class?: HTMLAttributes['class']
  /** Classes for the suggestions panel. */
  panelClass?: HTMLAttributes['class']
}>(), {
  recent: () => [],
  suggestions: () => [],
  placeholder: 'Search…',
  label: 'Search',
  align: 'start',
})

const emit = defineEmits<{
  /** Enter on the query, or a recent search was picked. */
  submit: [query: string]
  /** A suggestion was picked. */
  select: [item: MorphingSearchSuggestion]
  /** The "Clear" button of the recent list was pressed. */
  clearRecent: []
}>()

const query = defineModel<string>({ default: '' })
const open = defineModel<boolean>('open', { default: false })

const uid = `vx-search-${useId()}`
const reduced = useReducedMotion()
const root = ref<HTMLElement>()
const input = ref<HTMLInputElement>()
const trigger = ref<HTMLButtonElement>()
const fullWidth = ref(0)
const active = ref(-1)

const morph = { type: 'spring', stiffness: 360, damping: 30 } as const
const pop = { type: 'spring', stiffness: 520, damping: 32 } as const

interface Option { id: string, kind: 'recent' | 'suggestion' | 'query', label: string, item?: MorphingSearchSuggestion }

const q = computed(() => query.value.trim())
const groups = computed(() => {
  const out: { name: string, options: Option[] }[] = []
  if (!q.value) {
    if (props.recent.length)
      out.push({ name: 'Recent', options: props.recent.map((label, i) => ({ id: `${uid}-r${i}`, kind: 'recent', label })) })
    if (props.suggestions.length)
      out.push({ name: 'Suggested', options: props.suggestions.map((item, i) => ({ id: `${uid}-s${i}`, kind: 'suggestion', label: item.label, item })) })
    return out
  }
  const needle = q.value.toLowerCase()
  const matches: Option[] = props.suggestions
    .map((item, i) => ({ id: `${uid}-s${i}`, kind: 'suggestion' as const, label: item.label, item }))
    .filter(o => o.label.toLowerCase().includes(needle))
  out.push({ name: '', options: [{ id: `${uid}-q`, kind: 'query', label: q.value }, ...matches] })
  return out
})
const options = computed(() => groups.value.flatMap(g => g.options))
const panelOpen = computed(() => open.value && options.value.length > 0)

function parts(label: string) {
  const at = q.value ? label.toLowerCase().indexOf(q.value.toLowerCase()) : -1
  if (at === -1)
    return [{ text: label, match: false }]
  const end = at + q.value.length
  return [
    { text: label.slice(0, at), match: false },
    { text: label.slice(at, end), match: true },
    { text: label.slice(end), match: false },
  ].filter(p => p.text)
}

function expand() {
  open.value = true
}

function collapse(focusTrigger = false) {
  if (!open.value)
    return
  open.value = false
  if (focusTrigger)
    nextTick(() => trigger.value?.focus())
}

function choose(option: Option) {
  if (option.kind === 'suggestion' && option.item) {
    emit('select', option.item)
  }
  else {
    query.value = option.label
    emit('submit', option.label)
  }
  collapse(true)
}

function onKeydown(e: KeyboardEvent) {
  if (e.isComposing)
    return
  const n = options.value.length
  if (e.key === 'ArrowDown' && n) {
    e.preventDefault()
    active.value = (active.value + 1) % n
  }
  else if (e.key === 'ArrowUp' && n) {
    e.preventDefault()
    active.value = active.value <= 0 ? n - 1 : active.value - 1
  }
  else if (e.key === 'Enter') {
    e.preventDefault()
    const option = options.value[active.value]
    if (option)
      choose(option)
    else if (q.value)
      choose({ id: '', kind: 'query', label: q.value })
  }
  else if (e.key === 'Escape') {
    e.preventDefault()
    e.stopPropagation()
    collapse(true)
  }
}

function clear() {
  query.value = ''
  input.value?.focus()
}

watch(query, () => (active.value = -1))
watch(open, async (isOpen) => {
  active.value = -1
  if (isOpen) {
    await nextTick()
    input.value?.focus()
  }
})

// Collapse when focus or a click lands outside.
function onPointerDown(e: PointerEvent) {
  if (open.value && root.value && !root.value.contains(e.target as Node))
    collapse()
}
function onFocusOut(e: FocusEvent) {
  const next = e.relatedTarget as Node | null
  if (next && root.value && !root.value.contains(next))
    collapse()
}

let observer: ResizeObserver | undefined
onMounted(() => {
  document.addEventListener('pointerdown', onPointerDown)
  const el = root.value!
  fullWidth.value = el.clientWidth
  observer = new ResizeObserver(() => (fullWidth.value = el.clientWidth))
  observer.observe(el)
})
onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onPointerDown)
  observer?.disconnect()
})

const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.035, delayChildren: 0.06 } },
}
const itemVariants = computed(() => ({
  hidden: reduced.value ? { opacity: 0 } : { opacity: 0, y: 8, filter: 'blur(4px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: pop },
}))
</script>

<template>
  <div
    ref="root"
    :class="cn('relative flex w-full max-w-sm', props.align === 'end' ? 'justify-end' : 'justify-start', props.class)"
    @focusout="onFocusOut"
  >
    <motion.div
      :class="cn(
        'relative flex h-10 shrink-0 items-center overflow-hidden border bg-background text-foreground shadow-sm transition-shadow',
        'has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50',
      )"
      :style="{ borderRadius: '20px' }"
      :initial="false"
      :animate="{ width: open ? (fullWidth || '100%') : 40 }"
      :transition="reduced ? { duration: 0 } : morph"
    >
      <svg class="pointer-events-none absolute left-3 size-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
      <button
        v-if="!open"
        ref="trigger"
        type="button"
        :aria-label="props.label"
        aria-expanded="false"
        class="absolute inset-0 cursor-pointer rounded-[inherit] outline-none hover:bg-muted/60"
        @click="expand"
      />
      <AnimatePresence>
        <motion.div
          v-if="open"
          class="absolute inset-0"
          :initial="{ opacity: 0, x: reduced ? 0 : -6 }"
          :animate="{ opacity: 1, x: 0, transition: { delay: 0.08, duration: 0.2 } }"
          :exit="{ opacity: 0, transition: { duration: 0.08 } }"
        >
          <input
            ref="input"
            v-model="query"
            type="search"
            role="combobox"
            aria-autocomplete="list"
            :aria-label="props.label"
            :aria-expanded="panelOpen"
            :aria-controls="`${uid}-list`"
            :aria-activedescendant="options[active]?.id"
            :placeholder="props.placeholder"
            autocomplete="off"
            spellcheck="false"
            class="h-full w-full min-w-0 border-0 bg-transparent pl-10 pr-10 text-sm text-foreground outline-none placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:hidden"
            @keydown="onKeydown"
          >
        </motion.div>
      </AnimatePresence>
      <AnimatePresence>
        <motion.button
          v-if="open && query"
          type="button"
          aria-label="Clear search"
          class="absolute right-2 inline-flex size-6 cursor-pointer items-center justify-center rounded-full bg-muted text-muted-foreground outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
          :initial="{ opacity: 0, scale: 0.5 }"
          :animate="{ opacity: 1, scale: 1 }"
          :exit="{ opacity: 0, scale: 0.5 }"
          :transition="pop"
          @click="clear"
        >
          <svg class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
        </motion.button>
      </AnimatePresence>
    </motion.div>

    <AnimatePresence>
      <motion.div
        v-if="panelOpen"
        :id="`${uid}-list`"
        role="listbox"
        :aria-label="`${props.label} suggestions`"
        :class="cn(
          'absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border bg-popover p-1.5 text-popover-foreground shadow-xl',
          props.panelClass,
        )"
        :initial="{ opacity: 0, y: reduced ? 0 : -6, scale: reduced ? 1 : 0.98 }"
        :animate="{ opacity: 1, y: 0, scale: 1 }"
        :exit="{ opacity: 0, y: reduced ? 0 : -4, scale: reduced ? 1 : 0.98, transition: { duration: 0.12 } }"
        :transition="pop"
        style="transform-origin: top center"
        @mousedown.prevent
      >
        <motion.div
          v-for="(group, gi) in groups"
          :key="group.name || 'results'"
          role="group"
          :aria-labelledby="group.name ? `${uid}-g${gi}` : undefined"
          :variants="listVariants"
          initial="hidden"
          animate="show"
        >
          <div v-if="group.name" class="flex items-center justify-between px-2.5 pb-1 pt-2 text-xs font-medium text-muted-foreground">
            <span :id="`${uid}-g${gi}`">{{ group.name }}</span>
            <button
              v-if="group.name === 'Recent'"
              type="button"
              tabindex="-1"
              class="cursor-pointer rounded px-1 text-xs text-muted-foreground outline-none hover:text-foreground"
              @click="emit('clearRecent')"
            >
              Clear
            </button>
          </div>
          <motion.div
            v-for="option in group.options"
            :id="option.id"
            :key="option.id"
            role="option"
            :aria-selected="options[active]?.id === option.id"
            :variants="itemVariants"
            :class="cn(
              'flex h-9 cursor-pointer select-none items-center gap-2.5 rounded-lg px-2.5 text-sm transition-colors',
              options[active]?.id === option.id ? 'bg-accent text-accent-foreground' : 'text-foreground hover:bg-accent/60',
            )"
            @pointermove="active = options.indexOf(option)"
            @click="choose(option)"
          >
            <span class="flex size-4 shrink-0 items-center justify-center text-muted-foreground [&_svg]:size-4">
              <component :is="option.item.icon" v-if="option.item?.icon" aria-hidden="true" />
              <svg v-else-if="option.kind === 'recent'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
            </span>
            <span class="min-w-0 flex-1 truncate">
              <template v-if="option.kind === 'query'">Search for “<span class="font-semibold">{{ option.label }}</span>”</template>
              <template v-for="(p, pi) in parts(option.label)" v-else :key="pi">
                <span v-if="p.match" class="font-semibold text-foreground">{{ p.text }}</span>
                <template v-else>{{ p.text }}</template>
              </template>
            </span>
            <span v-if="option.item?.hint" class="shrink-0 text-xs text-muted-foreground">{{ option.item.hint }}</span>
            <kbd v-else-if="option.kind === 'query'" class="inline-flex h-5 shrink-0 items-center rounded border bg-muted px-1.5 font-sans text-[11px] text-muted-foreground">↵</kbd>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  </div>
</template>
