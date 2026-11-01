<script setup>
import catalog from '../../registry/catalog.json'
</script>

# Components

<div class="vp-raw mt-6 grid gap-3 sm:grid-cols-2">
  <a v-for="c in catalog" :key="c.name" :href="`/components/${c.name}`" class="block rounded-xl border p-4 no-underline transition-colors hover:border-brand">
    <span class="block text-xs text-muted-foreground">{{ c.category }}</span>
    <span class="block font-semibold text-foreground">{{ c.title }}</span>
    <span class="mt-1 block text-sm text-muted-foreground">{{ c.description }}</span>
  </a>
</div>
