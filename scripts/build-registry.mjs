// Generates registry.json (shadcn-vue registry format) from registry/catalog.json,
// then runs `shadcn-vue build` to emit installable JSON into docs/public/r.
import { execSync } from 'node:child_process'
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const catalog = JSON.parse(readFileSync(join(root, 'registry/catalog.json'), 'utf8'))

const items = catalog.map((item) => {
  const dir = join(root, 'registry/ui', item.name)
  const files = readdirSync(dir)
    .filter(f => /\.(vue|ts)$/.test(f))
    .sort()
    .map(f => ({ path: relative(root, join(dir, f)), type: 'registry:ui' }))
  if (!files.length)
    throw new Error(`No files for ${item.name}`)
  return {
    name: item.name,
    type: 'registry:ui',
    title: item.title,
    description: item.description,
    categories: [item.category.toLowerCase().replace(/\W+/g, '-')],
    dependencies: item.dependencies ?? [],
    registryDependencies: item.registryDependencies ?? [],
    files,
  }
})

const registry = {
  $schema: 'https://shadcn-vue.com/schema/registry.json',
  name: 'vuelix',
  homepage: 'https://vuelix.dev',
  items,
}

writeFileSync(join(root, 'registry.json'), `${JSON.stringify(registry, null, 2)}\n`)
console.log(`registry.json: ${items.length} items`)

execSync('npx shadcn-vue build registry.json -o docs/public/r', { cwd: root, stdio: 'inherit' })
