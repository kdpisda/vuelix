<script setup lang="ts">
import type { Component, HTMLAttributes } from 'vue'
import { AnimatePresence, motion, useReducedMotion } from 'motion-v'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, useId, watch } from 'vue'
import { cn } from '@/lib/utils'
import { highlightSegments, matchCommand } from './match'

export interface CommandPaletteItem {
  /** Unique id (within its list). */
  id: string
  label: string
  /** Group heading ("Pages", "Actions", "Recent"…). Groups keep the order they first appear in. */
  group?: string
  /** Secondary text shown after the label. */
  hint?: string
  icon?: Component
  /** Keys shown on the right, e.g. `['⌘', 'N']`. */
  shortcut?: string[]
  /** Extra search terms that also match (without highlighting). */
  keywords?: string[]
  disabled?: boolean
  /** Opening this item slides in a nested list instead of selecting it. */
  children?: CommandPaletteItem[]
  /** Search placeholder while this item's nested list is open. */
  placeholder?: string
}

const props = withDefaults(defineProps<{
  items: CommandPaletteItem[]
  placeholder?: string
  /** Key that toggles the palette together with ⌘ / Ctrl. `false` disables the global shortcut. */
  hotkey?: string | false
  /** Close after an item is selected. */
  closeOnSelect?: boolean
  /** Accessible name of the dialog. */
  label?: string
  /** Classes for the palette surface (it is teleported to `<body>`). */
  class?: HTMLAttributes['class']
  /** Classes for the backdrop. */
  overlayClass?: HTMLAttributes['class']
}>(), {
  placeholder: 'Type a command or search…',
  hotkey: 'k',
  closeOnSelect: true,
  label: 'Command palette',
})

const emit = defineEmits<{
  /** A leaf item was chosen. `path` lists the nested pages it was found in. */
  select: [item: CommandPaletteItem, path: CommandPaletteItem[]]
}>()

const open = defineModel<boolean>('open', { default: false })
const query = ref('')
const stack = shallowRef<CommandPaletteItem[]>([])
const direction = ref(1)
const active = ref(0)
const instant = ref(true)

const uid = `vx-cmd-${useId()}`
const reduced = useReducedMotion()
const input = ref<HTMLInputElement>()
let restoreFocus: HTMLElement | null = null

const panelSpring = { type: 'spring', stiffness: 520, damping: 38 } as const
const glide = { type: 'spring', stiffness: 700, damping: 46 } as const
const heightSpring = { type: 'spring', stiffness: 480, damping: 42 } as const

const depth = computed(() => stack.value.length)
const page = computed(() => stack.value.at(-1))
const listboxId = computed(() => `${uid}-list-${depth.value}`)
const optionId = (i: number) => `${uid}-${depth.value}-o-${i}`

interface Row { item: CommandPaletteItem, index: number, indices: number[] }

/** Filtered results grouped by heading, with a flat index for keyboard nav. */
const groups = computed(() => {
  const source = page.value?.children ?? props.items
  const q = query.value.trim()
  const scored = source.flatMap((item) => {
    const hit = matchCommand(q, item.label)
    if (hit)
      return [{ item, ...hit }]
    if (q && item.keywords?.some(k => k.toLowerCase().includes(q.toLowerCase())))
      return [{ item, score: 1, indices: [] as number[] }]
    return []
  })
  const byGroup = new Map<string, typeof scored>()
  for (const s of scored) {
    const key = s.item.group ?? ''
    if (!byGroup.has(key))
      byGroup.set(key, [])
    byGroup.get(key)!.push(s)
  }
  let index = 0
  return [...byGroup].map(([name, list]) => {
    if (q)
      list.sort((a, b) => b.score - a.score)
    const rows: Row[] = list.map(s => ({ item: s.item, indices: s.indices, index: index++ }))
    return { name, rows }
  })
})

const rows = computed(() => groups.value.flatMap(g => g.rows))
const count = computed(() => rows.value.length)

function move(delta: number) {
  const n = count.value
  if (!n)
    return
  let next = active.value
  for (let step = 0; step < n; step++) {
    next = (next + delta + n) % n
    if (!rows.value[next]!.item.disabled)
      break
  }
  instant.value = false
  active.value = next
}

