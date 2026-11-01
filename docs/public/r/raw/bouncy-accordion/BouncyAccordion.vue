<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { AnimatePresence, motion } from 'motion-v'
import { useId } from 'vue'
import { cn } from '@/lib/utils'

export interface BouncyAccordionItem {
  value: string
  title: string
  content?: string
}

const props = withDefaults(defineProps<{
  items: BouncyAccordionItem[]
  /** Allow several panels open at once. */
  multiple?: boolean
  class?: HTMLAttributes['class']
}>(), {
  multiple: false,
})

const open = defineModel<string[]>({ default: () => [] })
const uid = useId()

function toggle(value: string) {
  const isOpen = open.value.includes(value)
  if (props.multiple)
    open.value = isOpen ? open.value.filter(v => v !== value) : [...open.value, value]
  else
    open.value = isOpen ? [] : [value]
}

const bounce = { type: 'spring', stiffness: 380, damping: 22, mass: 0.8 } as const
</script>

<template>
  <div :class="cn('flex w-full flex-col gap-2', props.class)">
    <motion.div
      v-for="item in props.items"
      :key="item.value"
      layout
      :transition="bounce"
      :class="cn(
        'overflow-hidden rounded-xl border bg-card text-card-foreground transition-shadow',
        open.includes(item.value) && 'shadow-md',
      )"
    >
      <h3 class="m-0 text-base">
        <button
          :id="`${uid}-${item.value}-trigger`"
          type="button"
          class="flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left text-sm font-medium outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          :aria-expanded="open.includes(item.value)"
          :aria-controls="`${uid}-${item.value}-panel`"
          @click="toggle(item.value)"
        >
          <slot name="title" :item="item">{{ item.title }}</slot>
          <motion.svg
            class="size-4 shrink-0 text-muted-foreground"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
            :animate="{ rotate: open.includes(item.value) ? 180 : 0 }"
            :transition="bounce"
          >
            <path d="m6 9 6 6 6-6" />
          </motion.svg>
        </button>
      </h3>
      <AnimatePresence :initial="false">
        <motion.div
          v-if="open.includes(item.value)"
          :id="`${uid}-${item.value}-panel`"
          role="region"
          :aria-labelledby="`${uid}-${item.value}-trigger`"
          :initial="{ height: 0, opacity: 0 }"
          :animate="{ height: 'auto', opacity: 1 }"
          :exit="{ height: 0, opacity: 0 }"
          :transition="bounce"
        >
          <motion.div
            class="px-4 pb-4 text-sm text-muted-foreground"
            :initial="{ y: -8, filter: 'blur(4px)' }"
            :animate="{ y: 0, filter: 'blur(0px)' }"
            :exit="{ y: -8, filter: 'blur(4px)' }"
            :transition="bounce"
          >
            <slot name="content" :item="item">{{ item.content }}</slot>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  </div>
</template>
