<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { AnimatePresence, motion, useReducedMotion } from 'motion-v'
import { computed, onMounted, ref, useId } from 'vue'
import { cn } from '@/lib/utils'

export type TaskListStatus = 'pending' | 'in-progress' | 'done' | 'failed'

export interface TaskListItem {
  id: string
  title: string
  /** Secondary line — a file name, a command, or the error for failed steps. */
  description?: string
  status: TaskListStatus
}

const props = withDefaults(defineProps<{
  items: TaskListItem[]
  /** Heading above the progress bar. `false` hides the whole header. */
  title?: string | false
  class?: HTMLAttributes['class']
}>(), {
  title: 'Plan',
})

const uid = useId()
const reduced = useReducedMotion()

const total = computed(() => props.items.length)
const done = computed(() => props.items.filter(i => i.status === 'done').length)
const failed = computed(() => props.items.filter(i => i.status === 'failed').length)
const progress = computed(() => (total.value ? done.value / total.value : 0))

// Stagger only the first batch; items added later (the plan growing) animate in immediately.
const settled = ref(false)
onMounted(() => setTimeout(() => (settled.value = true), 50 + props.items.length * 60))

const spring = { type: 'spring', stiffness: 380, damping: 30 } as const
const pop = { type: 'spring', stiffness: 600, damping: 22 } as const

const statusText: Record<TaskListStatus, string> = {
  'pending': 'Pending',
  'in-progress': 'In progress',
  'done': 'Done',
  'failed': 'Failed',
}
</script>

