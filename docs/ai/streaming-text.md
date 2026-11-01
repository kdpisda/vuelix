---
title: Streaming Text
description: "Streamed AI answers where each new chunk blurs in, with a blinking cursor and light Markdown."
---

<script setup>
import Demo from '../demos/StreamingTextDemo.vue'
</script>

# Streaming Text

Streamed AI answers where each new chunk blurs in, with a blinking cursor and light Markdown.

<ComponentPreview align="start">
  <Demo />
  <template #code>

<<< @/demos/StreamingTextDemo.vue

  </template>
</ComponentPreview>

## Installation

<InstallTabs name="streaming-text" />

:::: details Manual installation
Install the dependencies:

```bash
npm install motion-v
```

Then copy these files into `components/ui/streaming-text/` (plus [`lib/utils.ts`](/docs/installation#utils) if you don't have it):

::: code-group
<<< @/../registry/ui/streaming-text/StreamingText.vue [StreamingText.vue]
<<< @/../registry/ui/streaming-text/markdown.ts [markdown.ts]
<<< @/../registry/ui/streaming-text/use-text-stream.ts [use-text-stream.ts]
<<< @/../registry/ui/streaming-text/index.ts [index.ts]
:::
::::

## Usage

```ts
import { StreamingText } from '@/components/ui/streaming-text'
```

Grow `text` as tokens arrive. Only the part that is new since the last update animates, so you can append on every chunk:

```vue
<StreamingText :text="answer" :streaming="isGenerating" markdown />
```

Or hand it an async iterable (for example a `ReadableStream` of decoded text) and let it accumulate the chunks itself:

```vue
<StreamingText :stream="response" markdown @done="save" />
```

### Simulating a stream

`useTextStream()` replays a string in token-sized chunks, for demos, loading states and tests. `createTextStream()` does the same as an async iterable for the `stream` prop.

```ts
import { createTextStream, useTextStream } from '@/components/ui/streaming-text'

const { text, streaming, start, stop, complete } = useTextStream(answer, { interval: 40, autoStart: true })
const stream = createTextStream(answer, { delay: 300 })
```

## API

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `text` | `string` | `''` | The text received so far. When it extends the previous value, only the new part animates; any other change starts over. |
| `stream` | `AsyncIterable<string>` | — | Chunks to consume and accumulate instead of `text`. |
| `streaming` | `boolean` | `false` | Shows the blinking cursor. Always on while a `stream` is being read. |
| `markdown` | `boolean` | `false` | Renders paragraphs, `#` headings, `-` / `1.` lists, `**bold**` and `` `code` ``. Unclosed markers mid-stream render as if closed. |
| `animation` | `'blur' \| 'fade' \| 'none'` | `'blur'` | How each new chunk enters. |
| `hideCursor` | `boolean` | `false` | Never show the cursor. |
| `as` | `string` | `'div'` | Root element. |

| Event | Payload | Description |
| --- | --- | --- |
| `done` | `text: string` | A `stream` was fully consumed. |

| `useTextStream(source, options)` | Description |
| --- | --- |
| `source` | `MaybeRefOrGetter<string>`: the full text to replay. |
| `options.interval` | Average ms between chunks (default `32`, jittered ±50%). |
| `options.delay` | Ms before the first chunk (default `0`). |
| `options.autoStart` | Start when the calling component mounts (default `false`). |
| returns | `{ text, streaming, start, stop, complete }`. |

The root is an `aria-live="polite"` region with `aria-busy` set while streaming, so screen readers announce the answer once rather than on every token.
