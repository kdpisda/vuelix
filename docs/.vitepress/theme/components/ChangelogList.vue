<script setup lang="ts">
import changelog from '../../../data/changelog.json'

function format(date: string) {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })
}
</script>

<template>
  <div class="vp-raw mt-10">
    <article
      v-for="entry in changelog"
      :id="`v${entry.version}`"
      :key="entry.version"
      class="relative grid gap-4 border-l pb-12 pl-8 sm:grid-cols-[140px_1fr] sm:border-l-0 sm:pl-0"
    >
      <div class="text-sm text-muted-foreground">
        <span class="absolute -left-[5px] top-1.5 size-2.5 rounded-full bg-brand sm:hidden" />
        <time :datetime="entry.date">{{ format(entry.date) }}</time>
        <a :href="`#v${entry.version}`" class="mt-1 block w-fit rounded-md border px-1.5 py-0.5 font-mono text-xs text-foreground no-underline">v{{ entry.version }}</a>
      </div>
      <div class="sm:border-l sm:pl-8">
        <h2 class="m-0 text-xl font-semibold text-foreground">
          {{ entry.title }}
        </h2>
        <p class="mt-2 text-muted-foreground">
          {{ entry.summary }}
        </p>
        <ul class="mt-4 space-y-2 pl-5 text-sm text-foreground [list-style:disc]">
          <li v-for="item in entry.items" :key="item">
            {{ item }}
          </li>
        </ul>
      </div>
    </article>
  </div>
</template>
