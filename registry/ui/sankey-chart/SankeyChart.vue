<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { PlacedLink, PlacedNode, SankeyLink, SankeyNode } from './layout'
import { AnimatePresence, motion, useReducedMotion } from 'motion-v'
import { computed, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'
import { cn } from '@/lib/utils'
import { layoutSankey, ribbonPath } from './layout'

const props = withDefaults(defineProps<{
  nodes: SankeyNode[]
  links: SankeyLink[]
  /** Chart height in px. Width follows the container. */
  height?: number
  /** Width of the node bars. */
  nodeWidth?: number
  /** Vertical gap between nodes in a column. */
  nodePadding?: number
  /** Relaxation passes — more passes, straighter ribbons. */
  iterations?: number
  /** `left`: each node sits at its depth. `justify`: end nodes line up in the last column. */
  align?: 'left' | 'justify'
  locale?: string
  formatValue?: (value: number) => string
  class?: HTMLAttributes['class']
}>(), {
  height: 360,
  nodeWidth: 12,
  nodePadding: 18,
  iterations: 8,
  align: 'left',
  locale: 'en-US',
})

const STAGGER = 0.22 // seconds between columns
const WIPE = { duration: 0.5, ease: [0.45, 0, 0.25, 1] } as const // + STAGGER per column
const TIP = { type: 'spring', stiffness: 520, damping: 38, mass: 0.6 } as const

const uid = `vx-sankey-${useId()}`
const root = ref<HTMLElement>()
const width = ref(640)
const prefersReduced = useReducedMotion()
// useReducedMotion() only settles after mount, so also read the media query directly: animations
// that start on mount get skipped too. Only transitions use it — `initial` must match the server render.
const reduce = computed(() => prefersReduced.value
  || (typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches))
const orInstant = <T>(t: T) => (reduce.value ? { duration: 0 } : t)

const fmt = computed(() => {
  if (props.formatValue)
    return props.formatValue
  const f = new Intl.NumberFormat(props.locale, { maximumFractionDigits: 1, notation: 'compact' })
  return (v: number) => f.format(v)
})
const pct = (v: number) => `${(v * 100).toFixed(v < 0.1 ? 1 : 0)}%`

// Rough text width so outer labels get enough margin (12px UI font ≈ 6.2px per glyph).
const GLYPH = 6.2
const textWidth = (s: string) => s.length * GLYPH

const STACK_MIN = 26 // nodes at least this tall get a two-line label

const options = (left: number, right: number) => ({
  left,
  right: width.value - right,
  top: 6,
  bottom: props.height - 6,
  nodeWidth: props.nodeWidth,
  nodePadding: props.nodePadding,
  iterations: props.iterations,
  align: props.align,
})

// Outer columns keep their labels outside the flow, so they need margins sized to the text.
const graph = computed(() => {
  const labelW = (n: PlacedNode) => {
    const name = textWidth(n.label)
    const value = textWidth(fmt.value(n.value))
    return (n.y1 - n.y0 >= STACK_MIN ? Math.max(name, value) : name + value + 5) + 12
  }
  const cap = width.value * 0.26
  const margins = (g: ReturnType<typeof layoutSankey>) => {
    const outer = (col: number) => Math.max(0, ...g.nodes.filter(n => n.column === col).map(labelW))
    return [Math.min(cap, outer(0)), g.columns > 1 ? Math.min(cap, outer(g.columns - 1)) : 0] as const
  }
  // Pass 1 assumes stacked labels; pass 2 corrects for nodes that turned out short.
  let [left, right] = [cap / 2, cap / 2]
  let g = layoutSankey(props.nodes, props.links, options(left, right))
  for (let pass = 0; pass < 2; pass++) {
    const [l, r] = margins(g)
    if (Math.abs(l - left) < 1 && Math.abs(r - right) < 1)
      break
    ;[left, right] = [l, r]
    g = layoutSankey(props.nodes, props.links, options(left, right))
  }
  return g
})

const total = computed(() => graph.value.nodes.filter(n => n.column === 0).reduce((s, n) => s + n.value, 0) || 1)

// Labels between columns are cut to the space before the next column (full name in the tooltip).
function fit(text: string, max: number) {
  const chars = Math.floor(max / GLYPH)
  return text.length <= chars ? text : `${text.slice(0, Math.max(1, chars - 1)).trimEnd()}…`
}

const labels = computed(() => {
  const { nodes, columns } = graph.value
  const step = columns > 1 ? (nodes.find(n => n.column === 1)?.x0 ?? 0) - (nodes.find(n => n.column === 0)?.x0 ?? 0) : width.value
  return nodes.map((n) => {
    const first = n.column === 0 && columns > 1
    const middle = n.column > 0 && n.column < columns - 1
    const stacked = n.y1 - n.y0 >= STACK_MIN
    const room = step - props.nodeWidth - 10
    const value = fmt.value(n.value)
    return {
      node: n,
      x: first ? n.x0 - 8 : n.x1 + 8,
      y: (n.y0 + n.y1) / 2,
      anchor: first ? 'end' : 'start',
      stacked,
      text: middle ? fit(n.label, stacked ? room : room - textWidth(value) - 5) : n.label,
      hidden: middle && room < 46,
      value,
      // Labels that sit over ribbons get a halo.
      halo: middle,
    }
  })
})

// Replays the draw-in whenever the data changes (not on resize).
const version = ref(0)
watch(() => [props.nodes, props.links], () => version.value++, { deep: true })

// --- hover ----------------------------------------------------------------------
const hover = ref<{ type: 'node' | 'link', index: number } | null>(null)
const pointer = ref({ x: 0, y: 0 })

const lit = computed(() => {
  const h = hover.value
  if (!h)
    return null
  const nodes = new Set<PlacedNode>()
  const links = new Set<PlacedLink>()
  if (h.type === 'link') {
    const l = graph.value.links[h.index]
    if (l) {
      links.add(l)
      nodes.add(l.source).add(l.target)
    }
    return { nodes, links }
  }
  const start = graph.value.nodes[h.index]
  if (!start)
    return null
  // Everything that flows into the node and everything that flows out of it.
  const walk = (n: PlacedNode, dir: 'incoming' | 'outgoing') => {
    nodes.add(n)
    for (const l of n[dir]) {
      if (links.has(l))
        continue
      links.add(l)
      walk(dir === 'incoming' ? l.source : l.target, dir)
    }
  }
  walk(start, 'incoming')
  walk(start, 'outgoing')
  return { nodes, links }
})

const linkOpacity = (l: PlacedLink) => (!lit.value ? 0.4 : lit.value.links.has(l) ? 0.72 : 0.08)
const nodeOpacity = (n: PlacedNode) => (!lit.value || lit.value.nodes.has(n) ? 1 : 0.3)

const tooltip = computed(() => {
  const h = hover.value
  if (!h)
    return null
  if (h.type === 'link') {
    const l = graph.value.links[h.index]
    if (!l)
      return null
    return {
      color: l.source.color,
      title: `${l.source.label} → ${l.target.label}`,
      value: fmt.value(l.value),
      note: `${pct(l.value / (l.source.outValue || 1))} of ${l.source.label}`,
    }
  }
  const n = graph.value.nodes[h.index]
  if (!n)
    return null
  return {
    color: n.color,
    title: n.label,
    value: fmt.value(n.value),
    note: n.inValue && n.outValue
      ? `in ${fmt.value(n.inValue)} · out ${fmt.value(n.outValue)}`
      : `${pct(n.value / total.value)} of total`,
  }
})

// Keep the tooltip inside the chart: flip to the other side of the pointer near the edges.
const tip = computed(() => {
  const flipX = pointer.value.x > width.value - 200
  const flipY = pointer.value.y > props.height - 90
  return {
    x: pointer.value.x + (flipX ? -14 : 14),
    y: pointer.value.y + (flipY ? -14 : 14),
    flipX,
    flipY,
  }
})

function onPointerMove(e: PointerEvent) {
  const r = root.value!.getBoundingClientRect()
  pointer.value = { x: e.clientX - r.left, y: e.clientY - r.top }
}

const summary = computed(() => {
  const { nodes, links } = graph.value
  const top = [...links].sort((a, b) => b.value - a.value)[0]
  return `Sankey diagram: ${links.length} flows between ${nodes.length} nodes, ${fmt.value(total.value)} in total.${
    top ? ` Largest flow: ${top.source.label} to ${top.target.label}, ${fmt.value(top.value)}.` : ''}`
})

let ro: ResizeObserver | undefined
onMounted(() => {
  ro = new ResizeObserver(([entry]) => {
    if (entry)
      width.value = Math.max(280, Math.round(entry.contentRect.width))
  })
  ro.observe(root.value!)
})
onBeforeUnmount(() => ro?.disconnect())
</script>

<template>
  <div
    ref="root"
    :class="cn('relative w-full text-foreground', props.class)"
    @pointermove="onPointerMove"
    @pointerleave="hover = null"
  >
    <svg
      :width="width"
      :height="props.height"
      :viewBox="`0 0 ${width} ${props.height}`"
      role="img"
      :aria-label="summary"
      class="block select-none overflow-visible"
    >
      <defs>
        <linearGradient
          v-for="l in graph.links"
          :id="`${uid}-g${l.index}`"
          :key="l.index"
          gradientUnits="userSpaceOnUse"
          :x1="l.source.x1"
          :x2="l.target.x0"
          y1="0"
          y2="0"
        >
          <stop offset="0%" :stop-color="l.source.color" />
          <stop offset="100%" :stop-color="l.target.color" />
        </linearGradient>
      </defs>

      <!-- background: moving off a ribbon or node clears the highlight -->
      <rect :width="width" :height="props.height" fill="transparent" @pointerenter="hover = null" />

      <g :key="version">
        <!-- ribbons, revealed by a left-to-right wipe that keeps pace with the nodes -->
        <clipPath :id="`${uid}-wipe`">
          <motion.rect
            x="0"
            y="0"
            :width="width"
            :height="props.height"
            :style="{ originX: 0 }"
            :initial="{ scaleX: 0 }"
            :animate="{ scaleX: 1 }"
            :transition="orInstant({ ...WIPE, duration: WIPE.duration + graph.columns * STAGGER, delay: 0.1 })"
          />
        </clipPath>
        <g :clip-path="`url(#${uid}-wipe)`">
          <path
            v-for="l in graph.links"
            :key="l.index"
            :d="ribbonPath(l)"
            :fill="`url(#${uid}-g${l.index})`"
            class="cursor-pointer transition-opacity duration-200"
            :style="{ opacity: linkOpacity(l) }"
            @pointerenter="hover = { type: 'link', index: l.index }"
          />
        </g>

        <!-- nodes -->
        <g
          v-for="n in graph.nodes"
          :key="n.id"
          class="cursor-pointer transition-opacity duration-200"
          :style="{ opacity: nodeOpacity(n) }"
          @pointerenter="hover = { type: 'node', index: n.index }"
        >
          <motion.rect
            :x="n.x0"
            :y="n.y0"
            :width="n.x1 - n.x0"
            :height="n.y1 - n.y0"
            rx="2"
            :style="{ fill: n.color }"
            :initial="{ scaleY: 0, opacity: 0 }"
            :animate="{ scaleY: 1, opacity: 1 }"
            :transition="orInstant({ type: 'spring', stiffness: 260, damping: 24, delay: n.column * STAGGER })"
          />
          <!-- generous invisible hit area -->
          <rect :x="n.x0 - 4" :y="n.y0" :width="n.x1 - n.x0 + 8" :height="n.y1 - n.y0" fill="transparent" />
        </g>

        <!-- labels -->
        <motion.g
          class="pointer-events-none text-xs"
          :initial="{ opacity: 0 }"
          :animate="{ opacity: 1 }"
          :transition="orInstant({ duration: 0.4, delay: 0.35 + (graph.columns - 1) * STAGGER })"
        >
          <g
            v-for="t in labels.filter(l => !l.hidden)"
            :key="t.node.id"
            class="transition-opacity duration-200"
            :style="{ opacity: nodeOpacity(t.node) }"
            :text-anchor="t.anchor"
          >
            <text
              :x="t.x"
              :y="t.stacked ? t.y - 7 : t.y"
              dy="0.35em"
              class="fill-foreground font-medium"
              :class="t.halo && 'stroke-background [paint-order:stroke] [stroke-linejoin:round]'"
              :stroke-width="t.halo ? 3 : 0"
            >
              {{ t.text }}<tspan v-if="!t.stacked" dx="5" class="fill-muted-foreground font-normal tabular-nums">{{ t.value }}</tspan>
            </text>
            <text
              v-if="t.stacked"
              :x="t.x"
              :y="t.y + 8"
              dy="0.35em"
              class="fill-muted-foreground text-[11px] tabular-nums"
              :class="t.halo && 'stroke-background [paint-order:stroke] [stroke-linejoin:round]'"
              :stroke-width="t.halo ? 3 : 0"
            >
              {{ t.value }}
            </text>
          </g>
        </motion.g>
      </g>
    </svg>

    <AnimatePresence>
      <motion.div
        v-if="tooltip"
        key="tip"
        aria-hidden="true"
        class="pointer-events-none absolute left-0 top-0 z-10"
        :initial="{ opacity: 0, scale: 0.96, x: tip.x, y: tip.y }"
        :animate="{ opacity: 1, scale: 1, x: tip.x, y: tip.y }"
        :exit="{ opacity: 0, scale: 0.96, transition: { duration: 0.12 } }"
        :transition="reduce ? { duration: 0 } : TIP"
      >
        <div
          class="whitespace-nowrap rounded-md border bg-popover px-2.5 py-1.5 text-xs text-popover-foreground shadow-md"
          :class="[tip.flipX && '-translate-x-full', tip.flipY && '-translate-y-full']"
        >
          <div class="flex items-center gap-1.5 font-medium">
            <span class="size-2 rounded-full" :style="{ background: tooltip.color }" />
            {{ tooltip.title }}
          </div>
          <div class="mt-0.5 flex items-baseline gap-2 tabular-nums">
            <span class="text-sm font-semibold">{{ tooltip.value }}</span>
            <span class="text-muted-foreground">{{ tooltip.note }}</span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  </div>
</template>
