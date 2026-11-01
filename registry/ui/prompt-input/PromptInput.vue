<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { AnimatePresence, motion, useReducedMotion } from 'motion-v'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'
import { cn } from '@/lib/utils'

export interface PromptAttachment {
  id: string
  name: string
  /** Bytes — shown next to the name. */
  size?: number
  /** MIME type. */
  type?: string
  /** Image URL for a thumbnail. Set automatically for picked / dropped / pasted images. */
  preview?: string
  file?: File
}

const props = withDefaults(defineProps<{
  placeholder?: string
  /** A response is being generated: the send button becomes a stop button. */
  loading?: boolean
  disabled?: boolean
  /** Soft limit: shows a counter and blocks sending above it. */
  maxLength?: number
  /** Rows the textarea grows to before it scrolls. */
  maxRows?: number
  /** Show the attach button and accept dropped / pasted files. */
  allowAttachments?: boolean
  /** `accept` for the file picker, e.g. `"image/*,.pdf"`. */
  accept?: string
  /** Clear the text and attachments after `submit`. */
  clearOnSubmit?: boolean
  /** Helper text under the composer. `false` hides it. */
  hint?: string | false
  /** Accessible name of the textarea. */
  label?: string
  class?: HTMLAttributes['class']
}>(), {
  placeholder: 'Ask anything…',
  loading: false,
  disabled: false,
  maxRows: 8,
  allowAttachments: true,
  clearOnSubmit: true,
  hint: 'Enter to send · Shift + Enter for a new line',
  label: 'Message',
})

const model = defineModel<string>({ default: '' })
const attachments = defineModel<PromptAttachment[]>('attachments', { default: () => [] })
const emit = defineEmits<{
  submit: [value: string, attachments: PromptAttachment[]]
  stop: []
  /** Files were picked, dropped or pasted (already added to `attachments`). */
  attach: [files: File[]]
}>()

const uid = useId()
const reduced = useReducedMotion()
const textarea = ref<HTMLTextAreaElement>()
const fileInput = ref<HTMLInputElement>()
const dragging = ref(false)

const spring = { type: 'spring', stiffness: 520, damping: 30, mass: 0.7 } as const

const length = computed(() => model.value.length)
const over = computed(() => props.maxLength != null && length.value > props.maxLength)
const nearLimit = computed(() => props.maxLength != null && length.value >= props.maxLength * 0.9)
const canSend = computed(() =>
  !props.disabled && !props.loading && !over.value
  && (model.value.trim().length > 0 || attachments.value.length > 0))

function resize() {
  const el = textarea.value
  if (!el)
    return
  el.style.height = 'auto'
  const cs = getComputedStyle(el)
  const line = Number.parseFloat(cs.lineHeight) || 24
  const pad = Number.parseFloat(cs.paddingTop) + Number.parseFloat(cs.paddingBottom)
  const max = line * props.maxRows + pad
  el.style.height = `${Math.min(el.scrollHeight, max)}px`
  el.style.overflowY = el.scrollHeight > max ? 'auto' : 'hidden'
}
onMounted(resize)
watch(model, () => nextTick(resize))

function submit() {
  if (props.loading) {
    emit('stop')
    return
  }
  if (!canSend.value)
    return
  emit('submit', model.value, [...attachments.value])
  if (props.clearOnSubmit) {
    model.value = ''
    attachments.value = []
  }
  textarea.value?.focus()
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
    e.preventDefault()
    if (!props.loading)
      submit()
  }
  else if (e.key === 'Escape' && props.loading) {
    e.preventDefault()
    emit('stop')
  }
}

// --- attachments -----------------------------------------------------------
const created = new Set<string>()
let seq = 0

function addFiles(list: FileList | File[] | null | undefined) {
  const files = Array.from(list ?? [])
  if (!files.length || !props.allowAttachments || props.disabled)
    return
  const added = files.map((file) => {
    const preview = file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
    if (preview)
      created.add(preview)
    return { id: `${uid}-file-${seq++}`, name: file.name, size: file.size, type: file.type, preview, file }
  })
  attachments.value = [...attachments.value, ...added]
  emit('attach', files)
}

