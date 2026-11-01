<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { AnimatePresence, motion, useDomRef } from 'motion-v'
import { nextTick, onBeforeUnmount, useId, watch } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{
  /** Classes for the closed (trigger) surface. */
  class?: HTMLAttributes['class']
  /** Classes for the open dialog surface. */
  contentClass?: HTMLAttributes['class']
  /** Accessible name for the dialog. */
  label?: string
}>()

const open = defineModel<boolean>('open', { default: false })
const uid = useId()
const layoutId = `vx-morph-${uid}`

const trigger = useDomRef()
const dialog = useDomRef()

const spring = { type: 'spring', stiffness: 260, damping: 30, mass: 0.9 } as const

function close() {
  open.value = false
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape')
    close()
}

watch(open, async (isOpen) => {
  if (typeof document === 'undefined')
    return
  if (isOpen) {
    document.addEventListener('keydown', onKeydown)
    document.documentElement.style.overflow = 'hidden'
    await nextTick()
    ;(dialog.value as HTMLElement | null)?.focus()
  }
  else {
    document.removeEventListener('keydown', onKeydown)
    document.documentElement.style.overflow = ''
    await nextTick()
    ;(trigger.value as HTMLElement | null)?.focus({ preventScroll: true })
  }
})

onBeforeUnmount(() => {
  if (typeof document === 'undefined')
    return
  document.removeEventListener('keydown', onKeydown)
  document.documentElement.style.overflow = ''
})
</script>

<template>
  <div class="contents">
    <motion.button
      v-if="!open"
      ref="trigger"
      type="button"
      :layout-id="layoutId"
      :aria-haspopup="'dialog'"
      :class="cn(
        'block w-full cursor-pointer overflow-hidden rounded-2xl border bg-card text-left text-card-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
        props.class,
      )"
      :style="{ borderRadius: '16px' }"
      :transition="spring"
      @click="open = true"
    >
      <slot name="trigger" />
    </motion.button>
    <div
      v-else
      aria-hidden="true"
      :class="cn('invisible rounded-2xl border', props.class)"
    >
      <slot name="trigger" />
    </div>
  </div>

  <Teleport to="body">
    <AnimatePresence>
      <motion.div
        v-if="open"
        key="overlay"
        class="fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm"
        :initial="{ opacity: 0 }"
        :animate="{ opacity: 1 }"
        :exit="{ opacity: 0 }"
        @click="close"
      />
    </AnimatePresence>
    <!-- No exit animation here on purpose: the trigger re-mounts with the same
         layout-id and morphs back from the dialog's last position. -->
    <div
        v-if="open"
        class="pointer-events-none fixed inset-0 z-[91] flex items-center justify-center p-4"
      >
        <motion.div
          ref="dialog"
          role="dialog"
          aria-modal="true"
          :aria-label="props.label"
          tabindex="-1"
          :layout-id="layoutId"
          :class="cn(
            'pointer-events-auto relative max-h-[85vh] w-full max-w-lg overflow-auto border bg-card text-card-foreground shadow-2xl outline-none',
            props.contentClass,
          )"
          :style="{ borderRadius: '24px' }"
          :transition="spring"
        >
          <slot name="content" :close="close" />
          <motion.button
            type="button"
            aria-label="Close"
            class="absolute right-3 top-3 inline-flex size-8 items-center justify-center rounded-full bg-background/80 text-muted-foreground outline-none backdrop-blur hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
            :initial="{ opacity: 0, scale: 0.6 }"
            :animate="{ opacity: 1, scale: 1, transition: { delay: 0.15 } }"
            :exit="{ opacity: 0, scale: 0.6, transition: { duration: 0.1 } }"
            @click="close"
          >
            <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </motion.button>
        </motion.div>
      </div>
  </Teleport>
</template>
