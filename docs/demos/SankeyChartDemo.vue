<script setup lang="ts">
import type { SankeyLink, SankeyNode } from '@/ui/sankey-chart'
import { SankeyChart } from '@/ui/sankey-chart'
import { Shuffle } from 'lucide-vue-next'
import { computed, ref } from 'vue'

type Dataset = 'income' | 'funnel'
const dataset = ref<Dataset>('income')
const jitter = ref<number[]>(Array.from({ length: 8 }, () => 1))

const round = (v: number) => Math.round(v * 10) / 10

// Income statement: every node's outflow adds up to its inflow.
function income(j: number[]) {
  const product = 42.6 * j[0]!
  const services = 18.4 * j[1]!
  const licensing = 7.9 * j[2]!
  const revenue = product + services + licensing
  const cost = revenue * 0.38 * j[3]!
  const gross = revenue - cost
  const rnd = gross * 0.27 * j[4]!
  const sales = gross * 0.22 * j[5]!
  const admin = gross * 0.09
  const operating = gross - rnd - sales - admin
  const tax = operating * 0.19
  const nodes: SankeyNode[] = [
    { id: 'product', label: 'Product', color: 'var(--chart-2)' },
    { id: 'services', label: 'Services', color: 'var(--chart-2)' },
    { id: 'licensing', label: 'Licensing', color: 'var(--chart-2)' },
    { id: 'revenue', label: 'Revenue', color: 'var(--chart-3)' },
    { id: 'gross', label: 'Gross', color: 'var(--chart-1)' },
    { id: 'cost', label: 'Costs', color: 'var(--chart-5)' },
    { id: 'operating', label: 'Operating', color: 'var(--chart-1)' },
    { id: 'rnd', label: 'R&D', color: 'var(--chart-5)' },
    { id: 'sales', label: 'Marketing', color: 'var(--chart-5)' },
    { id: 'admin', label: 'G&A', color: 'var(--chart-5)' },
    { id: 'net', label: 'Net income', color: 'var(--chart-1)' },
    { id: 'tax', label: 'Tax', color: 'var(--chart-4)' },
  ]
  const links: SankeyLink[] = [
    { source: 'product', target: 'revenue', value: product },
    { source: 'services', target: 'revenue', value: services },
    { source: 'licensing', target: 'revenue', value: licensing },
    { source: 'revenue', target: 'gross', value: gross },
    { source: 'revenue', target: 'cost', value: cost },
    { source: 'gross', target: 'operating', value: operating },
    { source: 'gross', target: 'rnd', value: rnd },
    { source: 'gross', target: 'sales', value: sales },
    { source: 'gross', target: 'admin', value: admin },
    { source: 'operating', target: 'net', value: operating - tax },
    { source: 'operating', target: 'tax', value: tax },
  ].map(l => ({ ...l, value: round(l.value) }))
  return { nodes, links }
}

// Visitors by channel → first page → outcome.
function funnel(j: number[]) {
  const channels = { search: 4200 * j[0]!, social: 2600 * j[1]!, email: 1500 * j[2]!, referral: 900 * j[3]! }
  const toPricing = [0.34, 0.22, 0.48, 0.4]
  const links: SankeyLink[] = []
  let landing = 0
  let pricing = 0
  Object.entries(channels).forEach(([id, v], i) => {
    const p = v * toPricing[i]! * j[4]!
    links.push({ source: id, target: 'landing', value: v - p }, { source: id, target: 'pricing', value: p })
    landing += v - p
    pricing += p
  })
  const landingSignup = landing * 0.12 * j[5]!
  const pricingSignup = pricing * 0.31 * j[6]!
  const signups = landingSignup + pricingSignup
  const paid = signups * 0.28 * j[7]!
  links.push(
    { source: 'landing', target: 'signup', value: landingSignup },
    { source: 'landing', target: 'left', value: landing - landingSignup },
    { source: 'pricing', target: 'signup', value: pricingSignup },
    { source: 'pricing', target: 'left', value: pricing - pricingSignup },
    { source: 'signup', target: 'paid', value: paid },
    { source: 'signup', target: 'free', value: signups - paid },
  )
  const nodes: SankeyNode[] = [
    { id: 'search', label: 'Search' },
    { id: 'social', label: 'Social' },
    { id: 'email', label: 'Email' },
    { id: 'referral', label: 'Referral' },
    { id: 'landing', label: 'Landing page', color: 'var(--chart-2)' },
    { id: 'pricing', label: 'Pricing page', color: 'var(--chart-3)' },
    { id: 'signup', label: 'Signed up', color: 'var(--chart-1)' },
    { id: 'left', label: 'Left', color: 'var(--muted-foreground)' },
    { id: 'paid', label: 'Paid plan', color: 'var(--chart-1)' },
    { id: 'free', label: 'Free plan', color: 'var(--chart-4)' },
  ]
  return { nodes, links: links.map(l => ({ ...l, value: Math.round(l.value) })) }
}

const data = computed(() => (dataset.value === 'income' ? income(jitter.value) : funnel(jitter.value)))
const formatValue = computed(() => dataset.value === 'income'
  ? (v: number) => `$${v.toFixed(1)}B`
  : (v: number) => new Intl.NumberFormat('en-US').format(Math.round(v)))

function randomize() {
  jitter.value = jitter.value.map(() => 0.75 + Math.random() * 0.5)
}
</script>

<template>
  <div class="w-full max-w-2xl rounded-xl border bg-card p-4">
    <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div class="inline-flex rounded-lg bg-muted p-0.5 text-xs">
        <button
          v-for="d in (['income', 'funnel'] as const)"
          :key="d"
          type="button"
          class="rounded-md px-2.5 py-1 transition-colors"
          :class="dataset === d ? 'bg-background font-medium shadow-sm' : 'text-muted-foreground hover:text-foreground'"
          :aria-pressed="dataset === d"
          @click="dataset = d"
        >
          {{ d === 'income' ? 'Income statement' : 'Signup funnel' }}
        </button>
      </div>
      <button
        type="button"
        class="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs transition-colors hover:bg-muted"
        @click="randomize"
      >
        <Shuffle class="size-3.5" />
        Randomize
      </button>
    </div>
    <SankeyChart :nodes="data.nodes" :links="data.links" :height="320" :format-value="formatValue" />
  </div>
</template>
