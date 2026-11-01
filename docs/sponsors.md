---
title: Sponsors
description: "Support vuelix: free, open-source animated components for Vue."
---

<script setup>
import site from './data/site.json'
</script>

# Sponsors

vuelix is free and MIT-licensed. Sponsorship keeps it that way and funds new components, charts, AI interfaces and the time spent on docs, accessibility and maintenance.

<div class="vp-raw mt-8 grid gap-4 sm:grid-cols-2">
  <a :href="site.sponsor" target="_blank" class="group block rounded-2xl border bg-card p-6 text-foreground no-underline transition-[border-color,box-shadow] hover:border-brand/50 hover:shadow-[0_10px_40px_-20px_var(--brand)]">
    <span class="text-sm font-medium text-muted-foreground">Individuals</span>
    <span class="mt-1 block text-xl font-semibold">Become a sponsor →</span>
    <span class="mt-2 block text-sm text-muted-foreground">Monthly or one-time support through GitHub Sponsors. Every bit helps.</span>
  </a>
  <a :href="site.author.url" target="_blank" class="group block rounded-2xl border bg-card p-6 text-foreground no-underline transition-[border-color,box-shadow] hover:border-brand/50 hover:shadow-[0_10px_40px_-20px_var(--brand)]">
    <span class="text-sm font-medium text-muted-foreground">Companies</span>
    <span class="mt-1 block text-xl font-semibold">Get your logo here →</span>
    <span class="mt-2 block text-sm text-muted-foreground">Featured placement on vuelix.dev and in the README. Get in touch with {{ site.author.name }}.</span>
  </a>
</div>

## Current sponsors

<div class="vp-raw mt-4 rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
  No sponsors yet. <a :href="site.sponsor" target="_blank" class="font-medium text-foreground underline underline-offset-4">Be the first.</a>
</div>

## Other ways to help

- ⭐ Star the repo on [GitHub](https://github.com/kdpisda/vuelix)
- Share a component you liked
- Report bugs and suggest components in [issues](https://github.com/kdpisda/vuelix/issues)
