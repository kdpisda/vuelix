<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { useInView, useMotionValueEvent, useSpring } from 'motion-v'
import { computed, onMounted, ref, watch } from 'vue'
import { cn } from '@/lib/utils'

const props = withDefaults(defineProps<{
  value: number
  /** Value to count from on first reveal. */
  from?: number
  locale?: string
  format?: Intl.NumberFormatOptions
  /** Only start counting once scrolled into view. */
  startOnView?: boolean
  stiffness?: number
  damping?: number
  class?: HTMLAttributes['class']
}>(), {
  from: 0,
  startOnView: true,
  stiffness: 90,
  damping: 22,
})

const el = ref<HTMLElement>()
const inView = useInView(el, { once: true, margin: '0px 0px -10% 0px' })

const spring = useSpring(props.from, computed(() => ({
  stiffness: props.stiffness,
  damping: props.damping,
})))

const formatter = computed(() => new Intl.NumberFormat(props.locale, props.format))
const display = ref(formatter.value.format(props.from))

useMotionValueEvent(spring, 'change', (latest) => {
  // Springs come to rest within a tiny threshold of the target — snap the last frame.
  const settled = Math.abs(latest - props.value) < 0.5 ? props.value : latest
  display.value = formatter.value.format(
    props.format?.maximumFractionDigits ? settled : Math.round(settled),
  )
})

function sync() {
  if (!props.startOnView || inView.value)
    spring.set(props.value)
}

onMounted(sync)
watch([() => props.value, inView], sync)
watch(formatter, f => (display.value = f.format(spring.get())))
</script>

<template>
  <span
    ref="el"
    :class="cn('inline-block tabular-nums tracking-tight', props.class)"
    :aria-label="formatter.format(props.value)"
  >
    <span aria-hidden="true">{{ display }}</span>
  </span>
</template>
