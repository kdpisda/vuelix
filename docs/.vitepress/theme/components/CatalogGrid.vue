<script setup lang="ts">
import { computed } from 'vue'
import catalog from '../../../../registry/catalog.json'

const props = defineProps<{ section: string }>()

const groups = computed(() => {
  const items = catalog.filter(c => c.section === props.section)
  const categories = [...new Set(items.map(c => c.category))]
  return categories.map(category => ({ category, items: items.filter(c => c.category === category) }))
})
</script>

<template>
  <div class="vp-raw mt-8 space-y-10">
    <section v-for="g in groups" :key="g.category">
      <h2 v-if="groups.length > 1" class="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        {{ g.category }}
      </h2>
      <div class="grid gap-3 sm:grid-cols-2">
        <a
          v-for="c in g.items"
          :key="c.name"
          :href="c.url"
          class="group block rounded-xl border bg-card p-4 text-foreground no-underline transition-[border-color,box-shadow] hover:border-brand/50 hover:shadow-[0_8px_30px_-18px_var(--brand)]"
        >
          <span class="flex items-center justify-between font-semibold">
            {{ c.title }}
            <span class="text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden="true">→</span>
          </span>
          <span class="mt-1 block text-sm text-muted-foreground">{{ c.description }}</span>
        </a>
      </div>
    </section>
    <p v-if="!groups.length" class="text-muted-foreground">
      Coming soon.
    </p>
  </div>
</template>
