export type StatusHistoryStatus = 'ok' | 'degraded' | 'down' | 'unknown'

export interface StatusHistoryEntry {
  /** Period name shown in the tooltip, e.g. "Oct 12, 2026". */
  label: string
  status: StatusHistoryStatus
  /** Uptime % for the period. Inferred from `status` when omitted (100, or 0 for `down`). */
  uptime?: number
  /** Optional incident summary for the tooltip. */
  note?: string
}
