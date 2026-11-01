<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { motion } from 'motion-v'
import { useId } from 'vue'
import { cn } from '@/lib/utils'

export interface AnimatedTabItem {
  value: string
  label: string
  disabled?: boolean
}

const props = withDefaults(defineProps<{
  items: AnimatedTabItem[]
  variant?: 'pill' | 'underline'
  class?: HTMLAttributes['class']
}>(), {
  variant: 'pill',
})

const model = defineModel<string>()
if (model.value === undefined && props.items.length)
  model.value = props.items[0]!.value

// Unique per instance so several tab bars on one page don't share an indicator.
const indicatorId = `vx-tabs-${useId()}`

function onKeydown(e: KeyboardEvent, index: number) {
  const enabled = props.items.map((item, i) => ({ item, i })).filter(({ item }) => !item.disabled)
  const pos = enabled.findIndex(({ i }) => i === index)
  let next: number | undefined
  if (e.key === 'ArrowRight')
    next = enabled[(pos + 1) % enabled.length]?.i
  else if (e.key === 'ArrowLeft')
    next = enabled[(pos - 1 + enabled.length) % enabled.length]?.i
  else if (e.key === 'Home')
    next = enabled[0]?.i
  else if (e.key === 'End')
    next = enabled.at(-1)?.i
  if (next === undefined)
    return
  e.preventDefault()
  model.value = props.items[next]!.value
  const list = (e.currentTarget as HTMLElement).parentElement
  ;(list?.children[next] as HTMLElement | undefined)?.focus()
}
</script>

<template>
  <div
    role="tablist"
    :class="cn(
      'relative inline-flex items-center',
      props.variant === 'pill' ? 'gap-1 rounded-xl bg-muted p-1' : 'gap-4 border-b',
      props.class,
    )"
  >
    <button
      v-for="(item, index) in props.items"
      :key="item.value"
      type="button"
      role="tab"
      :aria-selected="model === item.value"
      :tabindex="model === item.value ? 0 : -1"
      :disabled="item.disabled"
      :class="cn(
        'relative z-0 rounded-lg text-sm font-medium outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50',
        props.variant === 'pill' ? 'px-3 py-1.5' : 'px-1 pb-2.5 pt-1',
        model === item.value ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
      )"
      @click="model = item.value"
      @keydown="onKeydown($event, index)"
    >
      <motion.span
        v-if="model === item.value"
        :layout-id="indicatorId"
        aria-hidden="true"
        :class="cn(
          'absolute -z-10',
          props.variant === 'pill'
            ? 'inset-0 rounded-lg bg-background shadow-sm ring-1 ring-border/60'
            : 'inset-x-0 -bottom-px h-0.5 rounded-full bg-foreground',
        )"
        :transition="{ type: 'spring', stiffness: 420, damping: 34 }"
      />
      <slot name="item" :item="item" :active="model === item.value">
        {{ item.label }}
      </slot>
    </button>
  </div>
</template>