<template>
  <section
    :aria-labelledby="props.title !== false ? `${uid}-title` : undefined"
    :aria-label="props.title === false ? 'Tasks' : undefined"
    :class="cn('w-full rounded-2xl border bg-card p-4 text-card-foreground shadow-sm', props.class)"
  >
    <header v-if="props.title !== false" class="mb-3 flex flex-col gap-2.5">
      <div class="flex items-center justify-between gap-3">
        <h3 :id="`${uid}-title`" class="m-0 text-sm font-semibold">
          {{ props.title }}
        </h3>
        <p class="m-0 text-xs tabular-nums text-muted-foreground" aria-live="polite">
          {{ done }} of {{ total }} done<span v-if="failed" class="text-destructive"> · {{ failed }} failed</span>
        </p>
      </div>
      <div
        role="progressbar"
        :aria-labelledby="`${uid}-title`"
        aria-valuemin="0"
        :aria-valuemax="total"
        :aria-valuenow="done"
        class="h-1.5 overflow-hidden rounded-full bg-muted"
      >
        <motion.div
          class="h-full origin-left rounded-full bg-brand"
          :initial="{ scaleX: 0 }"
          :animate="{ scaleX: progress }"
          :transition="{ type: 'spring', stiffness: 120, damping: 22 }"
        />
      </div>
    </header>

    <ol class="m-0 flex list-none flex-col p-0">
      <AnimatePresence :initial="true">
        <motion.li
          v-for="(item, i) in props.items"
          :key="item.id"
          layout="position"
          :aria-current="item.status === 'in-progress' ? 'step' : undefined"
          :class="cn(
            'relative flex gap-3 rounded-lg px-2 py-2 transition-colors duration-300',
            item.status === 'in-progress' && 'bg-muted/60',
          )"
          :initial="reduced ? { opacity: 0 } : { opacity: 0, y: 10, filter: 'blur(4px)' }"
          :animate="{ opacity: 1, y: 0, filter: 'blur(0px)' }"
          :exit="{ opacity: 0, transition: { duration: 0.15 } }"
          :transition="{ ...spring, delay: settled ? 0 : i * 0.06 }"
        >
          <!-- status icon -->
          <span class="relative mt-0.5 grid size-5 shrink-0 place-items-center" aria-hidden="true">
            <AnimatePresence mode="popLayout" :initial="false">
              <motion.svg
                v-if="item.status === 'pending'"
                key="pending"
                class="size-5 text-muted-foreground/50"
                viewBox="0 0 20 20"
                fill="none"
                :initial="{ scale: 0.5, opacity: 0 }"
                :animate="{ scale: 1, opacity: 1 }"
                :exit="{ scale: 0.5, opacity: 0 }"
                :transition="pop"
              >
                <circle cx="10" cy="10" r="7.5" stroke="currentColor" stroke-width="1.5" stroke-dasharray="2.5 2.5" />
              </motion.svg>

              <motion.span
                v-else-if="item.status === 'in-progress'"
                key="progress"
                class="grid size-5 place-items-center"
                :initial="{ scale: 0.5, opacity: 0 }"
                :animate="{ scale: 1, opacity: 1 }"
                :exit="{ scale: 0.5, opacity: 0 }"
                :transition="pop"
              >
                <svg class="size-5 text-chart-2 motion-safe:animate-spin" viewBox="0 0 20 20" fill="none">
                  <circle cx="10" cy="10" r="7.5" stroke="currentColor" stroke-opacity="0.2" stroke-width="2" />
                  <path d="M10 2.5a7.5 7.5 0 0 1 7.5 7.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                </svg>
              </motion.span>

              <motion.span
                v-else-if="item.status === 'done'"
                key="done"
                class="grid size-5 place-items-center rounded-full bg-brand text-background"
                :initial="{ scale: 0.3 }"
                :animate="{ scale: 1 }"
                :exit="{ scale: 0.3, opacity: 0 }"
                :transition="pop"
              >
                <svg class="size-3" viewBox="0 0 12 12" fill="none">
                  <motion.path
                    d="M2.5 6.2 5 8.6 9.5 3.6"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    :initial="{ pathLength: reduced ? 1 : 0 }"
                    :animate="{ pathLength: 1 }"
                    :transition="{ duration: 0.3, delay: 0.08, ease: 'easeOut' }"
                  />
                </svg>
              </motion.span>

              <motion.span
                v-else
                key="failed"
                class="grid size-5 place-items-center rounded-full bg-destructive text-background"
                :initial="{ scale: 0.3 }"
                :animate="reduced ? { scale: 1 } : { scale: 1, x: [0, -2, 2, -1, 0] }"
                :exit="{ scale: 0.3, opacity: 0 }"
                :transition="{ scale: pop, x: { duration: 0.35, delay: 0.1 } }"
              >
                <svg class="size-2.5" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
                  <path d="M2.5 2.5l5 5M7.5 2.5l-5 5" />
                </svg>
              </motion.span>
            </AnimatePresence>
          </span>

          <!-- connector line to the next step -->
          <span
            v-if="i < props.items.length - 1"
            aria-hidden="true"
            :class="cn(
              'absolute left-[1.0625rem] top-8 bottom-[-0.375rem] w-px transition-colors duration-500',
              item.status === 'done' ? 'bg-brand/40' : 'bg-border',
            )"
          />

          <div class="min-w-0 flex-1">
            <p
              :class="cn(
                'm-0 text-sm leading-6 transition-colors duration-300',
                item.status === 'pending' && 'text-muted-foreground',
                item.status === 'in-progress' && 'font-medium text-foreground',
                item.status === 'done' && 'text-muted-foreground',
                item.status === 'failed' && 'text-foreground',
              )"
            >
              <!-- the strike is a background line that grows across (and wraps with) the text -->
              <span
                :class="cn(
                  'bg-[linear-gradient(currentColor,currentColor)] bg-no-repeat [background-position:0_55%] transition-[background-size] duration-500 ease-out motion-reduce:transition-none',
                  item.status === 'done' ? '[background-size:100%_1px]' : '[background-size:0%_1px]',
                )"
              >{{ item.title }}</span>
              <span class="sr-only"> — {{ statusText[item.status] }}</span>
            </p>
            <p
              v-if="item.description"
              :class="cn(
                'm-0 truncate text-xs leading-5',
                item.status === 'failed' ? 'text-destructive' : 'text-muted-foreground',
              )"
            >
              {{ item.description }}
            </p>
          </div>
        </motion.li>
      </AnimatePresence>
    </ol>
  </section>
</template>
