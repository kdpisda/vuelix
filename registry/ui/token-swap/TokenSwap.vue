<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { TokenSwapQuote, TokenSwapToken } from './types'
import { AnimatePresence, motion, useReducedMotion } from 'motion-v'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'
import { cn } from '@/lib/utils'
import TokenSwapIcon from './TokenSwapIcon.vue'
import TokenSwapPicker from './TokenSwapPicker.vue'
import { formatAmount, formatUsd } from './types'

const props = withDefaults(defineProps<{
  tokens: TokenSwapToken[]
  /** Pool fee as a fraction (0.003 = 0.3%). */
  fee?: number
  /** Fake pool depth in USD — bigger trades get more price impact. */
  liquidity?: number
  /** Called on confirm. Pending → spinner, resolved → success, thrown Error → message. */
  action?: (quote: TokenSwapQuote) => Promise<unknown> | unknown
  class?: HTMLAttributes['class']
}>(), {
  fee: 0.003,
  liquidity: 4_000_000,
})

const from = defineModel<string>('from', { default: '' })
const to = defineModel<string>('to', { default: '' })
const amount = defineModel<string>('amount', { default: '' })
const slippage = defineModel<number>('slippage', { default: 0.5 })
const emit = defineEmits<{ swap: [quote: TokenSwapQuote] }>()

if (!from.value && props.tokens[0])
  from.value = props.tokens[0].symbol
if (!to.value && props.tokens[1])
  to.value = props.tokens[1].symbol

const SPRING = { type: 'spring', stiffness: 420, damping: 34 } as const
const SWAP = { type: 'spring', stiffness: 360, damping: 30 } as const
const reduced = useReducedMotion()
const uid = useId()

const bySymbol = (s: string) => props.tokens.find(t => t.symbol === s)
const fromToken = computed(() => bySymbol(from.value))
const toToken = computed(() => bySymbol(to.value))

// ---------------------------------------------------------------------------
// Quote (mock pricing)
// ---------------------------------------------------------------------------
const amountIn = computed(() => Number.parseFloat(amount.value) || 0)
const rate = computed(() => (fromToken.value && toToken.value ? fromToken.value.price / toToken.value.price : 0))
const usdIn = computed(() => amountIn.value * (fromToken.value?.price ?? 0))
const priceImpact = computed(() => Math.min(25, (usdIn.value / props.liquidity) * 100))
const amountOut = computed(() => amountIn.value * rate.value * (1 - props.fee) * (1 - priceImpact.value / 100))
const quote = computed<TokenSwapQuote>(() => ({
  from: from.value,
  to: to.value,
  amountIn: amountIn.value,
  amountOut: amountOut.value,
  rate: rate.value,
  slippage: slippage.value,
  minReceived: amountOut.value * (1 - slippage.value / 100),
  fee: usdIn.value * props.fee,
  priceImpact: priceImpact.value,
}))
const insufficient = computed(() => fromToken.value?.balance !== undefined && amountIn.value > fromToken.value.balance)

// ---------------------------------------------------------------------------
// Swapping direction: the two rows trade places (layout animation)
// ---------------------------------------------------------------------------
const order = ref<['a', 'b'] | ['b', 'a']>(['a', 'b'])
const turns = ref(0)
const rowToken = (id: 'a' | 'b') => (id === order.value[0] ? fromToken.value : toToken.value)
const isPay = (id: 'a' | 'b') => id === order.value[0]

function flip() {
  const out = amountOut.value
  ;[from.value, to.value] = [to.value, from.value]
  order.value = [order.value[1], order.value[0]] as typeof order.value
  turns.value++
  amount.value = out ? String(Number(out.toFixed(out >= 1000 ? 2 : out >= 1 ? 4 : 6))) : amount.value
}

function onAmountInput(e: Event) {
  const el = e.target as HTMLInputElement
  let v = el.value.replace(',', '.').replace(/[^\d.]/g, '')
  const dot = v.indexOf('.')
  if (dot !== -1)
    v = v.slice(0, dot + 1) + v.slice(dot + 1).replace(/\./g, '')
  if (v.startsWith('.'))
    v = `0${v}`
  el.value = v
  amount.value = v
}

function setMax() {
  if (fromToken.value?.balance !== undefined)
    amount.value = String(fromToken.value.balance)
}

