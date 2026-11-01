# vuelix

**Animated, copy-paste components for Vue 3 & Nuxt** — [vuelix.dev](https://vuelix.dev). Built on Tailwind CSS v4 and [Motion for Vue](https://motion.dev/docs/vue) (`motion-v`), distributed as a [shadcn-vue](https://shadcn-vue.com) registry.

You don't install vuelix as a dependency. You pull each component's **source** into your project and own it.

```bash
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
scripts/build-registry.mjs  # catalog.json → registry.json → docs/public/r
```

## Development

```bash
pnpm install
pnpm dev              # docs at http://localhost:5173
pnpm typecheck        # vue-tsc over registry + demos
pnpm build            # builds the registry JSON, then the docs site
```

### Adding a component

1. Create `registry/ui/<name>/` with the `.vue` file(s) and an `index.ts` barrel. Import helpers from `@/lib/utils`.
2. Add an entry to `registry/catalog.json` (name, title, category, description, npm `dependencies`).
3. Add a demo in `docs/demos/<Name>Demo.vue` and a page in `docs/components/<name>.md` (copy an existing one).
4. Run `pnpm build` and commit the regenerated `registry.json` + `docs/public/r/*.json`.

Use the shadcn-vue token names (`bg-primary`, `text-muted-foreground`, `border`, …) so components inherit the user's theme.

## Deployment

The docs + registry are hosted on **Cloudflare Pages** (project `vuelix`) at [vuelix.dev](https://vuelix.dev).
Every push to `main` builds the site and deploys it via `.github/workflows/deploy.yml`, which needs two repository secrets:

| Secret | Value |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | API token with **Account → Cloudflare Pages → Edit** |
| `CLOUDFLARE_ACCOUNT_ID` | The Cloudflare account ID that owns the `vuelix` project |

Manual deploy from a machine logged in with wrangler:

```bash
pnpm build && npx wrangler pages deploy docs/.vitepress/dist --project-name=vuelix --branch=main
```

## License

MIT
