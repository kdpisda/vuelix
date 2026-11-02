# vuelix

**Animated, copy-paste components for Vue 3 & Nuxt** — [vuelix.dev](https://vuelix.dev). Built on Tailwind CSS v4 and [Motion for Vue](https://motion.dev/docs/vue) (`motion-v`), distributed as a [shadcn-vue](https://shadcn-vue.com) registry.

Use it two ways:

```bash
# 1. npm package — install and import
npm install @vuelix/ui motion-v    # then: @import "@vuelix/ui/tailwind.css";

# 2. Copy source — own and edit the code
npx shadcn-vue@latest add https://vuelix.dev/r/dock.json
```

## Components

114 items. Browse them all with live demos at [vuelix.dev](https://vuelix.dev).

| Category | Components |
| --- | --- |
| Buttons & Actions | CTA Button, Expanding Button, Icon Swap, Spring Button, Theme Toggle |
| Inputs & Forms | Color Picker, Color Swatches, Combobox, Date Range Picker, Dial Picker, Floating Input, Motion Select, Multi Select, OTP Input, Radio Cards, Range Slider, Spring Checkbox, Spring Switch, Wheel Picker |
| Overlays | Animated Tooltip, Bottom Sheet, Context Menu, Expanding Modal, Morphing Dialog, Spring Drawer, Spring Popover |
| Navigation | Animated Tabs, Breadcrumbs, Dock, Pagination, Spring Sidebar, Stepper |
| Layout & Surfaces | Aspect Ratio, Aurora Background, Bouncy Accordion, Collapsible, Hover Highlight, Orbit Carousel, Spotlight Card, Tilt Card |
| Text & Motion | Marquee, Number Ticker, Scroll Reveal, Text Reveal |
| Feedback | Alert, Loader, Pull to Refresh, Toast Stack |
| Data Display | Avatar Group, Data Table, File Tree, Filmstrip, Lightbox, Motion Badge, Sortable List, Timeline |
| Blocks | Action Bar, Auth Form, Availability Picker, Card Fan, Command Palette, Dynamic Island, Expandable Tabs, Feedback Widget, File Dropzone, Fluid Tabs, Folder Stack, Masonry Grid, Match Fixtures, Morphing Search, Not Found, Notification Center, Odds Card, Overflow Toolbar, Radial Menu, Swipe Actions, Token Swap, Wallet Card |
| AI | Agent Activity, Approval Card, Chat App, Chat Message, Chat Scroller, Citations, Code Block, Conversation Sidebar, File Diff, Image Generation, Model Picker, Prompt Input, Streaming Text, Suggestion Chips, Task List, Thinking Indicator, Tool Call, Voice Orb |
| Charts | Bar Chart, Bump Chart, Candlestick Chart, Depth Heatmap, Donut Chart, Forecast Fan, Funnel Chart, Heat Calendar, Line Chart, Order Book, Returns Calendar, Sankey Chart, Sparkline, Stacked Area, Status History, Treemap, Volume Profile |

## Repo layout

```
registry/
  catalog.json          # name, title, category, npm deps for every component
  lib/utils.ts          # cn() helper (same as shadcn-vue)
  ui/<name>/*.vue|ts    # component source (what users receive)
docs/                   # VitePress docs site
  .vitepress/           # config, theme, ComponentPreview, InstallTabs
  demos/                # one live demo per component
  components/<name>.md  # component pages
  public/r/*.json       # built registry (generated)
  index.ts              # npm package entry (generated)
packages/vuelix/        # npm package: builds registry/ → dist/ with Vite
scripts/build-registry.mjs  # catalog.json → registry.json, docs/public/r, registry/index.ts
```

## Development

```bash
pnpm install
pnpm dev              # docs at http://localhost:5173
pnpm typecheck        # vue-tsc over registry + demos
pnpm build            # builds the registry JSON, then the docs site
pnpm build:package    # builds the npm package into packages/vuelix/dist
```

### Adding a component

1. Create `registry/ui/<name>/` with the `.vue` file(s) and an `index.ts` barrel. Import helpers from `@/lib/utils`.
2. Add an entry to `registry/catalog.json` (name, title, category, description, npm `dependencies`).
3. Add a demo in `docs/demos/<Name>Demo.vue` and a page in `docs/components/<name>.md` (copy an existing one).
4. Run `pnpm build` and commit the regenerated `registry.json` + `docs/public/r/*.json`.

Use the shadcn-vue token names (`bg-primary`, `text-muted-foreground`, `border`, …) so components inherit the user's theme.

## Releasing the npm package

1. Bump `version` in `packages/vuelix/package.json` and push to `main`.
2. Create a GitHub release tagged `v<version>` (e.g. `v0.2.0`).
3. `.github/workflows/release.yml` builds and publishes to npm with provenance.

Publishing authenticates with npm **trusted publishing** (OIDC, no token), configured on npmjs.com for
`@vuelix/ui` → repo `kdpisda/vuelix`, workflow `release.yml`.

## Deployment

The docs + registry are hosted on **Cloudflare Pages** (project `vuelix`) at [vuelix.dev](https://vuelix.dev),
using Pages' built-in GitHub integration — no Actions or secrets involved:

- **Push to `main`** → Cloudflare builds (`pnpm build`) and deploys `docs/.vitepress/dist` to production.
- **Any other branch / PR** → a preview deployment at `<branch>.vuelix.pages.dev`, linked from the PR.

Build settings live in the Cloudflare dashboard (Workers & Pages → vuelix → Settings → Builds): Node 22, root `/`.

## License

MIT
