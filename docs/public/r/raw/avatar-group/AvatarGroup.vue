<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { AnimatePresence, motion } from 'motion-v'
import { computed, ref } from 'vue'
import { cn } from '@/lib/utils'

export interface AvatarGroupItem {
  name: string
  src?: string
}

const props = withDefaults(defineProps<{
  items: AvatarGroupItem[]
  /** Avatars shown before collapsing into a "+N" bubble. */
  max?: number
  size?: number
  class?: HTMLAttributes['class']
}>(), {
  max: 5,
  size: 40,
})

const hovered = ref(false)
const active = ref<number | null>(null)

const shown = computed(() => props.items.slice(0, props.max))
const rest = computed(() => props.items.length - shown.value.length)

const overlap = computed(() => -props.size * 0.3)

function initials(name: string) {
  return name.split(/\s+/).map(p => p[0]).join('').slice(0, 2).toUpperCase()
}

const spring = { type: 'spring', stiffness: 400, damping: 26 } as const
</script>

<template>
  <div
    :class="cn('flex items-center', props.class)"
    role="group"
    :aria-label="`${props.items.length} people`"
    @pointerenter="hovered = true"
    @pointerleave="hovered = false; active = null"
  >
    <motion.div
      v-for="(item, i) in shown"
      :key="item.name + i"
      class="relative"
      :style="{ zIndex: active === i ? 50 : shown.length - i }"
      :animate="{
        marginLeft: i === 0 ? 0 : hovered ? 4 : overlap,
        y: active === i ? -4 : 0,
        scale: active === i ? 1.12 : 1,
      }"
      :transition="spring"
      @pointerenter="active = i"
      @focusin="active = i"
      @focusout="active = null"
    >
      <span
        tabindex="0"
        :aria-label="item.name"
        class="flex items-center justify-center overflow-hidden rounded-full bg-muted text-xs font-semibold text-muted-foreground outline-none ring-2 ring-background focus-visible:ring-ring"
        :style="{ width: `${props.size}px`, height: `${props.size}px` }"
      >
        <img v-if="item.src" :src="item.src" :alt="item.name" class="size-full object-cover" draggable="false">
        <template v-else>{{ initials(item.name) }}</template>
      </span>
      <AnimatePresence>
        <motion.span
          v-if="active === i"
          role="tooltip"
          class="pointer-events-none absolute -top-9 left-1/2 whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-xs font-medium text-background shadow-md"
          :initial="{ opacity: 0, y: 8, x: '-50%', scale: 0.8, rotate: -6 }"
          :animate="{ opacity: 1, y: 0, x: '-50%', scale: 1, rotate: 0 }"
          :exit="{ opacity: 0, y: 4, x: '-50%', scale: 0.9 }"
          :transition="spring"
        >
          {{ item.name }}
        </motion.span>
      </AnimatePresence>
    </motion.div>
    <motion.span
      v-if="rest > 0"
      class="relative flex items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground ring-2 ring-background"
      :style="{ width: `${props.size}px`, height: `${props.size}px`, zIndex: 0 }"
      :animate="{ marginLeft: hovered ? 4 : overlap }"
      :transition="spring"
    >
      +{{ rest }}
    </motion.span>
  </div>
</template>
