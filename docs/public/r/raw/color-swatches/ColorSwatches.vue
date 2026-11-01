<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { AnimatePresence, motion } from 'motion-v'
import { computed, ref, useId } from 'vue'
import { cn } from '@/lib/utils'

export interface ColorSwatch {
  /** Any CSS color. Hex values also get an automatic light/dark check mark. */
  value: string
  /** Accessible name, e.g. "Ocean". Defaults to the value. */
  label?: string
}

const props = withDefaults(defineProps<{
  colors: (string | ColorSwatch)[]
  size?: 'sm' | 'md' | 'lg'
  /** Add a swatch that opens the native color picker. */
  custom?: boolean
  /** Accessible name for the group. */
  ariaLabel?: string
  /** Renders a hidden input so the value is submitted with a form. */
  name?: string
  disabled?: boolean
  class?: HTMLAttributes['class']
}>(), {
  size: 'md',
  ariaLabel: 'Color',
})

const model = defineModel<string>()
const emit = defineEmits<{ change: [value: string] }>()

const uid = useId()
const ringId = `vx-swatch-ring-${uid}`
const buttons: HTMLElement[] = []
const picker = ref<HTMLInputElement>()

const spring = { type: 'spring', stiffness: 520, damping: 28 } as const
const pop = { type: 'spring', stiffness: 600, damping: 22 } as const

const swatches = computed<Required<ColorSwatch>[]>(() =>
  props.colors.map(c => (typeof c === 'string' ? { value: c, label: c } : { value: c.value, label: c.label ?? c.value })),
)
const same = (a?: string, b?: string) => !!a && !!b && a.toLowerCase() === b.toLowerCase()
const isPreset = computed(() => swatches.value.some(s => same(s.value, model.value)))
/** The custom swatch holds the value whenever it isn't one of the presets. */
const customValue = computed(() => (model.value && !isPreset.value ? model.value : undefined))
const count = computed(() => swatches.value.length + (props.custom ? 1 : 0))

const tabStop = computed(() => {
  const i = swatches.value.findIndex(s => same(s.value, model.value))
  if (i >= 0)
    return i
  return customValue.value ? swatches.value.length : 0
})

const sizes = {
  sm: 'size-6 [&_svg]:size-3',
  md: 'size-8 [&_svg]:size-4',
  lg: 'size-10 [&_svg]:size-5',
}

/** Dark check on light colors, light check on dark ones (hex only; others get a light check). */
function checkClass(color: string) {
  const hex = color.trim().replace('#', '')
  const full = /^[\da-f]{3}$/i.test(hex) ? [...hex].map(c => c + c).join('') : hex
  if (!/^[\da-f]{6}$/i.test(full))
    return 'text-white drop-shadow-[0_1px_1px_rgb(0_0_0/0.5)]'
  const [r, g, b] = [0, 2, 4].map(i => Number.parseInt(full.slice(i, i + 2), 16) / 255)
  const luminance = 0.2126 * r! + 0.7152 * g! + 0.0722 * b!
  return luminance > 0.6 ? 'text-black/75' : 'text-white'
}

function select(value: string) {
  if (props.disabled || same(value, model.value))
    return
  model.value = value
  emit('change', value)
}

function openPicker() {
  if (props.disabled || !picker.value)
    return
  try {
    picker.value.showPicker()
  }
  catch {
    picker.value.click()
  }
}

function onPickerInput(e: Event) {
  select((e.target as HTMLInputElement).value)
}

function onKeydown(e: KeyboardEvent, index: number) {
  const n = count.value
  let next: number | undefined
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown')
    next = (index + 1) % n
  else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp')
    next = (index - 1 + n) % n
  else if (e.key === 'Home')
    next = 0
  else if (e.key === 'End')
    next = n - 1
  if (next === undefined)
    return
  e.preventDefault()
  // Arrowing onto the custom swatch only focuses it; Space/Enter opens the picker.
  if (next < swatches.value.length)
    select(swatches.value[next]!.value)
  else if (customValue.value)
    select(customValue.value)
  buttons[next]?.focus()
}
</script>

