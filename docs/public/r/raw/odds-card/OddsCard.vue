<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { AnimatePresence, motion, useReducedMotion } from 'motion-v'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'
import { cn } from '@/lib/utils'
import RollingNumber from './RollingNumber.vue'

export interface OddsOutcome {
  id: string
  label: string
  /** Probability in percent (0–100). */
  probability: number
  /** Earlier probabilities (percent, oldest first) for the sparkline. */
  history?: number[]
  /** Any CSS color. Defaults to the chart palette. */
  color?: string
}

export interface OddsTrade {
  outcome: OddsOutcome
  side: 'yes' | 'no'
  amount: number
  /** Price per share in dollars (0–1). */
  price: number
  shares: number
  /** What the shares pay out if the side wins. */
  payout: number
}

const props = withDefaults(defineProps<{
  question: string
  outcomes: OddsOutcome[]
  /** Small print under the question, e.g. "$2.4M vol · Closes Mar 31". */
  meta?: string
  /** Show a pulsing "Live" badge. */
  live?: boolean
  /** Quick-add amounts in the order panel. */
  presets?: number[]
  currency?: string
  locale?: string
  /** Points kept in the sparkline. */
  historyLength?: number
  class?: HTMLAttributes['class']
}>(), {
  live: true,
  presets: () => [10, 25, 100],
  currency: 'USD',
  historyLength: 24,
})

const selected = defineModel<string>('selected')
const emit = defineEmits<{ trade: [trade: OddsTrade] }>()

const uid = useId()
const reduced = useReducedMotion()
const spring = { type: 'spring', stiffness: 320, damping: 30 } as const
const soft = { type: 'spring', stiffness: 160, damping: 24 } as const

const colorOf = (o: OddsOutcome, i: number) => o.color ?? `var(--chart-${(i % 5) + 1})`
const current = computed(() => {
  const i = Math.max(0, props.outcomes.findIndex(o => o.id === selected.value))
  const outcome = props.outcomes[i]
  return outcome ? { outcome, color: colorOf(outcome, i) } : undefined
})

if (selected.value === undefined && props.outcomes.length)
  selected.value = props.outcomes[0]!.id

// ── Change tracking: last move per outcome, shown as a ▲/▼ chip ──────────
const deltas = ref<Record<string, { value: number, n: number }>>({})
watch(() => props.outcomes.map(o => [o.id, o.probability] as const), (now, before) => {
  const prev = new Map(before)
  for (const [id, p] of now) {
    const old = prev.get(id)
    if (old !== undefined && old !== p)
      deltas.value[id] = { value: p - old, n: (deltas.value[id]?.n ?? 0) + 1 }
  }
})

