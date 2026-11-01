export interface TreemapRect { x: number, y: number, w: number, h: number }

/**
 * Squarified treemap layout (Bruls, Huizing & van Wijk). Items are laid out
 * largest first in rows along the shorter side of the remaining space; a row
 * is closed as soon as adding the next item would make its worst aspect
 * ratio worse. Returns one rectangle per input value, in input order.
 */
export function squarify(values: number[], bounds: TreemapRect): TreemapRect[] {
  const out: TreemapRect[] = values.map(() => ({ x: bounds.x, y: bounds.y, w: 0, h: 0 }))
  const total = values.reduce((s, v) => s + Math.max(0, v), 0)
  if (!total || bounds.w <= 0 || bounds.h <= 0)
    return out

  const scale = (bounds.w * bounds.h) / total
  const queue = values
    .map((v, i) => ({ i, area: Math.max(0, v) * scale }))
    .filter(item => item.area > 0)
    .sort((a, b) => b.area - a.area)
  const free = { ...bounds }

  // Worst aspect ratio of a row of `areas` laid along a side of length `side`.
  const worst = (sum: number, min: number, max: number, side: number) => {
    const s2 = sum * sum
    const side2 = side * side
    return Math.max((side2 * max) / s2, s2 / (side2 * min))
  }

  const place = (row: typeof queue, sum: number) => {
    if (free.w >= free.h) {
      // Column on the left of the free space.
      const colW = sum / free.h
      let y = free.y
      for (const item of row) {
        const h = item.area / colW
        out[item.i] = { x: free.x, y, w: colW, h }
        y += h
      }
      free.x += colW
      free.w -= colW
    }
    else {
      // Row along the top of the free space.
      const rowH = sum / free.w
      let x = free.x
      for (const item of row) {
        const w = item.area / rowH
        out[item.i] = { x, y: free.y, w, h: rowH }
        x += w
      }
      free.y += rowH
      free.h -= rowH
    }
  }

  let row: typeof queue = []
  let sum = 0
  let min = Infinity
  let max = 0
  for (const item of queue) {
    const side = Math.min(free.w, free.h)
    const nextSum = sum + item.area
    const nextMin = Math.min(min, item.area)
    const nextMax = Math.max(max, item.area)
    if (!row.length || worst(nextSum, nextMin, nextMax, side) <= worst(sum, min, max, side)) {
      row.push(item)
      sum = nextSum
      min = nextMin
      max = nextMax
    }
    else {
      place(row, sum)
      row = [item]
      sum = item.area
      min = item.area
      max = item.area
    }
  }
  if (row.length)
    place(row, sum)
  return out
}
