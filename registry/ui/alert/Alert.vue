<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { AlertVariants } from '.'
import { AnimatePresence, motion, useReducedMotion } from 'motion-v'
import { computed, onMounted, ref } from 'vue'
import { cn } from '@/lib/utils'
import { alertVariants } from '.'

const props = withDefaults(defineProps<{
  /** Tone of the alert — also picks the icon and the ARIA role. */
  variant?: NonNullable<AlertVariants['variant']>
  /** Bold first line. Use the `title` slot for rich content. */
  title?: string
  /** Show a close button that collapses the alert. */
  dismissible?: boolean
  /** Accessible label of the close button. */
  dismissLabel?: string
  /** Render the animated icon. */
  icon?: boolean
  class?: HTMLAttributes['class']
}>(), {
  variant: 'info',
  dismissible: false,
  dismissLabel: 'Dismiss',
  icon: true,
})

const emit = defineEmits<{ dismiss: [] }>()
const open = defineModel<boolean>('open', { default: true })

const reduced = useReducedMotion()

// Skip the height animation on first render (no layout shift on page load),
// but animate it when the alert is re-opened later.
const mounted = ref(false)
onMounted(() => (mounted.value = true))

// Errors and warnings interrupt, info and success are announced politely.
const role = computed(() => (props.variant === 'error' || props.variant === 'warning' ? 'alert' : 'status'))

const pop = { type: 'spring', stiffness: 520, damping: 22, mass: 0.7 } as const
const ease = [0.32, 0.72, 0, 1] as const

const draw = computed(() => reduced.value
  ? { initial: false as const, transition: { duration: 0 } }
  : { initial: { pathLength: 0, opacity: 0 }, transition: { pathLength: { duration: 0.45, ease, delay: 0.18 }, opacity: { duration: 0.1, delay: 0.18 } } })

function dismiss() {
  open.value = false
  emit('dismiss')
}
</script>

<template>
  <AnimatePresence>
    <motion.div
      v-if="open"
      key="alert"
      :class="cn('overflow-hidden', props.class)"
      :initial="mounted && !reduced ? { height: 0, opacity: 0 } : false"
      :animate="{ height: 'auto', opacity: 1, transition: { height: { duration: 0.32, ease }, opacity: { duration: 0.2, delay: 0.08 } } }"
      :exit="reduced
        ? { opacity: 0, transition: { duration: 0.15 } }
        : { height: 0, opacity: 0, marginTop: 0, marginBottom: 0, transition: { height: { duration: 0.3, ease, delay: 0.06 }, marginTop: { duration: 0.3, ease, delay: 0.06 }, marginBottom: { duration: 0.3, ease, delay: 0.06 }, opacity: { duration: 0.16 } } }"
    >
      <div :role="role" :class="alertVariants({ variant: props.variant })">
        <motion.span
          v-if="props.icon"
          aria-hidden="true"
          class="mt-px inline-flex shrink-0 text-(--vx-alert-accent)"
          :initial="reduced ? false : { scale: 0.4, rotate: -25, opacity: 0 }"
          :animate="{ scale: 1, rotate: 0, opacity: 1 }"
          :transition="pop"
        >
          <slot name="icon">
            <svg class="size-[1.15rem]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path v-if="props.variant === 'warning'" d="M10.3 4.2 2.6 17.6A2 2 0 0 0 4.3 20.6h15.4a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0Z" />
              <circle v-else cx="12" cy="12" r="9.25" />
              <!-- the glyph draws itself in after the shape pops -->
              <motion.path
                v-if="props.variant === 'success'"
                d="m8 12.4 2.8 2.8L16.2 9.6"
                :initial="draw.initial"
                :animate="{ pathLength: 1, opacity: 1 }"
                :transition="draw.transition"
              />
              <motion.path
                v-else-if="props.variant === 'error'"
                d="m15 9-6 6M9 9l6 6"
                :initial="draw.initial"
                :animate="{ pathLength: 1, opacity: 1 }"
                :transition="draw.transition"
              />
              <motion.path
                v-else-if="props.variant === 'warning'"
                d="M12 9.5v4"
                :initial="draw.initial"
                :animate="{ pathLength: 1, opacity: 1 }"
                :transition="draw.transition"
              />
              <motion.path
                v-else
                d="M12 16.5v-5"
                :initial="draw.initial"
                :animate="{ pathLength: 1, opacity: 1 }"
                :transition="draw.transition"
              />
              <motion.circle
                v-if="props.variant === 'warning' || props.variant === 'info'"
                :cx="12"
                :cy="props.variant === 'warning' ? 17 : 8"
                r="0.6"
                fill="currentColor"
                :initial="reduced ? false : { scale: 0 }"
                :animate="{ scale: 1 }"
                :transition="{ ...pop, delay: 0.4 }"
              />
            </svg>
          </slot>
        </motion.span>

        <motion.div
          class="min-w-0 flex-1"
          :initial="reduced ? false : { opacity: 0, x: -8 }"
          :animate="{ opacity: 1, x: 0 }"
          :transition="{ type: 'spring', stiffness: 300, damping: 28, delay: 0.06 }"
        >
          <p v-if="props.title || $slots.title" class="m-0 font-medium leading-5">
            <slot name="title">
              {{ props.title }}
            </slot>
          </p>
          <div v-if="$slots.default" :class="cn('leading-5 text-muted-foreground', (props.title || $slots.title) && 'mt-1')">
            <slot />
          </div>
          <div v-if="$slots.actions" class="mt-3 flex flex-wrap items-center gap-2">
            <slot name="actions" />
          </div>
        </motion.div>

        <button
          v-if="props.dismissible"
          type="button"
          class="-mr-1.5 -mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-foreground/5 hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
          :aria-label="props.dismissLabel"
          @click="dismiss"
        >
          <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
        </button>
      </div>
    </motion.div>
  </AnimatePresence>
</template>
