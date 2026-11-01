<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { motion, useReducedMotion } from 'motion-v'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId } from 'vue'
import { cn } from '@/lib/utils'

export interface CardFanItem {
  id: string
  /** Corner index, e.g. "A", "7", "IV". */
  rank: string
  /** Glyph for the corners and centre, e.g. "♠" or "✦". */
  symbol?: string
  /** Name under the centre glyph. */
  title?: string
  /** Accent color for rank and glyph (any CSS color). */
  color?: string
  /** Accessible name, e.g. "Queen of hearts". Defaults to rank + title. */
  label?: string
}

const props = withDefaults(defineProps<{
  cards: CardFanItem[]
  /** Cards dealt into the hand. */
  handSize?: number
  /** Degrees between neighbouring cards in the fan. */
  spread?: number
  /** Deal a hand as soon as the component mounts. */
  autoDeal?: boolean
  /** Card width in px (height follows a 5:7 ratio). */
  cardWidth?: number
  /** Stage height in px. */
  height?: number
  class?: HTMLAttributes['class']
}>(), {
  handSize: 5,
  spread: 9,
  autoDeal: true,
  cardWidth: 96,
  height: 380,
})

const emit = defineEmits<{
  play: [card: CardFanItem]
  deal: [cards: CardFanItem[]]
  shuffle: []
}>()

const uid = useId()
const reduced = useReducedMotion()
const cardSpring = { type: 'spring', stiffness: 220, damping: 24, mass: 0.9 } as const
const hoverSpring = { type: 'spring', stiffness: 420, damping: 26 } as const

// ── State: every card lives in exactly one pile ──────────────────────────
const deck = ref<string[]>(props.cards.map(c => c.id)) // last = top
const hand = ref<string[]>([])
const table = ref<string[]>([]) // last = most recent play
const delays = ref<Record<string, number>>({})
const busy = ref(false)
const riffle = ref(false)
const hovered = ref<string | null>(null)
const focusId = ref<string | null>(null)
const announcement = ref('')
const byId = computed(() => new Map(props.cards.map(c => [c.id, c])))
const timers: ReturnType<typeof setTimeout>[] = []
const later = (ms: number) => new Promise<void>(r => timers.push(setTimeout(r, reduced.value ? 0 : ms)))

// ── Geometry ─────────────────────────────────────────────────────────────
const root = ref<HTMLElement>()
const width = ref(640)
let ro: ResizeObserver | undefined
const cw = computed(() => props.cardWidth)
const ch = computed(() => Math.round(props.cardWidth * 1.4))

// Centre of the play area (x from the stage centre): middle of the stage, nudged right on
// narrow stages so it never overlaps the deck.
const tableX = computed(() => Math.max(0, 20 + cw.value + 24 + (cw.value + 16) / 2 - width.value / 2))

function hash(id: string) {
  let h = 0
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) | 0
  return Math.abs(h)
}

function target(id: string) {
  const W = width.value
  const H = props.height
  const deckIndex = deck.value.indexOf(id)
  if (deckIndex !== -1) {
    // While riffling, every other card slides out to the right and tilts.
    const split = riffle.value && deckIndex % 2 === 1
    const depth = Math.min(deckIndex, 12)
    return {
      x: -W / 2 + cw.value / 2 + 20 - depth * 0.4 + (split ? cw.value * 0.7 : 0),
      y: -H / 2 + ch.value / 2 + 20 - depth * 0.6,
      rotate: riffle.value ? (split ? 8 : -4) : 0,
      rotateY: 180,
      scale: 1,
      zIndex: deckIndex,
    }
  }
  const tableIndex = table.value.indexOf(id)
  if (tableIndex !== -1) {
    const fromTop = table.value.length - 1 - tableIndex
    return {
      x: tableX.value + (hash(id) % 14) - 7,
      y: -H / 2 + ch.value / 2 + 28,
      rotate: fromTop === 0 ? (hash(id) % 6) : (hash(id) % 16),
      rotateY: 0,
      scale: fromTop === 0 ? 1.08 : 1,
      zIndex: 100 + tableIndex,
    }
  }
  const i = hand.value.indexOf(id)
  const n = hand.value.length
  const maxHalf = Math.max(0, W / 2 - cw.value / 2 - 12)
  const R = 420
  let step = n > 1 ? Math.min(props.spread, 64 / (n - 1)) : 0
  // Squeeze the fan on narrow stages.
  const halfAngle = ((n - 1) / 2) * step
  if (halfAngle && R * Math.sin(halfAngle * Math.PI / 180) > maxHalf)
    step *= Math.asin(Math.min(1, maxHalf / R)) * 180 / Math.PI / halfAngle
  const angle = (i - (n - 1) / 2) * step
  const rad = angle * Math.PI / 180
  const lift = hovered.value === id ? 30 : 0
  return {
    x: R * Math.sin(rad),
    y: H / 2 - ch.value / 2 - 40 + R * (1 - Math.cos(rad)) - lift,
    rotate: angle,
    rotateY: 0,
    scale: lift ? 1.06 : 1,
    zIndex: 50 + i,
  }
}

