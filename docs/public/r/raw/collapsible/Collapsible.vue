<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { AnimatePresence, motion, useReducedMotion } from 'motion-v'
import { computed, useId } from 'vue'
import { cn } from '@/lib/utils'

const props = withDefaults(defineProps<{
  /** Trigger text. Use the `#trigger` slot for richer content. */
  title?: string
  /** Prevents toggling. */
  disabled?: boolean
  class?: HTMLAttributes['class']
  /** Classes for the trigger button. */
  triggerClass?: HTMLAttributes['class']
  /** Classes for the content wrapper. */
  contentClass?: HTMLAttributes['class']
}>(), {
  disabled: false,
})

const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ toggle: [open: boolean] }>()

const uid = useId()
const reduced = useReducedMotion()

// A soft, slightly underdamped spring so the height settles with a little life.
const spring = { type: 'spring', stiffness: 300, damping: 28, mass: 0.9 } as const
const transition = computed(() => (reduced.value ? { duration: 0 } : spring))

function toggle(value = !open.value) {
  if (props.disabled || value === open.value)
    return
  open.value = value
  emit('toggle', value)
}

defineExpose({
  /** Toggle, or force a state with `toggle(true)` / `toggle(false)`. */
  toggle,
  show: () => toggle(true),
  hide: () => toggle(false),
})
</script>

<template>
  <div
    :class="cn('w-full overflow-hidden rounded-xl border bg-card text-card-foreground', props.class)"
    :data-state="open ? 'open' : 'closed'"
  >
    <button
      :id="`${uid}-trigger`"
      type="button"
      :class="cn(
        'flex w-full items-center justify-between gap-4 rounded-[inherit] px-4 py-3 text-left text-sm font-medium outline-none transition-colors hover:bg-muted/50 focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50',
        props.triggerClass,
      )"
      :aria-expanded="open"
      :aria-controls="`${uid}-content`"
      :disabled="props.disabled"
      @click="toggle()"
    >
      <span class="min-w-0 flex-1">
        <slot name="trigger" :open="open">{{ props.title }}</slot>
      </span>
      <motion.span
        aria-hidden="true"
        class="flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground"
        :animate="{ rotate: open ? 90 : 0 }"
        :transition="transition"
      >
        <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6" /></svg>
      </motion.span>
    </button>
    <AnimatePresence :initial="false">
      <motion.div
        v-if="open"
        :id="`${uid}-content`"
        key="content"
        role="region"
        :aria-labelledby="`${uid}-trigger`"
        class="overflow-hidden"
        :initial="{ height: 0 }"
        :animate="{ height: 'auto' }"
        :exit="{ height: 0 }"
        :transition="transition"
      >
        <motion.div
          :class="cn('px-4 pb-4 pt-1 text-sm text-muted-foreground', props.contentClass)"
          :initial="{ opacity: 0, filter: 'blur(6px)', scale: 0.98 }"
          :animate="{ opacity: 1, filter: 'blur(0px)', scale: 1 }"
          :exit="{ opacity: 0, filter: 'blur(6px)', scale: 0.98 }"
          :transition="reduced ? { duration: 0 } : { duration: 0.28, ease: [0.22, 1, 0.36, 1] }"
          style="transform-origin: top center"
        >
          <slot :close="() => toggle(false)" />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  </div>
</template>
