export interface SankeyNode {
  id: string
  /** Display name (defaults to the id). */
  label?: string
  /** Any CSS color. Defaults to cycling through `--chart-1…5`. */
  color?: string
}

export interface SankeyLink {
  source: string
  target: string
  value: number
}

export interface PlacedNode {
  id: string
  label: string
  color: string
  index: number
  column: number
  value: number
  inValue: number
  outValue: number
  x0: number
  x1: number
  y0: number
  y1: number
  incoming: PlacedLink[]
  outgoing: PlacedLink[]
}

export interface PlacedLink {
  index: number
  source: PlacedNode
  target: PlacedNode
  value: number
  width: number
  /** Top edge of the ribbon where it leaves the source / enters the target. */
  sy: number
  ty: number
}

export interface SankeyOptions {
  left: number
  right: number
  top: number
  bottom: number
  nodeWidth: number
  nodePadding: number
  iterations: number
  /** `left`: nodes sit at their depth. `justify`: nodes without outgoing links move to the last column. */
  align: 'left' | 'justify'
}

const center = (n: PlacedNode) => (n.y0 + n.y1) / 2

/**
 * A small Sankey layout:
 * 1. columns = longest path from a source (sinks are pushed to the last column),
 * 2. nodes stacked per column with one shared value→px scale,
 * 3. a few relaxation passes pull every node toward the weighted centre of its neighbours,
 *    resolving overlaps after each pass,
 * 4. ribbons are ordered at each node by the vertical position of the node at the other end,
 *    which keeps crossings to a minimum.
 */
export function layoutSankey(inputNodes: SankeyNode[], inputLinks: SankeyLink[], o: SankeyOptions) {
  const nodes: PlacedNode[] = inputNodes.map((n, index) => ({
    id: n.id,
    label: n.label ?? n.id,
    color: n.color ?? `var(--chart-${(index % 5) + 1})`,
    index,
    column: 0,
    value: 0,
    inValue: 0,
    outValue: 0,
    x0: 0,
    x1: 0,
    y0: 0,
    y1: 0,
    incoming: [],
    outgoing: [],
  }))
  const byId = new Map(nodes.map(n => [n.id, n]))
  const links: PlacedLink[] = []
  for (const l of inputLinks) {
    const source = byId.get(l.source)
    const target = byId.get(l.target)
    if (!source || !target || source === target || !(l.value > 0))
      continue
    const link: PlacedLink = { index: links.length, source, target, value: l.value, width: 0, sy: 0, ty: 0 }
    links.push(link)
    source.outgoing.push(link)
    target.incoming.push(link)
    source.outValue += l.value
    target.inValue += l.value
  }
  for (const n of nodes)
    n.value = Math.max(n.inValue, n.outValue)

  // 1. Columns (Kahn's algorithm; nodes caught in a cycle stay in column 0).
  const pending = new Map(nodes.map(n => [n, n.incoming.length]))
  const queue = nodes.filter(n => n.incoming.length === 0)
  while (queue.length) {
    const n = queue.shift()!
    for (const l of n.outgoing) {
      l.target.column = Math.max(l.target.column, n.column + 1)
      pending.set(l.target, pending.get(l.target)! - 1)
      if (pending.get(l.target) === 0)
        queue.push(l.target)
    }
  }
  const last = Math.max(0, ...nodes.map(n => n.column))
  if (o.align === 'justify') {
    for (const n of nodes) {
      if (!n.outgoing.length && n.incoming.length)
        n.column = last
    }
  }
  const columns: PlacedNode[][] = Array.from({ length: last + 1 }, () => [])
  for (const n of nodes)
    columns[n.column]!.push(n)

  // 2. Shared vertical scale + horizontal placement.
  const height = o.bottom - o.top
  const ky = Math.min(...columns.filter(c => c.length).map((c) => {
    const total = c.reduce((s, n) => s + n.value, 0) || 1
    return (height - (c.length - 1) * o.nodePadding) / total
  }))
  const colStep = last ? (o.right - o.left - o.nodeWidth) / last : 0
  for (const col of columns) {
    const total = col.reduce((s, n) => s + n.value * ky, 0) + (col.length - 1) * o.nodePadding
    let y = o.top + (height - total) / 2
    for (const n of col) {
      n.x0 = o.left + n.column * colStep
      n.x1 = n.x0 + o.nodeWidth
      n.y0 = y
      n.y1 = y + Math.max(1, n.value * ky)
      y = n.y1 + o.nodePadding
    }
  }
  for (const l of links)
    l.width = Math.max(1, l.value * ky)

  // 3. Relaxation.
  const shift = (n: PlacedNode, dy: number) => {
    n.y0 += dy
    n.y1 += dy
  }
  const resolve = (col: PlacedNode[]) => {
    col.sort((a, b) => a.y0 - b.y0)
    let y = o.top
    for (const n of col) {
      if (n.y0 < y)
        shift(n, y - n.y0)
      y = n.y1 + o.nodePadding
    }
    y = o.bottom
    for (let i = col.length - 1; i >= 0; i--) {
      const n = col[i]!
      if (n.y1 > y)
        shift(n, y - n.y1)
      y = n.y0 - o.nodePadding
    }
  }
  const pull = (n: PlacedNode, ls: PlacedLink[], other: (l: PlacedLink) => PlacedNode, alpha: number) => {
    const w = ls.reduce((s, l) => s + l.value, 0)
    if (!w)
      return
    const target = ls.reduce((s, l) => s + center(other(l)) * l.value, 0) / w
    shift(n, (target - center(n)) * alpha)
  }
  for (let i = 0; i < o.iterations; i++) {
    const alpha = 0.9 * (1 - i / o.iterations) + 0.1
    for (const col of columns.slice(1)) {
      for (const n of col) pull(n, n.incoming, l => l.source, alpha)
      resolve(col)
    }
    for (const col of columns.slice(0, -1).reverse()) {
      for (const n of col) pull(n, n.outgoing, l => l.target, alpha)
      resolve(col)
    }
  }

  // 4. Ribbon order at each node, centred within the node's height.
  for (const n of nodes) {
    n.outgoing.sort((a, b) => a.target.y0 - b.target.y0 || a.target.index - b.target.index)
    n.incoming.sort((a, b) => a.source.y0 - b.source.y0 || a.source.index - b.source.index)
    let y = n.y0 + (n.y1 - n.y0 - n.outValue * ky) / 2
    for (const l of n.outgoing) {
      l.sy = y
      y += l.width
    }
    y = n.y0 + (n.y1 - n.y0 - n.inValue * ky) / 2
    for (const l of n.incoming) {
      l.ty = y
      y += l.width
    }
  }

  return { nodes, links, columns: last + 1 }
}

/**
 * A ribbon as a filled shape: along the top edge from source to target, back along the bottom
 * edge. Filled (rather than a thick stroke) so it stays clean when columns are close together.
 */
export function ribbonPath(l: PlacedLink) {
  const x0 = l.source.x1
  const x1 = l.target.x0
  const xm = (x0 + x1) / 2
  const [s0, s1, t0, t1] = [l.sy, l.sy + l.width, l.ty, l.ty + l.width]
  return `M${x0},${s0} C${xm},${s0} ${xm},${t0} ${x1},${t0} L${x1},${t1} C${xm},${t1} ${xm},${s1} ${x0},${s1} Z`
}
