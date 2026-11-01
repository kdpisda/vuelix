<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { AnimatePresence, motion, useAnimate, useReducedMotion } from 'motion-v'
import { computed, ref, useId, useSlots, watch } from 'vue'
import { cn } from '@/lib/utils'

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
  /** Text that sits inside the field and floats up on focus / when filled. */
  label: string
  /** Native input type. */
  type?: 'text' | 'email' | 'password' | 'search' | 'tel' | 'url' | 'number'
  /** Shown under the field when there is no error. */
  hint?: string
  /** Error message — slides in below the field and marks it invalid. */
  error?: string
  /** Show a clear button while the field has a value. */
  clearable?: boolean
  /** Placeholder, only visible once the label has floated. */
  placeholder?: string
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  name?: string
  id?: string
  autocomplete?: string
  class?: HTMLAttributes['class']
}>(), {
  type: 'text',
})

const emit = defineEmits<{ clear: [] }>()
const model = defineModel<string>({ default: '' })
const slots = useSlots()

const uid = useId()
const inputId = computed(() => props.id ?? `vx-floating-${uid}`)
const messageId = `vx-floating-msg-${uid}`

const input = ref<HTMLInputElement>()
const focused = ref(false)
const reduced = useReducedMotion()
const [field, animate] = useAnimate()

const hasValue = computed(() => model.value !== '' && model.value != null)
const floated = computed(() => focused.value || hasValue.value)
const hasIcon = computed(() => !!slots.icon)
const showClear = computed(() => props.clearable && hasValue.value && !props.disabled && !props.readonly)
const message = computed(() => props.error || props.hint)

const spring = { type: 'spring', stiffness: 520, damping: 34 } as const
const ringSpring = { type: 'spring', stiffness: 380, damping: 26 } as const

function clear() {
  model.value = ''
  emit('clear')
  input.value?.focus()
}

// A short shake whenever a new error appears.
watch(() => props.error, (now, before) => {
  if (now && !before && field.value && !reduced.value)
    animate(field.value, { x: [0, -6, 5, -3, 2, 0] }, { duration: 0.35 })
})

defineExpose({ focus: () => input.value?.focus() })
</script>

<template>
  <div :class="cn('w-full', props.class)">
    <div ref="field" class="relative">
      <span
        v-if="hasIcon"
        aria-hidden="true"
        :class="cn(
          'pointer-events-none absolute left-3.5 top-1/2 flex -translate-y-1/2 transition-colors [&_svg]:size-4',
          focused && !props.error ? 'text-foreground' : 'text-muted-foreground',
        )"
      >
        <slot name="icon" />
      </span>
      <input
        :id="inputId"
        ref="input"
        v-bind="$attrs"
        v-model="model"
        :type="props.type"
        :name="props.name"
        :disabled="props.disabled"
        :readonly="props.readonly"
        :required="props.required"
        :autocomplete="props.autocomplete"
        :placeholder="floated ? props.placeholder : undefined"
        :aria-invalid="props.error ? true : undefined"
        :aria-describedby="message ? messageId : undefined"
        :class="cn(
          'h-14 w-full rounded-xl border bg-background pb-2 pt-6 text-sm text-foreground shadow-xs outline-none transition-colors placeholder:text-muted-foreground/70 disabled:cursor-not-allowed disabled:opacity-50',
          hasIcon ? 'pl-10' : 'pl-3.5',
          showClear ? 'pr-10' : 'pr-3.5',
          props.error ? 'border-destructive' : 'hover:border-ring/60',
        )"
        @focus="focused = true"
        @blur="focused = false"
      >
      <motion.label
        :for="inputId"
        :class="cn(
          'pointer-events-none absolute top-0 origin-left select-none truncate text-sm leading-5 transition-colors',
          hasIcon ? 'left-10' : 'left-3.5',
          props.error ? 'text-destructive' : focused ? 'text-foreground' : 'text-muted-foreground',
          props.disabled && 'opacity-50',
        )"
        :style="{ maxWidth: 'calc(100% - 4rem)' }"
        :initial="false"
        :animate="floated ? { y: 8, scale: 0.76 } : { y: 18, scale: 1 }"
        :transition="spring"
      >
        {{ props.label }}<span v-if="props.required" aria-hidden="true" class="text-destructive"> *</span>
      </motion.label>
      <!-- Focus ring: springs in from a slightly smaller outline. -->
      <motion.span
        aria-hidden="true"
        :class="cn(
          'pointer-events-none absolute inset-0 rounded-xl border ring-[3px]',
          props.error ? 'border-destructive ring-destructive/20' : 'border-ring ring-ring/30',
        )"
        :initial="false"
        :animate="focused ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.97 }"
        :transition="ringSpring"
      />
      <AnimatePresence>
        <motion.button
          v-if="showClear"
          key="clear"
          type="button"
          tabindex="-1"
          aria-label="Clear"
          class="absolute right-2.5 top-1/2 -mt-3 flex size-6 items-center justify-center rounded-full text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground"
          :initial="{ opacity: 0, scale: 0.4, rotate: -90 }"
          :animate="{ opacity: 1, scale: 1, rotate: 0 }"
          :exit="{ opacity: 0, scale: 0.4, rotate: 90 }"
          :transition="spring"
          @mousedown.prevent
          @click="clear"
        >
          <svg class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
        </motion.button>
      </AnimatePresence>
    </div>
    <div class="relative" aria-live="polite">
      <AnimatePresence mode="wait" :initial="false">
        <motion.p
          v-if="props.error"
          :id="messageId"
          key="error"
          class="m-0 overflow-hidden px-1 text-xs text-destructive"
          :initial="{ opacity: 0, y: -6, height: 0 }"
          :animate="{ opacity: 1, y: 0, height: 'auto' }"
          :exit="{ opacity: 0, y: -6, height: 0 }"
          :transition="{ type: 'spring', stiffness: 500, damping: 36 }"
        >
          <span class="block pt-1.5">{{ props.error }}</span>
        </motion.p>
        <motion.p
          v-else-if="props.hint"
          :id="messageId"
          key="hint"
          class="m-0 overflow-hidden px-1 text-xs text-muted-foreground"
          :initial="{ opacity: 0, height: 0 }"
          :animate="{ opacity: 1, height: 'auto' }"
          :exit="{ opacity: 0, height: 0 }"
          :transition="{ duration: 0.15 }"
        >
          <span class="block pt-1.5">{{ props.hint }}</span>
        </motion.p>
      </AnimatePresence>
    </div>
  </div>
</template>
