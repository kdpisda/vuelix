// Single source of truth: registry/ui/<name>/meta.json + the component files next to it.
//
// Generates (never edit these by hand):
//   registry/catalog.json   — ordered list of every item (used by the docs site)
//   registry.json           — shadcn-vue registry manifest
//   docs/public/r/*.json    — installable registry items (via `shadcn-vue build`)
//   registry/index.ts       — entry point of the `vuelix` npm package
import { execSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const uiDir = join(root, 'registry/ui')

export const SECTIONS = ['components', 'blocks', 'ai', 'charts']
export const CATEGORY_ORDER = [
  // components
  'Buttons & Actions',
  'Inputs & Forms',
  'Overlays',
  'Navigation',
  'Layout & Surfaces',
  'Text & Motion',
  'Feedback',
  'Data Display',
  // blocks / ai / charts may use their own categories; unknown ones sort last
]

const errors = []
const items = readdirSync(uiDir, { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map((d) => {
    const name = d.name
    const dir = join(uiDir, name)
    const metaPath = join(dir, 'meta.json')
    if (!existsSync(metaPath)) {
      errors.push(`${name}: missing meta.json`)
      return null
    }
    const meta = JSON.parse(readFileSync(metaPath, 'utf8'))
    for (const key of ['title', 'description', 'section', 'category'])
      if (!meta[key]) errors.push(`${name}: meta.json is missing "${key}"`)
    if (meta.section && !SECTIONS.includes(meta.section))
      errors.push(`${name}: unknown section "${meta.section}" (use ${SECTIONS.join(', ')})`)
    if (!existsSync(join(dir, 'index.ts')))
      errors.push(`${name}: missing index.ts`)
    const files = readdirSync(dir).filter(f => /\.(vue|ts)$/.test(f)).sort()
    const index = existsSync(join(dir, 'index.ts')) ? readFileSync(join(dir, 'index.ts'), 'utf8') : ''
    const components = [...index.matchAll(/default as (\w+)/g)].map(m => m[1])
    // Value exports from `export { a, b } from` / `export function x` / `export const x` (not types)
    const values = [
      ...[...index.matchAll(/^export \{([^}]*)\} from/gm)]
        .flatMap(m => m[1].split(',').map(s => s.trim()).filter(s => s && !s.startsWith('type ') && !s.startsWith('default as')))
        .map(s => s.split(/\s+as\s+/).pop()),
    ]
    return {
      name,
      ...meta,
      section: meta.section,
      url: `/${meta.section}/${name}`,
      components,
      exports: [...new Set([...components, ...values, ...(meta.exports ?? [])])],
      files: files.map(f => relative(root, join(dir, f))),
    }
  })
  .filter(Boolean)

if (errors.length) {
  console.error(`\nRegistry errors:\n  ${errors.join('\n  ')}\n`)
  process.exit(1)
}

const rank = c => (CATEGORY_ORDER.includes(c) ? CATEGORY_ORDER.indexOf(c) : CATEGORY_ORDER.length)
items.sort((a, b) =>
  SECTIONS.indexOf(a.section) - SECTIONS.indexOf(b.section)
  || rank(a.category) - rank(b.category)
  || a.category.localeCompare(b.category)
  || (a.order ?? 0) - (b.order ?? 0)
  || a.title.localeCompare(b.title))

// ---------------------------------------------------------------------------
// registry/catalog.json (docs site)
// ---------------------------------------------------------------------------
const catalog = items.map(({ name, title, description, section, category, url, exports, dependencies }) =>
  ({ name, title, description, section, category, url, exports, dependencies }))
writeFileSync(join(root, 'registry/catalog.json'), `${JSON.stringify(catalog, null, 2)}\n`)

// ---------------------------------------------------------------------------
// registry.json + docs/public/r (shadcn-vue)
// ---------------------------------------------------------------------------
const registry = {
  $schema: 'https://shadcn-vue.com/schema/registry.json',
  name: 'vuelix',
  homepage: 'https://vuelix.dev',
  items: items.map(item => ({
    name: item.name,
    type: 'registry:ui',
    title: item.title,
    description: item.description,
    categories: [item.section, item.category.toLowerCase().replace(/\W+/g, '-')],
    dependencies: item.dependencies ?? [],
    registryDependencies: item.registryDependencies ?? [],
    files: item.files.map(path => ({ path, type: 'registry:ui' })),
  })),
}
writeFileSync(join(root, 'registry.json'), `${JSON.stringify(registry, null, 2)}\n`)
console.log(`registry.json: ${items.length} items`)

execSync('npx shadcn-vue build registry.json -o docs/public/r', { cwd: root, stdio: 'inherit' })

// ---------------------------------------------------------------------------
// Agent-friendly endpoints (see docs/docs/ai-agents.md)
//   /r/index.json            catalogue of every item (also served at /r)
//   /r/raw/<slug>/<file>     plain-text source of each file
// ---------------------------------------------------------------------------
const SITE = 'https://vuelix.dev'
const rawDir = join(root, 'docs/public/r/raw')
rmSync(rawDir, { recursive: true, force: true })
const index = items.map((item) => {
  const files = item.files.map((path) => {
    const file = path.split('/').pop()
    mkdirSync(join(rawDir, item.name), { recursive: true })
    writeFileSync(join(rawDir, item.name, file), readFileSync(join(root, path), 'utf8'))
    return { path: `components/ui/${item.name}/${file}`, raw_url: `${SITE}/r/raw/${item.name}/${file}` }
  })
  return {
    slug: item.name,
    name: item.title,
    description: item.description,
    section: item.section,
    category: item.category,
    page_url: `${SITE}${item.url}`,
    detail_url: `${SITE}/r/${item.name}.json`,
    install: `npx shadcn-vue@latest add ${SITE}/r/${item.name}.json`,
    npm: { package: 'vuelix', imports: item.exports },
    dependencies: item.dependencies ?? [],
    registry_dependencies: item.registryDependencies ?? [],
    files,
  }
})
writeFileSync(join(root, 'docs/public/r/index.json'), `${JSON.stringify({
  name: 'vuelix',
  homepage: SITE,
  description: 'Animated, copy-paste components for Vue 3 & Nuxt, built on Tailwind CSS v4 and motion-v.',
  utils: { path: 'lib/utils.ts', raw_url: `${SITE}/r/raw/utils.ts` },
  count: index.length,
  items: index,
}, null, 2)}\n`)
writeFileSync(join(rawDir, 'utils.ts'), readFileSync(join(root, 'registry/lib/utils.ts'), 'utf8'))
console.log(`r/index.json + r/raw: ${index.length} items`)

// ---------------------------------------------------------------------------
// registry/index.ts — entry point for the `vuelix` npm package
// ---------------------------------------------------------------------------
const names = items.flatMap(i => i.components)
const entry = `// Entry point for the \`vuelix\` npm package.
// Generated by scripts/build-registry.mjs from registry/ui/*/meta.json — do not edit.
import type { App, Component } from 'vue'
${items.filter(i => i.components.length).map(i => `import { ${i.components.join(', ')} } from './ui/${i.name}'`).join('\n')}

${items.map(i => `export * from './ui/${i.name}'`).join('\n')}
export { cn } from './lib/utils'

const components: Record<string, Component> = {
${names.map(n => `  ${n},`).join('\n')}
}

/**
 * Registers every vuelix component globally.
 *
 * \`\`\`ts
 * import { Vuelix } from 'vuelix'
 * app.use(Vuelix)                   // <SpringButton />
 * app.use(Vuelix, { prefix: 'Vx' }) // <VxSpringButton />
 * \`\`\`
 */
export const Vuelix = {
  install(app: App, options: { prefix?: string } = {}) {
    for (const [name, component] of Object.entries(components))
      app.component(\`\${options.prefix ?? ''}\${name}\`, component)
  },
}

export default Vuelix
`
writeFileSync(join(root, 'registry/index.ts'), entry)
console.log(`registry/index.ts: ${names.length} components`)
