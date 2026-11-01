<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { motion } from 'motion-v'
import { computed, useId } from 'vue'
import { cn } from '@/lib/utils'

export interface RadioCardOption {
  value: string
  label: string
  description?: string
  disabled?: boolean
}

const props = withDefaults(defineProps<{
  options: RadioCardOption[]
  /** `cards`: a grid of bordered cards. `list`: compact stacked rows. */
  variant?: 'cards' | 'list'
  /** Grid columns for the `cards` variant. */
  columns?: number
  /** Accessible name for the group. */
  ariaLabel?: string
  /** Renders a hidden input so the value is submitted with a form. */
  name?: string
  disabled?: boolean
  class?: HTMLAttributes['class']
}>(), {
  variant: 'cards',
  columns: 3,
})

const model = defineModel<string>()
const emit = defineEmits<{ change: [value: string] }>()

const uid = useId()
const ringId = `vx-radio-ring-${uid}`
const dotId = `vx-radio-dot-${uid}`
const items: HTMLElement[] = []

const spring = { type: 'spring', stiffness: 460, damping: 32 } as const
const dotSpring = { type: 'spring', stiffness: 560, damping: 30 } as const

const isDisabled = (o: RadioCardOption) => props.disabled || !!o.disabled
const enabled = computed(() => props.options.flatMap((o, i) => (isDisabled(o) ? [] : [i])))

/** The one radio in the tab order: the checked one, else the first enabled. */
const tabStop = computed(() => {
  const i = props.options.findIndex(o => o.value === model.value)
  return i >= 0 && !isDisabled(props.options[i]!) ? i : (enabled.value[0] ?? -1)
})

function select(index: number) {
  const option = props.options[index]
  if (!option || isDisabled(option))
    return
  if (option.value !== model.value) {
    model.value = option.value
    emit('change', option.value)
  }
}

function onKeydown(e: KeyboardEvent, index: number) {
  const list = enabled.value
  const pos = list.indexOf(index)
  let next: number | undefined
  if (e.key === 'ArrowDown' || e.key === 'ArrowRight')
    next = list[(pos + 1) % list.length]
  else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft')
    next = list[(pos - 1 + list.length) % list.length]
  else if (e.key === 'Home')
    next = list[0]
  else if (e.key === 'End')
    next = list.at(-1)
  if (next === undefined)
    return
  e.preventDefault()
  select(next)
  items[next]?.focus()
}
</script>

<template>
  <div
    role="radiogroup"
    :aria-label="props.ariaLabel"
    :aria-disabled="props.disabled || undefined"
    :class="cn(
      props.variant === 'cards' ? 'grid gap-3' : 'flex flex-col gap-1 rounded-xl border bg-card p-1',
      props.class,
    )"
    :style="props.variant === 'cards' ? { gridTemplateColumns: `repeat(${props.columns}, minmax(0, 1fr))` } : undefined"
  >
    <input v-if="props.name" type="hidden" :name="props.name" :value="model ?? ''">
    <button
      v-for="(option, i) in props.options"
      :key="option.value"
      :ref="(el) => (items[i] = el as HTMLElement)"
      type="button"
      role="radio"
      :aria-checked="option.value === model"
      :disabled="isDisabled(option)"
      :tabindex="i === tabStop ? 0 : -1"
      :class="cn(
        'group relative isolate flex text-left outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50',
        props.variant === 'cards'
          ? 'flex-col gap-1 rounded-xl border bg-card p-4 pr-10 hover:border-ring/60'
          : 'items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-muted/60',
      )"
      @click="select(i)"
      @keydown="onKeydown($event, i)"
    >
      <!-- Selection surface: a ring (cards) or a soft pill (list) that springs to the checked option. -->
      <motion.span
        v-if="option.value === model"
        :layout-id="ringId"
        aria-hidden="true"
        :class="cn(
          'pointer-events-none absolute',
          props.variant === 'cards'
            ? '-inset-px rounded-xl border-2 border-primary bg-primary/[0.03]'
            : 'inset-0 -z-10 rounded-lg bg-muted',
        )"
        :transition="spring"
      />
      <span
        aria-hidden="true"
        :class="cn(
          'flex size-4 shrink-0 items-center justify-center rounded-full border transition-colors',
          option.value === model ? 'border-primary' : 'border-input bg-background',
          props.variant === 'cards' && 'absolute right-4 top-4',
        )"
      >
        <motion.span
          v-if="option.value === model"
          :layout-id="dotId"
          class="size-2 rounded-full bg-primary"
          :transition="dotSpring"
        />
      </span>
      <slot name="item" :option="option" :checked="option.value === model">
        <span :class="cn('flex min-w-0 flex-col', props.variant === 'list' && 'flex-1')">
          <span class="text-sm font-medium text-foreground">{{ option.label }}</span>
          <span v-if="option.description" class="text-sm text-muted-foreground">{{ option.description }}</span>
        </span>
      </slot>
    </button>
  </div>
</template>
