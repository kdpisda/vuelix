<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { AnimatePresence, motion, useDomRef, useReducedMotion } from 'motion-v'
import { computed, nextTick, useId } from 'vue'
import { cn } from '@/lib/utils'

export type ApprovalCardStatus = 'pending' | 'approved' | 'denied'
export type ApprovalCardRisk = 'low' | 'medium' | 'high'
export interface ApprovalCardDetail {
  label: string
  value: string
}

const props = withDefaults(defineProps<{
  /** What the agent wants to do, e.g. "Run a shell command". */
  title: string
  description?: string
  /** Key/value facts about the action — rendered as a definition list. */
  details?: ApprovalCardDetail[] | Record<string, string>
  risk?: ApprovalCardRisk
  approveLabel?: string
  denyLabel?: string
  class?: HTMLAttributes['class']
}>(), {
  risk: 'medium',
  approveLabel: 'Approve',
  denyLabel: 'Deny',
})

const status = defineModel<ApprovalCardStatus>('status', { default: 'pending' })
const emit = defineEmits<{
  approve: []
  deny: []
}>()

const uid = useId()
const reduced = useReducedMotion()
const resolvedEl = useDomRef()

const rows = computed<ApprovalCardDetail[]>(() => {
  const d = props.details
  if (!d)
    return []
  return Array.isArray(d) ? d : Object.entries(d).map(([label, value]) => ({ label, value }))
})

const RISK = {
  low: { label: 'Low risk', badge: 'bg-chart-1/15 text-chart-1', dot: 'bg-chart-1', icon: 'text-chart-1 bg-chart-1/10' },
  medium: { label: 'Medium risk', badge: 'bg-chart-4/15 text-chart-4', dot: 'bg-chart-4', icon: 'text-chart-4 bg-chart-4/10' },
  high: { label: 'High risk', badge: 'bg-destructive/15 text-destructive', dot: 'bg-destructive', icon: 'text-destructive bg-destructive/10' },
} as const

const layoutSpring = { type: 'spring', stiffness: 320, damping: 32 } as const
// A heavy, slightly under-damped spring: the stamp slams down and settles.
const stampSpring = { type: 'spring', stiffness: 700, damping: 18, mass: 1.1 } as const

function decide(next: 'approved' | 'denied') {
  status.value = next
  if (next === 'approved')
    emit('approve')
  else
    emit('deny')
  // The buttons are gone — move keyboard focus to the summary once it has mounted
  // (it waits for the pending view's exit animation).
  let tries = 0
  const focusSummary = () => {
    if (resolvedEl.value)
      resolvedEl.value.focus({ preventScroll: true })
    else if (tries++ < 25)
      setTimeout(focusSummary, 40)
  }
  nextTick(focusSummary)
}
</script>

