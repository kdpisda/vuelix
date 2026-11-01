<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { AnimatePresence, motion, useDomRef, useReducedMotion } from 'motion-v'
import { computed, nextTick, onBeforeUnmount, ref, useId, watch } from 'vue'
import { cn } from '@/lib/utils'

export interface FeedbackWidgetPayload {
  /** 1–5, or null when only a message was written. */
  rating: number | null
  message: string
}

const props = withDefaults(defineProps<{
  /** Text of the collapsed button. */
  label?: string
  title?: string
  placeholder?: string
  /** Optional async sender; while it's pending the submit button shows a spinner. Throw to show an error. */
  send?: (payload: FeedbackWidgetPayload) => Promise<unknown> | unknown
  /** Milliseconds the success state stays before collapsing. */
  resetDelay?: number
  maxLength?: number
  class?: HTMLAttributes['class']
}>(), {
  label: 'Feedback',
  title: 'How was your experience?',
  placeholder: 'Tell us what worked, or what didn\'t…',
  resetDelay: 2200,
  maxLength: 500,
})

const emit = defineEmits<{ submit: [payload: FeedbackWidgetPayload] }>()
const open = defineModel<boolean>('open', { default: false })

const SPRING = { type: 'spring', stiffness: 380, damping: 32 } as const
const POP = { type: 'spring', stiffness: 520, damping: 16 } as const

const uid = useId()
const morphId = `vx-feedback-${uid}`
const ratingId = `vx-feedback-rating-${uid}`
const reduced = useReducedMotion()

const ratings = [
  { value: 1, emoji: '😣', label: 'Terrible' },
  { value: 2, emoji: '🙁', label: 'Bad' },
  { value: 3, emoji: '😐', label: 'Okay' },
  { value: 4, emoji: '🙂', label: 'Good' },
  { value: 5, emoji: '🤩', label: 'Amazing' },
]

const rating = ref<number | null>(null)
const message = ref('')
const phase = ref<'form' | 'sending' | 'done'>('form')
const error = ref('')
const canSubmit = computed(() => (rating.value !== null || message.value.trim().length > 0) && phase.value === 'form')

const trigger = useDomRef()
let timer: ReturnType<typeof setTimeout> | undefined

function reset() {
  rating.value = null
  message.value = ''
  phase.value = 'form'
  error.value = ''
}

async function submit() {
  if (!canSubmit.value)
    return
  const payload = { rating: rating.value, message: message.value.trim() }
  error.value = ''
  emit('submit', payload)
  if (props.send) {
    phase.value = 'sending'
    try {
      await props.send(payload)
    }
    catch (e) {
      phase.value = 'form'
      error.value = e instanceof Error ? e.message : 'Something went wrong. Please try again.'
      return
    }
  }
  phase.value = 'done'
  timer = setTimeout(() => (open.value = false), props.resetDelay)
}

// ---------------------------------------------------------------------------
// Rating radio group (roving tabindex)
// ---------------------------------------------------------------------------
const group = ref<HTMLElement>()
function focusRating(i: number) {
  const buttons = group.value?.querySelectorAll<HTMLElement>('[role="radio"]')
  buttons?.[i]?.focus()
}
function onRatingKey(e: KeyboardEvent, index: number) {
  const last = ratings.length - 1
  const map: Record<string, number> = {
    ArrowRight: index === last ? 0 : index + 1,
    ArrowDown: index === last ? 0 : index + 1,
    ArrowLeft: index === 0 ? last : index - 1,
    ArrowUp: index === 0 ? last : index - 1,
    Home: 0,
    End: last,
  }
  const next = map[e.key]
  if (next === undefined)
    return
  e.preventDefault()
  rating.value = ratings[next]!.value
  focusRating(next)
}
const tabStop = computed(() => (rating.value === null ? 0 : ratings.findIndex(r => r.value === rating.value)))

// ---------------------------------------------------------------------------
// Open / close
// ---------------------------------------------------------------------------
function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape' && phase.value !== 'sending')
    open.value = false
}

watch(open, async (isOpen) => {
  clearTimeout(timer)
  if (isOpen) {
    reset()
    await nextTick()
    focusRating(0)
  }
  else {
    await nextTick()
    ;(trigger.value as HTMLElement | null)?.focus({ preventScroll: true })
    setTimeout(reset, 400)
  }
})

onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <div :class="cn('fixed bottom-6 right-6 z-50 flex flex-col items-end', props.class)">
    <motion.button
      v-if="!open"
      ref="trigger"
      type="button"
      :layout-id="morphId"
      aria-haspopup="dialog"
      :aria-expanded="false"
      class="inline-flex h-11 items-center gap-2 bg-primary px-4 text-sm font-medium text-primary-foreground shadow-lg outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      :style="{ borderRadius: '22px' }"
      :while-hover="reduced ? undefined : { scale: 1.04 }"
      :while-press="{ scale: 0.96 }"
      :transition="SPRING"
      @click="open = true"
    >
      <motion.span layout="position" class="inline-flex items-center gap-2">
        <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" /><path d="M8 12h.01M12 12h.01M16 12h.01" /></svg>
        {{ props.label }}
      </motion.span>
    </motion.button>

    <motion.div
      v-else
      role="dialog"
      :aria-label="props.title"
      :layout-id="morphId"
      class="w-[min(340px,calc(100vw-2rem))] overflow-hidden border bg-popover text-popover-foreground shadow-2xl"
      :style="{ borderRadius: '20px' }"
      :transition="SPRING"
      @keydown="onKey"
    >
      <AnimatePresence mode="popLayout" :initial="false">
        <motion.form
          v-if="phase !== 'done'"
          key="form"
          class="p-4"
          :initial="{ opacity: 0 }"
          :animate="{ opacity: 1, transition: { delay: 0.12, duration: 0.2 } }"
          :exit="{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }"
          @submit.prevent="submit"
        >
          <div class="flex items-start justify-between gap-3">
            <p :id="ratingId" class="m-0 text-sm font-semibold">
              {{ props.title }}
            </p>
            <button
              type="button"
              aria-label="Close feedback"
              class="-mr-1 -mt-1 inline-flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
              @click="open = false"
            >
              <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
            </button>
          </div>

          <div ref="group" role="radiogroup" :aria-labelledby="ratingId" class="mt-3 flex justify-between gap-1">
            <button
              v-for="(r, i) in ratings"
              :key="r.value"
              type="button"
              role="radio"
              :aria-checked="rating === r.value"
              :aria-label="r.label"
              :tabindex="i === tabStop ? 0 : -1"
              class="group relative flex flex-1 flex-col items-center gap-1 rounded-xl py-2 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
              @click="rating = rating === r.value ? null : r.value"
              @keydown="onRatingKey($event, i)"
            >
              <motion.span
                v-if="rating === r.value"
                :layout-id="`${morphId}-pick`"
                aria-hidden="true"
                class="absolute inset-0 rounded-xl bg-muted ring-1 ring-border"
                :transition="POP"
              />
              <motion.span
                aria-hidden="true"
                :class="cn('relative text-2xl leading-none transition-[filter,opacity] duration-200', rating !== null && rating !== r.value && 'opacity-50 grayscale')"
                :animate="rating === r.value && !reduced ? { scale: 1.3, rotate: [0, -12, 8, 0], y: -2 } : { scale: 1, rotate: 0, y: 0 }"
                :while-hover="reduced ? undefined : { scale: rating === r.value ? 1.35 : 1.15 }"
                :transition="POP"
              >
                {{ r.emoji }}
              </motion.span>
              <span :class="cn('relative text-[11px] transition-colors', rating === r.value ? 'font-medium text-foreground' : 'text-muted-foreground')">
                {{ r.label }}
              </span>
            </button>
          </div>

          <label class="mt-3 block">
            <span class="sr-only">Message</span>
            <textarea
              v-model="message"
              rows="3"
              :maxlength="props.maxLength"
              :placeholder="props.placeholder"
              class="block w-full resize-none rounded-xl border bg-background px-3 py-2 text-sm text-foreground outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              @keydown.meta.enter="submit"
              @keydown.ctrl.enter="submit"
            />
          </label>

          <AnimatePresence>
            <motion.p
              v-if="error"
              key="error"
              role="alert"
              class="m-0 overflow-hidden text-xs text-destructive"
              :initial="{ opacity: 0, height: 0 }"
              :animate="{ opacity: 1, height: 'auto', marginTop: 8 }"
              :exit="{ opacity: 0, height: 0, marginTop: 0 }"
            >
              {{ error }}
            </motion.p>
          </AnimatePresence>

          <div class="mt-3 flex items-center justify-between gap-3">
            <span class="text-xs tabular-nums text-muted-foreground" aria-hidden="true">{{ message.length }}/{{ props.maxLength }}</span>
            <motion.button
              type="submit"
              :disabled="!canSubmit"
              :aria-busy="phase === 'sending'"
              class="inline-flex h-9 min-w-28 items-center justify-center gap-2 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground outline-none transition-opacity focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50"
              :class="phase === 'sending' && 'disabled:opacity-100'"
              :while-press="canSubmit ? { scale: 0.96 } : undefined"
              :transition="SPRING"
            >
              <AnimatePresence mode="popLayout" :initial="false">
                <motion.span
                  v-if="phase === 'sending'"
                  key="spin"
                  class="inline-flex"
                  :initial="{ opacity: 0, scale: 0.5 }"
                  :animate="{ opacity: 1, scale: 1 }"
                  :exit="{ opacity: 0, scale: 0.5 }"
                >
                  <svg class="size-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-opacity=".25" stroke-width="3" /><path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" stroke-width="3" stroke-linecap="round" /></svg>
                  <span class="sr-only">Sending</span>
                </motion.span>
                <motion.span
                  v-else
                  key="label"
                  :initial="{ opacity: 0, y: 6 }"
                  :animate="{ opacity: 1, y: 0 }"
                  :exit="{ opacity: 0, y: -6 }"
                >
                  Send feedback
                </motion.span>
              </AnimatePresence>
            </motion.button>
          </div>
        </motion.form>

        <motion.div
          v-else
          key="done"
          role="status"
          class="flex flex-col items-center gap-2 px-6 py-8 text-center"
          :initial="{ opacity: 0, scale: 0.9 }"
          :animate="{ opacity: 1, scale: 1 }"
          :transition="SPRING"
        >
          <motion.span
            class="flex size-12 items-center justify-center rounded-full bg-brand text-background"
            :initial="{ scale: 0 }"
            :animate="{ scale: 1 }"
            :transition="{ ...POP, delay: 0.05 }"
          >
            <svg class="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <motion.path
                d="M5 12.5 10 17 19 7.5"
                :initial="{ pathLength: 0 }"
                :animate="{ pathLength: 1 }"
                :transition="{ duration: 0.35, delay: 0.2, ease: 'easeOut' }"
              />
            </svg>
          </motion.span>
          <p class="m-0 mt-1 text-sm font-semibold">
            Thanks for the feedback!
          </p>
          <p class="m-0 text-xs text-muted-foreground">
            We read every message.
          </p>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  </div>
</template>
