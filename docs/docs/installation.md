<script setup>
import { REGISTRY_URL } from '../.vitepress/registry'
</script>

# Installation

veulix components are distributed through a [shadcn-vue](https://shadcn-vue.com) compatible registry.

## 1. Set up your project

You need a Vue 3 (Vite) or Nuxt project with **Tailwind CSS v4**. If you don't have shadcn-vue set up yet, run:

```bash
npx shadcn-vue@latest init
```

This creates `components.json`, adds the `cn()` helper at `lib/utils.ts`, and writes the theme CSS variables.

## 2. Add a component

Point the CLI at any component's registry URL:

```bash-vue
npx shadcn-vue@latest add {{ REGISTRY_URL }}/spring-button.json
```

The CLI copies the source into `components/ui/spring-button/` and installs its npm dependencies (`motion-v`, etc.).

### Use the `@veulix` namespace (optional)

Add the registry to `components.json` so you can install by name:

```json-vue
{
  "registries": {
    "@veulix": "{{ REGISTRY_URL }}/{name}.json"
  }
}
```

```bash
npx shadcn-vue@latest add @veulix/spring-button @veulix/dock
```

## Manual installation

Every component page has a **Manual installation** section with the full source. Install the listed dependencies, copy the files, and make sure you have the `cn` helper:

### utils

```ts
// lib/utils.ts
import type { ClassValue } from 'clsx'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

```bash
npm install motion-v clsx tailwind-merge
```

## Nuxt

Components work as-is in Nuxt. `motion-v` also ships a Nuxt module (`motion-v/nuxt`) if you want auto-imports for `motion`, `AnimatePresence`, etc.:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['motion-v/nuxt'],
})
```
