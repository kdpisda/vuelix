<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

export type ChatMessageFrom = 'user' | 'assistant'

const props = withDefaults(defineProps<{
  /** Who wrote it — the user's bubble is filled, the assistant's is a quiet card. */
  from?: ChatMessageFrom
  /** Shows a blinking caret after the last element while text is still arriving. */
  streaming?: boolean
  class?: HTMLAttributes['class']
}>(), {
  from: 'assistant',
  streaming: false,
})

// Light "markdown-ish" typography for whatever HTML lands in the slot.
const prose = [
  'min-w-0 max-w-full break-words text-sm leading-6',
  '[&_p]:m-0 [&_p+p]:mt-3 [&_p+ul]:mt-2 [&_p+ol]:mt-2 [&_ul+p]:mt-2 [&_ol+p]:mt-2',
  '[&_ul]:m-0 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:m-0 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-0.5 [&_li]:pl-0.5',
  '[&_strong]:font-semibold [&_em]:italic [&_a]:font-medium [&_a]:underline [&_a]:underline-offset-2',
  '[&_h3]:mt-3 [&_h3]:mb-1 [&_h3]:text-sm [&_h3]:font-semibold [&_h3:first-child]:mt-0',
  '[&_code]:rounded-md [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.85em]',
  '[&_pre]:my-3 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:p-3 [&_pre]:text-xs [&_pre]:leading-5 [&_pre_code]:bg-transparent [&_pre_code]:p-0',
  '[&_blockquote]:my-2 [&_blockquote]:border-l-2 [&_blockquote]:pl-3 [&_blockquote]:opacity-80',
]

// Blinking caret at the end of the last block — or of the last list item when the content ends in a list.
const caret = [
  '[&>:last-child:not(ul,ol),&>:is(ul,ol):last-child>li:last-child]:after:ml-0.5',
  '[&>:last-child:not(ul,ol),&>:is(ul,ol):last-child>li:last-child]:after:inline-block',
  '[&>:last-child:not(ul,ol),&>:is(ul,ol):last-child>li:last-child]:after:h-[1.05em]',
  '[&>:last-child:not(ul,ol),&>:is(ul,ol):last-child>li:last-child]:after:w-[0.45em]',
  '[&>:last-child:not(ul,ol),&>:is(ul,ol):last-child>li:last-child]:after:translate-y-[0.18em]',
  '[&>:last-child:not(ul,ol),&>:is(ul,ol):last-child>li:last-child]:after:rounded-[2px]',
  '[&>:last-child:not(ul,ol),&>:is(ul,ol):last-child>li:last-child]:after:bg-current',
  '[&>:last-child:not(ul,ol),&>:is(ul,ol):last-child>li:last-child]:after:opacity-70',
  '[&>:last-child:not(ul,ol),&>:is(ul,ol):last-child>li:last-child]:after:animate-pulse',
  'motion-reduce:[&>:last-child:not(ul,ol),&>:is(ul,ol):last-child>li:last-child]:after:animate-none',
  '[&>:last-child:not(ul,ol),&>:is(ul,ol):last-child>li:last-child]:after:content-[\'\']',
]
</script>

<template>
  <div
    :data-from="props.from"
    :aria-busy="props.streaming || undefined"
    :class="cn(
      prose,
      'rounded-2xl px-4 py-2.5',
      props.from === 'user'
        ? 'rounded-br-md bg-primary text-primary-foreground [&_code]:bg-primary-foreground/15 [&_pre]:bg-primary-foreground/10'
        : 'rounded-bl-md border bg-card text-card-foreground shadow-xs [&_code]:bg-muted [&_pre]:bg-muted',
      props.streaming && caret,
      props.class,
    )"
  >
    <slot />
  </div>
</template>
