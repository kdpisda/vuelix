---
title: File Dropzone
description: "Drag-and-drop uploads that swell on hover, with thumbnails, live progress bars, retry and remove."
---

<script setup>
import Demo from '../demos/FileDropzoneDemo.vue'
</script>

# File Dropzone

Drag-and-drop uploads that swell on hover, with thumbnails, live progress bars, retry and remove.

<ComponentPreview align="start" min-height="480px">
  <Demo />
  <template #code>

<<< @/demos/FileDropzoneDemo.vue

  </template>
</ComponentPreview>

## Installation

<InstallTabs name="file-dropzone" />

:::: details Manual installation
Install the dependencies:

```bash
npm install motion-v
```

Then copy these files into `components/ui/file-dropzone/` (plus [`lib/utils.ts`](/docs/installation#utils) if you don't have it):

::: code-group
<<< @/../registry/ui/file-dropzone/FileDropzone.vue [FileDropzone.vue]
<<< @/../registry/ui/file-dropzone/index.ts [index.ts]
:::
::::

## Usage

```ts
import { FileDropzone, type FileDropzoneItem, type FileDropzoneUpload } from '@/components/ui/file-dropzone'

const files = ref<FileDropzoneItem[]>([])

// Any transport works — report progress, resolve on success, throw on failure.
const upload: FileDropzoneUpload = (file, report, signal) =>
  new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.upload.onprogress = e => report(e.loaded / e.total)
    xhr.onload = () => (xhr.status < 400 ? resolve(xhr.response) : reject(new Error(xhr.statusText)))
    xhr.onerror = () => reject(new Error('Network error'))
    signal.addEventListener('abort', () => xhr.abort())
    xhr.open('POST', '/api/upload')
    xhr.send(file)
  })
```

```vue
<FileDropzone
  v-model="files"
  :upload="upload"
  accept="image/*,.pdf"
  :max-size="10 * 1024 * 1024"
  hint="PNG, JPG or PDF · up to 10 MB"
/>
```

The drop area is a real button, so it can also be focused and opened with Enter or Space. Removing a
file that is still uploading aborts its `signal`. Image thumbnails use object URLs, which are revoked
when the file is removed or the component unmounts.

## API

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `v-model` | `FileDropzoneItem[]` | `[]` | The file list, including progress and status. |
| `upload` | `(file, report, signal) => Promise<unknown>` | — | Uploads one file. Without it, files are added as done. |
| `accept` | `string` | — | Accepted types, same syntax as `<input accept>`. |
| `multiple` | `boolean` | `true` | Allow more than one file. |
| `maxSize` | `number` | — | Max bytes per file. |
| `maxFiles` | `number` | — | Max files in the list. |
| `disabled` | `boolean` | `false` | Disable picking and dropping. |
| `label` | `string` | `'Drop files here or click to browse'` | Main line of the drop area. |
| `hint` | `string` | — | Secondary line, e.g. accepted types. |

`FileDropzoneItem`: `{ id, file?, name, size, type, progress (0–1), status: 'uploading' \| 'done' \| 'error', error?, preview? }`.

| Event | Payload | Description |
| --- | --- | --- |
| `reject` | `(file: File, reason: string)` | A file was refused (type, size or count). |
| `uploaded` | `(item)` | An upload finished. |
| `error` | `(item, error)` | An upload failed. |

| Exposed | Description |
| --- | --- |
| `add(files)` | Add files programmatically (e.g. from a paste handler). |
| `remove(item)` | Remove (and abort) a file. |
| `browse()` | Open the file picker. |
