import type { VariantProps } from 'class-variance-authority'
import { cva } from 'class-variance-authority'

export { default as MotionBadge } from './MotionBadge.vue'

export const motionBadgeVariants = cva(
  'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border font-medium leading-none tabular-nums',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        outline: 'bg-background text-foreground [--vx-badge-dot:var(--color-chart-1)]',
        success: 'border-chart-1/30 bg-chart-1/12 text-foreground [--vx-badge-dot:var(--color-chart-1)]',
        warning: 'border-chart-4/40 bg-chart-4/15 text-foreground [--vx-badge-dot:var(--color-chart-4)]',
        destructive: 'border-transparent bg-destructive text-white',
        brand: 'border-transparent bg-brand text-black',
      },
      size: {
        sm: 'h-5 px-2 text-[0.6875rem]',
        md: 'h-6 px-2.5 text-xs',
        lg: 'h-7 px-3 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  },
)

export type MotionBadgeVariants = VariantProps<typeof motionBadgeVariants>