function hover(row: Row) {
  if (row.item.disabled || active.value === row.index)
    return
  instant.value = false
  active.value = row.index
}

/** Keep focus in the input when clicking anywhere else on the panel. */
function onPanelMousedown(e: MouseEvent) {
  if (e.target !== input.value)
    e.preventDefault()
}

function firstEnabled() {
  const i = rows.value.findIndex(r => !r.item.disabled)
  return i === -1 ? 0 : i
}

function activate(item: CommandPaletteItem) {
  if (item.disabled)
    return
  if (item.children) {
    direction.value = 1
    stack.value = [...stack.value, item]
    query.value = ''
    return
  }
  emit('select', item, stack.value)
  if (props.closeOnSelect)
    open.value = false
}

function back() {
  if (!stack.value.length)
    return
  direction.value = -1
  stack.value = stack.value.slice(0, -1)
  query.value = ''
}

function onKeydown(e: KeyboardEvent) {
  if (e.isComposing)
    return
  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault()
      move(1)
      break
    case 'ArrowUp':
      e.preventDefault()
      move(-1)
      break
    case 'Enter': {
      const row = rows.value[active.value]
      if (row) {
        e.preventDefault()
        activate(row.item)
      }
      break
    }
    case 'Escape':
      e.preventDefault()
      e.stopPropagation()
      if (stack.value.length)
        back()
      else
        open.value = false
      break
    case 'Backspace':
      if (!query.value && stack.value.length) {
        e.preventDefault()
        back()
      }
      break
    case 'Tab':
      // The input owns focus while the palette is open.
      e.preventDefault()
      break
  }
}

// ---------------------------------------------------------------------------
// Selection highlight + body height (measured, then sprung)
// ---------------------------------------------------------------------------
const pageEl = ref<HTMLElement | null>(null)
const highlight = ref({ y: 0, height: 0, visible: false })
const bodyHeight = ref<number | 'auto'>('auto')
let observer: ResizeObserver | undefined

function setPageEl(el: unknown) {
  const node = ((el as { $el?: unknown } | null)?.$el ?? el) as HTMLElement | null
  if (!(node instanceof HTMLElement) || node === pageEl.value)
    return
  pageEl.value = node
  observer?.disconnect()
  if (typeof ResizeObserver !== 'undefined') {
    observer = new ResizeObserver(() => (bodyHeight.value = node.offsetHeight))
    observer.observe(node)
  }
}

function syncHighlight() {
  const el = pageEl.value?.querySelector<HTMLElement>(`#${CSS.escape(optionId(active.value))}`)
  if (!el) {
    highlight.value = { ...highlight.value, visible: false }
    return
  }
  highlight.value = { y: el.offsetTop, height: el.offsetHeight, visible: true }
  el.scrollIntoView({ block: 'nearest' })
}

watch([query, stack], () => {
  active.value = firstEnabled()
  instant.value = true
})

watch([active, rows, pageEl], () => nextTick(syncHighlight), { flush: 'post' })

const highlightTransition = computed(() =>
  instant.value || reduced.value ? { duration: 0 } : glide,
)

const pageVariants = {
  enter: (dir: number) => ({ x: reduced.value ? 0 : dir * 56, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: reduced.value ? 0 : dir * -56, opacity: 0 }),
}

// ---------------------------------------------------------------------------
// Open / close, focus, scroll lock, global shortcut
// ---------------------------------------------------------------------------
watch(open, async (isOpen) => {
  if (typeof document === 'undefined')
    return
  if (isOpen) {
    restoreFocus = document.activeElement as HTMLElement | null
    query.value = ''
    stack.value = []
    active.value = firstEnabled()
    instant.value = true
    bodyHeight.value = 'auto'
    document.documentElement.style.overflow = 'hidden'
    await nextTick()
    input.value?.focus()
  }
  else {
    document.documentElement.style.overflow = ''
    observer?.disconnect()
    pageEl.value = null
    restoreFocus?.focus({ preventScroll: true })
    restoreFocus = null
  }
})

