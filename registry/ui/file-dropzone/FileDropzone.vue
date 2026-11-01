<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { AnimatePresence, motion, useReducedMotion } from 'motion-v'
import { computed, onBeforeUnmount, ref, shallowRef, useId, watch } from 'vue'
import { cn } from '@/lib/utils'

export interface FileDropzoneItem {
  id: string
  /** Missing for items you seed yourself (e.g. already-uploaded files). */
  file?: File
  name: string
  size: number
  type: string
  /** 0 → 1 */
  progress: number
  status: 'uploading' | 'done' | 'error'
  error?: string
  /** Thumbnail URL (an object URL is created automatically for images). */
  preview?: string
}

/** Upload one file. Call `report(0…1)` as it progresses; resolve on success, reject with an Error on failure. */
export type FileDropzoneUpload = (file: File, report: (progress: number) => void, signal: AbortSignal) => Promise<unknown>

const props = withDefaults(defineProps<{
  /** Uploads each accepted file. Without it, files are added as done. */
  upload?: FileDropzoneUpload
  /** Same syntax as `<input accept>`, e.g. `"image/*,.pdf"`. */
  accept?: string
  multiple?: boolean
  /** Max size per file in bytes. */
  maxSize?: number
  maxFiles?: number
  disabled?: boolean
  label?: string
  /** Secondary line, e.g. "PNG, JPG or PDF · up to 10 MB". */
  hint?: string
  class?: HTMLAttributes['class']
}>(), {
  multiple: true,
  label: 'Drop files here or click to browse',
})

const model = defineModel<FileDropzoneItem[]>({ default: () => [] })
const emit = defineEmits<{
  /** A file was refused before uploading (type, size or count). */
  reject: [file: File, reason: string]
  uploaded: [item: FileDropzoneItem]
  error: [item: FileDropzoneItem, error: unknown]
}>()

const SPRING = { type: 'spring', stiffness: 380, damping: 30 } as const
const reduced = useReducedMotion()
const inputId = `vx-dropzone-${useId()}`

// Internal source of truth: v-model updates from the parent arrive a tick later,
// but progress callbacks can fire several times per tick.
const list = shallowRef<FileDropzoneItem[]>(model.value)
watch(model, (v) => {
  if (v !== list.value)
    list.value = v
})
function commit(next: FileDropzoneItem[]) {
  list.value = next
  model.value = next
}
function patch(id: string, changes: Partial<FileDropzoneItem>) {
  commit(list.value.map(item => (item.id === id ? { ...item, ...changes } : item)))
}

// ---------------------------------------------------------------------------
// Adding files
// ---------------------------------------------------------------------------
const input = ref<HTMLInputElement>()
const controllers = new Map<string, AbortController>()
const objectUrls = new Set<string>()
let seq = 0

const rejections = ref<{ id: number, text: string }[]>([])
const announcement = ref('')

function accepts(file: File) {
  if (!props.accept)
    return true
  return props.accept.split(',').map(s => s.trim().toLowerCase()).filter(Boolean).some((rule) => {
    if (rule.startsWith('.'))
      return file.name.toLowerCase().endsWith(rule)
    if (rule.endsWith('/*'))
      return file.type.startsWith(rule.slice(0, -1))
    return file.type === rule
  })
}

function rejectFile(file: File, reason: string) {
  emit('reject', file, reason)
  const id = ++seq
  rejections.value = [...rejections.value, { id, text: `${file.name}: ${reason}` }]
  setTimeout(() => (rejections.value = rejections.value.filter(r => r.id !== id)), 5000)
}

/** Add files programmatically (e.g. from a paste handler). */
function add(files: Iterable<File>) {
  if (props.disabled)
    return
  const incoming = [...files].slice(0, props.multiple ? undefined : 1)
  const added: FileDropzoneItem[] = []
  for (const file of incoming) {
    if (!accepts(file)) {
      rejectFile(file, 'file type not accepted')
      continue
    }
    if (props.maxSize && file.size > props.maxSize) {
      rejectFile(file, `larger than ${formatBytes(props.maxSize)}`)
      continue
    }
    if (props.maxFiles && list.value.length + added.length >= props.maxFiles) {
      rejectFile(file, `only ${props.maxFiles} file${props.maxFiles === 1 ? '' : 's'} allowed`)
      continue
    }
    let preview: string | undefined
    if (file.type.startsWith('image/') && typeof URL !== 'undefined') {
      preview = URL.createObjectURL(file)
      objectUrls.add(preview)
    }
    added.push({
      id: `${Date.now().toString(36)}-${++seq}`,
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      progress: props.upload ? 0 : 1,
      status: props.upload ? 'uploading' : 'done',
      preview,
    })
  }
  if (!added.length)
    return
  commit(props.multiple ? [...list.value, ...added] : added)
  added.forEach(start)
}