// ---------------------------------------------------------------------------
// Token picker
// ---------------------------------------------------------------------------
const picking = ref<'from' | 'to' | null>(null)
let pickerReturn: HTMLElement | null = null

function openPicker(side: 'from' | 'to', e: Event) {
  pickerReturn = e.currentTarget as HTMLElement
  picking.value = side
}
function closePicker() {
  picking.value = null
  nextTick(() => pickerReturn?.focus())
}
function pick(symbol: string) {
  const side = picking.value
  if ((side === 'from' && symbol === to.value) || (side === 'to' && symbol === from.value))
    [from.value, to.value] = [to.value, from.value]
  else if (side === 'from')
    from.value = symbol
  else if (side === 'to')
    to.value = symbol
  closePicker()
}

// ---------------------------------------------------------------------------
// Settings popover
// ---------------------------------------------------------------------------
const settingsOpen = ref(false)
const settingsBtn = ref<HTMLButtonElement>()
const settingsId = `vx-swap-settings-${uid}`
const presets = [0.1, 0.5, 1]
const custom = ref(presets.includes(slippage.value) ? '' : String(slippage.value))

function onCustom(e: Event) {
  const v = (e.target as HTMLInputElement).value.replace(/[^\d.]/g, '')
  custom.value = v
  const n = Number.parseFloat(v)
  if (n > 0 && n < 50)
    slippage.value = n
}
function onDocPointer(e: PointerEvent) {
  const t = e.target as Node
  if (!document.getElementById(settingsId)?.contains(t) && !settingsBtn.value?.contains(t))
    settingsOpen.value = false
}
watch(settingsOpen, async (open) => {
  if (typeof document === 'undefined')
    return
  if (open) {
    document.addEventListener('pointerdown', onDocPointer, true)
    document.addEventListener('keydown', onSettingsKey)
    await nextTick()
    requestAnimationFrame(() => document.getElementById(settingsId)?.querySelector<HTMLElement>('[aria-checked="true"], input')?.focus())
  }
  else {
    document.removeEventListener('pointerdown', onDocPointer, true)
    document.removeEventListener('keydown', onSettingsKey)
  }
})
function onSettingsKey(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    settingsOpen.value = false
    settingsBtn.value?.focus()
  }
}
const slippageNote = computed(() => (slippage.value > 5
  ? 'High slippage — you may get a much worse price.'
  : slippage.value < 0.05 ? 'Very low slippage — the swap may fail.' : ''))

// ---------------------------------------------------------------------------
// Review → confirm → done
// ---------------------------------------------------------------------------
const phase = ref<'form' | 'review' | 'pending' | 'done'>('form')
const error = ref('')
const showDetails = ref(false)
const inverted = ref(false)
const submitted = ref<TokenSwapQuote | null>(null)

const cta = computed(() => {
  if (phase.value === 'done')
    return { label: 'Done', disabled: false }
  if (phase.value === 'review' || phase.value === 'pending')
    return { label: 'Confirm swap', disabled: phase.value === 'pending' }
  if (!fromToken.value || !toToken.value)
    return { label: 'Select a token', disabled: true }
  if (!amountIn.value)
    return { label: 'Enter an amount', disabled: true }
  if (insufficient.value)
    return { label: `Insufficient ${fromToken.value.symbol} balance`, disabled: true }
  return { label: 'Review swap', disabled: false }
})

async function onCta() {
  if (cta.value.disabled)
    return
  error.value = ''
  if (phase.value === 'form') {
    phase.value = 'review'
    return
  }
  if (phase.value === 'done') {
    phase.value = 'form'
    amount.value = ''
    return
  }
  const q = { ...quote.value }
  phase.value = 'pending'
  try {
    await props.action?.(q)
  }
  catch (e) {
    phase.value = 'review'
    error.value = e instanceof Error ? e.message : 'Swap failed'
    return
  }
  submitted.value = q
  emit('swap', q)
  phase.value = 'done'
}

// ---------------------------------------------------------------------------
// Height animation between phases
// ---------------------------------------------------------------------------
const inner = ref<HTMLElement>()
const height = ref<number | 'auto'>('auto')
let observer: ResizeObserver | undefined
onMounted(() => {
  if (!inner.value || typeof ResizeObserver === 'undefined')
    return
  observer = new ResizeObserver(([entry]) => (height.value = entry!.borderBoxSize?.[0]?.blockSize ?? entry!.contentRect.height))
  observer.observe(inner.value)
})
onBeforeUnmount(() => {
  observer?.disconnect()
  if (typeof document !== 'undefined')
    document.removeEventListener('pointerdown', onDocPointer, true)
  if (typeof document !== 'undefined')
    document.removeEventListener('keydown', onSettingsKey)
})