function onGlobalKeydown(e: KeyboardEvent) {
  if (!props.hotkey || !(e.metaKey || e.ctrlKey) || e.altKey)
    return
  if (e.key.toLowerCase() !== props.hotkey.toLowerCase())
    return
  e.preventDefault()
  open.value = !open.value
}

onMounted(() => window.addEventListener('keydown', onGlobalKeydown))
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onGlobalKeydown)
  observer?.disconnect()
  if (open.value)
    document.documentElement.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <AnimatePresence>
      <motion.div
        v-if="open"
        key="overlay"
        aria-hidden="true"
        :class="cn('fixed inset-0 z-[90] bg-black/40 backdrop-blur-[2px]', props.overlayClass)"
        :initial="{ opacity: 0 }"
        :animate="{ opacity: 1 }"
        :exit="{ opacity: 0, transition: { duration: 0.15 } }"
        @click="open = false"
      />
    </AnimatePresence>
    <AnimatePresence>
      <motion.div
        v-if="open"
        key="panel"
        role="dialog"
        aria-modal="true"
        :aria-label="props.label"
        :class="cn(
          'fixed inset-x-0 top-[12vh] z-[91] mx-auto flex w-[min(640px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border bg-popover text-popover-foreground shadow-2xl',
          props.class,
        )"
        :initial="{ opacity: 0, scale: reduced ? 1 : 0.96, y: reduced ? 0 : -12 }"
        :animate="{ opacity: 1, scale: 1, y: 0 }"
        :exit="{ opacity: 0, scale: reduced ? 1 : 0.98, transition: { duration: 0.14 } }"
        :transition="panelSpring"
        @keydown="onKeydown"
        @mousedown="onPanelMousedown"
      >
        <!-- Search row -->
        <div class="flex items-center gap-2 border-b px-4">
          <svg class="size-4 shrink-0 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          <AnimatePresence mode="popLayout" :initial="false">
            <motion.button
              v-if="page"
              :key="page.id"
              type="button"
              aria-label="Back"
              class="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs font-medium text-foreground outline-none hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50"
              :initial="{ opacity: 0, scale: 0.8, filter: 'blur(4px)' }"
              :animate="{ opacity: 1, scale: 1, filter: 'blur(0px)' }"
              :exit="{ opacity: 0, scale: 0.8, filter: 'blur(4px)' }"
              :transition="panelSpring"
              @click="back"
            >
              <svg class="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
              {{ page.label }}
            </motion.button>
          </AnimatePresence>
          <input
            ref="input"
            v-model="query"
            type="text"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded="true"
            :aria-controls="listboxId"
            :aria-activedescendant="rows[active] ? optionId(active) : undefined"
            :placeholder="page?.placeholder ?? props.placeholder"
            autocomplete="off"
            autocorrect="off"
            spellcheck="false"
            class="h-14 min-w-0 flex-1 border-0 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground"
          >
          <kbd class="hidden h-5 shrink-0 items-center rounded border bg-muted px-1.5 font-sans text-[11px] text-muted-foreground sm:inline-flex">esc</kbd>
        </div>

        <!-- Results -->
        <motion.div
          class="relative overflow-hidden"
          :initial="false"
          :animate="{ height: bodyHeight }"
          :transition="reduced ? { duration: 0 } : heightSpring"
        >
          <AnimatePresence :initial="false" mode="popLayout" :custom="direction">
            <motion.div
              :id="listboxId"
              :key="`page-${depth}-${page?.id ?? 'root'}`"
              :ref="setPageEl"
              role="listbox"
              :aria-label="page ? page.label : 'Results'"
              class="max-h-[min(22rem,55vh)] w-full scroll-py-2 overflow-y-auto overscroll-contain p-2"
              :variants="pageVariants"
              initial="enter"
              animate="center"
              exit="exit"
              :transition="panelSpring"
            >
              <div class="relative">
                <motion.div
                  aria-hidden="true"
                  class="pointer-events-none absolute inset-x-0 top-0 rounded-lg bg-accent"
                  :initial="false"
                  :animate="{ y: highlight.y, height: highlight.height, opacity: highlight.visible ? 1 : 0 }"
                  :transition="highlightTransition"
                >
                  <span class="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-full bg-brand" />
                </motion.div>

                <div
                  v-for="(group, gi) in groups"
                  :key="group.name || `g${gi}`"
                  role="group"
                  :aria-labelledby="group.name ? `${uid}-${depth}-g${gi}` : undefined"
                >
                  <div
                    v-if="group.name"
                    :id="`${uid}-${depth}-g${gi}`"
                    class="px-3 pb-1.5 pt-2.5 text-xs font-medium text-muted-foreground"
                  >
                    {{ group.name }}
                  </div>
                  <div
                    v-for="row in group.rows"
                    :id="optionId(row.index)"
                    :key="row.item.id"
                    role="option"
                    :aria-selected="row.index === active"
                    :aria-disabled="row.item.disabled || undefined"
                    :class="cn(
                      'relative flex min-h-11 cursor-pointer select-none items-center gap-3 rounded-lg px-3 text-sm transition-colors',
                      row.index === active ? 'text-accent-foreground' : 'text-foreground',
                      row.item.disabled && 'cursor-not-allowed opacity-50',
                    )"
                    @pointermove="hover(row)"
                    @click="activate(row.item)"
                  >
                    <span
                      v-if="row.item.icon"
                      class="flex size-7 shrink-0 items-center justify-center rounded-md border bg-background text-muted-foreground [&_svg]:size-3.5"
                    >
                      <component :is="row.item.icon" aria-hidden="true" />
                    </span>
                    <span class="min-w-0 flex-1 truncate">
                      <template v-for="(seg, si) in highlightSegments(row.item.label, row.indices)" :key="si">
                        <span v-if="seg.match" class="rounded-[3px] bg-brand/20 font-semibold text-foreground">{{ seg.text }}</span>
                        <template v-else>{{ seg.text }}</template>
                      </template>
                      <span v-if="row.item.hint" class="ml-2 text-muted-foreground">{{ row.item.hint }}</span>
                    </span>
                    <span v-if="row.item.shortcut?.length" class="flex shrink-0 items-center gap-1" aria-hidden="true">
                      <kbd
                        v-for="key in row.item.shortcut"
                        :key="key"
                        class="inline-flex h-5 min-w-5 items-center justify-center rounded border bg-muted px-1 font-sans text-[11px] text-muted-foreground"
                      >{{ key }}</kbd>
                    </span>
                    <svg v-else-if="row.item.children" class="size-4 shrink-0 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
                  </div>
                </div>

                <div v-if="!count" class="flex flex-col items-center gap-2 px-6 py-10 text-center">
                  <slot name="empty" :query="query">
                    <span class="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      <svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5M8.5 8.5l5 5M13.5 8.5l-5 5" /></svg>
                    </span>
                    <span class="text-sm font-medium text-foreground">No results for “{{ query }}”</span>
                    <span class="text-xs text-muted-foreground">Try a different keyword or check the spelling.</span>
                  </slot>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>

        <div class="flex items-center justify-between gap-4 border-t bg-muted/40 px-4 py-2 text-xs text-muted-foreground">
          <slot name="footer">
            <span class="flex items-center gap-3">
              <span class="flex items-center gap-1"><kbd class="inline-flex h-5 min-w-5 items-center justify-center rounded border bg-background px-1 font-sans text-[11px]">↑</kbd><kbd class="inline-flex h-5 min-w-5 items-center justify-center rounded border bg-background px-1 font-sans text-[11px]">↓</kbd> navigate</span>
              <span class="flex items-center gap-1"><kbd class="inline-flex h-5 min-w-5 items-center justify-center rounded border bg-background px-1 font-sans text-[11px]">↵</kbd> {{ rows[active]?.item.children ? 'open' : 'select' }}</span>
            </span>
            <span class="flex items-center gap-1">
              <kbd class="inline-flex h-5 items-center justify-center rounded border bg-background px-1 font-sans text-[11px]">{{ page ? '⌫' : 'esc' }}</kbd>
              {{ page ? 'back' : 'close' }}
            </span>
          </slot>
        </div>
        <span class="sr-only" aria-live="polite">{{ count }} {{ count === 1 ? 'result' : 'results' }}</span>
      </motion.div>
    </AnimatePresence>
  </Teleport>
</template>
