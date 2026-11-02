<script setup>
import { REGISTRY_URL } from '../.vitepress/registry'
</script>

# Installation

There are two ways to use vuelix. Pick whichever fits. You can mix them, too.

| | Copy source (CLI) | npm package |
| --- | --- | --- |
| Install | `shadcn-vue add …` | `npm install @vuelix/ui` |
| Code lives in | your repo (`components/ui/…`) | `node_modules` |
| Customise | edit anything | props + `class` |
| Updates | re-run the CLI | bump the version |

## npm package

```bash
npm install @vuelix/ui motion-v
```

Requires **Tailwind CSS v4**. Add one line to your CSS entry, after Tailwind:

```css
@import "tailwindcss";
@import "@vuelix/ui/tailwind.css";
```

This tells Tailwind to scan vuelix's components for class names and adds default theme tokens. If you already have a shadcn-vue theme, yours wins automatically.

Import what you need (tree-shakeable):

```vue
<script setup lang="ts">
import { SpringButton, toast, ToastStack } from '@vuelix/ui'
</script>

<template>
  <SpringButton @click="toast.success('Saved!')">Save</SpringButton>
  <ToastStack />
</template>
```

Or register everything globally:

```ts
import { Vuelix } from '@vuelix/ui'

app.use(Vuelix)                   // <SpringButton />
app.use(Vuelix, { prefix: 'Vx' }) // <VxSpringButton />
```

## Copy source (CLI)

Components are also distributed through a [shadcn-vue](https://shadcn-vue.com) compatible registry, so you get the source in your project.

### 1. Set up your project

You need a Vue 3 (Vite) or Nuxt project with **Tailwind CSS v4**. If you don't have shadcn-vue set up yet, run:

```bash
npx shadcn-vue@latest init
```

This creates `components.json`, adds the `cn()` helper at `lib/utils.ts`, and writes the theme CSS variables.

### 2. Add a component

Point the CLI at any component's registry URL:

```bash-vue
npx shadcn-vue@latest add {{ REGISTRY_URL }}/spring-button.json
```

The CLI copies the source into `components/ui/spring-button/` and installs its npm dependencies (`motion-v`, etc.).

#### Use the `@vuelix` namespace (optional)

Add the registry to `components.json` so you can install by name:

```json-vue
{
  "registries": {
    "@vuelix": "{{ REGISTRY_URL }}/{name}.json"
  }
}
```

```bash
npx shadcn-vue@latest add @vuelix/spring-button @vuelix/dock
```

### Manual installation

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
