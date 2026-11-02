/**
 * vuelix MCP server — Cloudflare Pages Function at https://vuelix.dev/mcp
 *
 * Stateless "streamable HTTP" transport: every JSON-RPC request is answered with a
 * single JSON response (no sessions, no SSE). Data comes from the static registry
 * the site already serves (/r/index.json, /r/<slug>.json), so it's always in sync
 * with the deployed docs.
 *
 *   claude mcp add --transport http vuelix https://vuelix.dev/mcp
 */

interface Env {
  ASSETS: { fetch: (input: Request | string | URL) => Promise<Response> }
}

interface Ctx {
  request: Request
  env: Env
}

interface CatalogItem {
  slug: string
  name: string
  description: string
  section: string
  category: string
  page_url: string
  detail_url: string
  install: string
  npm: { package: string, imports: string[] }
  dependencies: string[]
  files: { path: string, raw_url: string }[]
}

interface JsonRpcRequest {
  jsonrpc: '2.0'
  id?: string | number | null
  method: string
  params?: Record<string, any>
}

const SERVER_INFO = { name: 'vuelix', title: 'vuelix — animated Vue components', version: '0.2.0' }
const PROTOCOL_VERSIONS = ['2025-06-18', '2025-03-26', '2024-11-05']

const INSTRUCTIONS = `vuelix is a library of animated Vue 3 components (Tailwind CSS v4 + motion-v).
Use search_components or list_components to find a fitting component, get_component to read its source,
and get_install_command to add it. Components use shadcn-vue theme tokens (bg-primary, text-muted-foreground, …),
so they inherit the project's theme. Prefer installing over re-implementing.`

const TOOLS = [
  {
    name: 'list_components',
    title: 'List components',
    description: 'List every vuelix component, optionally filtered by section (components, blocks, ai, charts).',
    inputSchema: {
      type: 'object',
      properties: {
        section: { type: 'string', enum: ['components', 'blocks', 'ai', 'charts'], description: 'Only list this section.' },
      },
    },
    annotations: { readOnlyHint: true },
  },
  {
    name: 'search_components',
    title: 'Search components',
    description: 'Search components by keywords across names, descriptions and categories. Returns the best matches first.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'What you need, e.g. "date picker", "chat input", "stacked bar".' },
        limit: { type: 'number', description: 'Maximum results (default 8).' },
      },
      required: ['query'],
    },
    annotations: { readOnlyHint: true },
  },
  {
    name: 'get_component',
    title: 'Get component',
    description: 'Get a component\'s full details: description, dependencies, install commands and the complete source of every file.',
    inputSchema: {
      type: 'object',
      properties: { slug: { type: 'string', description: 'Component slug, e.g. "spring-button".' } },
      required: ['slug'],
    },
    annotations: { readOnlyHint: true },
  },
  {
    name: 'get_install_command',
    title: 'Get install command',
    description: 'Get the command to add a component, either as copy-paste source (shadcn-vue CLI) or from the @vuelix/ui npm package.',
    inputSchema: {
      type: 'object',
      properties: {
        slug: { type: 'string', description: 'Component slug, e.g. "dock".' },
        method: { type: 'string', enum: ['source', 'npm'], description: 'source (default): copy files into the project. npm: import from the package.' },
        packageManager: { type: 'string', enum: ['pnpm', 'npm', 'yarn', 'bun'], description: 'Default npm.' },
      },
      required: ['slug'],
    },
    annotations: { readOnlyHint: true },
  },
]

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept, Authorization, Mcp-Session-Id, Mcp-Protocol-Version, Last-Event-ID',
  'Access-Control-Expose-Headers': 'Mcp-Session-Id',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...CORS } })
}

async function loadCatalog(ctx: Ctx): Promise<CatalogItem[]> {
  const res = await ctx.env.ASSETS.fetch(new URL('/r/index.json', ctx.request.url))
  if (!res.ok)
    throw new Error(`catalogue unavailable (${res.status})`)
  return ((await res.json()) as { items: CatalogItem[] }).items
}

function summary(c: CatalogItem) {
  return { slug: c.slug, name: c.name, description: c.description, section: c.section, category: c.category, url: c.page_url }
}

function score(c: CatalogItem, terms: string[]) {
  const hay = {
    slug: c.slug.toLowerCase(),
    name: c.name.toLowerCase(),
    category: `${c.section} ${c.category}`.toLowerCase(),
    description: c.description.toLowerCase(),
  }
  let total = 0
  for (const t of terms) {
    let s = 0
    if (hay.slug === t || hay.name === t)
      s += 10
    if (hay.slug.includes(t) || hay.name.includes(t))
      s += 5
    if (hay.category.includes(t))
      s += 3
    if (hay.description.includes(t))
      s += 2
    if (!s)
      return 0 // every term must match somewhere
    total += s
  }
  return total
}

function text(value: unknown, structured?: unknown) {
  return {
    content: [{ type: 'text', text: typeof value === 'string' ? value : JSON.stringify(value, null, 2) }],
    ...(structured !== undefined ? { structuredContent: structured } : {}),
  }
}

