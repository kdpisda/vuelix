<script setup lang="ts">
import type { TokenSwapToken } from './types'
import { motion } from 'motion-v'
import { computed, nextTick, onMounted, ref, useId } from 'vue'
import { cn } from '@/lib/utils'
import TokenSwapIcon from './TokenSwapIcon.vue'
import { formatAmount } from './types'

const props = defineProps<{
  tokens: TokenSwapToken[]
  selected?: string
  title: string
}>()

const emit = defineEmits<{
  pick: [symbol: string]
  close: []
}>()

const listId = `vx-swap-list-${useId()}`
const query = ref('')
const input = ref<HTMLInputElement>()
const results = computed(() => {
  const q = query.value.trim().toLowerCase()
  return props.tokens.filter(t => !q || t.symbol.toLowerCase().includes(q) || t.name.toLowerCase().includes(q))
})
const active = ref(0)
const optionId = (i: number) => `${listId}-${i}`

onMounted(async () => {
  active.value = Math.max(0, results.value.findIndex(t => t.symbol === props.selected))
  await nextTick()
  input.value?.focus()
})

function onKeydown(e: KeyboardEvent) {
  const n = results.value.length
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault()
    if (n)
      active.value = (active.value + (e.key === 'ArrowDown' ? 1 : -1) + n) % n
    document.getElementById(optionId(active.value))?.scrollIntoView({ block: 'nearest' })
  }
  else if (e.key === 'Enter') {
    e.preventDefault()
    const t = results.value[active.value]
    if (t)
      emit('pick', t.symbol)
  }
  else if (e.key === 'Escape') {
    e.preventDefault()
    emit('close')
  }
}
</script>

<template>
  <motion.div
    role="dialog"
    :aria-label="props.title"
    class="absolute inset-0 z-30 flex flex-col bg-card p-4"
    :initial="{ opacity: 0, y: 24 }"
    :animate="{ opacity: 1, y: 0 }"
    :exit="{ opacity: 0, y: 24, transition: { duration: 0.15 } }"
    :transition="{ type: 'spring', stiffness: 420, damping: 36 }"
    @keydown="onKeydown"
  >
    <div class="flex items-center justify-between">
      <p class="m-0 text-sm font-semibold">
        {{ props.title }}
      </p>
      <button
        type="button"
        aria-label="Close"
        class="inline-flex size-8 items-center justify-center rounded-full text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
        @click="emit('close')"
      >
        <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
      </button>
    </div>
    <label class="relative mt-3 block">
      <span class="sr-only">Search tokens</span>
      <svg class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
      <input
        ref="input"
        v-model="query"
        type="text"
        role="combobox"
        aria-expanded="true"
        :aria-controls="listId"
        :aria-activedescendant="results.length ? optionId(active) : undefined"
        autocomplete="off"
        placeholder="Search name or symbol"
        class="h-10 w-full rounded-xl border bg-background pl-9 pr-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
        @input="active = 0"
      >
    </label>
    <ul :id="listId" role="listbox" :aria-label="props.title" class="-mx-2 mt-2 min-h-0 flex-1 list-none overflow-y-auto p-0">
      <li
        v-for="(t, i) in results"
        :id="optionId(i)"
        :key="t.symbol"
        role="option"
        :aria-selected="t.symbol === props.selected"
        :class="cn(
          'flex cursor-pointer items-center gap-3 rounded-xl px-2 py-2',
          i === active && 'bg-muted',
        )"
        @pointermove="active = i"
        @click="emit('pick', t.symbol)"
      >
        <TokenSwapIcon :token="t" class="size-8" />
        <span class="min-w-0 flex-1">
          <span class="block text-sm font-medium">{{ t.symbol }}</span>
          <span class="block truncate text-xs text-muted-foreground">{{ t.name }}</span>
        </span>
        <span v-if="t.balance !== undefined" class="text-right text-sm tabular-nums text-muted-foreground">{{ formatAmount(t.balance) }}</span>
        <svg v-if="t.symbol === props.selected" class="size-4 text-brand" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
      </li>
      <li v-if="!results.length" class="px-2 py-6 text-center text-sm text-muted-foreground">
        No tokens match “{{ query }}”.
      </li>
    </ul>
  </motion.div>
</template>
