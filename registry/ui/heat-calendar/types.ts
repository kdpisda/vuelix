export interface HeatCalendarDay {
  /** ISO date, `YYYY-MM-DD`. Repeated dates are summed. */
  date: string
  value: number
}

export interface HeatCalendarRange {
  /** First selected day, `YYYY-MM-DD`. */
  start: string
  /** Last selected day, `YYYY-MM-DD`. */
  end: string
  /** Number of days in the range. */
  days: number
  /** Sum of values in the range. */
  total: number
}
