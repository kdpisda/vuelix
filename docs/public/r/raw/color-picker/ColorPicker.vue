<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { ColorFormat, Hsva, Rgba } from './color'
import { AnimatePresence, motion } from 'motion-v'
import { computed, onMounted, ref, watch } from 'vue'
import { cn } from '@/lib/utils'
import { clamp, hslToHsv, hsvToHsl, hsvToRgb, parseColor, rgbToHsv, toHex } from './color'

const props = withDefaults(defineProps<{
  /** Show the opacity slider + alpha field. The model becomes `#rrggbbaa` when opacity < 100%. */
  alpha?: boolean
  /** Show the eyedropper button (only rendered where the browser supports `window.EyeDropper`). */
  eyedropper?: boolean
  /** How many recent colors to keep. `0` hides the row. */
  recentLimit?: number
  disabled?: boolean
  class?: HTMLAttributes['class']
}>(), {
  eyedropper: true,
  recentLimit: 7,
})

const emit = defineEmits<{
  /** Fires when an interaction finishes (pointer up, key up, field commit, eyedropper, swatch…). */
  change: [value: string]
}>()

const model = defineModel<string>({ default: '#6366f1' })
/** Most recent first. Bind it to keep the history across mounts (e.g. in a popover). */
const recent = defineModel<string[]>('recent', { default: () => [] })
const format = defineModel<ColorFormat>('format', { default: 'hex' })

// Tune the feel here.
const thumbSpring = { type: 'spring', stiffness: 520, damping: 22 } as const
const fadeSpring = { type: 'spring', stiffness: 600, damping: 40 } as const
const popSpring = { type: 'spring', stiffness: 600, damping: 18 } as const
const formatSpring = { type: 'spring', stiffness: 500, damping: 36 } as const

// Thumbs and the saturation/brightness gradients sit on the picked color itself, never on a
// themed surface, so they use fixed white/black (that *is* the HSV model) instead of tokens.
const THUMB_EDGE = '0 0 0 2px #fff, 0 0 0 3px rgb(0 0 0 / 0.18), 0 2px 6px rgb(0 0 0 / 0.3)'
const SV_OVERLAY = 'linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, transparent)'
const HUE_TRACK = 'linear-gradient(to right, #f00 0%, #ff0 16.67%, #0f0 33.33%, #0ff 50%, #00f 66.67%, #f0f 83.33%, #f00 100%)'
// Transparency checkerboard drawn with the theme's border token.
const CHECKER = {
  backgroundColor: 'var(--color-background)',
  backgroundImage: 'repeating-conic-gradient(var(--color-border) 0 25%, transparent 0 50%)',
  backgroundSize: '8px 8px',
}

// The picker's source of truth is HSV, so the hue survives greys and pure black/white.
function toHsva(value: string, hue = 0): Hsva {
  const rgb = parseColor(value) ?? { r: 0, g: 0, b: 0, a: 1 }
  return rgbToHsv({ ...rgb, a: props.alpha ? rgb.a : 1 }, hue)
}

const hsva = ref<Hsva>(toHsva(model.value))
const rgba = computed(() => hsvToRgb(hsva.value))
const hex = computed(() => toHex(rgba.value, props.alpha))
const solidHex = computed(() => toHex(rgba.value))
const cssColor = computed(() => {
  const { r, g, b, a } = rgba.value
  return `rgb(${Math.round(r)} ${Math.round(g)} ${Math.round(b)} / ${a})`
})

let lastEmitted = hex.value
let committed = hex.value // last value sent with `change`
let remembered = hex.value // last value pushed to (or picked from) the recent row
const original = ref(hex.value)

watch(model, (value) => {
  if (value === lastEmitted)
    return
  hsva.value = toHsva(value, hsva.value.h)
  lastEmitted = value
  committed = remembered = hex.value
})

function set(next: Partial<Hsva>) {
  hsva.value = { ...hsva.value, ...next }
  lastEmitted = hex.value
  model.value = hex.value
}

/**
 * Ends an interaction: emits `change`, and with `remember` records the color in the recent row.
 * Keyboard nudges only emit; the slider remembers on blur so tapping arrows doesn't flood recents.
 */
