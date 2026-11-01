export interface TreemapItem {
  /** Unique name; tiles are matched by label when the data changes. */
  label: string
  value: number
  /** Items in the same group share a colour. */
  group?: string
  /** Any CSS colour. Defaults to a `--chart-*` token per group (or per item). */
  color?: string
}
