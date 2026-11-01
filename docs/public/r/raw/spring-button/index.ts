import type { VariantProps } from 'class-variance-authority'
import { cva } from 'class-variance-authority'

export { default as SpringButton } from './SpringButton.vue'

export const springButtonVariants = cva(
  'relative inline-flex items-center justify-center gap-2 overflow-hidden whitespace-nowrap rounded-lg text-sm font-medium outline-none select-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-60 [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow-sm',
        secondary: 'bg-secondary text-secondary-foreground',
        outline: 'border bg-background text-foreground shadow-xs hover:bg-accent',
        ghost: 'text-foreground hover:bg-accent',
        destructive: 'bg-destructive text-white shadow-sm',
        brand: 'bg-brand text-black shadow-sm',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        default: 'h-10 px-4',
        lg: 'h-12 px-6 text-base',
        icon: 'size-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export type SpringButtonVariants = VariantProps<typeof springButtonVariants>
