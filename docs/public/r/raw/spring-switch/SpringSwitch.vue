<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { motion } from 'motion-v'
import { ref } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{
  disabled?: boolean
  id?: string
  name?: string
  class?: HTMLAttributes['class']
}>()

const checked = defineModel<boolean>({ default: false })
const pressed = ref(false)

const spring = { type: 'spring', stiffness: 700, damping: 32 } as const
</script>

<template>
  <button
    :id="props.id"
    type="button"
    role="switch"
    :aria-checked="checked"
    :disabled="props.disabled"
    :class="cn(
      'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 outline-none transition-colors duration-200 focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50',
      checked ? 'justify-end bg-primary' : 'justify-start bg-input',
      props.class,
    )"
    @click="checked = !checked"
    @pointerdown="pressed = true"
    @pointerup="pressed = false"
    @pointerleave="pressed = false"
  >
    <input v-if="props.name" type="hidden" :name="props.name" :value="checked ? 'on' : 'off'">
    <motion.span
      layout
      aria-hidden="true"
      class="block h-5 rounded-full bg-background shadow-md ring-0"
      :animate="{ width: pressed ? 26 : 20 }"
      :transition="spring"
    />
  </button>
</template>
