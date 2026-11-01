export interface BarChartSeries {
  /** Shown in the legend and tooltip; must be unique within the chart. */
  name: string
  /** One value per label. Negative values grow the other way (grouped mode). */
  data: number[]
  /** Any CSS colour. Defaults to the `--chart-1…5` tokens in order. */
  color?: string
}
