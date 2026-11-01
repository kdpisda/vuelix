import type { HTMLAttributes } from 'vue'

export interface DataTableColumn<R = Record<string, any>> {
  /** Property of the row shown in this column (also the `#cell-<key>` slot name). */
  key: string
  label: string
  sortable?: boolean
  align?: 'left' | 'center' | 'right'
  /** Value used for sorting when it differs from the displayed one. */
  sortValue?: (row: R) => string | number | Date | null | undefined
  /** Extra classes for the header and body cells of this column. */
  class?: HTMLAttributes['class']
}

export interface DataTableSort {
  key: string
  direction: 'asc' | 'desc'
}