<template>
  <motion.section
    layout
    :aria-labelledby="`${uid}-title`"
    :class="cn('w-full overflow-hidden border bg-card text-card-foreground shadow-sm', props.class)"
    :style="{ borderRadius: '16px' }"
    :transition="reduced ? { duration: 0 } : layoutSpring"
  >
    <AnimatePresence mode="wait" :initial="false">
      <motion.div
        v-if="status === 'pending'"
        key="pending"
        class="flex flex-col gap-4 p-4"
        :exit="reduced ? { opacity: 0 } : { opacity: 0, scale: 0.98, filter: 'blur(4px)' }"
        :transition="{ duration: 0.18 }"
      >
        <div class="flex items-start gap-3">
          <span :class="cn('grid size-9 shrink-0 place-items-center rounded-lg', RISK[props.risk].icon)" aria-hidden="true">
            <slot name="icon">
              <svg class="size-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 4.5 6v5.5c0 4.6 3.1 8.3 7.5 9.5 4.4-1.2 7.5-4.9 7.5-9.5V6L12 3Z" /><path d="M12 8v4.5" /><path d="M12 16h.01" /></svg>
            </slot>
          </span>
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
              <h3 :id="`${uid}-title`" class="m-0 text-sm font-semibold leading-6">
                {{ props.title }}
              </h3>
              <span :class="cn('inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium', RISK[props.risk].badge)">
                <span :class="cn('size-1.5 rounded-full', RISK[props.risk].dot)" aria-hidden="true" />
                {{ RISK[props.risk].label }}
              </span>
            </div>
            <p v-if="props.description" class="m-0 mt-0.5 text-sm leading-5 text-muted-foreground">
              {{ props.description }}
            </p>
          </div>
        </div>

        <dl v-if="rows.length" class="m-0 grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1.5 rounded-lg border bg-muted/40 px-3 py-2.5 text-xs">
          <template v-for="row in rows" :key="row.label">
            <dt class="text-muted-foreground">
              {{ row.label }}
            </dt>
            <dd class="m-0 truncate font-mono text-foreground" :title="row.value">
              {{ row.value }}
            </dd>
          </template>
        </dl>
        <slot />

        <div class="flex items-center justify-end gap-2">
          <motion.button
            type="button"
            class="inline-flex h-9 items-center gap-1.5 rounded-lg border bg-background px-3.5 text-sm font-medium outline-none transition-colors hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50"
            :while-press="{ scale: 0.95 }"
            @click="decide('denied')"
          >
            {{ props.denyLabel }}
          </motion.button>
          <motion.button
            type="button"
            class="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3.5 text-sm font-medium text-primary-foreground shadow-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
            :while-press="{ scale: 0.95 }"
            @click="decide('approved')"
          >
            <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5 10 17 19 7" /></svg>
            {{ props.approveLabel }}
          </motion.button>
        </div>
      </motion.div>

      <motion.div
        v-else
        key="resolved"
        ref="resolvedEl"
        tabindex="-1"
        class="flex items-center gap-3 px-4 py-3 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-inset"
        :initial="{ opacity: 0 }"
        :animate="{ opacity: 1 }"
        :transition="{ duration: 0.2 }"
      >
        <span class="relative grid size-8 shrink-0 place-items-center" aria-hidden="true">
          <motion.span
            v-if="!reduced"
            :class="cn('absolute inset-0 rounded-full', status === 'approved' ? 'bg-brand/30' : 'bg-destructive/30')"
            :initial="{ scale: 0.6, opacity: 0.9 }"
            :animate="{ scale: 2, opacity: 0 }"
            :transition="{ duration: 0.6, delay: 0.12, ease: 'easeOut' }"
          />
          <motion.span
            :class="cn('relative grid size-8 place-items-center rounded-full text-background', status === 'approved' ? 'bg-brand' : 'bg-destructive')"
            :initial="reduced ? { opacity: 0 } : { scale: 0, rotate: -90 }"
            :animate="{ scale: 1, rotate: 0, opacity: 1 }"
            :transition="stampSpring"
          >
            <svg v-if="status === 'approved'" class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.75" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5 10 17 19 7" /></svg>
            <svg v-else class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </motion.span>
        </span>

        <div class="min-w-0 flex-1">
          <p class="m-0 truncate text-sm font-medium leading-5">
            {{ props.title }}
          </p>
          <p class="m-0 text-xs leading-5 text-muted-foreground">
            <slot name="resolved" :status="status">
              {{ status === 'approved' ? 'You approved this action' : 'You denied this action' }}
            </slot>
          </p>
        </div>

        <motion.span
          :class="cn(
            'shrink-0 select-none rounded-md border-2 px-2 py-0.5 text-[11px] font-black uppercase tracking-[0.18em]',
            status === 'approved' ? 'border-brand text-brand' : 'border-destructive text-destructive',
          )"
          :initial="reduced ? { opacity: 0, rotate: -8 } : { opacity: 0, scale: 2.4, rotate: -24 }"
          :animate="{ opacity: 1, scale: 1, rotate: -8 }"
          :transition="{ ...stampSpring, delay: reduced ? 0 : 0.18 }"
        >
          {{ status === 'approved' ? 'Approved' : 'Denied' }}
        </motion.span>
      </motion.div>
    </AnimatePresence>
    <span class="sr-only" role="status">
      {{ status === 'pending' ? '' : `${props.title}: ${status}` }}
    </span>
  </motion.section>
</template>
