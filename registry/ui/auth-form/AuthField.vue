<script setup lang="ts">
import type { InputTypeHTMLAttribute } from 'vue'
import { AnimatePresence, motion } from 'motion-v'
import { computed, ref, useId } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{
  label: string
  type?: InputTypeHTMLAttribute
  name?: string
  autocomplete?: string
  /** Inline error; slides in under the field. */
  error?: string
  /** Extra id(s) for aria-describedby (e.g. a strength meter). */
  describedby?: string
}>()

const model = defineModel<string>({ default: '' })
const emit = defineEmits<{ blur: [] }>()

const id = `vx-auth-${useId()}`
const focused = ref(false)
const floated = computed(() => focused.value || model.value.length > 0)
const SPRING = { type: 'spring', stiffness: 500, damping: 34 } as const
</script>

<template>
  <div>
    <div
      :class="cn(
        'relative flex items-center rounded-xl border bg-background transition-[border-color,box-shadow]',
        focused && !props.error && 'border-ring ring-[3px] ring-ring/30',
        props.error && 'border-destructive',
        props.error && focused && 'ring-[3px] ring-destructive/20',
      )"
    >
      <motion.label
        :for="id"
        class="pointer-events-none absolute left-3 top-[17px] origin-top-left text-sm leading-5"
        :class="floated ? (props.error ? 'text-destructive' : 'text-muted-foreground') : 'text-muted-foreground'"
        :initial="false"
        :animate="floated ? { y: -10, scale: 0.78 } : { y: 0, scale: 1 }"
        :transition="SPRING"
      >
        {{ props.label }}
      </motion.label>
      <input
        :id="id"
        v-model="model"
        :type="props.type ?? 'text'"
        :name="props.name"
        :autocomplete="props.autocomplete"
        :aria-invalid="props.error ? true : undefined"
        :aria-describedby="[props.error ? `${id}-error` : '', props.describedby ?? ''].join(' ').trim() || undefined"
        class="h-14 w-full min-w-0 flex-1 rounded-xl bg-transparent px-3 pb-1.5 pt-5 text-sm text-foreground outline-none"
        @focus="focused = true"
        @blur="focused = false; emit('blur')"
      >
      <slot name="trailing" />
    </div>
    <AnimatePresence :initial="false">
      <motion.p
        v-if="props.error"
        :id="`${id}-error`"
        key="error"
        class="m-0 flex items-center gap-1.5 overflow-hidden pl-1 text-xs text-destructive"
        :initial="{ opacity: 0, height: 0, y: -4 }"
        :animate="{ opacity: 1, height: 'auto', y: 0, marginTop: 6 }"
        :exit="{ opacity: 0, height: 0, y: -4, marginTop: 0 }"
        :transition="SPRING"
      >
        <svg class="size-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg>
        {{ props.error }}
      </motion.p>
    </AnimatePresence>
  </div>
</template>
