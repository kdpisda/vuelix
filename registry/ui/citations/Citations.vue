<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { CitationSource } from './context'
import { motion } from 'motion-v'
import { computed, provide, ref, toRef, useId } from 'vue'
import { cn } from '@/lib/utils'
import CitationChip from './CitationChip.vue'
import { CITATIONS_KEY, sourceDomain } from './context'
import SourceIcon from './SourceIcon.vue'

const props = withDefaults(defineProps<{
  sources: CitationSource[]
  /** Text with `[1]`-style markers. Ignored when the default slot is used. */
  text?: string
  /** Don't render the sources list. */
  hideSources?: boolean
  /** Heading of the sources list. */
  sourcesLabel?: string
  class?: HTMLAttributes['class']
}>(), {
  text: '',
  hideSources: false,
  sourcesLabel: 'Sources',
})

const uid = `vx-cite-${useId()}`
const active = ref<number | null>(null)
provide(CITATIONS_KEY, { sources: toRef(props, 'sources'), active, uid })

// "Prices rose 4% [1][3]." → text, chip 1, chip 3, text
const parts = computed(() =>
  props.text.split(/(\[\d+\])/).filter(Boolean).map((part) => {
    const m = /^\[(\d+)\]$/.exec(part)
    return m && Number(m[1]) <= props.sources.length ? { n: Number(m[1]) } : { text: part }
  }),
)

const spring = { type: 'spring', stiffness: 500, damping: 38 } as const
</script>

<template>
  <div :class="cn('flex flex-col gap-4', props.class)">
    <div class="text-sm leading-7 text-foreground/90">
      <slot>
        <p class="m-0">
          <template v-for="(part, i) in parts" :key="i">
            <CitationChip v-if="'n' in part" :n="part.n!" />
            <template v-else>
              {{ part.text }}
            </template>
          </template>
        </p>
      </slot>
    </div>

    <section v-if="!props.hideSources && props.sources.length" :aria-labelledby="`${uid}-heading`">
      <h4 :id="`${uid}-heading`" class="m-0 mb-1.5 text-xs font-medium text-muted-foreground">
        {{ props.sourcesLabel }}
      </h4>
      <ol class="m-0 grid list-none gap-1 p-0 sm:grid-cols-2" @pointerleave="active = null">
        <li v-for="(source, i) in props.sources" :key="i" class="relative min-w-0">
          <motion.span
            v-if="active === i + 1"
            :layout-id="`${uid}-highlight`"
            aria-hidden="true"
            class="absolute inset-0 rounded-lg bg-muted ring-1 ring-border"
            :transition="spring"
          />
          <component
            :is="source.url ? 'a' : 'div'"
            :href="source.url"
            :target="source.url ? '_blank' : undefined"
            :rel="source.url ? 'noopener noreferrer' : undefined"
            class="relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-foreground no-underline outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
            @pointerenter="active = i + 1"
            @focus="active = i + 1"
            @blur="active = null"
          >
            <span class="w-3 shrink-0 text-center text-[11px] font-semibold tabular-nums text-muted-foreground">{{ i + 1 }}</span>
            <SourceIcon :source="source" :n="i + 1" />
            <span class="flex min-w-0 flex-1 flex-col">
              <span class="truncate text-[13px] font-medium leading-5 text-foreground">{{ source.title }}</span>
              <span class="truncate text-xs leading-4 text-muted-foreground">{{ sourceDomain(source) }}</span>
            </span>
          </component>
        </li>
      </ol>
    </section>
  </div>
</template>