async function callTool(ctx: Ctx, name: string, args: Record<string, any> = {}) {
  const catalog = await loadCatalog(ctx)
  const find = (slug: string) => {
    const item = catalog.find(c => c.slug === String(slug ?? '').trim().toLowerCase())
    if (!item)
      throw new ToolError(`Unknown component "${slug}". Use search_components to find the right slug.`)
    return item
  }

  switch (name) {
    case 'list_components': {
      const items = catalog.filter(c => !args.section || c.section === args.section).map(summary)
      return text({ count: items.length, items }, { count: items.length, items })
    }
    case 'search_components': {
      const terms = String(args.query ?? '').toLowerCase().split(/\s+/).filter(Boolean)
      const limit = Math.min(Math.max(Number(args.limit) || 8, 1), 50)
      const results = catalog
        .map(c => ({ c, s: score(c, terms) }))
        .filter(r => r.s > 0)
        .sort((a, b) => b.s - a.s)
        .slice(0, limit)
        .map(r => summary(r.c))
      return text(results.length ? { results } : `No components match "${args.query}". Try broader terms or list_components.`, { results })
    }
    case 'get_component': {
      const item = find(args.slug)
      const res = await ctx.env.ASSETS.fetch(new URL(`/r/${item.slug}.json`, ctx.request.url))
      const detail = (await res.json()) as { files: { path: string, content: string }[] }
      const files = detail.files.map(f => ({ path: `components/ui/${item.slug}/${f.path.split('/').pop()}`, content: f.content }))
      const out = {
        ...summary(item),
        dependencies: item.dependencies,
        install: { source: item.install, npm: `npm install @vuelix/ui motion-v  # then: import { ${item.npm.imports.join(', ')} } from '@vuelix/ui'` },
        notes: 'Files import `cn` from "@/lib/utils" (clsx + tailwind-merge). Requires Tailwind CSS v4 and shadcn-vue style CSS variables.',
        files,
      }
      return text(out, out)
    }
    case 'get_install_command': {
      const item = find(args.slug)
      const pm = (['pnpm', 'npm', 'yarn', 'bun'].includes(args.packageManager) ? args.packageManager : 'npm') as 'pnpm' | 'npm' | 'yarn' | 'bun'
      if (args.method === 'npm') {
        const add = { pnpm: 'pnpm add', npm: 'npm install', yarn: 'yarn add', bun: 'bun add' }[pm]
        const out = {
          command: `${add} @vuelix/ui motion-v`,
          css: '@import "tailwindcss";\n@import "@vuelix/ui/tailwind.css";',
          import: `import { ${item.npm.imports.join(', ')} } from '@vuelix/ui'`,
        }
        return text(out, out)
      }
      const run = { pnpm: 'pnpm dlx', npm: 'npx', yarn: 'yarn dlx', bun: 'bunx --bun' }[pm]
      const out = { command: `${run} shadcn-vue@latest add https://vuelix.dev/r/${item.slug}.json`, installs_to: `components/ui/${item.slug}/` }
      return text(out, out)
    }
    default:
      throw new RpcError(-32602, `Unknown tool: ${name}`)
  }
}

class RpcError extends Error {
  code: number
  constructor(code: number, message: string) {
    super(message)
    this.code = code
  }
}
class ToolError extends Error {}

async function handle(ctx: Ctx, msg: JsonRpcRequest) {
  const isNotification = msg.id === undefined || msg.id === null
  try {
    if (msg.jsonrpc !== '2.0' || typeof msg.method !== 'string')
      throw new RpcError(-32600, 'Invalid Request')
    let result: unknown
    switch (msg.method) {
      case 'initialize': {
        const requested = msg.params?.protocolVersion
        result = {
          protocolVersion: PROTOCOL_VERSIONS.includes(requested) ? requested : PROTOCOL_VERSIONS[0],
          capabilities: { tools: { listChanged: false } },
          serverInfo: SERVER_INFO,
          instructions: INSTRUCTIONS,
        }
        break
      }
      case 'ping':
        result = {}
        break
      case 'tools/list':
        result = { tools: TOOLS }
        break
      case 'tools/call':
        try {
          result = await callTool(ctx, msg.params?.name, msg.params?.arguments)
        }
        catch (e) {
          if (e instanceof ToolError)
            result = { content: [{ type: 'text', text: e.message }], isError: true }
          else throw e
        }
        break
      default:
        if (msg.method.startsWith('notifications/'))
          return null
        throw new RpcError(-32601, `Method not found: ${msg.method}`)
    }
    return isNotification ? null : { jsonrpc: '2.0', id: msg.id, result }
  }
  catch (e) {
    if (isNotification)
      return null
    const code = e instanceof RpcError ? e.code : -32603
    return { jsonrpc: '2.0', id: msg.id, error: { code, message: e instanceof Error ? e.message : 'Internal error' } }
  }
}

export async function onRequestPost(ctx: Ctx): Promise<Response> {
  let body: JsonRpcRequest | JsonRpcRequest[]
  try {
    body = await ctx.request.json()
  }
  catch {
    return json({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } }, 400)
  }
  if (Array.isArray(body)) {
    const out = (await Promise.all(body.map(m => handle(ctx, m)))).filter(Boolean)
    return out.length ? json(out) : new Response(null, { status: 202, headers: CORS })
  }
  const out = await handle(ctx, body)
  return out ? json(out) : new Response(null, { status: 202, headers: CORS })
}

export async function onRequestGet(): Promise<Response> {
  // No server-initiated stream: this server is stateless.
  return new Response('vuelix MCP server. POST JSON-RPC here — see https://vuelix.dev/docs/ai-agents', {
    status: 405,
    headers: { 'Allow': 'POST, OPTIONS', 'Content-Type': 'text/plain', ...CORS },
  })
}

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, { status: 204, headers: CORS })
}

export async function onRequestDelete(): Promise<Response> {
  return new Response(null, { status: 405, headers: { Allow: 'POST, OPTIONS', ...CORS } })
}
