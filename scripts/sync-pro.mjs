// Refreshes docs/data/pro-catalog.json from vuelix Pro's public catalogue (metadata only — no source).
// Never fails the build: if the network is unavailable the committed snapshot is kept.
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const out = join(dirname(fileURLToPath(import.meta.url)), '../docs/data/pro-catalog.json')

try {
  const res = await fetch('https://pro.vuelix.dev/r/index.json', { signal: AbortSignal.timeout(10_000) })
  if (!res.ok)
    throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  const items = data.items.map(({ name, title, description, section, category, page_url }) => ({ name, title, description, section, category, url: page_url }))
  if (!items.length)
    throw new Error('empty catalogue')
  mkdirSync(dirname(out), { recursive: true })
  writeFileSync(out, `${JSON.stringify(items, null, 2)}\n`)
  console.log(`vuelix Pro catalogue: ${items.length} items`)
}
catch (e) {
  console.warn(`vuelix Pro catalogue not refreshed (${e.message}); using the committed snapshot`)
}
