export interface BookLevel {
  price: number
  size: number
}

export interface LadderRow {
  price: number
  size: number
  /** Size from the best price up to and including this level. */
  total: number
}

/** Best `rows` levels of one side, best first, with running totals. Empty levels are dropped. */
export function ladder(levels: BookLevel[], side: 'bid' | 'ask', rows: number): LadderRow[] {
  const sorted = levels
    .filter(l => l.size > 0)
    .sort((a, b) => (side === 'bid' ? b.price - a.price : a.price - b.price))
    .slice(0, rows)
  let total = 0
  return sorted.map((l) => {
    total += l.size
    return { price: l.price, size: l.size, total }
  })
}

/** Size-weighted average price and totals from the best level to row `index` (inclusive). */
export function sweep(rows: LadderRow[], index: number) {
  const slice = rows.slice(0, index + 1)
  const size = slice.reduce((s, r) => s + r.size, 0)
  const notional = slice.reduce((s, r) => s + r.size * r.price, 0)
  return { size, notional, average: size ? notional / size : 0 }
}
