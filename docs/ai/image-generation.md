---
title: Image Generation
description: "Image placeholder where grainy colour fields sharpen behind a scan line, then the result fades in."
---

<script setup>
import Demo from '../demos/ImageGenerationDemo.vue'
</script>

# Image Generation

Image placeholder where grainy colour fields sharpen behind a scan line, then the result fades in.

<ComponentPreview>
  <Demo />
  <template #code>

<<< @/demos/ImageGenerationDemo.vue

  </template>
</ComponentPreview>

## Installation

<InstallTabs name="image-generation" />

:::: details Manual installation
Install the dependencies:

```bash
npm install motion-v
```

Then copy these files into `components/ui/image-generation/` (plus [`lib/utils.ts`](/docs/installation#utils) if you don't have it):

::: code-group
<<< @/../registry/ui/image-generation/ImageGeneration.vue [ImageGeneration.vue]
<<< @/../registry/ui/image-generation/index.ts [index.ts]
:::
::::

## Usage

```ts
import { ImageGeneration } from '@/components/ui/image-generation'
```

```vue
<ImageGeneration
  :progress="job.progress"
  :src="job.url"
  :preview="job.partialUrl"
  :error="job.error"
  alt="A lighthouse on a cliff at dusk"
  aspect-ratio="4 / 3"
  @retry="restart"
/>
```

The placeholder is built from your `chart-1…4` tokens, so it matches your theme. Progress is smoothed with a spring, so coarse updates still sweep the scan line fluidly. If your backend sends intermediate previews, pass them as `preview` and they sharpen from a heavy blur as progress grows. The final `src` loads in the background and fades in once `progress` reaches `1`.

## API

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `progress` | `number` | `0` | Generation progress, `0`–`1`. Moving backwards restarts the reveal. |
| `src` | `string` | — | The finished image. |
| `alt` | `string` | `''` | Alt text for the finished image. |
| `preview` | `string` | — | Intermediate preview that sharpens as progress grows. |
| `error` | `boolean \| string` | — | Shows the error state; a string replaces the default message. |
| `label` | `string` | `'Generating'` | Caption text and accessible name of the progress bar. |
| `aspectRatio` | `string` | `'1 / 1'` | CSS `aspect-ratio` of the tile. |
| `hideCaption` | `boolean` | `false` | Hide the status pill. |

| Event | Payload | Description |
| --- | --- | --- |
| `retry` | — | The “Try again” button in the error state was pressed. |
| `load` | — | The final image finished loading. |

While generating, the tile is a `role="progressbar"` with `aria-valuenow`; the error state is a `role="alert"`. The colour fields stop drifting under `prefers-reduced-motion`.
