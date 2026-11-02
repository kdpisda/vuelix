<script setup lang="ts">
import { ArrowUpRight } from 'lucide-vue-next'
import pro from '../../../data/pro-catalog.json'

interface ProItem { name: string, title: string, description: string, section: string, category: string, url: string }

const SECTIONS: Record<string, { title: string, blurb: string }> = {
  blocks: { title: 'Marketing blocks', blurb: 'Full-width landing-page sections.' },
  app: { title: 'App blocks', blurb: 'Product screens for dashboards, data, workflows, settings and auth.' },
  components: { title: 'Components', blurb: 'Richer interactive pieces beyond the free library.' },
  illustrations: { title: 'Illustrations', blurb: 'Animated, themeable SVG scenes.' },
  templates: { title: 'Templates', blurb: 'Complete pages and apps composed from Pro blocks.' },
}

const items = pro as ProItem[]
const sections = Object.entries(SECTIONS)
  .map(([key, meta]) => {
    const list = items.filter(i => i.section === key)
    const categories = [...new Set(list.map(i => i.category))]
    return { key, ...meta, count: list.length, groups: categories.map(category => ({ category, items: list.filter(i => i.category === category) })) }
  })
  .filter(s => s.count)
</script>

<template>
  <div class="vp-raw mt-8 space-y-14">
    <section v-for="s in sections" :id="s.key" :key="s.key" class="scroll-mt-24">
      <div class="mb-4 flex flex-wrap items-baseline justify-between gap-2 border-b pb-3">
        <h2 class="m-0 text-xl font-semibold tracking-tight text-foreground">
          {{ s.title }} <span class="text-sm font-normal text-muted-foreground">· {{ s.count }}</span>
        </h2>
        <p class="m-0 text-sm text-muted-foreground">
          {{ s.blurb }}
        </p>
      </div>
      <div class="space-y-6">
        <div v-for="g in s.groups" :key="g.category">
          <h3 v-if="s.groups.length > 1" class="mb-2.5 mt-0 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {{ g.category }}
          </h3>
          <div class="grid gap-3 sm:grid-cols-2">
            <a
              v-for="i in g.items"
              :key="i.name"
              :href="i.url"
              class="group block rounded-xl border bg-card p-4 text-foreground no-underline transition-[border-color,box-shadow] hover:border-brand/50 hover:shadow-[0_8px_30px_-18px_var(--brand)]"
            >
              <span class="flex items-center justify-between gap-3 font-semibold">
                <span class="flex items-center gap-2">
                  {{ i.title }}
                  <span class="rounded-full bg-brand/15 px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide text-brand">Pro</span>
                </span>
                <ArrowUpRight class="size-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
              </span>
              <span class="mt-1 block text-sm text-muted-foreground">{{ i.description }}</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