function motionTarget(id: string) {
  const { zIndex: _z, ...rest } = target(id)
  return rest
}

function transitionFor(id: string) {
  if (reduced.value)
    return { duration: 0 }
  if (hovered.value === id)
    return hoverSpring
  return { ...cardSpring, delay: delays.value[id] ?? 0 }
}

// ── Actions ──────────────────────────────────────────────────────────────
async function deal(count = props.handSize) {
  if (busy.value || !deck.value.length)
    return
  busy.value = true
  const dealt = deck.value.slice(-count).reverse() // from the top
  delays.value = Object.fromEntries(dealt.map((id, i) => [id, i * 0.11]))
  deck.value = deck.value.slice(0, -dealt.length)
  hand.value = [...hand.value, ...dealt]
  announcement.value = `Dealt ${dealt.length} cards`
  emit('deal', dealt.map(id => byId.value.get(id)!))
  await later(dealt.length * 110 + 450)
  delays.value = {}
  busy.value = false
}

async function shuffle() {
  if (busy.value)
    return
  busy.value = true
  hovered.value = null
  emit('shuffle')
  // 1. gather everything back onto the deck
  const back = [...table.value, ...hand.value.slice().reverse()]
  delays.value = Object.fromEntries(back.map((id, i) => [id, i * 0.04]))
  deck.value = [...deck.value, ...back]
  hand.value = []
  table.value = []
  await later(back.length * 40 + 520)
  // 2. riffle: split the deck sideways and snap it back together
  delays.value = {}
  const ids = [...deck.value]
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[ids[i], ids[j]] = [ids[j]!, ids[i]!]
  }
  riffle.value = true
  await later(260)
  deck.value = ids
  riffle.value = false
  await later(380)
  busy.value = false
  announcement.value = 'Deck shuffled'
  await deal()
}

function draw() {
  if (busy.value || !deck.value.length)
    return
  const id = deck.value.at(-1)!
  deck.value = deck.value.slice(0, -1)
  hand.value = [...hand.value, id]
  announcement.value = `Drew ${nameOf(id)}`
}

async function play(id: string) {
  const i = hand.value.indexOf(id)
  if (busy.value || i === -1)
    return
  hovered.value = null
  hand.value = hand.value.filter(h => h !== id)
  table.value = [...table.value, id]
  const card = byId.value.get(id)!
  announcement.value = `Played ${nameOf(id)}`
  emit('play', card)
  // Keep keyboard focus in the hand.
  const next = hand.value[Math.min(i, hand.value.length - 1)]
  if (next && focusId.value === id) {
    await nextTick()
    root.value?.querySelector<HTMLElement>(`[data-card="${next}"]`)?.focus()
  }
}

function nameOf(id: string) {
  const c = byId.value.get(id)
  return c ? (c.label ?? [c.rank, c.title].filter(Boolean).join(' ')) : id
}

function onKey(e: KeyboardEvent, id: string) {
  const i = hand.value.indexOf(id)
  const n = hand.value.length
  const next = { ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1, Home: 0, End: n - 1 }[e.key]
  if (next === undefined || i === -1)
    return
  e.preventDefault()
  const nid = hand.value[(next + n) % n]
  root.value?.querySelector<HTMLElement>(`[data-card="${nid}"]`)?.focus()
}

// Roving tabindex: one tabbable card in the hand.
const tabbable = computed(() => (focusId.value && hand.value.includes(focusId.value) ? focusId.value : hand.value[0]))

onMounted(() => {
  if (root.value) {
    width.value = root.value.clientWidth
    ro = new ResizeObserver(() => (width.value = root.value?.clientWidth ?? width.value))
    ro.observe(root.value)
  }
  if (props.autoDeal)
    timers.push(setTimeout(deal, reduced.value ? 0 : 350))
})
onBeforeUnmount(() => {
  ro?.disconnect()
  timers.forEach(clearTimeout)
})

defineExpose({ deal, shuffle, draw })
</script>

