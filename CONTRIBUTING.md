# Contributing a component

vuelix ships every component two ways — as copy-paste source (shadcn-vue registry) and as the
`vuelix` npm package — both built from the same files in `registry/ui/<name>/`. This guide is the
contract every component follows. Read an existing component first; `registry/ui/animated-tabs`,
`registry/ui/toast-stack` and `registry/ui/sparkline` are good references.

## 1. Files

For a component named `kebab-name` in section `<section>` (`components`, `blocks`, `ai` or `charts`):

| File | Purpose |
| --- | --- |
| `registry/ui/kebab-name/KebabName.vue` | The component (more `.vue` / `.ts` files in the same folder are fine) |
| `registry/ui/kebab-name/index.ts` | Barrel: `export { default as KebabName } from './KebabName.vue'` (+ types / helpers) |
| `registry/ui/kebab-name/meta.json` | Title, description, section, category, npm dependencies |
| `docs/demos/KebabNameDemo.vue` | Live demo shown on the docs page |
| `docs/<section>/kebab-name.md` | Docs page |

**Never edit generated files**: `registry/catalog.json`, `registry.json`, `registry/index.ts`,
`docs/public/r/*`. Run `pnpm registry:build` to regenerate them.

### meta.json

```json
{
  "title": "Kebab Name",
  "description": "One sentence, under ~110 characters, describing what it does and what moves.",
  "section": "components",
  "category": "Inputs & Forms",
  "dependencies": ["motion-v"]
}
```

- `section`: `components` · `blocks` · `ai` · `charts`
- `category` for `components`: `Buttons & Actions`, `Inputs & Forms`, `Overlays`, `Navigation`,
  `Layout & Surfaces`, `Text & Motion`, `Feedback`, `Data Display`. For `blocks`, `ai` and `charts`
  use the section name (`Blocks`, `AI`, `Charts`) unless told otherwise.
- `dependencies`: every npm package the component imports (besides `vue`). Allowed:
  `motion-v`, `@vueuse/core`, `class-variance-authority`. Anything else needs a very good reason —
  **no chart, date or UI libraries**: charts are hand-rolled SVG.
- Optional `exports`: extra value exports re-exported via `export *` (e.g. `["toast", "useToast"]`).
- Optional `registryDependencies`: other vuelix items this one needs, as full URLs
  (`"https://vuelix.dev/r/spring-button.json"`). Import them as `@/components/ui/spring-button`.

## 2. Code conventions

```vue
<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { motion } from 'motion-v'
import { cn } from '@/lib/utils'

const props = withDefaults(defineProps<{
  /** JSDoc every prop — it shows up in editors. */
  size?: 'sm' | 'md'
  class?: HTMLAttributes['class']
}>(), { size: 'md' })

const model = defineModel<string>()
const emit = defineEmits<{ select: [value: string] }>()
</script>
```

- **Vue 3.5 `<script setup lang="ts">`**, typed `defineProps` / `defineModel` / `defineEmits`.
  Always accept `class` and merge it with `cn(...)` onto the root element.
