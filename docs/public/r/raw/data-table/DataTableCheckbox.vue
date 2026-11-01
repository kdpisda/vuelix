<script setup lang="ts">
import { motion } from 'motion-v'
import { cn } from '@/lib/utils'

const props = defineProps<{
  checked: boolean | 'mixed'
  label: string
  reduced?: boolean
  disabled?: boolean
}>()

const emit = defineEmits<{ toggle: [] }>()

const pop = { type: 'spring', stiffness: 600, damping: 22 } as const
</script>

<template>
  <button
    type="button"
    role="checkbox"
    :aria-checked="props.checked"
    :aria-label="props.label"
    :disabled="props.disabled"
    class="group/check relative flex size-6 items-center justify-center rounded-md outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-40"
    @click.stop="emit('toggle')"
  >
    <motion.span
      aria-hidden="true"
      :class="cn(
        'flex size-4 items-center justify-center rounded-[5px] border transition-colors duration-150',
        props.checked ? 'border-primary bg-primary text-primary-foreground' : 'border-input bg-background group-hover/check:border-ring',
      )"
      :while-press="props.reduced ? undefined : { scale: 0.82 }"
      :transition="pop"
    >
      <svg class="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
        <motion.path
          v-if="props.checked === 'mixed'"
          d="M6 12h12"
          :initial="{ pathLength: 0 }"
          :animate="{ pathLength: 1 }"
          :transition="props.reduced ? { duration: 0 } : { duration: 0.18 }"
        />
        <motion.path
          v-else
          d="M5 12.5 10 17.5 19 7"
          :initial="false"
          :animate="{ pathLength: props.checked ? 1 : 0, opacity: props.checked ? 1 : 0 }"
          :transition="props.reduced ? { duration: 0 } : { duration: 0.22, ease: 'easeOut' }"
        />
      </svg>
    </motion.span>
  </button>
</template>
