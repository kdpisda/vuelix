<script setup lang="ts">
import type { FileDropzoneItem, FileDropzoneUpload } from '@/ui/file-dropzone'
import { FileDropzone } from '@/ui/file-dropzone'
import { ref } from 'vue'

const files = ref<FileDropzoneItem[]>([
  { id: 'seed-1', name: 'moodboard-cover.jpg', size: 482_133, type: 'image/jpeg', progress: 1, status: 'done', preview: 'https://picsum.photos/seed/dune/96/96' },
  { id: 'seed-2', name: 'brand-guidelines.pdf', size: 3_870_221, type: 'application/pdf', progress: 1, status: 'done' },
])

// Fake network: progress in random steps; every third upload fails so you can try "Retry".
let count = 0
const upload: FileDropzoneUpload = (_file, report, signal) => {
  const fail = ++count % 3 === 0
  return new Promise((resolve, reject) => {
    let p = 0
    const timer = setInterval(() => {
      if (signal.aborted) {
        clearInterval(timer)
        return reject(new Error('Cancelled'))
      }
      p = Math.min(1, p + 0.06 + Math.random() * 0.14)
      report(fail ? Math.min(p, 0.62) : p)
      if (fail && p > 0.6) {
        clearInterval(timer)
        reject(new Error('Network hiccup, try again'))
      }
      else if (p >= 1) {
        clearInterval(timer)
        resolve(undefined)
      }
    }, 220)
  })
}
</script>

<template>
  <div class="w-full max-w-md">
    <FileDropzone
      v-model="files"
      :upload="upload"
      accept="image/*,.pdf,.zip,.fig"
      :max-size="20 * 1024 * 1024"
      hint="Images, PDF, ZIP or Figma files · up to 20 MB"
    />
  </div>
</template>