function commit(remember = true) {
  if (hex.value !== committed) {
    committed = hex.value
    emit('change', hex.value)
  }
  if (!remember || hex.value === remembered)
    return
  remembered = hex.value
  if (props.recentLimit > 0)
    recent.value = [hex.value, ...recent.value.filter(c => c !== hex.value)].slice(0, props.recentLimit)
}

// ---------------------------------------------------------------------------
// 2D area + sliders: pointer and keyboard
// ---------------------------------------------------------------------------
type Control = 'sv' | 'hue' | 'alpha'
const dragging = ref<Control | null>(null)

function applyPointer(control: Control, e: PointerEvent, el: HTMLElement) {
  const rect = el.getBoundingClientRect()
  const x = clamp((e.clientX - rect.left) / rect.width, 0, 1)
  const y = clamp((e.clientY - rect.top) / rect.height, 0, 1)
  if (control === 'sv')
    set({ s: x * 100, v: (1 - y) * 100 })
  else if (control === 'hue')
    set({ h: x * 360 })
  else
    set({ a: x })
}

function onPointerDown(control: Control, e: PointerEvent) {
  if (props.disabled || e.button !== 0)
    return
  const el = e.currentTarget as HTMLElement
  el.setPointerCapture(e.pointerId)
  // No preventDefault: the native mousedown focuses the control without a keyboard focus ring.
  dragging.value = control
  applyPointer(control, e, el)
}

function onPointerMove(control: Control, e: PointerEvent) {
  if (dragging.value === control)
    applyPointer(control, e, e.currentTarget as HTMLElement)
}

function onPointerUp(control: Control) {
  if (dragging.value !== control)
    return
  dragging.value = null
  commit()
}

const NAV_KEYS = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End']

function onKeydown(control: Control, e: KeyboardEvent) {
  if (props.disabled || !NAV_KEYS.includes(e.key))
    return
  e.preventDefault()
  const step = e.shiftKey || e.key.startsWith('Page') ? 10 : 1
  const { h, s, v, a } = hsva.value
  if (control === 'sv') {
    // Left/right → saturation, up/down (and PageUp/PageDown) → brightness.
    const dx = { ArrowLeft: -step, ArrowRight: step } as Record<string, number>
    const dy = { ArrowDown: -step, ArrowUp: step, PageDown: -step, PageUp: step } as Record<string, number>
    if (e.key === 'Home')
      set({ s: 0 })
    else if (e.key === 'End')
      set({ s: 100 })
    else
      set({ s: clamp(s + (dx[e.key] ?? 0), 0, 100), v: clamp(v + (dy[e.key] ?? 0), 0, 100) })
    return
  }
  const [value, max] = control === 'hue' ? [h, 360] : [a * 100, 100]
  const delta = ['ArrowLeft', 'ArrowDown', 'PageDown'].includes(e.key) ? -step : step
  const next = e.key === 'Home' ? 0 : e.key === 'End' ? max : clamp(Math.round(value) + delta, 0, max)
  set(control === 'hue' ? { h: next } : { a: next / 100 })
}

function onKeyup(e: KeyboardEvent) {
  if (NAV_KEYS.includes(e.key))
    commit(false)
}

const round = Math.round
const svText = computed(() => `Saturation ${round(hsva.value.s)}%, brightness ${round(hsva.value.v)}%`)

// ---------------------------------------------------------------------------
// Text fields (hex / rgb / hsl)
// ---------------------------------------------------------------------------
interface Field {
  key: 'hex' | 'r' | 'g' | 'b' | 'h' | 's' | 'l' | 'a'
  label: string
  name: string
  value: string
  max?: number
}

const formats: { value: ColorFormat, label: string }[] = [
  { value: 'hex', label: 'HEX' },
  { value: 'rgb', label: 'RGB' },
  { value: 'hsl', label: 'HSL' },
]

// The format pill slides by index × 46px (w-11 segment + 2px gap).
const formatIndex = computed(() => Math.max(0, formats.findIndex(f => f.value === format.value)))

