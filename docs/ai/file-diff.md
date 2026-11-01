---
title: File Diff
description: "A unified diff viewer with a change bar, folding unchanged lines and per-hunk accept or reject that springs shut."
---

<script setup>
import Demo from '../demos/FileDiffDemo.vue'
</script>

# File Diff

A unified diff viewer with a change bar, folding unchanged lines and per-hunk accept or reject that springs shut.

<ComponentPreview>
  <Demo />
  <template #code>

<<< @/demos/FileDiffDemo.vue

  </template>
</ComponentPreview>

## Installation

<InstallTabs name="file-diff" />

:::: details Manual installation
Install the dependencies:

```bash
npm install motion-v
```

Then copy these files into `components/ui/file-diff/` (plus [`lib/utils.ts`](/docs/installation#utils) if you don't have it):

::: code-group
<<< @/../registry/ui/file-diff/FileDiff.vue [FileDiff.vue]
<<< @/../registry/ui/file-diff/parse-diff.ts [parse-diff.ts]
<<< @/../registry/ui/file-diff/index.ts [index.ts]
:::
::::

## Usage

```ts
import { FileDiff } from '@/components/ui/file-diff'
```

```vue
<FileDiff :diff="patch" reviewable v-model:decisions="decisions" @accept="applyHunk" />
```

`diff` is plain unified-diff text — `git diff` output, `diff -u`, or what your agent proposes.
Several files show one after another. Long runs of unchanged lines fold into a "Show N unchanged
lines" row. With `reviewable`, each hunk gets Accept / Reject; once decided, the hunk springs shut
and can be undone.

The parser is exported too, if you want the structure yourself:

```ts
import { parseUnifiedDiff } from '@/components/ui/file-diff'

const [file] = parseUnifiedDiff(patch)
file.additions // 4
file.hunks[0].lines // [{ type: 'add', content: '…', newLine: 2 }, …]
```

## API

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `diff` | `string` | — | Unified diff text. |
| `reviewable` | `boolean` | `false` | Accept / Reject buttons per hunk. |
| `contextLines` | `number` | `3` | Unchanged lines kept around each change before folding. |
| `v-model:decisions` | `Record<string, 'accepted' \| 'rejected'>` | `{}` | Review state, keyed `"<fileIndex>:<hunkIndex>"`. |

| Event | Payload | Description |
| --- | --- | --- |
| `accept` | `hunk: FileDiffHunk, file: FileDiffFile` | A hunk was accepted. |
| `reject` | `hunk: FileDiffHunk, file: FileDiffFile` | A hunk was rejected. |