// ── Sparkline (hand-rolled SVG) ──────────────────────────────────────────
const W = 132
const H = 44
const series = computed(() => {
  const o = current.value?.outcome
  if (!o)
    return []
  const s = [...(o.history ?? []), o.probability].slice(-props.historyLength)
  // Constant point count keeps the path morphable between updates and outcomes.
  return [...Array.from({ length: props.historyLength - s.length }, () => s[0]!), ...s]
})
const points = computed(() => {
  const s = series.value
  if (s.length < 2)
    return [] as [number, number][]
  const min = Math.max(0, Math.min(...s) - 4)
  const max = Math.min(100, Math.max(...s) + 4)
  const range = max - min || 1
  return s.map((v, i) => [
    2 + (i / (s.length - 1)) * (W - 8),
    3 + (1 - (v - min) / range) * (H - 6),
  ] as [number, number])
})
const linePath = computed(() => points.value.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(2)},${y.toFixed(2)}`).join(' '))
const areaPath = computed(() => {
  const p = points.value
  return p.length ? `${linePath.value} L${p.at(-1)![0].toFixed(2)},${H} L${p[0]![0].toFixed(2)},${H} Z` : ''
})
const end = computed(() => points.value.at(-1) ?? [W - 6, H / 2])

// ── Outcome radiogroup ───────────────────────────────────────────────────
const list = ref<HTMLElement>()
function onRadioKey(e: KeyboardEvent, index: number) {
  const n = props.outcomes.length
  const next = { ArrowDown: index + 1, ArrowRight: index + 1, ArrowUp: index - 1, ArrowLeft: index - 1, Home: 0, End: n - 1 }[e.key]
  if (next === undefined)
    return
  e.preventDefault()
  const i = (next + n) % n
  selected.value = props.outcomes[i]!.id
  ;(list.value?.querySelectorAll<HTMLElement>('[role="radio"]')[i])?.focus()
}

// ── Order panel ──────────────────────────────────────────────────────────
const side = ref<'yes' | 'no' | null>(null)
const amountText = ref('')
const placed = ref<OddsTrade | null>(null)
const input = ref<HTMLInputElement>()
const yesId = `vx-odds-yes-${uid}`
const noId = `vx-odds-no-${uid}`
let timer: ReturnType<typeof setTimeout> | undefined

const money = computed(() => new Intl.NumberFormat(props.locale, { style: 'currency', currency: props.currency }))
const cents = (p: number) => `${Math.round(p * 100)}¢`
const yesPrice = computed(() => (current.value?.outcome.probability ?? 50) / 100)
const price = computed(() => Math.min(0.99, Math.max(0.01, side.value === 'no' ? 1 - yesPrice.value : yesPrice.value)))
const amount = computed(() => {
  const n = Number.parseFloat(amountText.value.replace(/[^\d.]/g, ''))
  return Number.isFinite(n) ? n : 0
})
const shares = computed(() => amount.value / price.value)
const payout = computed(() => shares.value)
const gain = computed(() => (amount.value ? (payout.value - amount.value) / amount.value : 0))

async function openSide(s: 'yes' | 'no') {
  side.value = s
  placed.value = null
  await nextTick()
  input.value?.focus()
}
async function closePanel() {
  const was = side.value
  side.value = null
  amountText.value = ''
  clearTimeout(timer)
  await nextTick()
  if (was)
    document.getElementById(was === 'yes' ? yesId : noId)?.focus()
}
function addPreset(v: number) {
  amountText.value = String(Math.round((amount.value + v) * 100) / 100)
}
function submit() {
  if (!side.value || !current.value || amount.value <= 0)
    return
  const trade: OddsTrade = {
    outcome: current.value.outcome,
    side: side.value,
    amount: amount.value,
    price: price.value,
    shares: shares.value,
    payout: payout.value,
  }
  placed.value = trade
  emit('trade', trade)
  clearTimeout(timer)
  timer = setTimeout(closePanel, 1800)
}

// Animate the trade area's height so the card grows smoothly around the panel.
const tradeInner = ref<HTMLElement>()
const tradeHeight = ref<number | 'auto'>('auto')
let ro: ResizeObserver | undefined
onMounted(() => {
  if (!tradeInner.value)
    return
  tradeHeight.value = tradeInner.value.offsetHeight
  ro = new ResizeObserver(() => (tradeHeight.value = tradeInner.value?.offsetHeight ?? 'auto'))
  ro.observe(tradeInner.value)
})
onBeforeUnmount(() => {
  ro?.disconnect()
  clearTimeout(timer)
})
</script>

<template>
  <div
    :class="cn('w-full max-w-md rounded-2xl border bg-card p-5 text-card-foreground shadow-sm', props.class)"
    role="group"
    :aria-labelledby="`${uid}-q`"
  >
    <!-- Header -->
    <div class="flex items-start gap-3">
      <slot name="media" />
      <div class="min-w-0 flex-1">
        <p :id="`${uid}-q`" class="m-0 text-[15px] font-semibold leading-snug">
          {{ props.question }}
        </p>
        <p v-if="props.meta" class="m-0 mt-1 text-xs text-muted-foreground">
          {{ props.meta }}
        </p>
      </div>
      <span
        v-if="props.live"
        class="inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
      >
        <span class="relative flex size-1.5">
          <span class="absolute inset-0 rounded-full bg-destructive opacity-75 motion-safe:animate-ping motion-reduce:hidden" />
          <span class="relative size-1.5 rounded-full bg-destructive" />
        </span>
        Live
      </span>
    </div>

    <!-- Selected outcome: chance + sparkline -->
    <div v-if="current" class="mt-4 flex items-end justify-between gap-4">
      <div class="min-w-0 shrink-0">
        <div class="flex items-baseline gap-2">
          <RollingNumber
            :value="Math.round(current.outcome.probability)"
            :locale="props.locale"
            class="text-4xl font-semibold tracking-tight"
          />
          <span class="whitespace-nowrap text-sm text-muted-foreground">% chance</span>
        </div>
        <div class="mt-1 flex h-5 items-center gap-2 text-xs">
          <span class="truncate text-muted-foreground">{{ current.outcome.label }}</span>
          <AnimatePresence mode="popLayout">
            <motion.span
              v-if="deltas[current.outcome.id]"
              :key="`${current.outcome.id}-${deltas[current.outcome.id]!.n}`"
              :class="cn(
                'inline-flex items-center gap-0.5 rounded-full px-1.5 py-px font-medium tabular-nums',
                deltas[current.outcome.id]!.value > 0 ? 'bg-chart-1/15 text-foreground' : 'bg-destructive/15 text-foreground',
              )"
              :initial="{ opacity: 0, y: deltas[current.outcome.id]!.value > 0 ? 6 : -6, scale: 0.9 }"
              :animate="{ opacity: 1, y: 0, scale: 1 }"
              :exit="{ opacity: 0, scale: 0.9 }"
              :transition="spring"
            >
              <svg
                class="size-2.5"
                :class="deltas[current.outcome.id]!.value > 0 ? 'text-chart-1' : 'rotate-180 text-destructive'"
                viewBox="0 0 10 10"
                aria-hidden="true"
              ><path d="M5 1.5 9 8H1z" fill="currentColor" /></svg>
              {{ Math.abs(deltas[current.outcome.id]!.value).toFixed(1) }}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>
      <svg
        :viewBox="`0 0 ${W} ${H}`"
        class="h-auto min-w-0 shrink overflow-visible"
        :style="{ width: `${W}px` }"
        role="img"
        :aria-label="`${current.outcome.label} probability trend`"
      >
        <defs>
          <linearGradient :id="`${uid}-fill`" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" :stop-color="current.color" stop-opacity="0.28" />
            <stop offset="100%" :stop-color="current.color" stop-opacity="0" />
          </linearGradient>
        </defs>
        <motion.path
          :fill="`url(#${uid}-fill)`"
          :initial="false"
          :animate="{ d: areaPath }"
          :transition="reduced ? { duration: 0 } : soft"
        />
        <motion.path
          fill="none"
          :stroke="current.color"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          :initial="false"
          :animate="{ d: linePath }"
          :transition="reduced ? { duration: 0 } : soft"
        />
        <motion.circle
          r="3"
          :fill="current.color"
          :initial="false"
          :animate="{ cx: end[0], cy: end[1] }"
          :transition="reduced ? { duration: 0 } : soft"
        />
        <motion.circle
          :key="`${current.outcome.id}-${series.at(-1)}`"
          class="motion-reduce:hidden"
          :cx="end[0]"
          :cy="end[1]"
          :fill="current.color"
          :initial="{ r: 3, opacity: 0.5 }"
          :animate="{ r: 10, opacity: 0 }"
          :transition="{ duration: 1.2, ease: 'easeOut' }"
        />
      </svg>
    </div>

    <!-- Outcomes -->
    <div
      ref="list"
      role="radiogroup"
      :aria-label="props.question"
      class="mt-4 flex flex-col gap-1.5"
    >
      <button
        v-for="(o, i) in props.outcomes"
        :key="o.id"
        type="button"
        role="radio"
        :aria-checked="o.id === selected"
        :tabindex="o.id === selected ? 0 : -1"
        :class="cn(
          'relative isolate flex h-10 items-center justify-between gap-3 overflow-hidden rounded-lg px-3 text-left text-sm outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50',
          o.id === selected ? 'bg-muted ring-1 ring-foreground/15' : 'hover:bg-muted/60',
        )"
        @click="selected = o.id"
        @keydown="onRadioKey($event, i)"
      >
        <motion.span
          aria-hidden="true"
          class="absolute inset-y-0 left-0 -z-10"
          :style="{ backgroundColor: `color-mix(in oklab, ${colorOf(o, i)} 22%, transparent)` }"
          :initial="false"
          :animate="{ width: `${Math.max(0, Math.min(100, o.probability))}%` }"
          :transition="reduced ? { duration: 0 } : soft"
        />
        <span class="flex min-w-0 items-center gap-2">
          <span class="size-2 shrink-0 rounded-full" :style="{ backgroundColor: colorOf(o, i) }" />
          <span class="truncate font-medium">{{ o.label }}</span>
        </span>
        <span class="flex items-baseline font-semibold">
          <RollingNumber :value="Math.round(o.probability)" :locale="props.locale" />%
        </span>
      </button>
    </div>

    <!-- Trade -->
    <motion.div
      class="-m-1 mt-3 overflow-hidden p-1"
      :initial="false"
      :animate="{ height: tradeHeight === 'auto' ? 'auto' : tradeHeight + 8 }"
      :transition="reduced ? { duration: 0 } : spring"
    >
      <div ref="tradeInner">
        <div v-if="!side" class="grid grid-cols-2 gap-2">
          <motion.button
            :id="yesId"
            type="button"
            :layout-id="yesId"
            class="flex h-11 items-center justify-center gap-2 rounded-xl border border-chart-1/40 bg-chart-1/15 text-sm font-semibold outline-none hover:bg-chart-1/25 focus-visible:ring-[3px] focus-visible:ring-ring/50"
            :style="{ borderRadius: '12px' }"
            :transition="spring"
            :while-press="{ scale: 0.97 }"
            :aria-label="current ? `Buy Yes on ${current.outcome.label} at ${cents(yesPrice)}` : 'Buy Yes'"
            @click="openSide('yes')"
          >
            Buy Yes <span class="font-normal text-muted-foreground tabular-nums">{{ cents(yesPrice) }}</span>
          </motion.button>
          <motion.button
            :id="noId"
            type="button"
            :layout-id="noId"
            class="flex h-11 items-center justify-center gap-2 rounded-xl border border-destructive/40 bg-destructive/15 text-sm font-semibold outline-none hover:bg-destructive/25 focus-visible:ring-[3px] focus-visible:ring-ring/50"
            :style="{ borderRadius: '12px' }"
            :transition="spring"
            :while-press="{ scale: 0.97 }"
            :aria-label="current ? `Buy No on ${current.outcome.label} at ${cents(1 - yesPrice)}` : 'Buy No'"
            @click="openSide('no')"
          >
            Buy No <span class="font-normal text-muted-foreground tabular-nums">{{ cents(1 - yesPrice) }}</span>
          </motion.button>
        </div>

        <motion.form
          v-else
          :layout-id="side === 'yes' ? yesId : noId"
          :class="cn(
            'border p-3',
            side === 'yes' ? 'border-chart-1/40 bg-chart-1/10' : 'border-destructive/40 bg-destructive/10',
          )"
          :style="{ borderRadius: '14px' }"
          :transition="spring"
          :aria-label="`Buy ${side === 'yes' ? 'Yes' : 'No'}`"
          @submit.prevent="submit"
          @keydown.esc.prevent="closePanel"
        >
          <motion.div
            :initial="{ opacity: 0, y: 6 }"
            :animate="{ opacity: 1, y: 0, transition: { delay: reduced ? 0 : 0.12 } }"
          >
            <div class="flex items-center justify-between gap-2">
              <p class="m-0 text-sm font-semibold">
                Buy {{ side === 'yes' ? 'Yes' : 'No' }}
                <span class="font-normal text-muted-foreground">· {{ current?.outcome.label }} · {{ cents(price) }}</span>
              </p>
              <button
                type="button"
                aria-label="Cancel order"
                class="inline-flex size-7 items-center justify-center rounded-full text-muted-foreground outline-none hover:bg-background/60 hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
                @click="closePanel"
              >
                <svg class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
              </button>
            </div>

            <div class="mt-2.5 flex items-center gap-2">
              <label :for="`${uid}-amt`" class="sr-only">Amount</label>
              <div class="flex h-10 min-w-0 flex-1 items-center rounded-lg border bg-background px-3 focus-within:ring-[3px] focus-within:ring-ring/50">
                <span class="text-sm text-muted-foreground">$</span>
                <input
                  :id="`${uid}-amt`"
                  ref="input"
                  v-model="amountText"
                  type="text"
                  inputmode="decimal"
                  autocomplete="off"
                  placeholder="0"
                  :disabled="!!placed"
                  class="h-full w-full min-w-0 bg-transparent pl-1 text-sm font-medium tabular-nums outline-none placeholder:text-muted-foreground"
                >
              </div>
              <button
                v-for="p in props.presets"
                :key="p"
                type="button"
                :disabled="!!placed"
                class="h-10 shrink-0 rounded-lg border bg-background px-2.5 text-xs font-medium tabular-nums outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50"
                @click="addPreset(p)"
              >
                +{{ p }}
              </button>
            </div>

            <dl class="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              <dt class="text-muted-foreground">
                Shares
              </dt>
              <dd class="m-0 text-right font-medium tabular-nums">
                {{ shares.toFixed(2) }}
              </dd>
              <dt class="text-muted-foreground">
                Payout if {{ side === 'yes' ? 'Yes' : 'No' }}
              </dt>
              <dd class="m-0 flex items-baseline justify-end gap-1.5 text-right font-semibold">
                <RollingNumber
                  :value="Math.round(payout * 100) / 100"
                  :locale="props.locale"
                  :format="{ style: 'currency', currency: props.currency }"
                  class="text-sm"
                />
                <span v-if="amount > 0" class="font-normal text-muted-foreground tabular-nums">+{{ Math.round(gain * 100) }}%</span>
              </dd>
            </dl>

            <div class="relative mt-3 h-10">
              <AnimatePresence :initial="false">
                <motion.button
                  v-if="!placed"
                  key="submit"
                  type="submit"
                  :disabled="amount <= 0"
                  class="absolute inset-0 rounded-lg bg-primary text-sm font-semibold text-primary-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50"
                  :while-press="{ scale: 0.98 }"
                  :exit="{ opacity: 0, scale: 0.96 }"
                  :transition="spring"
                >
                  {{ amount > 0 ? `Buy for ${money.format(amount)}` : 'Enter an amount' }}
                </motion.button>
                <motion.p
                  v-else
                  key="done"
                  role="status"
                  class="absolute inset-0 m-0 flex items-center justify-center gap-2 rounded-lg bg-background text-sm font-medium"
                  :initial="{ opacity: 0, scale: 0.96 }"
                  :animate="{ opacity: 1, scale: 1 }"
                  :transition="spring"
                >
                  <svg class="size-4 text-chart-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
                  Order placed · {{ placed.shares.toFixed(1) }} shares
                </motion.p>
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.form>
      </div>
    </motion.div>
  </div>
</template>
