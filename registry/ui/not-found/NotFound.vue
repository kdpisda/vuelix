<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { motion, useMotionValue, useReducedMotion } from 'motion-v'
import { computed, ref, useId } from 'vue'
import { cn } from '@/lib/utils'
import NotFoundDigit from './NotFoundDigit.vue'

export interface NotFoundLink {
  label: string
  href: string
}

const props = withDefaults(defineProps<{
  /** The big code. Each character becomes a springy, draggable glyph. */
  code?: string
  title?: string
  description?: string
  /** Links back into the site; the first one is the primary action. */
  links?: NotFoundLink[]
  /** Show the search field. */
  search?: boolean
  searchPlaceholder?: string
  /** Show a "Go back" button that calls `history.back()`. */
  back?: boolean
  /** Heading level of the title (use 2 when the page already has an h1). */
  headingLevel?: 1 | 2 | 3
  class?: HTMLAttributes['class']
}>(), {
  code: '404',
  title: 'This page wandered off',
  description: 'The link may be broken, or the page may have moved. Try searching, or head back somewhere familiar.',
  links: () => [{ label: 'Back to home', href: '/' }],
  search: true,
  searchPlaceholder: 'Search the site…',
  back: true,
  headingLevel: 1,
})

const emit = defineEmits<{ search: [query: string] }>()

const uid = useId()
const reduced = useReducedMotion()
const query = ref('')
const chars = computed(() => [...props.code])
const accentIndex = computed(() => Math.floor((chars.value.length - 1) / 2))

// Pointer position relative to the section, shared with every glyph.
const px = useMotionValue(Number.POSITIVE_INFINITY)
const py = useMotionValue(Number.POSITIVE_INFINITY)
function onMove(e: PointerEvent) {
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  px.set(e.clientX - rect.left)
  py.set(e.clientY - rect.top)
}
function onLeave() {
  px.set(Number.POSITIVE_INFINITY)
  py.set(Number.POSITIVE_INFINITY)
}

function submit() {
  const q = query.value.trim()
  if (q)
    emit('search', q)
}
function goBack() {
  if (typeof window !== 'undefined')
    window.history.back()
}

const enter = (i: number) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { type: 'spring', stiffness: 260, damping: 26, delay: reduced.value ? 0 : 0.15 + i * 0.07 },
})
</script>

<template>
  <section
    data-vx-nf-root
    :class="cn('relative flex w-full flex-col items-center px-4 py-10 text-center', props.class)"
    :aria-labelledby="`${uid}-title`"
    @pointermove="onMove"
    @pointerleave="onLeave"
  >
    <div
      aria-hidden="true"
      class="flex select-none items-center justify-center text-[clamp(6rem,24vw,11rem)] font-black leading-none tracking-tighter"
    >
      <NotFoundDigit
        v-for="(c, i) in chars"
        :key="`${i}-${c}`"
        :char="c"
        :index="i"
        :px="px"
        :py="py"
        :accent="i === accentIndex"
      />
    </div>

    <motion.div v-bind="enter(0)" class="mt-6">
      <component :is="`h${props.headingLevel}`" :id="`${uid}-title`" class="m-0 text-2xl font-semibold tracking-tight sm:text-3xl">
        <span class="sr-only">Error {{ props.code }}: </span>{{ props.title }}
      </component>
    </motion.div>
    <motion.p v-bind="enter(1)" class="m-0 mt-2 max-w-md text-sm leading-6 text-muted-foreground">
      {{ props.description }}
    </motion.p>

    <motion.form
      v-if="props.search"
      v-bind="enter(2)"
      role="search"
      class="mt-6 flex w-full max-w-sm items-center gap-2"
      @submit.prevent="submit"
    >
      <label :for="`${uid}-q`" class="sr-only">Search</label>
      <div class="relative flex-1">
        <svg class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
        <input
          :id="`${uid}-q`"
          v-model="query"
          type="search"
          :placeholder="props.searchPlaceholder"
          class="h-10 w-full rounded-lg border bg-background pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
      </div>
      <button
        type="submit"
        class="h-10 shrink-0 rounded-lg border bg-background px-3.5 text-sm font-medium outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        Search
      </button>
    </motion.form>

    <motion.nav v-bind="enter(3)" aria-label="Helpful links" class="mt-5 flex flex-wrap items-center justify-center gap-2">
      <a
        v-for="(link, i) in props.links"
        :key="link.href"
        :href="link.href"
        :class="cn(
          'inline-flex h-9 items-center rounded-lg px-3.5 text-sm font-medium no-underline outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50',
          i === 0 ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'text-foreground hover:bg-muted',
        )"
      >{{ link.label }}</a>
      <button
        v-if="props.back"
        type="button"
        class="inline-flex h-9 items-center gap-1.5 rounded-lg px-3.5 text-sm font-medium text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
        @click="goBack"
      >
        <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m12 19-7-7 7-7M19 12H5" /></svg>
        Go back
      </button>
      <slot name="actions" />
    </motion.nav>

    <p class="m-0 mt-8 text-xs text-muted-foreground/70 motion-reduce:hidden" aria-hidden="true">
      Psst — the numbers don't like being poked. Try dragging one.
    </p>
  </section>
</template>
