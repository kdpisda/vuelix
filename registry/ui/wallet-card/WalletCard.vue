<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { AnimatePresence, motion, useReducedMotion } from 'motion-v'
import { computed, nextTick, onBeforeUnmount, ref, useId, watch } from 'vue'
import { cn } from '@/lib/utils'
import RollingNumber from './RollingNumber.vue'

export interface WalletTransaction {
  id: string
  merchant: string
  /** Negative for spending, positive for income. */
  amount: number
  /** Display date, e.g. "Today, 09:41". */
  date: string
}

export interface WalletCardItem {
  id: string
  /** Network or issuer shown on the card, e.g. "VISA". */
  brand: string
  /** Card nickname, e.g. "Everyday". */
  label: string
  /** Full card number; only the last four digits show on the front. */
  number: string
  holder: string
  /** "MM/YY" */
  expiry: string
  cvv: string
  balance: number
  /** Any CSS background (color or gradient). Defaults to the primary token. */
  background?: string
  /** Text color on the card when `background` is set. */
  foreground?: string
  transactions?: WalletTransaction[]
}

const props = withDefaults(defineProps<{
  cards: WalletCardItem[]
  currency?: string
  locale?: string
  /** Pixels each card behind the front one peeks out. */
  peek?: number
  class?: HTMLAttributes['class']
}>(), {
  currency: 'USD',
  peek: 16,
})

const active = defineModel<string>('active')
if (active.value === undefined && props.cards.length)
  active.value = props.cards[0]!.id

const uid = useId()
const reduced = useReducedMotion()
const stackSpring = { type: 'spring', stiffness: 300, damping: 30, mass: 0.9 } as const
const flipSpring = { type: 'spring', stiffness: 170, damping: 20 } as const
const listSpring = { type: 'spring', stiffness: 380, damping: 32 } as const

const flipped = ref(false)
const lifting = ref<string | null>(null)
let timer: ReturnType<typeof setTimeout> | undefined
onBeforeUnmount(() => clearTimeout(timer))
watch(active, () => (flipped.value = false))

// Active card first, the rest keep their relative order behind it.
const order = computed(() => {
  const front = props.cards.find(c => c.id === active.value) ?? props.cards[0]
  return front ? [front, ...props.cards.filter(c => c !== front)] : []
})
const depthOf = (id: string) => order.value.findIndex(c => c.id === id)
const current = computed(() => order.value[0])
const visibleDepth = computed(() => Math.min(order.value.length, 3) - 1)

const last4 = (n: string) => n.replace(/\D/g, '').slice(-4)
const groups = (n: string) => n.replace(/\D/g, '').replace(/(.{4})(?=.)/g, '$1 ')
const money = computed(() => new Intl.NumberFormat(props.locale, { style: 'currency', currency: props.currency }))
const signed = (v: number) => `${v > 0 ? '+' : v < 0 ? '−' : ''}${money.value.format(Math.abs(v))}`

function target(id: string) {
  const d = depthOf(id)
  const shown = Math.min(d, visibleDepth.value)
  const lift = lifting.value === id
  return {
    // A card being pulled forward first rises out of the stack, then drops in front.
    y: lift ? -shown * props.peek - 110 : -shown * props.peek,
    scale: lift ? 1 - shown * 0.04 : 1 - shown * 0.06,
    opacity: d > visibleDepth.value ? 0 : 1,
  }
}

function bringToFront(id: string) {
  if (id === active.value || lifting.value)
    return
  if (reduced.value) {
    active.value = id
    return
  }
  lifting.value = id
  clearTimeout(timer)
  timer = setTimeout(() => {
    active.value = id
    lifting.value = null
  }, 240)
}

const stack = ref<HTMLElement>()
function onCardClick(id: string) {
  if (id === active.value)
    flipped.value = !flipped.value
  else
    bringToFront(id)
}
async function onKeydown(e: KeyboardEvent) {
  const n = props.cards.length
  if (e.key === 'Escape' && flipped.value) {
    flipped.value = false
    return
  }
  const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key]
  if (!step || n < 2)
    return
  e.preventDefault()
  const i = props.cards.findIndex(c => c.id === active.value)
  const next = props.cards[(i + step + n) % n]!
  active.value = next.id
  await nextTick()
  stack.value?.querySelector<HTMLElement>(`[data-card="${next.id}"]`)?.focus()
}
</script>

