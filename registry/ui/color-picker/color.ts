// Tiny, dependency-free color math for the color picker.
//
// Conventions used everywhere in this file:
//   r, g, b  → 0–255 (integers once rounded)
//   h        → 0–360 degrees
//   s, v, l  → 0–100 percent
//   a        → 0–1

export interface Rgba { r: number, g: number, b: number, a: number }
export interface Hsva { h: number, s: number, v: number, a: number }
export interface Hsla { h: number, s: number, l: number, a: number }

export type ColorFormat = 'hex' | 'rgb' | 'hsl'

export const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))

const toHexByte = (n: number) => Math.round(clamp(n, 0, 255)).toString(16).padStart(2, '0')

/** Parses `#rgb`, `#rgba`, `#rrggbb` or `#rrggbbaa` (the `#` is optional). Returns `null` if invalid. */
export function parseHex(input: string): Rgba | null {
  let hex = input.trim().replace(/^#/, '')
  if (!/^(?:[\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$/i.test(hex))
    return null
  if (hex.length <= 4)
    hex = [...hex].map(c => c + c).join('')
  const n = (i: number) => Number.parseInt(hex.slice(i, i + 2), 16)
  return { r: n(0), g: n(2), b: n(4), a: hex.length === 8 ? n(6) / 255 : 1 }
}

/**
 * Lenient parser for pasted values: any hex form, `rgb()/rgba()` or `hsl()/hsla()`
 * (comma or space separated, optional `/ alpha`). Returns `null` if it can't make sense of it.
 */
export function parseColor(input: string): Rgba | null {
  const text = input.trim().toLowerCase()
  const fn = /^(rgba?|hsla?)\(([^)]*)\)$/.exec(text)
  if (!fn)
    return parseHex(text)
  const parts = fn[2]!.split(/[\s,/]+/).filter(Boolean)
  if (parts.length < 3 || parts.length > 4)
    return null
  const num = (p: string) => Number.parseFloat(p)
  const nums = parts.map(num)
  if (nums.some(Number.isNaN))
    return null
  const alphaPart = parts[3]
  const a = alphaPart === undefined ? 1 : clamp(alphaPart.endsWith('%') ? num(alphaPart) / 100 : num(alphaPart), 0, 1)
  if (fn[1]!.startsWith('rgb')) {
    const ch = (p: string) => clamp(p.endsWith('%') ? num(p) * 2.55 : num(p), 0, 255)
    return { r: ch(parts[0]!), g: ch(parts[1]!), b: ch(parts[2]!), a }
  }
  return hslToRgb({ h: ((nums[0]! % 360) + 360) % 360, s: clamp(nums[1]!, 0, 100), l: clamp(nums[2]!, 0, 100), a })
}

/** `#rrggbb`, or `#rrggbbaa` when `alpha` is true and the color isn't fully opaque. */
export function toHex({ r, g, b, a }: Rgba, alpha = false): string {
  const base = `#${toHexByte(r)}${toHexByte(g)}${toHexByte(b)}`
  return alpha && a < 1 ? base + toHexByte(a * 255) : base
}

export function hsvToRgb({ h, s, v, a }: Hsva): Rgba {
  const sat = s / 100
  const val = v / 100
  // f(n) walks the hue wheel once per channel (n = 5 → red, 3 → green, 1 → blue).
  const f = (n: number) => {
    const k = (n + h / 60) % 6
    return val - val * sat * Math.max(0, Math.min(k, 4 - k, 1))
  }
  return { r: f(5) * 255, g: f(3) * 255, b: f(1) * 255, a }
}

/** Hue of an rgb triple (0–360); `fallback` is returned for greys, where hue is undefined. */
function hueOf(r: number, g: number, b: number, max: number, delta: number, fallback: number) {
  if (delta === 0)
    return fallback
  let h: number
  if (max === r)
    h = ((g - b) / delta) % 6
  else if (max === g)
    h = (b - r) / delta + 2
  else
    h = (r - g) / delta + 4
  return (h * 60 + 360) % 360
}

/** `hue` is kept for greys (s = 0) so a picker's hue slider doesn't jump back to red. */
export function rgbToHsv({ r, g, b, a }: Rgba, hue = 0): Hsva {
  const [rn, gn, bn] = [r / 255, g / 255, b / 255]
  const max = Math.max(rn, gn, bn)
  const delta = max - Math.min(rn, gn, bn)
  return {
    h: hueOf(rn, gn, bn, max, delta, hue),
    s: max === 0 ? 0 : (delta / max) * 100,
    v: max * 100,
    a,
  }
}

export function rgbToHsl({ r, g, b, a }: Rgba, hue = 0): Hsla {
  const [rn, gn, bn] = [r / 255, g / 255, b / 255]
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const delta = max - min
  const l = (max + min) / 2
  return {
    h: hueOf(rn, gn, bn, max, delta, hue),
    s: delta === 0 ? 0 : (delta / (1 - Math.abs(2 * l - 1))) * 100,
    l: l * 100,
    a,
  }
}

export function hslToRgb({ h, s, l, a }: Hsla): Rgba {
  const sat = s / 100
  const lig = l / 100
  const k = sat * Math.min(lig, 1 - lig)
  const f = (n: number) => {
    const m = (n + h / 30) % 12
    return lig - k * Math.max(-1, Math.min(m - 3, 9 - m, 1))
  }
  return { r: f(0) * 255, g: f(8) * 255, b: f(4) * 255, a }
}

// HSV ↔ HSL directly, so editing in HSL never loses the hue through an rgb round-trip.
export function hsvToHsl({ h, s, v, a }: Hsva): Hsla {
  const sv = s / 100
  const vv = v / 100
  const l = vv * (1 - sv / 2)
  const sl = l === 0 || l === 1 ? 0 : (vv - l) / Math.min(l, 1 - l)
  return { h, s: sl * 100, l: l * 100, a }
}

export function hslToHsv({ h, s, l, a }: Hsla): Hsva {
  const sl = s / 100
  const ll = l / 100
  const v = ll + sl * Math.min(ll, 1 - ll)
  return { h, s: v === 0 ? 0 : 2 * (1 - ll / v) * 100, v: v * 100, a }
}

/** Relative luminance (0–1) — handy for picking a readable foreground on top of a color. */
export function luminance({ r, g, b }: Rgba): number {
  const lin = (c: number) => {
    const n = c / 255
    return n <= 0.03928 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}
