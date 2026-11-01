export interface YearReturns {
  year: number
  /** Twelve monthly returns in percent (2.4 = +2.4%), January first. `null` = no data. */
  months: (number | null)[]
}

/** Compounds percentage returns: [10, -5] → +4.5. Missing months are skipped. */
export function compound(returns: (number | null | undefined)[]) {
  let growth = 1
  let any = false
  for (const r of returns) {
    if (r === null || r === undefined)
      continue
    growth *= 1 + r / 100
    any = true
  }
  return any ? (growth - 1) * 100 : null
}

export function mean(values: (number | null | undefined)[]) {
  const v = values.filter((x): x is number => x !== null && x !== undefined)
  return v.length ? v.reduce((s, x) => s + x, 0) / v.length : null
}

/** Signed percentage with a real minus sign: +2.4 / −1.3. */
export function signed(v: number, digits: number, suffix = '') {
  const s = Math.abs(v).toFixed(digits)
  return `${v > 0 && Number(s) !== 0 ? '+' : v < 0 && Number(s) !== 0 ? '−' : ''}${s}${suffix}`
}