- **Imports**: `@/lib/utils` for `cn`, `@/components/ui/<other>` for other vuelix components (exactly
  how the import looks once installed in a user's project), relative paths inside the folder.
  Nothing else from the repo. `pnpm registry:build` rejects `@/ui/…` imports.
- **Styling: Tailwind utilities + theme tokens only.** Use `bg-background`, `text-foreground`,
  `bg-card`, `bg-popover`, `bg-muted`, `text-muted-foreground`, `bg-accent`, `bg-primary`,
  `text-primary-foreground`, `bg-secondary`, `border` (border color comes from the theme),
  `ring-ring`, `bg-destructive`, `bg-brand`, `text-chart-1…5` / `fill-chart-*` / `stroke-chart-*`.
  - No `dark:` variants and no hard-coded colors in components — tokens already switch with `.dark`.
    (Demos may use Tailwind palette colors / gradients for content imagery.)
  - **Radius scale is relative to `--radius` (0.75rem)**: `rounded-md` is 10px and `rounded-lg` 12px,
    so small controls (checkbox boxes, chips < 24px) should use explicit values like `rounded-[6px]`.
  - **No `<style>` blocks.** The npm package ships no component CSS. Use Tailwind arbitrary
    values (`[mask-image:…]`, `[perspective:900px]`) or inline `:style` for one-offs.
- **Motion** (`motion-v`, the Vue port of Framer Motion; API: `<motion.div :animate :initial :exit
  :transition :while-hover :while-press :layout :layout-id>`, `AnimatePresence`, `useMotionValue`,
  `useSpring`, `useTransform`, `useMotionTemplate`, `useInView`, `useAnimate`, `useReducedMotion`,
  `useDomRef`):
  - Prefer springs (`{ type: 'spring', stiffness, damping }`) for interactive motion; keep the
    spring config in a const at the top so it's easy to tune.
  - `layout-id`s must be unique per instance: ``const id = `vx-x-${useId()}` ``.
  - `AnimatePresence` only animates the exit of **motion** children with a `key`.
    Infinitely repeating animations never finish an exit — keep those outside `AnimatePresence`.
  - Pointer-driven effects go through motion values, not Vue refs (no re-render per frame).
  - Decorative motion (parallax, tilt, idle loops) must check `useReducedMotion()`.
  - `ref` on a motion component gives a component instance — use `useDomRef()` for the element.
  - `useReducedMotion()` is `false` during SSR but may be `true` in the browser. If it changes the
    **markup** (not just animation values), read it only after `onMounted`, or you'll get hydration
    mismatches for reduced-motion users.
  - Springs can overshoot `filter: blur()` below zero (console warning) — give `filter` its own
    tween: `transition: { ..., filter: { duration: 0.2 } }`.
  - `animate(mv, mv.get(), { type: 'inertia' })` does nothing — motion skips animations whose
    keyframes don't change. Compute the landing value yourself and animate to it.
  - Generic components (`<script setup generic="T">`) must declare their slots as optional in
    `defineSlots`, or the generated npm entry fails `pnpm typecheck`.
  - A `defineModel` ref doesn't reflect a new value until the parent re-renders; use the value you
    just set rather than re-reading the model in the same tick.
- **Accessibility**: real `<button>`s / inputs, correct ARIA roles and states, keyboard support
  (arrows / Home / End / Escape where expected), visible focus:
  `outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50`.
- **SSR-safe**: no `window` / `document` at setup top level — use `onMounted` or guards.
  Use `useId()` for ids. `Teleport to="body"` for overlays.
- **Exported names are global**: the npm entry re-exports every component with `export *`, so
  component, type and helper names must be unique across the library — prefix types
  (`ToolCallStatus`, not `Status`). `pnpm typecheck` fails on a clash.
- **CSS variables in inline styles / SVG**: the theme maps tokens with `@theme inline`, so only the
  raw variables exist at runtime — use `var(--chart-1)`, `var(--primary)`, never
  `var(--color-chart-1)`. For SVG gradients, `stop-color="currentColor"` + a `text-chart-*` class works well.
- **No new global state** except via module-level `reactive` for imperative APIs (see toast-stack).
- Keep each component self-contained and readable — people will copy and edit it.

## 3. Originality

vuelix takes inspiration from great libraries but **never copies them**. Implement from the concept
in your own words: your own markup, motion choreography, API and naming. Don't open or paraphrase
another library's source. If a concept name is a well-known generic pattern (tabs, drawer, dock,
command palette) keep it; if it's a distinctive name coined by another library, choose a new one.

## 4. Demo + docs page

`docs/demos/KebabNameDemo.vue` imports from `@/components/ui/kebab-name` and shows the component at its best
with realistic content. It renders inside a ~720px-wide, ≥320px-tall stage — make it fit (use
`max-w-*`). Overlays/toasts should be triggered by a button. Use `lucide-vue-next` for demo icons.

`docs/<section>/kebab-name.md` — copy `docs/components/spring-button.md` and adapt:
frontmatter (`title`, quoted `description`), `<ComponentPreview>` with the demo + code slot,
`## Installation` with `<InstallTabs name="kebab-name" />` and the manual-install details block
listing **every** file in the folder, `## Usage`, `## API` (props table; add emits / slots / exposed
functions when relevant).

## 5. Checks before committing

```bash
pnpm registry:build              # validates meta.json, regenerates the registry
pnpm typecheck                   # vue-tsc over registry + demos
pnpm build                       # docs site
npx vitepress preview docs --port 4173 &
node scripts/check-pages.mjs --port 4173 --out .shots components/kebab-name
node scripts/check-pages.mjs --port 4173 --out .shots --reduced components/kebab-name  # hydration check
```

`vitepress preview` indexes files at startup — restart it after every `pnpm build`.

Look at the light **and** dark screenshots in `.shots/`. Zero console errors is required.