const fields = computed<Field[]>(() => {
  const { r, g, b, a } = rgba.value
  const hsl = hsvToHsl(hsva.value)
  const list: Field[] = format.value === 'hex'
    ? [{ key: 'hex', label: 'Hex', name: 'Hex color', value: solidHex.value.slice(1).toUpperCase() }]
    : format.value === 'rgb'
      ? [
          { key: 'r', label: 'R', name: 'Red', value: `${round(r)}`, max: 255 },
          { key: 'g', label: 'G', name: 'Green', value: `${round(g)}`, max: 255 },
          { key: 'b', label: 'B', name: 'Blue', value: `${round(b)}`, max: 255 },
        ]
      : [
          { key: 'h', label: 'H', name: 'Hue', value: `${round(hsl.h)}`, max: 360 },
          { key: 's', label: 'S', name: 'Saturation', value: `${round(hsl.s)}`, max: 100 },
          { key: 'l', label: 'L', name: 'Lightness', value: `${round(hsl.l)}`, max: 100 },
        ]
  if (props.alpha)
    list.push({ key: 'a', label: 'A', name: 'Opacity', value: `${round(a * 100)}`, max: 100 })
  return list
})

// While a field is being typed in, it shows the raw draft instead of the formatted value.
const draft = ref<{ key: Field['key'], text: string } | null>(null)

