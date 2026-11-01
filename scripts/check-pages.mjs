// Visual + runtime smoke test for docs pages.
//
//   pnpm build && npx vitepress preview docs --port 4173   (in another shell)
//   node scripts/check-pages.mjs --port 4173 --out .shots components/dock blocks/command-palette
//
// For every path: loads it in light and dark mode, waits for animations, saves
// a screenshot of the preview area (or the full page if there isn't one) and
// prints any console errors / page errors. Exit code 1 if any errors were seen.
// --reduced emulates prefers-reduced-motion (surfaces SSR hydration mismatches).
import { mkdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join } from 'node:path'

// Playwright may be installed globally (CI images) rather than in the project.
let chromium
try {
  ({ chromium } = createRequire(import.meta.url)('playwright'))
}
catch {
  console.error('Playwright not found. Install it with: pnpm dlx playwright install chromium (and add playwright as a dev dependency)')
  process.exit(2)
}

const args = process.argv.slice(2)
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`)
  if (i === -1)
    return fallback
  return args.splice(i, 2)[1]
}
const reduced = args.includes('--reduced')
if (reduced)
  args.splice(args.indexOf('--reduced'), 1)
const port = opt('port', '4173')
const out = opt('out', '.shots')
const paths = args.length ? args : ['']
mkdirSync(out, { recursive: true })

const browser = await chromium.launch()
let failures = 0
for (const scheme of ['light', 'dark']) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, colorScheme: scheme, reducedMotion: reduced ? 'reduce' : 'no-preference' })
  for (const path of paths) {
    const errors = []
    const onConsole = m => ['error', 'warning'].includes(m.type()) && errors.push(`${m.type()}: ${m.text()}`)
    const onError = e => errors.push(`pageerror: ${e.message}`)
    page.on('console', onConsole)
    page.on('pageerror', onError)
    await page.goto(`http://localhost:${port}/${path.replace(/^\//, '')}`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(1800)
    const preview = await page.$('.vx-preview')
    const file = join(out, `${(path || 'home').replace(/\//g, '__')}.${scheme}${reduced ? '.reduced' : ''}.png`)
    if (preview)
      await preview.screenshot({ path: file })
    else
      await page.screenshot({ path: file, fullPage: true })
    page.off('console', onConsole)
    page.off('pageerror', onError)
    if (errors.length)
      failures++
    console.log(`${errors.length ? '✗' : '✓'} [${scheme}] /${path} → ${file}${errors.length ? `\n    ${errors.join('\n    ')}` : ''}`)
  }
  await page.close()
}
await browser.close()
process.exit(failures ? 1 : 0)