async function start(item: FileDropzoneItem) {
  if (!props.upload || !item.file)
    return
  const ctrl = new AbortController()
  controllers.set(item.id, ctrl)
  try {
    await props.upload(item.file, (p) => {
      if (!ctrl.signal.aborted)
        patch(item.id, { progress: Math.min(1, Math.max(0, p)) })
    }, ctrl.signal)
    if (ctrl.signal.aborted)
      return
    patch(item.id, { progress: 1, status: 'done' })
    announcement.value = `${item.name} uploaded`
    emit('uploaded', list.value.find(i => i.id === item.id)!)
  }
  catch (error) {
    if (ctrl.signal.aborted)
      return
    const message = error instanceof Error ? error.message : 'Upload failed'
    patch(item.id, { status: 'error', error: message })
    announcement.value = `${item.name} failed: ${message}`
    emit('error', list.value.find(i => i.id === item.id)!, error)
  }
  finally {
    controllers.delete(item.id)
  }
}

function retry(item: FileDropzoneItem) {
  patch(item.id, { status: 'uploading', progress: 0, error: undefined })
  start({ ...item })
}

function remove(item: FileDropzoneItem) {
  controllers.get(item.id)?.abort()
  controllers.delete(item.id)
  if (item.preview && objectUrls.has(item.preview)) {
    URL.revokeObjectURL(item.preview)
    objectUrls.delete(item.preview)
  }
  commit(list.value.filter(i => i.id !== item.id))
  announcement.value = `${item.name} removed`
}

onBeforeUnmount(() => {
  controllers.forEach(c => c.abort())
  objectUrls.forEach(u => URL.revokeObjectURL(u))
})

function onChange(e: Event) {
  const el = e.target as HTMLInputElement
  if (el.files)
    add(el.files)
  el.value = ''
}

// ---------------------------------------------------------------------------
// Drag & drop
// ---------------------------------------------------------------------------
const over = ref(false)
let depth = 0

function hasFiles(e: DragEvent) {
  return [...(e.dataTransfer?.types ?? [])].includes('Files')
}
function onDragEnter(e: DragEvent) {
  if (props.disabled || !hasFiles(e))
    return
  depth++
  over.value = true
}
function onDragOver(e: DragEvent) {
  if (props.disabled || !hasFiles(e))
    return
  e.preventDefault()
  if (e.dataTransfer)
    e.dataTransfer.dropEffect = 'copy'
}
function onDragLeave() {
  depth = Math.max(0, depth - 1)
  if (!depth)
    over.value = false
}
function onDrop(e: DragEvent) {
  e.preventDefault()
  depth = 0
  over.value = false
  if (e.dataTransfer?.files.length)
    add(e.dataTransfer.files)
}

defineExpose({ add, remove, browse: () => input.value?.click() })

// ---------------------------------------------------------------------------
// Display helpers
// ---------------------------------------------------------------------------
function formatBytes(n: number) {
  if (n < 1024)
    return `${n} B`
  const units = ['KB', 'MB', 'GB']
  let v = n / 1024
  let u = 0
  while (v >= 1024 && u < units.length - 1) {
    v /= 1024
    u++
  }
  return `${v < 10 ? v.toFixed(1) : Math.round(v)} ${units[u]}`
}

function extension(name: string) {
  const ext = name.split('.').pop()
  return ext && ext !== name ? ext.slice(0, 4).toUpperCase() : 'FILE'
}

function statusText(item: FileDropzoneItem) {
  if (item.status === 'uploading')
    return `${Math.round(item.progress * 100)}%`
  return item.status === 'done' ? 'Uploaded' : (item.error || 'Upload failed')
}

const uploading = computed(() => list.value.filter(i => i.status === 'uploading').length)
</script>

