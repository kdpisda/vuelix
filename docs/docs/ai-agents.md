---
title: For AI Agents
description: "How coding agents discover, read and install vuelix components: MCP server, llms.txt, JSON catalogue and raw sources."
---

# For AI Agents

vuelix is built to be used by coding agents (Claude Code, Cursor, Codex and friends) as easily as by people.
Everything below is public and needs no API key.

## MCP server

A hosted [Model Context Protocol](https://modelcontextprotocol.io) server lets agents list, search, read and install components.

```txt
https://vuelix.dev/mcp
```

::: code-group

```bash [Claude Code]
claude mcp add --transport http vuelix https://vuelix.dev/mcp
```

```bash [Codex]
codex mcp add vuelix --url https://vuelix.dev/mcp
```

```json [Other clients]
{
  "mcpServers": {
    "vuelix": { "type": "http", "url": "https://vuelix.dev/mcp" }
  }
}
```

:::

| Tool | What it does |
| --- | --- |
| `list_components` | Every component, optionally filtered by `section` (`components`, `blocks`, `ai`, `charts`) |
| `search_components` | Keyword search across names, descriptions and categories |
| `get_component` | Full details plus the complete source of every file |
| `get_install_command` | The command to add it: copy source (shadcn-vue CLI) or the npm package |

## Agent skill

Teach your agent to reach for vuelix before hand-rolling UI:

```bash
npx skills add kdpisda/vuelix --skill vuelix
```

The skill tells the agent to search the catalogue first, pick the closest component, install it and compose from the generated source.

## Endpoints

| URL | Contents |
| --- | --- |
| [`/llms.txt`](/llms.txt) | Markdown index of the site ([llmstxt.org](https://llmstxt.org) format) |
| [`/r`](/r) | JSON catalogue of every item: slug, description, section, URLs, dependencies, files |
| `/r/{slug}.json` | shadcn-vue registry item with inline file contents (what the CLI installs) |
| `/r/raw/{slug}/{file}` | Plain-text source of a single file |
| [`/r/registry.json`](/r/registry.json) | The shadcn-vue registry manifest |

## Agent flow without MCP

1. Fetch `https://vuelix.dev/r` and pick an item by `slug` / `description`.
2. Either run its `install` command, **or** fetch each `files[].raw_url` and write it to `files[].path`.
3. Make sure `lib/utils.ts` exists (`utils.raw_url` in the catalogue) and install the item's `dependencies`.

Components use shadcn-vue's semantic tokens (`bg-primary`, `text-muted-foreground`, `border`, …), so they inherit the target app's theme. They need Tailwind CSS v4.

## Catalogue entry shape

```json
{
  "slug": "dock",
  "name": "Dock",
  "description": "A magnifying dock where icons grow as the pointer approaches.",
  "section": "components",
  "category": "Navigation",
  "page_url": "https://vuelix.dev/components/dock",
  "detail_url": "https://vuelix.dev/r/dock.json",
  "install": "npx shadcn-vue@latest add https://vuelix.dev/r/dock.json",
  "npm": { "package": "vuelix", "imports": ["Dock", "DockItem"] },
  "dependencies": ["motion-v"],
  "files": [
    { "path": "components/ui/dock/Dock.vue", "raw_url": "https://vuelix.dev/r/raw/dock/Dock.vue" }
  ]
}
```
