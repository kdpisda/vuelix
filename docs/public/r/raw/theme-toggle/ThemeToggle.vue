<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { useDark, useToggle } from '@vueuse/core'
import { AnimatePresence, motion } from 'motion-v'
import { cn } from '@/lib/utils'

const props = withDefaults(defineProps<{
  /** localStorage key; match your framework's key to stay in sync (VitePress: `vitepress-theme-appearance`). */
  storageKey?: string
  class?: HTMLAttributes['class']
}>(), {
  storageKey: 'vuelix-color-scheme',
})

const isDark = useDark({ storageKey: props.storageKey })
const toggle = useToggle(isDark)

const spring = { type: 'spring', stiffness: 380, damping: 22 } as const
</script>

<template>
  <motion.button
    type="button"
    :aria-label="isDark ? 'Switch to light theme' : 'Switch to dark theme'"
    :class="cn(
      'relative inline-flex size-10 items-center justify-center overflow-hidden rounded-full border bg-background text-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
      props.class,
    )"
    :while-press="{ scale: 0.9 }"
    :transition="spring"
    @click="toggle()"
  >
    <AnimatePresence mode="popLayout" :initial="false">
      <motion.svg
        v-if="isDark"
        key="moon"
        class="size-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
        :initial="{ y: 24, rotate: -90, opacity: 0 }"
        :animate="{ y: 0, rotate: 0, opacity: 1 }"
        :exit="{ y: -24, rotate: 90, opacity: 0 }"
        :transition="spring"
      >
        <path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401" />
      </motion.svg>
      <motion.svg
        v-else
        key="sun"
        class="size-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
        :initial="{ y: 24, rotate: 90, opacity: 0 }"
        :animate="{ y: 0, rotate: 0, opacity: 1 }"
        :exit="{ y: -24, rotate: -90, opacity: 0 }"
        :transition="spring"
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
      </motion.svg>
    </AnimatePresence>
  </motion.button>
</template>
