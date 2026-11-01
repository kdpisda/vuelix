export interface DonutChartDatum {
  label: string
  /** Non-negative amount; segments are sized by their share of the total. */
  value: number
  /** Any CSS colour. Defaults to the `--chart-1…5` tokens in order. */
  color?: string
}