function applyField(key: Field['key'], text: string, final: boolean) {
  if (key === 'hex') {
    const raw = text.trim().replace(/^#/, '')
    // Live-apply only complete values so typing "abc…" doesn't flash a shorthand color.
    if (!final && !/^(?:[\da-f]{6}|[\da-f]{8})$/i.test(raw))
      return
    const rgb = parseColor(/^[\da-f]+$/i.test(raw) ? `#${raw}` : text)
    if (rgb)
      set(rgbToHsv({ ...rgb, a: props.alpha && raw.length !== 6 ? rgb.a : hsva.value.a }, hsva.value.h))
    return
  }
  if (!/^\s*-?\d+(?:\.\d+)?\s*%?\s*$/.test(text))
    return
  const n = Number.parseFloat(text)
  if (key === 'a')
    return set({ a: clamp(n, 0, 100) / 100 })
  if (key === 'r' || key === 'g' || key === 'b') {
    const rgb: Rgba = { ...rgba.value, [key]: clamp(n, 0, 255) }
    return set(rgbToHsv(rgb, hsva.value.h))
  }
  const hsl = { ...hsvToHsl(hsva.value), [key]: clamp(n, 0, key === 'h' ? 360 : 100) }
  set(hslToHsv(hsl))
}

function onFieldInput(field: Field, e: Event) {
  const text = (e.target as HTMLInputElement).value
  draft.value = { key: field.key, text }
  applyField(field.key, text, false)
}

function finishField(field: Field) {
  if (draft.value?.key === field.key)
    applyField(field.key, draft.value.text, true)
  draft.value = null
  commit()
}

function onFieldKeydown(field: Field, e: KeyboardEvent) {
  if (e.key === 'Enter') {
    e.preventDefault()
    finishField(field)
  }
  else if (field.max !== undefined && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
    e.preventDefault()
    const step = (e.shiftKey ? 10 : 1) * (e.key === 'ArrowUp' ? 1 : -1)
    draft.value = null
    applyField(field.key, `${clamp(Number(field.value) + step, 0, field.max)}`, true)
  }
}

function onFormatKeydown(e: KeyboardEvent, index: number) {
  const delta = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0
  if (!delta)
    return
  e.preventDefault()
  const next = (index + delta + formats.length) % formats.length
  format.value = formats[next]!.value
  const group = (e.currentTarget as HTMLElement).parentElement
  ;(group?.children[next] as HTMLElement | undefined)?.focus()
}

// ---------------------------------------------------------------------------
// Eyedropper (Chromium only — feature-detected after mount, so SSR renders without it)
// ---------------------------------------------------------------------------
interface EyeDropperLike { open: () => Promise<{ sRGBHex: string }> }
type EyeDropperCtor = new () => EyeDropperLike

const canEyedrop = ref(false)
onMounted(() => {
  canEyedrop.value = 'EyeDropper' in window
})

async function pickFromScreen() {
  const Ctor = (window as unknown as { EyeDropper?: EyeDropperCtor }).EyeDropper
  if (!Ctor)
    return
  try {
    const { sRGBHex } = await new Ctor().open()
    const rgb = parseColor(sRGBHex)
    if (rgb) {
      set(rgbToHsv({ ...rgb, a: hsva.value.a }, hsva.value.h))
      commit()
    }
  }
  catch {
    // The user pressed Escape — nothing to do.
  }
}

// ---------------------------------------------------------------------------
// Preview + recent
// ---------------------------------------------------------------------------
const changed = computed(() => original.value !== hex.value)

/** Picking a recent swatch or reverting doesn't reshuffle the recent row. */
function useColor(value: string) {
  set(toHsva(value, hsva.value.h))
  remembered = hex.value
  commit()
}
</script>

<template>
  <div
    :class="cn(
      'flex w-72 select-none flex-col gap-3 rounded-2xl border bg-card p-3 text-card-foreground shadow-sm',
      props.disabled && 'pointer-events-none opacity-50',
      props.class,
    )"
    :aria-disabled="props.disabled || undefined"
  >
    <!-- Saturation (x) / brightness (y) -->
    <div
      role="slider"
      aria-label="Saturation and brightness"
      aria-roledescription="2D slider"
      :aria-valuenow="round(hsva.s)"
      aria-valuemin="0"
      aria-valuemax="100"
      :aria-valuetext="svText"
      :aria-disabled="props.disabled || undefined"
      :tabindex="props.disabled ? -1 : 0"
      class="relative h-40 w-full cursor-crosshair touch-none rounded-xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      :style="{ backgroundColor: `hsl(${hsva.h} 100% 50%)` }"
      @pointerdown="onPointerDown('sv', $event)"
      @pointermove="onPointerMove('sv', $event)"
      @pointerup="onPointerUp('sv')"
      @pointercancel="onPointerUp('sv')"
      @keydown="onKeydown('sv', $event)"
      @keyup="onKeyup"
      @blur="commit()"
    >
      <div class="absolute inset-0 rounded-xl" :style="{ backgroundImage: SV_OVERLAY }" />
      <span class="pointer-events-none absolute size-0" :style="{ left: `${hsva.s}%`, top: `${100 - hsva.v}%` }">
        <motion.span
          class="absolute -left-2.5 -top-2.5 block size-5 rounded-full"
          :style="{ backgroundColor: solidHex, boxShadow: THUMB_EDGE }"
          :animate="{ scale: dragging === 'sv' ? 1.35 : 1 }"
          :transition="thumbSpring"
        />
      </span>
    </div>

    <div class="flex items-center gap-3">
      <!-- Old vs new. The "old" half slides in once the color differs; click it to revert. -->
      <div
        role="group"
        aria-label="Color preview"
        class="relative flex size-10 shrink-0 overflow-hidden rounded-lg"
        :style="CHECKER"
      >
        <motion.button
          type="button"
          :tabindex="changed ? 0 : -1"
          :aria-hidden="!changed || undefined"
          :aria-label="`Revert to original color ${original}`"
          :title="`Original ${original}`"
          class="h-full shrink-0 cursor-pointer outline-none focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/50"
          :style="{ backgroundColor: original }"
          :initial="false"
          :animate="{ width: changed ? '50%' : '0%' }"
          :transition="fadeSpring"
          @click="useColor(original)"
        />
        <span class="h-full flex-1" :style="{ backgroundColor: cssColor }" />
        <span aria-hidden="true" class="pointer-events-none absolute inset-0 rounded-lg ring-1 ring-inset ring-foreground/10" />
      </div>

      <div class="flex flex-1 flex-col gap-3">
        <div
          role="slider"
          aria-label="Hue"
          :aria-valuenow="round(hsva.h)"
          aria-valuemin="0"
          aria-valuemax="360"
          :aria-valuetext="`Hue ${round(hsva.h)}°`"
          :aria-disabled="props.disabled || undefined"
          :tabindex="props.disabled ? -1 : 0"
          class="relative h-3 cursor-pointer touch-none rounded-full outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          :style="{ backgroundImage: HUE_TRACK }"
          @pointerdown="onPointerDown('hue', $event)"
          @pointermove="onPointerMove('hue', $event)"
          @pointerup="onPointerUp('hue')"
          @pointercancel="onPointerUp('hue')"
          @keydown="onKeydown('hue', $event)"
          @keyup="onKeyup"
          @blur="commit()"
        >
          <span class="pointer-events-none absolute top-1/2 size-0" :style="{ left: `${(hsva.h / 360) * 100}%` }">
            <motion.span
              class="absolute -left-2 -top-2 block size-4 rounded-full"
              :style="{ backgroundColor: `hsl(${hsva.h} 100% 50%)`, boxShadow: THUMB_EDGE }"
              :animate="{ scale: dragging === 'hue' ? 1.35 : 1 }"
              :transition="thumbSpring"
            />
          </span>
        </div>

        <div
          v-if="props.alpha"
          role="slider"
          aria-label="Opacity"
          :aria-valuenow="round(hsva.a * 100)"
          aria-valuemin="0"
          aria-valuemax="100"
          :aria-valuetext="`Opacity ${round(hsva.a * 100)}%`"
          :aria-disabled="props.disabled || undefined"
          :tabindex="props.disabled ? -1 : 0"
          class="relative h-3 cursor-pointer touch-none rounded-full outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          :style="CHECKER"
          @pointerdown="onPointerDown('alpha', $event)"
          @pointermove="onPointerMove('alpha', $event)"
          @pointerup="onPointerUp('alpha')"
          @pointercancel="onPointerUp('alpha')"
          @keydown="onKeydown('alpha', $event)"
          @keyup="onKeyup"
          @blur="commit()"
        >
          <span class="absolute inset-0 rounded-full" :style="{ backgroundImage: `linear-gradient(to right, transparent, ${solidHex})` }" />
          <span class="pointer-events-none absolute top-1/2 size-0" :style="{ left: `${hsva.a * 100}%` }">
            <motion.span
              class="absolute -left-2 -top-2 block size-4 rounded-full"
              :style="{ ...CHECKER, boxShadow: THUMB_EDGE }"
              :animate="{ scale: dragging === 'alpha' ? 1.35 : 1 }"
              :transition="thumbSpring"
            >
              <span class="absolute inset-0 rounded-full" :style="{ backgroundColor: cssColor }" />
            </motion.span>
          </span>
        </div>
      </div>
    </div>

    <div class="flex flex-col gap-2">
      <div class="flex items-center justify-between gap-2">
        <div role="radiogroup" aria-label="Color format" class="relative inline-flex gap-0.5 rounded-lg bg-muted p-0.5">
          <!-- Fixed-width segments, so the pill just slides by index (no layout projection,
               which would misplace it while a parent popover is still scaling in). -->
          <motion.span
            aria-hidden="true"
            class="absolute left-0.5 top-0.5 h-6 w-11 rounded-md bg-background shadow-sm"
            :initial="false"
            :animate="{ x: formatIndex * 46 }"
            :transition="formatSpring"
          />
          <button
            v-for="(f, i) in formats"
            :key="f.value"
            type="button"
            role="radio"
            :aria-checked="format === f.value"
            :tabindex="format === f.value ? 0 : -1"
            :disabled="props.disabled"
            :class="cn(
              'relative inline-flex h-6 w-11 items-center justify-center rounded-md text-[11px] font-semibold tracking-wide outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50',
              format === f.value ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
            )"
            @click="format = f.value"
            @keydown="onFormatKeydown($event, i)"
          >
            {{ f.label }}
          </button>
        </div>

        <button
          v-if="props.eyedropper && canEyedrop"
          type="button"
          aria-label="Pick a color from the screen"
          title="Pick from screen"
          :disabled="props.disabled"
          class="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
          @click="pickFromScreen"
        >
          <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="m12 9-8.4 8.4a2 2 0 0 0-.6 1.4V21h2.2a2 2 0 0 0 1.4-.6L15 12" />
            <path d="m15.5 5.5 3-3a2.1 2.1 0 0 1 3 3l-3 3 .9.9a1.4 1.4 0 0 1-2 2L11.6 5.6a1.4 1.4 0 0 1 2-2z" />
          </svg>
        </button>
      </div>

      <!-- Switching format cross-fades the whole row of fields. -->
      <div class="relative">
        <AnimatePresence mode="popLayout" :initial="false">
          <motion.div
            :key="format"
            class="flex w-full gap-1.5"
            :initial="{ opacity: 0, y: 6, filter: 'blur(3px)' }"
            :animate="{ opacity: 1, y: 0, filter: 'blur(0px)' }"
            :exit="{ opacity: 0, y: -6, filter: 'blur(3px)' }"
            :transition="fadeSpring"
          >
            <label
              v-for="field in fields"
              :key="field.key"
              :class="cn('flex min-w-0 flex-col items-center gap-1', field.key === 'hex' ? 'flex-[3]' : 'flex-1')"
            >
              <!-- Box styles live on the wrapper so host resets on bare <input>s can't flatten them. -->
              <span
                :class="cn(
                  'flex h-8 w-full items-center rounded-md border bg-background font-mono text-xs transition-[box-shadow,border-color] focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50',
                  field.key === 'hex' ? 'pl-2.5 pr-2' : 'px-1',
                )"
              >
                <span v-if="field.key === 'hex'" aria-hidden="true" class="text-muted-foreground">#</span>
                <input
                  :value="draft?.key === field.key ? draft.text : field.value"
                  :aria-label="field.name"
                  :inputmode="field.key === 'hex' ? 'text' : 'numeric'"
                  :maxlength="field.key === 'hex' ? 32 : 5"
                  :disabled="props.disabled"
                  autocomplete="off"
                  spellcheck="false"
                  :class="cn(
                    'h-full w-full min-w-0 select-text bg-transparent uppercase tabular-nums outline-none',
                    field.key === 'hex' ? 'ml-0.5 text-left' : 'text-center',
                  )"
                  @input="onFieldInput(field, $event)"
                  @keydown="onFieldKeydown(field, $event)"
                  @blur="finishField(field)"
                  @focus="($event.target as HTMLInputElement).select()"
                >
              </span>
              <span class="text-[10px] font-medium text-muted-foreground">{{ field.label }}{{ field.key === 'a' ? ' %' : '' }}</span>
            </label>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>

    <div v-if="props.recentLimit > 0" class="flex items-center gap-2 border-t pt-3">
      <span class="text-[11px] font-medium text-muted-foreground">Recent</span>
      <div class="flex min-h-6 flex-1 flex-wrap items-center gap-1.5">
        <span v-if="!recent.length" class="text-[11px] text-muted-foreground/70">Colors you pick show up here</span>
        <!-- The newest swatch pops in at the front; the others slide over to make room. -->
        <AnimatePresence mode="popLayout" :initial="false">
          <motion.button
            v-for="color in recent"
            :key="color"
            layout
            type="button"
            :aria-label="`Use ${color}`"
            :title="color"
            :disabled="props.disabled"
            class="relative size-6 shrink-0 cursor-pointer overflow-hidden rounded-md outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
            :style="CHECKER"
            :initial="{ scale: 0, opacity: 0 }"
            :animate="{ scale: 1, opacity: 1 }"
            :exit="{ scale: 0, opacity: 0 }"
            :while-hover="{ scale: 1.12 }"
            :while-press="{ scale: 0.92 }"
            :transition="popSpring"
            @click="useColor(color)"
          >
            <span class="absolute inset-0" :style="{ backgroundColor: color }" />
            <span
              aria-hidden="true"
              :class="cn('absolute inset-0 rounded-md ring-1 ring-inset ring-foreground/10', color === hex && 'ring-2 ring-foreground/60')"
            />
          </motion.button>
        </AnimatePresence>
      </div>
    </div>
  </div>
</template>
