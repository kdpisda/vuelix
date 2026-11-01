# vuelix

**Animated, copy-paste components for Vue 3 & Nuxt** — [vuelix.dev](https://vuelix.dev). Built on Tailwind CSS v4 and [Motion for Vue](https://motion.dev/docs/vue) (`motion-v`), distributed as a [shadcn-vue](https://shadcn-vue.com) registry.

Use it two ways:

```bash
# 1. npm package — install and import
npm install vuelix motion-v        # then: @import "vuelix/tailwind.css";

# 2. Copy source — own and edit the code
npx shadcn-vue@latest add https://vuelix.dev/r/dock.json
```

## Components

| Category | Components |
| --- | --- |
| Primitives | Spring Button, Animated Tabs, Spring Switch, Animated Tooltip, Bouncy Accordion |
| Text & Numbers | Number Ticker, Text Reveal |
| Surfaces | Tilt Card, Morphing Dialog |
| Navigation | Dock, Theme Toggle |
| Feedback | Toast Stack |
| Data Display | Avatar Group |
| Charts | Sparkline |
| Forms | OTP Input |

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

Publishing auth uses npm **trusted publishing** (OIDC, no token). Set it up once on npmjs.com →
`vuelix` → Settings → Trusted publishing → GitHub Actions, repo `kdpisda/vuelix`, workflow `release.yml`.
Until that's configured, add an `NPM_TOKEN` repository secret (automation token) instead.

## Deployment

The docs + registry are hosted on **Cloudflare Pages** (project `vuelix`) at [vuelix.dev](https://vuelix.dev),
using Pages' built-in GitHub integration — no Actions or secrets involved:

- **Push to `main`** → Cloudflare builds (`pnpm build`) and deploys `docs/.vitepress/dist` to production.
- **Any other branch / PR** → a preview deployment at `<branch>.vuelix.pages.dev`, linked from the PR.

Build settings live in the Cloudflare dashboard (Workers & Pages → vuelix → Settings → Builds): Node 22, root `/`.

## License

MIT