function remove(a: PromptAttachment) {
  attachments.value = attachments.value.filter(x => x.id !== a.id)
  if (a.preview && created.has(a.preview)) {
    URL.revokeObjectURL(a.preview)
    created.delete(a.preview)
  }
  textarea.value?.focus()
}
onBeforeUnmount(() => created.forEach(u => URL.revokeObjectURL(u)))

function onPick(e: Event) {
  const input = e.target as HTMLInputElement
  addFiles(input.files)
  input.value = ''
}
function onDrop(e: DragEvent) {
  dragging.value = false
  addFiles(e.dataTransfer?.files)
}
function onDragOver(e: DragEvent) {
  if (props.allowAttachments && e.dataTransfer?.types.includes('Files'))
    dragging.value = true
}
function onPaste(e: ClipboardEvent) {
  const files = Array.from(e.clipboardData?.files ?? [])
  if (files.length && props.allowAttachments) {
    e.preventDefault()
    addFiles(files)
  }
}

function formatSize(bytes?: number) {
  if (bytes == null)
    return ''
  if (bytes < 1024)
    return `${bytes} B`
  if (bytes < 1024 * 1024)
    return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}
function extension(name: string) {
  const ext = name.split('.').pop()
  return ext && ext !== name ? ext.slice(0, 4).toUpperCase() : 'FILE'
}

defineExpose({ focus: () => textarea.value?.focus() })
</script>

