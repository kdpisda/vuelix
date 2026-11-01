---
title: Citations
description: "Numbered citation chips with hover cards, linked to a sources list that lights up the cited source."
---

<script setup>
import Demo from '../demos/CitationsDemo.vue'
</script>

# Citations

Numbered citation chips with hover cards, linked to a sources list that lights up the cited source.

<ComponentPreview>
  <Demo />
  <template #code>

<<< @/demos/CitationsDemo.vue

  </template>
</ComponentPreview>

## Installation

<InstallTabs name="citations" />

:::: details Manual installation
Install the dependencies:

```bash
npm install motion-v
```

Then copy these files into `components/ui/citations/` (plus [`lib/utils.ts`](/docs/installation#utils) if you don't have it):

::: code-group
<<< @/../registry/ui/citations/Citations.vue [Citations.vue]
<<< @/../registry/ui/citations/CitationChip.vue [CitationChip.vue]
<<< @/../registry/ui/citations/SourceIcon.vue [SourceIcon.vue]
<<< @/../registry/ui/citations/context.ts [context.ts]
<<< @/../registry/ui/citations/index.ts [index.ts]
:::
::::

## Usage

```ts
import { CitationChip, Citations } from '@/components/ui/citations'
```

Pass text with `[n]` markers and they become chips (markers past the end of `sources` stay plain text):

```vue
<Citations :sources="sources" text="Blue light scatters more strongly than red [1][2]." />
```

Or write your own markup with `<CitationChip>` anywhere inside, e.g. in a rendered Markdown answer:

```vue
<Citations :sources="sources">
  <p>Blue light scatters more strongly <CitationChip :n="1" /> than red.</p>
</Citations>
```

Hovering or focusing a chip opens a card with the source's domain, title and snippet, and highlights it in the sources list. Hovering a source highlights its chips. Chips with a `url` are links that open the source in a new tab.

## API

### Citations

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `sources` | `CitationSource[]` | — | Sources, numbered from `1`. |
| `text` | `string` | `''` | Text with `[1]`-style markers. Ignored when the default slot is used. |
| `hideSources` | `boolean` | `false` | Don't render the sources list. |
| `sourcesLabel` | `string` | `'Sources'` | Heading of the sources list. |

### CitationChip

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `n` | `number` | — | 1-based number of the source in the parent's `sources`. |

### CitationSource

| Field | Type | Description |
| --- | --- | --- |
| `title` | `string` | Title of the page. |
| `url` | `string?` | Link; also used to derive the domain. |
| `snippet` | `string?` | Excerpt shown in the hover card. |
| `favicon` | `string?` | Favicon URL. Falls back to the domain's initial on a tinted square. |
| `domain` | `string?` | Display domain, if it shouldn't come from `url`. |

Chips are real links or buttons with an `aria-label` like “Source 2: Rayleigh scattering”; the card is a `role="tooltip"` referenced by `aria-describedby` and closes on `Escape`.
