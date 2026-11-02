<script setup lang="ts">
import { AppWindow, ArrowRight, Component, LayoutPanelTop, LayoutTemplate, Sparkles } from 'lucide-vue-next'
import pro from '../../../data/pro-catalog.json'

const count = (section: string) => pro.filter(i => i.section === section).length
const tiles = [
  { key: 'blocks', label: 'Marketing blocks', icon: LayoutPanelTop },
  { key: 'app', label: 'App blocks', icon: AppWindow },
  { key: 'components', label: 'Components', icon: Component },
  { key: 'illustrations', label: 'Illustrations', icon: Sparkles },
  { key: 'templates', label: 'Templates', icon: LayoutTemplate },
].map(t => ({ ...t, count: count(t.key) })).filter(t => t.count)
</script>

<template>
  <section class="vp-raw mx-auto mt-24 max-w-[1152px] px-6 pb-8">
    <div class="relative overflow-hidden rounded-3xl border bg-card p-8 sm:p-12">
      <div aria-hidden="true" class="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-brand/15 blur-3xl" />
      <div class="relative grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-center">
        <div>
          <span class="inline-flex items-center rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">vuelix Pro</span>
          <h2 class="mb-0 mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Need whole pages, not just parts?
          </h2>
          <p class="mb-0 mt-3 max-w-md text-muted-foreground">
            {{ pro.length }} premium sections, app screens, illustrations and full templates, built on these free components and installed with the same CLI.
          </p>
          <div class="mt-6 flex flex-wrap gap-3">
            <a href="https://pro.vuelix.dev" class="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground no-underline">
              Explore vuelix Pro <ArrowRight class="size-4" aria-hidden="true" />
            </a>
            <a href="/pro" class="inline-flex h-10 items-center rounded-lg border bg-background px-5 text-sm font-semibold text-foreground no-underline hover:bg-muted">
              See everything in Pro
            </a>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <a
            v-for="t in tiles"
            :key="t.key"
            :href="`/pro#${t.key}`"
            class="group flex flex-col gap-3 rounded-2xl border bg-background p-4 text-foreground no-underline transition-[border-color,box-shadow] hover:border-brand/50 hover:shadow-[0_8px_30px_-18px_var(--brand)]"
          >
            <span class="grid size-9 place-items-center rounded-lg bg-brand/12 text-brand">
              <component :is="t.icon" class="size-[18px]" aria-hidden="true" />
            </span>
            <span>
              <span class="block text-2xl font-semibold tabular-nums">{{ t.count }}</span>
              <span class="block text-sm text-muted-foreground">{{ t.label }}</span>
            </span>
          </a>
        </div>
      </div>
    </div>
  </section>
</template>
