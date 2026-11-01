import type { VariantProps } from 'class-variance-authority'
import { cva } from 'class-variance-authority'

export { default as Alert } from './Alert.vue'

export const alertVariants = cva(
  'relative flex w-full items-start gap-3 rounded-xl border px-4 py-3.5 text-sm shadow-xs',
  {
    variants: {
      variant: {
        info: 'border-chart-2/30 bg-card bg-linear-to-br from-chart-2/12 to-chart-2/4 text-foreground [--vx-alert-accent:var(--color-chart-2)]',
        success: 'border-chart-1/30 bg-card bg-linear-to-br from-chart-1/12 to-chart-1/4 text-foreground [--vx-alert-accent:var(--color-chart-1)]',
        warning: 'border-chart-4/40 bg-card bg-linear-to-br from-chart-4/12 to-chart-4/4 text-foreground [--vx-alert-accent:var(--color-chart-4)]',
        error: 'border-destructive/30 bg-card bg-linear-to-br from-destructive/12 to-destructive/4 text-foreground [--vx-alert-accent:var(--color-destructive)]',
      },
    },
    defaultVariants: {
      variant: 'info',
    },
  },
)

export type AlertVariants = VariantProps<typeof alertVariants>
