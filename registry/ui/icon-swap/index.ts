import type { VariantProps } from 'class-variance-authority'
import type { Component, HTMLAttributes } from 'vue'
import { cva } from 'class-variance-authority'

export { default as IconSwap } from './IconSwap.vue'

export interface IconSwapState<V = unknown> {
  /** Model value while this state is shown. */
  value: V
  /** Accessible name of the button in this state (also the visible text with `showLabel`). */
  label: string
  /** Icon component, e.g. from lucide-vue-next. Or use the `#icon` slot. */
  icon?: Component
  /** Extra classes on the button while this state is active (colour, fill…). */
  class?: HTMLAttributes['class']
  /** Play a particle burst when the button switches into this state. */
  burst?: boolean
}

export const iconSwapVariants = cva(
  'relative inline-flex select-none items-center justify-center gap-2 rounded-lg text-sm font-medium outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        ghost: 'text-foreground hover:bg-accent',
        outline: 'border bg-background text-foreground shadow-xs hover:bg-accent',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        default: 'bg-primary text-primary-foreground shadow-sm',
      },
      size: {
        sm: 'h-8 min-w-8 px-2 text-xs [&_svg]:size-3.5',
        md: 'h-9 min-w-9 px-2.5 [&_svg]:size-4',
        lg: 'h-11 min-w-11 px-3 text-base [&_svg]:size-5',
      },
    },
    defaultVariants: {
      variant: 'outline',
      size: 'md',
    },
  },
)

export type IconSwapVariants = VariantProps<typeof iconSwapVariants>
