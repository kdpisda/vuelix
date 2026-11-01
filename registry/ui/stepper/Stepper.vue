<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { StepperStep } from '.'
import { AnimatePresence, motion, useReducedMotion } from 'motion-v'
import { computed, onMounted, ref } from 'vue'
import { cn } from '@/lib/utils'

const props = withDefaults(defineProps<{
  steps: StepperStep[]
  orientation?: 'horizontal' | 'vertical'
  /** Let people click a step to jump to it. */
  clickable?: boolean
  /** With `clickable`, only allow jumping back to completed steps (not ahead). */
  linear?: boolean
  /** Accessible name of the progress navigation. */
  label?: string
  class?: HTMLAttributes['class']
}>(), {
  orientation: 'horizontal',
  clickable: true,
  linear: true,
  label: 'Progress',
})

/** Zero-based index of the current step. `steps.length` means every step is complete. */
const step = defineModel<number>('step', { default: 0 })

const prefersReduced = useReducedMotion()
// Trust the media query only after mount, so server and hydrated markup always match.
const mounted = ref(false)
onMounted(() => (mounted.value = true))
const reduced = computed(() => mounted.value && prefersReduced.value)
const vertical = computed(() => props.orientation === 'vertical')

type StepState = 'complete' | 'current' | 'upcoming'
function stateOf(i: number): StepState {
  return i < step.value ? 'complete' : i === step.value ? 'current' : 'upcoming'
}
function canGo(i: number) {
  return props.clickable && !props.steps[i]?.disabled && (!props.linear || i <= step.value) && i !== step.value
}

const current = computed(() => props.steps[Math.min(step.value, props.steps.length - 1)])
const done = computed(() => step.value >= props.steps.length)

const fill = { type: 'spring', stiffness: 140, damping: 22 } as const
const pop = { type: 'spring', stiffness: 500, damping: 26 } as const
const indicatorClass: Record<StepState, string> = {
  complete: 'border-primary bg-primary text-primary-foreground',
  current: 'border-primary bg-background text-foreground',
  upcoming: 'border-border bg-background text-muted-foreground',
}
</script>