<template>
  <div :class="cn('w-full', props.class)">
    <form
      :class="cn(
        'relative rounded-2xl border bg-card text-card-foreground shadow-sm transition-[box-shadow,border-color]',
        'focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50',
        props.disabled && 'opacity-60',
      )"
      @submit.prevent="submit"
      @dragover.prevent="onDragOver"
      @dragleave.self="dragging = false"
      @drop.prevent="onDrop"
    >
      <ul
        :aria-label="attachments.length ? 'Attachments' : undefined"
        :class="cn('m-0 flex list-none flex-wrap gap-2 p-0', attachments.length && 'px-3 pt-3')"
      >
        <AnimatePresence :initial="false">
          <motion.li
            v-for="a in attachments"
            :key="a.id"
            layout
            class="group/chip relative flex max-w-[14rem] items-center gap-2 rounded-xl border bg-background py-1.5 pl-1.5 pr-2.5 shadow-xs"
            :initial="reduced ? { opacity: 0 } : { opacity: 0, scale: 0.6, y: 6 }"
            :animate="{ opacity: 1, scale: 1, y: 0 }"
            :exit="reduced ? { opacity: 0 } : { opacity: 0, scale: 0.6, transition: { duration: 0.15 } }"
            :transition="spring"
          >
            <img v-if="a.preview" :src="a.preview" alt="" class="size-8 shrink-0 rounded-md bg-muted object-cover">
            <span v-else class="grid size-8 shrink-0 place-items-center rounded-md bg-muted text-[9px] font-semibold tracking-wide text-muted-foreground" aria-hidden="true">
              {{ extension(a.name) }}
            </span>
            <span class="flex min-w-0 flex-col leading-tight">
              <span class="truncate text-xs font-medium">{{ a.name }}</span>
              <span v-if="a.size != null" class="text-[11px] text-muted-foreground">{{ formatSize(a.size) }}</span>
            </span>
            <button
              type="button"
              class="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full border bg-popover text-muted-foreground shadow-sm outline-none transition-[opacity,color] hover:text-foreground focus-visible:opacity-100 focus-visible:ring-[3px] focus-visible:ring-ring/50 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover/chip:opacity-100"
              :aria-label="`Remove ${a.name}`"
              @click="remove(a)"
            >
              <svg class="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
            </button>
          </motion.li>
        </AnimatePresence>
      </ul>

      <textarea
        ref="textarea"
        v-model="model"
        rows="1"
        :placeholder="props.placeholder"
        :disabled="props.disabled"
        :aria-label="props.label"
        :aria-describedby="props.hint !== false || props.maxLength != null ? `${uid}-hint` : undefined"
        :aria-invalid="over || undefined"
        class="block max-h-none w-full resize-none border-0 bg-transparent px-4 pb-1 pt-3.5 text-sm leading-6 text-foreground shadow-none outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
        @keydown="onKeydown"
        @paste="onPaste"
      />

      <div class="flex items-center gap-1 px-2 pb-2 pt-1">
        <template v-if="props.allowAttachments">
          <input
            ref="fileInput"
            type="file"
            class="sr-only"
            tabindex="-1"
            aria-hidden="true"
            multiple
            :accept="props.accept"
            @change="onPick"
          >
          <button
            type="button"
            class="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none"
            aria-label="Attach files"
            :disabled="props.disabled"
            @click="fileInput?.click()"
          >
            <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m16 6-8.4 8.4a2 2 0 0 0 2.8 2.8l8.5-8.5a4 4 0 0 0-5.7-5.6L4.8 11.6a6 6 0 0 0 8.5 8.5L21 12.4" /></svg>
          </button>
        </template>
        <slot name="model" />
        <slot name="tools" />

        <div class="flex-1" />

        <motion.button
          :type="props.loading ? 'button' : 'submit'"
          :aria-label="props.loading ? 'Stop generating' : 'Send message'"
          :disabled="!props.loading && !canSend"
          :class="cn(
            'relative inline-flex size-9 items-center justify-center outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
            'transition-colors disabled:cursor-not-allowed',
            canSend || props.loading ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
          )"
          :initial="false"
          :animate="{ borderRadius: props.loading ? 11 : 18 }"
          :while-press="canSend || props.loading ? { scale: 0.9 } : undefined"
          :transition="spring"
          @click="props.loading && submit()"
        >
          <svg
            v-if="props.loading"
            class="pointer-events-none absolute -inset-1 size-[calc(100%+0.5rem)] text-primary motion-safe:animate-spin"
            viewBox="0 0 44 44"
            fill="none"
            aria-hidden="true"
          >
            <circle cx="22" cy="22" r="21" stroke="currentColor" stroke-opacity="0.2" stroke-width="1.5" />
            <circle cx="22" cy="22" r="21" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-dasharray="38 94" class="motion-reduce:hidden" />
          </svg>
          <AnimatePresence mode="popLayout" :initial="false">
            <motion.svg
              v-if="props.loading"
              key="stop"
              class="size-3.5"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
              :initial="{ scale: 0.3, opacity: 0, rotate: -90 }"
              :animate="{ scale: 1, opacity: 1, rotate: 0 }"
              :exit="{ scale: 0.3, opacity: 0, rotate: 90 }"
              :transition="spring"
            >
              <rect x="4" y="4" width="16" height="16" rx="3" />
            </motion.svg>
            <motion.svg
              v-else
              key="send"
              class="size-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.25"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
              :initial="{ scale: 0.3, opacity: 0, y: 8 }"
              :animate="{ scale: 1, opacity: 1, y: 0 }"
              :exit="{ scale: 0.3, opacity: 0, y: -8 }"
              :transition="spring"
            >
              <path d="M12 19V5" /><path d="m5 12 7-7 7 7" />
            </motion.svg>
          </AnimatePresence>
        </motion.button>
      </div>

      <AnimatePresence>
        <motion.div
          v-if="dragging"
          class="pointer-events-none absolute inset-0 grid place-items-center rounded-2xl border-2 border-dashed border-ring bg-card/90 text-sm font-medium text-muted-foreground"
          :initial="{ opacity: 0 }"
          :animate="{ opacity: 1 }"
          :exit="{ opacity: 0 }"
          :transition="{ duration: 0.15 }"
        >
          Drop files to attach
        </motion.div>
      </AnimatePresence>
    </form>

    <div
      v-if="props.hint !== false || props.maxLength != null"
      :id="`${uid}-hint`"
      class="mt-2 flex items-center justify-between gap-3 px-1 text-xs text-muted-foreground"
    >
      <span v-if="props.hint !== false">{{ props.loading ? 'Generating… press Esc to stop' : props.hint }}</span>
      <span v-else />
      <span
        v-if="props.maxLength != null"
        :class="cn('tabular-nums transition-colors', over ? 'font-medium text-destructive' : nearLimit && 'text-chart-4')"
        :aria-live="nearLimit ? 'polite' : 'off'"
      >
        {{ length }} / {{ props.maxLength }}<span v-if="over" class="sr-only"> — over the limit</span>
      </span>
    </div>
  </div>
</template>
