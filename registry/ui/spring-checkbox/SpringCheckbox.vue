<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { AnimatePresence, motion } from 'motion-v'
import { computed, ref, useId, useSlots } from 'vue'
import { cn } from '@/lib/utils'

const props = withDefaults(defineProps<{
  /** Shows a dash instead of a check (e.g. a "select all" with some items checked). Cleared on click. */
  indeterminate?: boolean
  disabled?: boolean
  /** Renders a hidden input (submitted only while checked). */
  name?: string
  /** Value submitted with the form while checked. */
  value?: string
  id?: string
  class?: HTMLAttributes['class']
}>(), {
  value: 'on',
})

const checked = defineModel<boolean>({ default: false })
const emit = defineEmits<{ 'update:indeterminate': [value: boolean] }>()
const slots = useSlots()

const uid = useId()
const boxId = computed(() => props.id ?? `vx-checkbox-${uid}`)
const pressed = ref(false)

const state = computed(() => (props.indeterminate ? 'mixed' : checked.value))
const on = computed(() => props.indeterminate || checked.value)

const squish = { type: 'spring', stiffness: 600, damping: 18 } as const
const draw = { type: 'spring', stiffness: 260, damping: 26, delay: 0.04 } as const

function toggle() {
  if (props.disabled)
    return
  // Indeterminate resolves to checked, like a native checkbox.
  checked.value = props.indeterminate ? true : !checked.value
  if (props.indeterminate)
    emit('update:indeterminate', false)
}
</script>

<template>
  <label
    :for="boxId"
    :class="cn(
      'group inline-flex select-none items-center gap-2.5 text-sm',
      props.disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
      props.class,
    )"
    @pointerdown="pressed = !props.disabled"
    @pointerup="pressed = false"
    @pointerleave="pressed = false"
  >
    <input v-if="props.name && checked" type="hidden" :name="props.name" :value="props.value">
    <motion.button
      :id="boxId"
      type="button"
      role="checkbox"
      :aria-checked="state"
      :disabled="props.disabled"
      :class="cn(
        'relative flex size-5 shrink-0 items-center justify-center rounded-[6px] border shadow-xs outline-none transition-colors duration-150 focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed',
        on ? 'border-primary bg-primary text-primary-foreground' : 'border-input bg-background group-hover:border-ring/70',
      )"
      :animate="pressed ? { scaleX: 1.12, scaleY: 0.82 } : { scaleX: 1, scaleY: 1 }"
      :transition="squish"
      @click="toggle"
    >
      <svg class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <AnimatePresence :initial="false">
          <motion.path
            v-if="props.indeterminate"
            key="dash"
            d="M6 12h12"
            :initial="{ pathLength: 0, opacity: 0 }"
            :animate="{ pathLength: 1, opacity: 1 }"
            :exit="{ pathLength: 0, opacity: 0, transition: { duration: 0.1 } }"
            :transition="draw"
          />
          <motion.path
            v-else-if="checked"
            key="check"
            d="M5 12.5l4.5 4.5L19 7.5"
            :initial="{ pathLength: 0, opacity: 0 }"
            :animate="{ pathLength: 1, opacity: 1 }"
            :exit="{ pathLength: 0, opacity: 0, transition: { duration: 0.1 } }"
            :transition="draw"
          />
        </AnimatePresence>
      </svg>
    </motion.button>
    <span v-if="slots.default" class="leading-5">
      <slot />
    </span>
  </label>
</template>