const rateText = computed(() => {
  if (!fromToken.value || !toToken.value)
    return ''
  return inverted.value
    ? `1 ${toToken.value.symbol} = ${formatAmount(1 / rate.value)} ${fromToken.value.symbol}`
    : `1 ${fromToken.value.symbol} = ${formatAmount(rate.value)} ${toToken.value.symbol}`
})
const impactTone = computed(() => (priceImpact.value > 3 ? 'text-destructive' : priceImpact.value > 1 ? 'text-chart-4' : 'text-muted-foreground'))
const details = computed(() => [
  { label: 'Price impact', value: `${priceImpact.value < 0.01 ? '<0.01' : priceImpact.value.toFixed(2)}%`, tone: impactTone.value },
  { label: `Fee (${(props.fee * 100).toFixed(1)}%)`, value: formatUsd(quote.value.fee), tone: '' },
  { label: 'Minimum received', value: `${formatAmount(quote.value.minReceived)} ${toToken.value?.symbol ?? ''}`, tone: '' },
  { label: 'Max slippage', value: `${slippage.value}%`, tone: '' },
])
</script>

<template>
  <div :class="cn('relative w-full max-w-sm overflow-hidden rounded-3xl border bg-card p-3 text-card-foreground shadow-sm', props.class)">
    <!-- Header -->
    <div class="flex h-10 items-center justify-between px-1">
      <div class="flex items-center gap-1">
        <AnimatePresence mode="popLayout" :initial="false">
          <motion.button
            v-if="phase === 'review'"
            key="back"
            type="button"
            aria-label="Back to swap"
            class="inline-flex size-8 items-center justify-center rounded-full text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
            :initial="{ opacity: 0, x: -8 }"
            :animate="{ opacity: 1, x: 0 }"
            :exit="{ opacity: 0, x: -8 }"
            @click="phase = 'form'"
          >
            <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
          </motion.button>
          <motion.p :key="phase === 'review' || phase === 'pending' ? 'review' : 'swap'" layout="position" class="m-0 px-1 text-sm font-semibold" :initial="{ opacity: 0 }" :animate="{ opacity: 1 }" :exit="{ opacity: 0 }">
            {{ phase === 'review' || phase === 'pending' ? 'Review swap' : 'Swap' }}
          </motion.p>
        </AnimatePresence>
      </div>
      <button
        v-if="phase === 'form'"
        ref="settingsBtn"
        type="button"
        aria-label="Swap settings"
        aria-haspopup="dialog"
        :aria-expanded="settingsOpen"
        class="inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 text-xs text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
        @click="settingsOpen = !settingsOpen"
      >
        <span class="tabular-nums">{{ slippage }}% slippage</span>
        <motion.svg
          class="size-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
          :animate="{ rotate: settingsOpen && !reduced ? 90 : 0 }"
          :transition="SPRING"
        >
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
          <circle cx="12" cy="12" r="3" />
        </motion.svg>
      </button>
    </div>

    <!-- Settings popover -->
    <AnimatePresence>
      <motion.div
        v-if="settingsOpen"
        :id="settingsId"
        role="dialog"
        aria-label="Swap settings"
        class="absolute right-3 top-14 z-20 w-72 origin-top-right rounded-2xl border bg-popover p-3 text-popover-foreground shadow-xl"
        :initial="{ opacity: 0, scale: 0.92, y: -6 }"
        :animate="{ opacity: 1, scale: 1, y: 0 }"
        :exit="{ opacity: 0, scale: 0.95, transition: { duration: 0.12 } }"
        :transition="SPRING"
      >
        <p :id="`vx-swap-slip-${uid}`" class="m-0 text-xs font-medium text-muted-foreground">
          Max slippage
        </p>
        <div role="radiogroup" :aria-labelledby="`vx-swap-slip-${uid}`" class="mt-2 flex gap-1 rounded-xl bg-muted p-1">
          <button
            v-for="p in presets"
            :key="p"
            type="button"
            role="radio"
            :aria-checked="slippage === p && !custom"
            :class="cn('relative flex-1 rounded-lg py-1 text-xs font-medium tabular-nums outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50', slippage === p && !custom ? 'text-foreground' : 'text-muted-foreground hover:text-foreground')"
            @click="slippage = p; custom = ''"
          >
            <motion.span
              v-if="slippage === p && !custom"
              :layout-id="`vx-swap-slip-pill-${uid}`"
              class="absolute inset-0 rounded-lg bg-background shadow-sm"
              :transition="SPRING"
            />
            <span class="relative">{{ p }}%</span>
          </button>
          <label class="relative flex-1">
            <span class="sr-only">Custom slippage percent</span>
            <input
              :value="custom"
              inputmode="decimal"
              placeholder="Custom"
              :class="cn('h-full w-full rounded-lg bg-transparent px-2 py-1 text-center text-xs tabular-nums outline-none placeholder:text-muted-foreground focus-visible:bg-background focus-visible:ring-[3px] focus-visible:ring-ring/50', custom && 'bg-background')"
              @input="onCustom"
            >
          </label>
        </div>
        <AnimatePresence>
          <motion.p
            v-if="slippageNote"
            key="note"
            class="m-0 overflow-hidden text-xs text-chart-4"
            :initial="{ opacity: 0, height: 0 }"
            :animate="{ opacity: 1, height: 'auto', marginTop: 8 }"
            :exit="{ opacity: 0, height: 0, marginTop: 0 }"
          >
            {{ slippageNote }}
          </motion.p>
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>

    <!-- Body -->
    <motion.div class="overflow-hidden" :animate="{ height }" :transition="reduced ? { duration: 0 } : SPRING">
      <div ref="inner">
        <AnimatePresence mode="popLayout" :initial="false">
          <!-- Form -->
          <motion.div
            v-if="phase === 'form'"
            key="form"
            :initial="{ opacity: 0, x: -24 }"
            :animate="{ opacity: 1, x: 0 }"
            :exit="{ opacity: 0, x: -24 }"
            :transition="SPRING"
          >
            <div class="relative flex flex-col gap-1">
              <motion.div
                v-for="id in order"
                :key="id"
                layout
                :class="cn('rounded-2xl p-4 transition-colors', isPay(id) ? 'bg-muted focus-within:ring-[3px] focus-within:ring-ring/30' : 'border bg-card')"
                :transition="SWAP"
              >
                <div class="flex items-center justify-between">
                  <label :for="`vx-swap-${id}-${uid}`" class="text-xs font-medium text-muted-foreground">
                    {{ isPay(id) ? 'You pay' : 'You receive' }}
                  </label>
                  <span v-if="rowToken(id)?.balance !== undefined" class="flex items-center gap-1.5 text-xs text-muted-foreground">
                    Balance <span class="tabular-nums">{{ formatAmount(rowToken(id)!.balance!) }}</span>
                    <button
                      v-if="isPay(id)"
                      type="button"
                      class="rounded-md px-1.5 py-0.5 text-[11px] font-semibold text-brand outline-none transition-colors hover:bg-brand/10 focus-visible:ring-[3px] focus-visible:ring-ring/50"
                      @click="setMax"
                    >
                      Max
                    </button>
                  </span>
                </div>
                <div class="mt-2 flex items-center gap-3">
                  <input
                    :id="`vx-swap-${id}-${uid}`"
                    :value="isPay(id) ? amount : (amountOut ? formatAmount(amountOut) : '')"
                    :readonly="!isPay(id)"
                    :tabindex="isPay(id) ? 0 : -1"
                    inputmode="decimal"
                    autocomplete="off"
                    placeholder="0"
                    :aria-invalid="isPay(id) && insufficient ? true : undefined"
                    :class="cn('min-w-0 flex-1 bg-transparent text-3xl font-semibold tabular-nums tracking-tight outline-none placeholder:text-muted-foreground/50', isPay(id) && insufficient && 'text-destructive')"
                    @input="isPay(id) && onAmountInput($event)"
                  >
                  <motion.button
                    type="button"
                    :aria-label="`${isPay(id) ? 'Pay with' : 'Receive'} ${rowToken(id)?.symbol ?? 'token'}, change token`"
                    class="inline-flex h-10 shrink-0 items-center gap-2 rounded-full border bg-background py-1 pl-1.5 pr-2.5 text-sm font-semibold shadow-xs outline-none transition-colors hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    :while-press="{ scale: 0.96 }"
                    @click="openPicker(isPay(id) ? 'from' : 'to', $event)"
                  >
                    <TokenSwapIcon :token="rowToken(id)" class="size-7" />
                    {{ rowToken(id)?.symbol ?? 'Select' }}
                    <svg class="size-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
                  </motion.button>
                </div>
                <p class="m-0 mt-1 h-4 text-xs tabular-nums text-muted-foreground">
                  {{ (isPay(id) ? amountIn : amountOut) ? formatUsd((isPay(id) ? amountIn : amountOut) * (rowToken(id)?.price ?? 0)) : '' }}
                </p>
              </motion.div>

              <motion.button
                type="button"
                aria-label="Switch pay and receive tokens"
                class="absolute left-1/2 top-1/2 z-10 inline-flex size-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-xl border-4 border-card bg-muted text-foreground outline-none transition-colors hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50"
                :animate="{ rotate: turns * 180 }"
                :while-hover="reduced ? undefined : { scale: 1.08 }"
                :while-press="{ scale: 0.92 }"
                :transition="SWAP"
                @click="flip"
              >
                <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m21 16-4 4-4-4M17 20V4M3 8l4-4 4 4M7 4v16" /></svg>
              </motion.button>
            </div>

            <!-- Rate + details -->
            <div v-if="rateText" class="px-1 pt-2">
              <div class="flex items-center justify-between gap-2 text-xs">
                <button
                  type="button"
                  class="rounded-md py-1 text-left font-medium tabular-nums outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  :aria-label="`${rateText}. Invert rate`"
                  @click="inverted = !inverted"
                >
                  {{ rateText }}
                </button>
                <button
                  type="button"
                  :aria-expanded="showDetails"
                  :aria-controls="`vx-swap-details-${uid}`"
                  class="inline-flex items-center gap-1 rounded-md py-1 text-muted-foreground outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  @click="showDetails = !showDetails"
                >
                  <span :class="amountIn ? impactTone : ''">{{ amountIn ? formatUsd(quote.fee) : 'Details' }}</span>
                  <motion.svg class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" :animate="{ rotate: showDetails ? 180 : 0 }" :transition="SPRING">
                    <path d="m6 9 6 6 6-6" />
                  </motion.svg>
                </button>
              </div>
              <AnimatePresence :initial="false">
                <motion.dl
                  v-if="showDetails"
                  :id="`vx-swap-details-${uid}`"
                  key="details"
                  class="m-0 overflow-hidden"
                  :initial="{ opacity: 0, height: 0 }"
                  :animate="{ opacity: 1, height: 'auto' }"
                  :exit="{ opacity: 0, height: 0 }"
                  :transition="SPRING"
                >
                  <div class="space-y-1.5 pb-1 pt-1.5">
                    <div v-for="d in details" :key="d.label" class="flex justify-between text-xs">
                      <dt class="text-muted-foreground">
                        {{ d.label }}
                      </dt>
                      <dd :class="cn('m-0 tabular-nums', d.tone)">
                        {{ d.value }}
                      </dd>
                    </div>
                  </div>
                </motion.dl>
              </AnimatePresence>
            </div>
          </motion.div>

          <!-- Review / pending -->
          <motion.div
            v-else-if="phase === 'review' || phase === 'pending'"
            key="review"
            class="px-1"
            :initial="{ opacity: 0, x: 24 }"
            :animate="{ opacity: 1, x: 0 }"
            :exit="{ opacity: 0, x: 24 }"
            :transition="SPRING"
          >
            <div class="rounded-2xl bg-muted p-4">
              <div v-for="(side, i) in [{ label: 'You pay', token: fromToken, value: amountIn }, { label: 'You receive', token: toToken, value: amountOut }]" :key="side.label">
                <div v-if="i === 1" class="my-2 flex items-center gap-2 text-muted-foreground" aria-hidden="true">
                  <span class="h-px flex-1 bg-border" />
                  <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M19 12l-7 7-7-7" /></svg>
                  <span class="h-px flex-1 bg-border" />
                </div>
                <p class="m-0 text-xs text-muted-foreground">
                  {{ side.label }}
                </p>
                <div class="mt-1 flex items-center justify-between gap-3">
                  <p class="m-0 truncate text-2xl font-semibold tabular-nums tracking-tight">
                    {{ formatAmount(side.value) }} <span class="text-base text-muted-foreground">{{ side.token?.symbol }}</span>
                  </p>
                  <TokenSwapIcon :token="side.token" class="size-8" />
                </div>
                <p class="m-0 text-xs tabular-nums text-muted-foreground">
                  {{ formatUsd(side.value * (side.token?.price ?? 0)) }}
                </p>
              </div>
            </div>
            <dl class="m-0 space-y-1.5 px-1 py-3">
              <div class="flex justify-between text-xs">
                <dt class="text-muted-foreground">
                  Rate
                </dt>
                <dd class="m-0 tabular-nums">
                  {{ rateText }}
                </dd>
              </div>
              <div v-for="d in details" :key="d.label" class="flex justify-between text-xs">
                <dt class="text-muted-foreground">
                  {{ d.label }}
                </dt>
                <dd :class="cn('m-0 tabular-nums', d.tone)">
                  {{ d.value }}
                </dd>
              </div>
            </dl>
            <AnimatePresence>
              <motion.p
                v-if="error"
                key="error"
                role="alert"
                class="m-0 mb-2 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive"
                :initial="{ opacity: 0, y: -4 }"
                :animate="{ opacity: 1, y: 0 }"
                :exit="{ opacity: 0 }"
              >
                {{ error }}
              </motion.p>
            </AnimatePresence>
          </motion.div>

          <!-- Done -->
          <motion.div
            v-else
            key="done"
            role="status"
            class="flex flex-col items-center px-4 pb-4 pt-6 text-center"
            :initial="{ opacity: 0, scale: 0.94 }"
            :animate="{ opacity: 1, scale: 1 }"
            :exit="{ opacity: 0, scale: 0.94 }"
            :transition="SPRING"
          >
            <motion.span
              class="flex size-14 items-center justify-center rounded-full bg-brand text-background"
              :initial="{ scale: 0, rotate: -30 }"
              :animate="{ scale: 1, rotate: 0 }"
              :transition="{ type: 'spring', stiffness: 500, damping: 18, delay: 0.05 }"
            >
              <svg class="size-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <motion.path d="M5 12.5 10 17 19 7.5" :initial="{ pathLength: 0 }" :animate="{ pathLength: 1 }" :transition="{ duration: 0.35, delay: 0.2 }" />
              </svg>
            </motion.span>
            <p class="m-0 mt-4 text-base font-semibold">
              Swap submitted
            </p>
            <p v-if="submitted" class="m-0 mt-1 text-sm tabular-nums text-muted-foreground">
              {{ formatAmount(submitted.amountIn) }} {{ submitted.from }} → {{ formatAmount(submitted.amountOut) }} {{ submitted.to }}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>

    <!-- Primary action (persists across phases and morphs its label) -->
    <motion.button
      type="button"
      layout
      :disabled="cta.disabled"
      :aria-busy="phase === 'pending'"
      :class="cn(
        'mt-2 inline-flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-2xl text-sm font-semibold outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50',
        phase === 'done' ? 'bg-muted text-foreground hover:bg-accent'
        : cta.disabled && phase !== 'pending' ? 'cursor-not-allowed bg-muted text-muted-foreground'
          : 'bg-primary text-primary-foreground hover:bg-primary/90',
      )"
      :while-press="cta.disabled ? undefined : { scale: 0.98 }"
      :transition="SPRING"
      @click="onCta"
    >
      <AnimatePresence mode="popLayout" :initial="false">
        <motion.span
          :key="phase === 'pending' ? 'pending' : cta.label"
          class="inline-flex items-center gap-2"
          :initial="{ opacity: 0, y: 12 }"
          :animate="{ opacity: 1, y: 0 }"
          :exit="{ opacity: 0, y: -12 }"
          :transition="SPRING"
        >
          <svg v-if="phase === 'pending'" class="size-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-opacity=".25" stroke-width="3" /><path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" stroke-width="3" stroke-linecap="round" /></svg>
          {{ phase === 'pending' ? 'Confirming…' : cta.label }}
        </motion.span>
      </AnimatePresence>
    </motion.button>

    <!-- Token picker overlay -->
    <AnimatePresence>
      <TokenSwapPicker
        v-if="picking"
        key="picker"
        :tokens="props.tokens"
        :selected="picking === 'from' ? from : to"
        :title="picking === 'from' ? 'Pay with' : 'Receive'"
        @pick="pick"
        @close="closePicker"
      />
    </AnimatePresence>
  </div>
</template>
