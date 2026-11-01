export interface TokenSwapToken {
  symbol: string
  name: string
  /** USD price, used for rates and fiat values. */
  price: number
  balance?: number
  /** Logo URL. Without it a lettered chip is shown. */
  icon?: string
  /** Background of the lettered chip (any CSS color). */
  color?: string
}

export interface TokenSwapQuote {
  from: string
  to: string
  amountIn: number
  amountOut: number
  /** Units of `to` per 1 `from`. */
  rate: number
  /** Percent. */
  slippage: number
  minReceived: number
  fee: number
  /** Percent. */
  priceImpact: number
}

export function formatAmount(n: number, max?: number) {
  const digits = max ?? (n >= 1000 ? 2 : n >= 1 ? 4 : 6)
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: digits }).format(n)
}

export function formatUsd(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n)
}
