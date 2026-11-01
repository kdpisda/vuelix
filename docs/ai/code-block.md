---
title: Code Block
description: "Code with a file header, line numbers, highlighted lines, a copy-to-check button and a springy collapse for long snippets."
---

<script setup>
import Demo from '../demos/CodeBlockDemo.vue'
</script>

# Code Block

Code with a file header, line numbers, highlighted lines, a copy-to-check button and a springy collapse for long snippets.

<ComponentPreview>
  <Demo />
  <template #code>

<<< @/demos/CodeBlockDemo.vue

  </template>
</ComponentPreview>

## Installation

<InstallTabs name="code-block" />

:::: details Manual installation
Install the dependencies:

```bash
npm install motion-v
```

Then copy these files into `components/ui/code-block/` (plus [`lib/utils.ts`](/docs/installation#utils) if you don't have it):

::: code-group
<<< @/../registry/ui/code-block/CodeBlock.vue [CodeBlock.vue]
<<< @/../registry/ui/code-block/index.ts [index.ts]
:::
::::

## Usage

```ts
import { CodeBlock } from '@/components/ui/code-block'
```

```vue
<!-- plain text -->
<CodeBlock :code="source" filename="main.ts" language="ts" highlight="3-5" />

<!-- bring your own highlighter -->
<CodeBlock :code="source" :html="shikiHtml" filename="main.ts" language="ts" collapsible />
```

The component ships no tokenizer, so it stays dependency-free. Pass plain text, or pass highlighted
HTML from Shiki / highlight.js via `html` (or the default slot) — `code` is still what gets copied
and counted. Highlighted HTML is rendered with `v-html`, so only pass markup you produced.

## API

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `code` | `string` | — | Source text. Rendered when there's no `html` / slot, and always what Copy copies. |
| `html` | `string` | — | Pre-highlighted HTML. A wrapping `<pre><code>` is stripped. |
| `filename` | `string` | `'Code'` | Shown in the header. |
| `language` | `string` | — | Badge in the header. |
| `lineNumbers` | `boolean` | `true` | Show the line-number gutter. |
| `startLine` | `number` | `1` | Number of the first line. |
| `highlight` | `number[] \| string` | — | Lines to highlight: `[2, 3]` or `"2-4, 9"`. |
| `collapsible` | `boolean` | `false` | Fold long code behind a fade with a toggle. |
| `collapsedLines` | `number` | `12` | Lines visible while folded. |

| Slot | Description |
| --- | --- |
| default | Highlighted markup, instead of `html`. |
| `actions` | Extra header buttons, before Copy. |
