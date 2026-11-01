export interface BumpChartSeries {
  /** Unique name, shown at both ends of the line. */
  name: string
  /** Rank per period, 1 = top. One entry per label. */
  ranks: number[]
  /** Any CSS colour. Defaults to the `--chart-1…5` tokens in order. */
  color?: string
}