<template>
  <div :class="cn('flex w-full max-w-sm flex-col', props.class)">
    <!-- Card stack -->
    <div
      ref="stack"
      role="group"
      aria-roledescription="card stack"
      aria-label="Payment cards"
      class="relative aspect-[1.586] w-full"
      :style="{ marginTop: `${visibleDepth * props.peek}px` }"
      @keydown="onKeydown"
    >
      <motion.button
        v-for="card in props.cards"
        :key="card.id"
        type="button"
        :data-card="card.id"
        :aria-label="depthOf(card.id) === 0
          ? `${card.label} card ending ${last4(card.number)}. ${flipped ? 'Hide' : 'Show'} card details`
          : `Switch to ${card.label} card ending ${last4(card.number)}`"
        :aria-pressed="depthOf(card.id) === 0 ? flipped : undefined"
        :aria-describedby="depthOf(card.id) === 0 && flipped ? `${uid}-details` : undefined"
        :tabindex="depthOf(card.id) > visibleDepth ? -1 : 0"
        class="absolute inset-0 origin-top rounded-2xl text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        :style="{ zIndex: props.cards.length - depthOf(card.id) }"
        :initial="false"
        :animate="target(card.id)"
        :transition="reduced ? { duration: 0 } : stackSpring"
        :while-hover="depthOf(card.id) > 0 && !reduced ? { y: target(card.id).y - 6 } : undefined"
        @click="onCardClick(card.id)"
      >
        <motion.div
          class="relative size-full [transform-style:preserve-3d]"
          :style="{ transformPerspective: 1200 }"
          :initial="false"
          :animate="{ rotateY: depthOf(card.id) === 0 && flipped ? 180 : 0 }"
          :transition="reduced ? { duration: 0 } : flipSpring"
        >
          <!-- Front face -->
          <div
            :class="cn(
              'absolute inset-0 flex flex-col justify-between overflow-hidden rounded-2xl p-5 shadow-lg ring-1 ring-black/5 [backface-visibility:hidden]',
              !card.background && 'bg-primary text-primary-foreground',
            )"
            :style="card.background ? { background: card.background, color: card.foreground } : undefined"
          >
            <div
              aria-hidden="true"
              class="pointer-events-none absolute inset-0"
              :style="{ background: 'radial-gradient(120% 80% at 0% 0%, color-mix(in oklab, currentColor 18%, transparent), transparent 60%)' }"
            />
            <div class="relative flex items-start justify-between">
              <span class="text-xs font-medium uppercase tracking-[0.18em] opacity-80">{{ card.label }}</span>
              <span class="text-lg font-bold italic tracking-tight">{{ card.brand }}</span>
            </div>
            <div class="relative flex items-center gap-3">
              <svg class="h-7 w-9 opacity-80" viewBox="0 0 36 28" fill="none" aria-hidden="true">
                <rect x="0.75" y="0.75" width="34.5" height="26.5" rx="5" stroke="currentColor" stroke-width="1.5" />
                <path d="M12 1v26M24 1v26M1 10h11M24 10h11M1 18h11M24 18h11" stroke="currentColor" stroke-width="1.2" />
              </svg>
              <svg class="size-5 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
                <path d="M8.5 8.5a5 5 0 0 1 0 7M12 6a8.5 8.5 0 0 1 0 12M15.5 3.5a12 12 0 0 1 0 17" />
              </svg>
            </div>
            <div class="relative">
              <p class="m-0 font-mono text-base tracking-[0.2em]">
                •••• {{ last4(card.number) }}
              </p>
              <div class="mt-1.5 flex items-end justify-between text-xs opacity-80">
                <span class="truncate uppercase tracking-wider">{{ card.holder }}</span>
                <span class="tabular-nums">{{ card.expiry }}</span>
              </div>
            </div>
          </div>

          <!-- Back face -->
          <div
            :id="depthOf(card.id) === 0 ? `${uid}-details` : undefined"
            :class="cn(
              'absolute inset-0 flex flex-col overflow-hidden rounded-2xl shadow-lg ring-1 ring-black/5 [backface-visibility:hidden] [transform:rotateY(180deg)]',
              !card.background && 'bg-primary text-primary-foreground',
            )"
            :style="card.background ? { background: card.background, color: card.foreground } : undefined"
          >
            <div aria-hidden="true" class="mt-5 h-9 w-full bg-black/50" />
            <div class="flex flex-1 flex-col justify-between p-5 pt-4">
              <div class="flex items-center gap-3">
                <div
                  class="h-8 flex-1 rounded-md"
                  :style="{ background: 'repeating-linear-gradient(-45deg, color-mix(in oklab, currentColor 22%, transparent) 0 6px, color-mix(in oklab, currentColor 10%, transparent) 6px 12px)' }"
                  aria-hidden="true"
                />
                <div class="flex flex-col items-end">
                  <span class="text-[10px] uppercase tracking-wider opacity-70">CVV</span>
                  <span class="font-mono text-sm font-semibold">{{ depthOf(card.id) === 0 && flipped ? card.cvv : '•••' }}</span>
                </div>
              </div>
              <div>
                <p class="m-0 font-mono text-[15px] tracking-[0.12em]">
                  {{ depthOf(card.id) === 0 && flipped ? groups(card.number) : '•••• •••• •••• ••••' }}
                </p>
                <div class="mt-1.5 flex justify-between text-xs opacity-80">
                  <span class="truncate uppercase tracking-wider">{{ card.holder }}</span>
                  <span class="tabular-nums">Exp {{ card.expiry }}</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.button>
    </div>

    <!-- Balance -->
    <div v-if="current" class="mt-5 flex items-end justify-between gap-4 px-1">
      <div class="min-w-0">
        <p class="m-0 text-xs text-muted-foreground">
          {{ current.label }} balance
        </p>
        <RollingNumber
          :value="current.balance"
          :locale="props.locale"
          :format="{ style: 'currency', currency: props.currency }"
          class="text-3xl font-semibold tracking-tight"
        />
      </div>
      <p class="m-0 shrink-0 text-xs text-muted-foreground">
        {{ flipped ? 'Tap card to hide' : 'Tap card for details' }}
      </p>
    </div>

    <!-- Transactions for the active card -->
    <div class="relative mt-3 min-h-16">
      <AnimatePresence mode="wait" :initial="false">
        <motion.ul
          v-if="current"
          :key="current.id"
          :aria-label="`Recent ${current.label} transactions`"
          class="m-0 flex list-none flex-col gap-1 p-0"
          :exit="{ opacity: 0, y: -8, transition: { duration: reduced ? 0 : 0.12 } }"
        >
          <motion.li
            v-for="(tx, i) in current.transactions ?? []"
            :key="tx.id"
            class="flex items-center gap-3 rounded-xl px-2 py-2"
            :initial="{ opacity: 0, y: -14 }"
            :animate="{ opacity: 1, y: 0, transition: { ...listSpring, delay: reduced ? 0 : 0.05 + i * 0.05 } }"
          >
            <slot name="transaction" :transaction="tx">
              <span class="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground" aria-hidden="true">
                {{ tx.merchant.charAt(0) }}
              </span>
              <span class="flex min-w-0 flex-1 flex-col">
                <span class="truncate text-sm font-medium">{{ tx.merchant }}</span>
                <span class="text-xs text-muted-foreground">{{ tx.date }}</span>
              </span>
              <span :class="cn('text-sm font-medium tabular-nums', tx.amount < 0 && 'text-muted-foreground')">
                {{ signed(tx.amount) }}
              </span>
            </slot>
          </motion.li>
          <li v-if="!current.transactions?.length" class="px-2 py-4 text-sm text-muted-foreground">
            No recent transactions
          </li>
        </motion.ul>
      </AnimatePresence>
    </div>
  </div>
</template>