<template>
  <div :class="cn('w-full', props.class)">
    <input
      :id="inputId"
      ref="input"
      type="file"
      class="sr-only"
      tabindex="-1"
      aria-hidden="true"
      :accept="props.accept"
      :multiple="props.multiple"
      :disabled="props.disabled"
      @change="onChange"
    >
    <motion.button
      type="button"
      :disabled="props.disabled"
      :aria-describedby="props.hint ? `${inputId}-hint` : undefined"
      :class="cn(
        'relative flex w-full flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl border-2 border-dashed px-6 py-10 text-center outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50',
        over ? 'border-brand bg-brand/5' : 'border-border bg-muted/30 hover:border-muted-foreground/40 hover:bg-muted/50',
      )"
      :animate="{ scale: over && !reduced ? 1.02 : 1 }"
      :while-press="props.disabled ? undefined : { scale: 0.99 }"
      :transition="SPRING"
      @click="input?.click()"
      @dragenter="onDragEnter"
      @dragover="onDragOver"
      @dragleave="onDragLeave"
      @drop="onDrop"
    >
      <motion.span
        aria-hidden="true"
        :class="cn('relative flex size-12 items-center justify-center rounded-2xl border bg-background shadow-xs transition-colors', over ? 'text-brand' : 'text-muted-foreground')"
        :animate="over && !reduced ? { y: -4, rotate: -6, scale: 1.08 } : { y: 0, rotate: 0, scale: 1 }"
        :transition="SPRING"
      >
        <svg class="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14.9A7 7 0 1 1 15.7 8h1.8a4.5 4.5 0 0 1 2.5 8.2" /><path d="M12 12v9" /><path d="m16 16-4-4-4 4" /></svg>
      </motion.span>
      <span class="pointer-events-none">
        <span class="block text-sm font-medium text-foreground">{{ over ? 'Release to upload' : props.label }}</span>
        <span v-if="props.hint" :id="`${inputId}-hint`" class="mt-1 block text-xs text-muted-foreground">{{ props.hint }}</span>
      </span>
    </motion.button>

    <AnimatePresence>
      <motion.p
        v-for="r in rejections"
        :key="r.id"
        role="alert"
        class="m-0 mt-2 flex items-center gap-2 overflow-hidden text-xs text-destructive"
        :initial="{ opacity: 0, height: 0 }"
        :animate="{ opacity: 1, height: 'auto' }"
        :exit="{ opacity: 0, height: 0, marginTop: 0 }"
      >
        <svg class="size-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg>
        {{ r.text }}
      </motion.p>
    </AnimatePresence>

    <ul
      class="m-0 mt-1 list-none p-0"
      :aria-label="uploading ? `Files, ${uploading} uploading` : 'Files'"
    >
      <AnimatePresence :initial="false">
        <motion.li
          v-for="item in list"
          :key="item.id"
          layout="position"
          class="overflow-hidden"
          :initial="{ opacity: 0, height: 0, y: -6 }"
          :animate="{ opacity: 1, height: 'auto', y: 0 }"
          :exit="{ opacity: 0, height: 0 }"
          :transition="SPRING"
        >
          <div class="pt-2">
            <div
              :class="cn(
                'flex items-center gap-3 rounded-xl border bg-card p-2.5 pr-3 text-card-foreground transition-colors',
                item.status === 'error' && 'border-destructive/40',
              )"
            >
              <span class="relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted text-[10px] font-semibold text-muted-foreground">
                <img v-if="item.preview" :src="item.preview" alt="" class="size-full object-cover">
                <template v-else>{{ extension(item.name) }}</template>
              </span>

              <div class="min-w-0 flex-1">
                <p class="m-0 truncate text-sm font-medium">
                  {{ item.name }}
                </p>
                <p :class="cn('m-0 mt-0.5 truncate text-xs', item.status === 'error' ? 'text-destructive' : 'text-muted-foreground')">
                  {{ formatBytes(item.size) }} · <span class="tabular-nums">{{ statusText(item) }}</span>
                </p>
                <AnimatePresence>
                  <motion.div
                    v-if="item.status === 'uploading'"
                    role="progressbar"
                    :aria-label="`Uploading ${item.name}`"
                    aria-valuemin="0"
                    aria-valuemax="100"
                    :aria-valuenow="Math.round(item.progress * 100)"
                    class="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"
                    :exit="{ opacity: 0, height: 0, marginTop: 0 }"
                    :transition="{ duration: 0.25 }"
                  >
                    <motion.div
                      class="h-full rounded-full bg-brand"
                      :initial="{ width: '0%' }"
                      :animate="{ width: `${item.progress * 100}%` }"
                      :transition="{ type: 'spring', stiffness: 120, damping: 20 }"
                    />
                  </motion.div>
                </AnimatePresence>
              </div>

              <AnimatePresence mode="popLayout" :initial="false">
                <motion.span
                  v-if="item.status === 'done'"
                  key="done"
                  class="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand text-background"
                  :initial="{ scale: 0, rotate: -90 }"
                  :animate="{ scale: 1, rotate: 0 }"
                  :exit="{ scale: 0 }"
                  :transition="{ type: 'spring', stiffness: 500, damping: 20 }"
                >
                  <svg class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
                </motion.span>
                <motion.button
                  v-else-if="item.status === 'error' && item.file && props.upload"
                  key="retry"
                  type="button"
                  :aria-label="`Retry ${item.name}`"
                  class="inline-flex h-7 shrink-0 items-center gap-1 rounded-full border px-2.5 text-xs font-medium outline-none transition-colors hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  :initial="{ scale: 0.6, opacity: 0 }"
                  :animate="{ scale: 1, opacity: 1 }"
                  :exit="{ scale: 0.6, opacity: 0 }"
                  :transition="SPRING"
                  @click="retry(item)"
                >
                  <svg class="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>
                  Retry
                </motion.button>
              </AnimatePresence>

              <button
                type="button"
                :aria-label="item.status === 'uploading' ? `Cancel ${item.name}` : `Remove ${item.name}`"
                class="inline-flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
                @click="remove(item)"
              >
                <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
              </button>
            </div>
          </div>
        </motion.li>
      </AnimatePresence>
    </ul>

    <p class="sr-only" aria-live="polite">
      {{ announcement }}
    </p>
  </div>
</template>