<template>
  <nav :aria-label="props.label" :class="cn('@container w-full', props.class)">
    <ol :class="cn('m-0 flex w-full list-none p-0', vertical ? 'flex-col' : 'flex-row')">
      <li
        v-for="(s, i) in props.steps"
        :key="i"
        :aria-current="stateOf(i) === 'current' ? 'step' : undefined"
        :class="cn('relative m-0 flex', vertical ? 'pb-8 last:pb-0' : 'flex-1 justify-center')"
      >
        <!-- connector to the next step; the fill springs along it once this step is complete -->
        <span
          v-if="i < props.steps.length - 1"
          aria-hidden="true"
          :class="cn(
            'absolute overflow-hidden rounded-full bg-border',
            vertical
              ? 'bottom-1.5 left-4 top-10.5 w-0.5 -translate-x-1/2'
              : 'left-[calc(50%+1.5rem)] right-[calc(-50%+1.5rem)] top-4 h-0.5 -translate-y-1/2',
          )"
        >
          <motion.span
            :key="props.orientation"
            :class="cn('absolute inset-0 bg-primary', vertical ? 'origin-top' : 'origin-left')"
            :initial="false"
            :animate="vertical ? { scaleX: 1, scaleY: i < step ? 1 : 0 } : { scaleX: i < step ? 1 : 0, scaleY: 1 }"
            :transition="reduced ? { duration: 0 } : fill"
          />
        </span>

        <component
          :is="props.clickable ? 'button' : 'div'"
          :type="props.clickable ? 'button' : undefined"
          :disabled="props.clickable ? !canGo(i) : undefined"
          :class="cn(
            'group relative flex rounded-lg text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-default',
            vertical ? 'items-start gap-4' : 'flex-col items-center gap-2 px-1',
          )"
          @click="canGo(i) && (step = i)"
        >
          <motion.span
            :class="cn(
              'relative grid size-8 shrink-0 place-items-center rounded-full border-2 text-sm font-semibold tabular-nums transition-colors duration-300',
              indicatorClass[stateOf(i)],
              canGo(i) && 'group-hover:border-primary/60',
            )"
            :initial="false"
            :animate="{ scale: stateOf(i) === 'current' && !reduced ? 1.08 : 1 }"
            :transition="pop"
          >
            <!-- current step: a soft ring breathing outward -->
            <motion.span
              v-if="stateOf(i) === 'current' && !reduced"
              aria-hidden="true"
              class="pointer-events-none absolute -inset-0.5 rounded-full border-2 border-primary"
              :initial="{ scale: 1, opacity: 0.5 }"
              :animate="{ scale: 1.55, opacity: 0 }"
              :transition="{ duration: 1.6, ease: 'easeOut', repeat: Infinity }"
            />
            <AnimatePresence mode="popLayout" :initial="false">
              <motion.svg
                v-if="stateOf(i) === 'complete'"
                key="check"
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="3"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="size-4"
                :initial="reduced ? { opacity: 0 } : { scale: 0.4, opacity: 0, rotate: -30 }"
                :animate="{ scale: 1, opacity: 1, rotate: 0 }"
                :exit="reduced ? { opacity: 0 } : { scale: 0.4, opacity: 0 }"
                :transition="pop"
              >
                <motion.path
                  d="m5 12.5 4.5 4.5L19 7.5"
                  :initial="reduced ? false : { pathLength: 0 }"
                  :animate="{ pathLength: 1 }"
                  :transition="{ duration: 0.35, ease: 'easeOut', delay: 0.08 }"
                />
              </motion.svg>
              <motion.span
                v-else
                key="number"
                aria-hidden="true"
                :initial="reduced ? { opacity: 0 } : { scale: 0.4, opacity: 0 }"
                :animate="{ scale: 1, opacity: 1 }"
                :exit="reduced ? { opacity: 0 } : { scale: 0.4, opacity: 0 }"
                :transition="pop"
              >
                {{ i + 1 }}
              </motion.span>
            </AnimatePresence>
          </motion.span>

          <span
            :class="cn(
              'flex min-w-0 flex-col',
              vertical ? 'gap-0.5 pt-1' : 'sr-only items-center text-center @lg:not-sr-only',
            )"
          >
            <span
              :class="cn(
                'text-sm font-medium leading-5 transition-colors duration-300',
                stateOf(i) === 'upcoming' ? 'text-muted-foreground' : 'text-foreground',
              )"
            >
              {{ s.title }}
            </span>
            <span v-if="s.description" class="text-xs leading-4 text-muted-foreground">{{ s.description }}</span>
          </span>
          <span v-if="stateOf(i) === 'complete'" class="sr-only">(completed)</span>
        </component>
      </li>
    </ol>

    <!-- narrow horizontal steppers swap the label row for a single animated caption -->
    <div v-if="!vertical" class="mt-3 flex h-5 justify-center overflow-hidden text-sm @lg:hidden" aria-hidden="true">
      <AnimatePresence mode="popLayout" :initial="false">
        <motion.p
          :key="step"
          class="m-0 whitespace-nowrap"
          :initial="reduced ? { opacity: 0 } : { opacity: 0, y: 12 }"
          :animate="{ opacity: 1, y: 0 }"
          :exit="reduced ? { opacity: 0 } : { opacity: 0, y: -12 }"
          :transition="pop"
        >
          <template v-if="done">
            <span class="font-medium">All steps complete</span>
          </template>
          <template v-else>
            <span class="text-muted-foreground">Step {{ step + 1 }} of {{ props.steps.length }} · </span>
            <span class="font-medium">{{ current?.title }}</span>
          </template>
        </motion.p>
      </AnimatePresence>
    </div>
  </nav>
</template>
