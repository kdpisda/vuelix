<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { AnimatePresence, motion, useAnimate } from 'motion-v'
import { computed, ref, watch } from 'vue'
import { cn } from '@/lib/utils'

const props = withDefaults(defineProps<{
  length?: number
  /** Only accept digits. */
  numeric?: boolean
  disabled?: boolean
  /** Show the error shake + red ring. */
  invalid?: boolean
  /** Insert a separator after this many slots (e.g. 3 → "123-456"). */
  groupSize?: number
  autofocus?: boolean
  class?: HTMLAttributes['class']
}>(), {
  length: 6,
  numeric: true,
})

const emit = defineEmits<{ complete: [value: string] }>()
const model = defineModel<string>({ default: '' })

const input = ref<HTMLInputElement>()
const focused = ref(false)
const [scope, animate] = useAnimate()

const slots = computed(() => Array.from({ length: props.length }, (_, i) => model.value[i] ?? ''))
const activeIndex = computed(() => Math.min(model.value.length, props.length - 1))

function onInput(e: Event) {
  const el = e.target as HTMLInputElement
  let v = el.value
  if (props.numeric)
    v = v.replace(/\D/g, '')
  v = v.slice(0, props.length)
  el.value = v
  model.value = v
}

watch(model, (v) => {
  if (v.length === props.length)
    emit('complete', v)
})

watch(() => props.invalid, (v) => {
  if (v && scope.value)
    animate(scope.value, { x: [0, -10, 9, -6, 4, 0] }, { duration: 0.4 })
})
</script>

<template>
  <div
    ref="scope"
    :class="cn('relative inline-flex items-center gap-2', props.disabled && 'opacity-50', props.class)"
    @click="input?.focus()"
  >
    <input
      ref="input"
      :value="model"
      :maxlength="props.length"
      :disabled="props.disabled"
      :autofocus="props.autofocus"
      :inputmode="props.numeric ? 'numeric' : 'text'"
      :pattern="props.numeric ? '\\d*' : undefined"
      autocomplete="one-time-code"
      :aria-label="`${props.length}-character code`"
      :aria-invalid="props.invalid || undefined"
      class="absolute inset-0 z-10 size-full cursor-text opacity-0 disabled:cursor-not-allowed"
      @input="onInput"
      @focus="focused = true"
      @blur="focused = false"
    >
    <template v-for="(char, i) in slots" :key="i">
      <span
        v-if="props.groupSize && i > 0 && i % props.groupSize === 0"
        aria-hidden="true"
        class="h-0.5 w-3 rounded-full bg-border"
      />
      <motion.div
        aria-hidden="true"
        :class="cn(
          'relative flex size-12 items-center justify-center rounded-xl border bg-background text-xl font-semibold shadow-xs transition-colors',
          focused && i === activeIndex && !props.invalid && 'border-ring ring-[3px] ring-ring/30',
          props.invalid && 'border-destructive ring-[3px] ring-destructive/20',
        )"
        :animate="{ scale: focused && i === activeIndex ? 1.06 : 1 }"
        :transition="{ type: 'spring', stiffness: 500, damping: 28 }"
      >
        <AnimatePresence mode="popLayout" :initial="false">
          <motion.span
            v-if="char"
            :key="char + i"
            :initial="{ y: 14, opacity: 0, scale: 0.6, filter: 'blur(4px)' }"
            :animate="{ y: 0, opacity: 1, scale: 1, filter: 'blur(0px)' }"
            :exit="{ y: -10, opacity: 0, scale: 0.6, filter: 'blur(4px)' }"
            :transition="{ type: 'spring', stiffness: 500, damping: 26 }"
          >
            {{ char }}
          </motion.span>
        </AnimatePresence>
        <!-- Kept outside AnimatePresence: an infinitely repeating animation never finishes an exit. -->
        <motion.span
          v-if="!char && focused && i === activeIndex"
          class="absolute h-6 w-0.5 rounded-full bg-foreground"
          :initial="{ opacity: 1 }"
          :animate="{ opacity: [1, 1, 0, 0] }"
          :transition="{ duration: 1, repeat: Infinity, times: [0, 0.5, 0.5, 1] }"
        />
      </motion.div>
    </template>
  </div>
</template>
