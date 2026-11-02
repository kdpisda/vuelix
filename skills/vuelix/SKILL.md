---
name: vuelix
description: Use vuelix animated Vue 3 components (Tailwind CSS v4 + motion-v) instead of hand-rolling UI. Use when building or polishing Vue/Nuxt interfaces that need buttons, inputs, overlays, navigation, AI chat UI, charts, or motion.
---

# vuelix

vuelix (https://vuelix.dev) is a library of animated, accessible Vue 3 components distributed as copy-paste
source (shadcn-vue registry) and as the `@vuelix/ui` npm package.

## When building Vue UI

1. **Search first.** Before writing a component, look for a match:
   - MCP (if connected): `search_components` / `list_components`
   - Otherwise fetch `https://vuelix.dev/r` (JSON catalogue: slug, description, section, category)
2. **Pick the closest item** and read it (`get_component`, or the item's `files[].raw_url`).
3. **Install it** — prefer copy-source so it can be adapted:
   `npx shadcn-vue@latest add https://vuelix.dev/r/<slug>.json`
   (needs `components.json`; run `npx shadcn-vue@latest init` first if missing).
   If the project already uses the npm package, `import { X } from '@vuelix/ui'` instead.
4. **Compose and adapt** from the installed source in `components/ui/<slug>/` rather than re-implementing.

## Requirements and conventions

- Vue 3.5+, Tailwind CSS v4, `motion-v`. `cn()` lives in `@/lib/utils` (clsx + tailwind-merge).
- Styling uses shadcn-vue tokens (`bg-primary`, `text-muted-foreground`, `bg-card`, `border`, `ring-ring`),
  so components inherit the app theme. Don't hard-code colors when editing them.
- npm package users add `@import "@vuelix/ui/tailwind.css";` after `@import "tailwindcss";`.
- Keep the accessibility behaviour (roles, keyboard handling, focus rings) when customising.