<template>
  <div
    role="radiogroup"
    :aria-label="props.ariaLabel"
    :aria-disabled="props.disabled || undefined"
    :class="cn('flex flex-wrap items-center gap-3', props.disabled && 'opacity-50', props.class)"
  >
    <input v-if="props.name" type="hidden" :name="props.name" :value="model ?? ''">
    <button
      v-for="(swatch, i) in swatches"
      :key="swatch.value"
      :ref="(el) => (buttons[i] = el as HTMLElement)"
      type="button"
      role="radio"
      :aria-checked="same(swatch.value, model)"
      :aria-label="swatch.label"
      :title="swatch.label"
      :disabled="props.disabled"
      :tabindex="i === tabStop ? 0 : -1"
      :class="cn(
        'relative flex shrink-0 items-center justify-center rounded-full outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed',
        sizes[props.size],
      )"
      @click="select(swatch.value)"
      @keydown="onKeydown($event, i)"
    >
      <motion.span
        aria-hidden="true"
        class="absolute inset-0 rounded-full ring-1 ring-inset ring-foreground/15"
        :style="{ backgroundColor: swatch.value }"
        :initial="false"
        :animate="{ scale: same(swatch.value, model) ? 0.78 : 1 }"
        :while-hover="props.disabled ? undefined : { scale: same(swatch.value, model) ? 0.82 : 1.1 }"
        :while-press="props.disabled ? undefined : { scale: 0.7 }"
        :transition="spring"
      />
      <motion.span
        v-if="same(swatch.value, model)"
        :layout-id="ringId"
        aria-hidden="true"
        class="pointer-events-none absolute inset-0 rounded-full border-2 ring-1 ring-foreground/10"
        :initial="false"
        :animate="{ borderColor: swatch.value }"
        :transition="spring"
      />
      <AnimatePresence>
        <motion.svg
          v-if="same(swatch.value, model)"
          key="check"
          :class="cn('relative', checkClass(swatch.value))"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="3"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
          :initial="{ scale: 0, rotate: -45 }"
          :animate="{ scale: 1, rotate: 0 }"
          :exit="{ scale: 0, transition: { duration: 0.1 } }"
          :transition="pop"
        >
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        </motion.svg>
      </AnimatePresence>
    </button>

    <button
      v-if="props.custom"
      :ref="(el) => (buttons[swatches.length] = el as HTMLElement)"
      type="button"
      role="radio"
      :aria-checked="!!customValue"
      :aria-label="customValue ? `Custom color ${customValue}` : 'Pick a custom color'"
      :title="customValue ?? 'Custom color'"
      :disabled="props.disabled"
      :tabindex="tabStop === swatches.length ? 0 : -1"
      :class="cn(
        'relative flex shrink-0 items-center justify-center rounded-full outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed',
        sizes[props.size],
      )"
      @click="openPicker"
      @keydown="onKeydown($event, swatches.length)"
    >
      <motion.span
        aria-hidden="true"
        :class="cn(
          'absolute inset-0 rounded-full',
          customValue ? 'ring-1 ring-inset ring-foreground/15' : 'border-2 border-dashed border-muted-foreground/40 bg-muted',
        )"
        :style="customValue ? { backgroundColor: customValue } : undefined"
        :initial="false"
        :animate="{ scale: customValue ? 0.78 : 1 }"
        :while-hover="props.disabled ? undefined : { scale: customValue ? 0.82 : 1.1 }"
        :while-press="props.disabled ? undefined : { scale: 0.7 }"
        :transition="spring"
      />
      <motion.span
        v-if="customValue"
        :layout-id="ringId"
        aria-hidden="true"
        class="pointer-events-none absolute inset-0 rounded-full border-2 ring-1 ring-foreground/10"
        :initial="false"
        :animate="{ borderColor: customValue }"
        :transition="spring"
      />
      <AnimatePresence mode="popLayout" :initial="false">
        <motion.svg
          :key="customValue ? 'check' : 'plus'"
          :class="cn('relative', customValue ? checkClass(customValue) : 'text-muted-foreground')"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          :stroke-width="customValue ? 3 : 2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
          :initial="{ scale: 0, rotate: -45 }"
          :animate="{ scale: 1, rotate: 0 }"
          :exit="{ scale: 0, transition: { duration: 0.1 } }"
          :transition="pop"
        >
          <path :d="customValue ? 'M5 12.5l4.5 4.5L19 7.5' : 'M12 5v14M5 12h14'" />
        </motion.svg>
      </AnimatePresence>
    </button>
    <!-- Native picker, kept out of the tab order and anchored over the custom swatch. -->
    <input
      v-if="props.custom"
      ref="picker"
      type="color"
      tabindex="-1"
      aria-hidden="true"
      class="pointer-events-none -ml-3 size-0 opacity-0"
      :value="customValue && /^#[\da-f]{6}$/i.test(customValue) ? customValue : '#000000'"
      @input="onPickerInput"
    >
  </div>
</template>