<template>
  <div :class="cn('flex w-full flex-col items-center gap-4', props.class)">
    <div
      ref="root"
      role="group"
      :aria-label="`Card table: ${hand.length} in hand, ${deck.length} in deck, ${table.length} played`"
      class="relative w-full select-none"
      :style="{ height: `${props.height}px` }"
    >
      <!-- Deck hit area -->
      <button
        type="button"
        class="absolute left-5 top-5 rounded-xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-default"
        :style="{ width: `${cw}px`, height: `${ch}px`, zIndex: 40 }"
        :disabled="!deck.length || busy"
        :aria-label="`Draw a card, ${deck.length} left`"
        @click="draw"
      />
      <div
        aria-hidden="true"
        class="pointer-events-none absolute left-5 top-5 rounded-xl border border-dashed"
        :style="{ width: `${cw}px`, height: `${ch}px` }"
      />
      <!-- Play area -->
      <div
        aria-hidden="true"
        class="pointer-events-none absolute left-1/2 top-7 flex items-center justify-center rounded-xl border border-dashed text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground/70"
        :style="{ width: `${cw + 16}px`, height: `${ch + 16}px`, marginLeft: `${tableX - (cw + 16) / 2}px`, marginTop: '-8px' }"
      >
        Play
      </div>

      <motion.button
        v-for="card in props.cards"
        :key="card.id"
        type="button"
        :data-card="card.id"
        :disabled="!hand.includes(card.id)"
        :aria-hidden="!hand.includes(card.id) || undefined"
        :tabindex="tabbable === card.id ? 0 : -1"
        :aria-label="`Play ${nameOf(card.id)}`"
        class="absolute left-1/2 top-1/2 rounded-xl outline-none [transform-style:preserve-3d] focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none"
        :style="{
          width: `${cw}px`,
          height: `${ch}px`,
          marginLeft: `${-cw / 2}px`,
          marginTop: `${-ch / 2}px`,
          transformPerspective: 1000,
          zIndex: target(card.id).zIndex,
        }"
        :initial="motionTarget(card.id)"
        :animate="motionTarget(card.id)"
        :transition="transitionFor(card.id)"
        @click="play(card.id)"
        @keydown="onKey($event, card.id)"
        @pointerenter="hand.includes(card.id) && !busy && (hovered = card.id)"
        @pointerleave="hovered === card.id && (hovered = null)"
        @focus="focusId = card.id; !busy && (hovered = card.id)"
        @blur="hovered === card.id && (hovered = null)"
      >
        <!-- Face -->
        <span
          class="absolute inset-0 overflow-hidden rounded-xl border bg-card text-card-foreground shadow-md [backface-visibility:hidden]"
        >
          <slot name="face" :card="card">
            <span class="absolute left-2 top-1.5 flex flex-col items-center leading-none" :style="{ color: card.color }">
              <span class="text-base font-semibold">{{ card.rank }}</span>
              <span v-if="card.symbol" class="mt-0.5 text-xs">{{ card.symbol }}</span>
            </span>
            <span class="absolute bottom-1.5 right-2 flex rotate-180 flex-col items-center leading-none" :style="{ color: card.color }">
              <span class="text-base font-semibold">{{ card.rank }}</span>
              <span v-if="card.symbol" class="mt-0.5 text-xs">{{ card.symbol }}</span>
            </span>
            <span class="absolute inset-x-[22px] inset-y-[24px] flex flex-col items-center justify-center gap-1.5 rounded-md border border-dashed">
              <span class="text-4xl leading-none" :style="{ color: card.color }">{{ card.symbol ?? card.rank }}</span>
              <span v-if="card.title" class="max-w-full truncate px-1 text-[9px] font-medium uppercase tracking-[0.18em] text-muted-foreground">{{ card.title }}</span>
            </span>
          </slot>
        </span>
        <!-- Back -->
        <span
          class="absolute inset-0 overflow-hidden rounded-xl border bg-primary text-primary-foreground shadow-md [backface-visibility:hidden] [transform:rotateY(180deg)]"
        >
          <slot name="back">
            <span
              class="absolute inset-1.5 rounded-lg border border-current/25"
              :style="{
                backgroundImage: 'repeating-linear-gradient(45deg, color-mix(in oklab, currentColor 14%, transparent) 0 2px, transparent 2px 9px), repeating-linear-gradient(-45deg, color-mix(in oklab, currentColor 14%, transparent) 0 2px, transparent 2px 9px)',
              }"
            />
            <span class="absolute inset-0 flex items-center justify-center">
              <span class="flex size-9 items-center justify-center rounded-full border border-current/40 bg-primary text-sm">✦</span>
            </span>
          </slot>
        </span>
      </motion.button>

      <p :id="`${uid}-status`" class="sr-only" role="status" aria-live="polite">
        {{ announcement }}
      </p>
    </div>

    <slot
      name="controls"
      :deal="deal"
      :shuffle="shuffle"
      :draw="draw"
      :busy="busy"
      :deck-count="deck.length"
      :hand-count="hand.length"
      :played="table.map(id => byId.get(id)!)"
    />
  </div>
</template>
