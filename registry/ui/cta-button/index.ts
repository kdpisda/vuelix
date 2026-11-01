import type { VariantProps } from 'class-variance-authority'
import { cva } from 'class-variance-authority'

export { default as CtaButton } from './CtaButton.vue'

export const ctaButtonVariants = cva(
  'group relative isolate inline-flex select-none items-center justify-center overflow-hidden whitespace-nowrap rounded-full font-medium no-underline outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-60 aria-disabled:pointer-events-none aria-disabled:opacity-60 [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        'shimmer': 'bg-primary text-primary-foreground shadow-sm',
        'gradient-border': 'bg-border p-[1.5px] text-foreground shadow-sm',
        'magnetic': 'bg-brand text-black shadow-md shadow-brand/25',
        'arrow': 'bg-primary text-primary-foreground shadow-sm',
      },
      size: {
        sm: 'h-8 text-xs [&_svg]:size-3.5',
        md: 'h-10 text-sm [&_svg]:size-4',
        lg: 'h-12 text-base [&_svg]:size-[1.1rem]',
      },
    },
    defaultVariants: {
      variant: 'shimmer',
      size: 'md',
    },
  },
)

export type CtaButtonVariants = VariantProps<typeof ctaButtonVariants>
