<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{
  name: string
  folder?: boolean
  open?: boolean
}>()

// Tints by file type, using chart tokens so they follow the theme.
const tints: Record<string, string> = {
  ts: 'text-chart-2',
  tsx: 'text-chart-2',
  js: 'text-chart-4',
  mjs: 'text-chart-4',
  vue: 'text-chart-1',
  json: 'text-chart-4',
  css: 'text-chart-3',
  html: 'text-chart-5',
  md: 'text-muted-foreground',
  png: 'text-chart-3',
  jpg: 'text-chart-3',
  svg: 'text-chart-3',
}

const ext = computed(() => props.name.split('.').pop()?.toLowerCase() ?? '')
const kind = computed(() => {
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext.value))
    return 'image'
  if (['md', 'mdx', 'txt'].includes(ext.value))
    return 'text'
  if (ext.value === 'json')
    return 'data'
  return 'code'
})
</script>

<template>
  <svg
    :class="cn('size-4 shrink-0', props.folder ? 'text-chart-4' : (tints[ext] ?? 'text-muted-foreground'))"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <template v-if="props.folder && props.open">
      <path d="M3 18V6.5A1.5 1.5 0 0 1 4.5 5h4l2 2.5h7A1.5 1.5 0 0 1 19 9v1.5" />
      <path d="M3 18 5.4 11.6A1.5 1.5 0 0 1 6.8 10.5H20.5a1 1 0 0 1 .95 1.3L19.6 17a1.5 1.5 0 0 1-1.4 1H3Z" fill="currentColor" fill-opacity="0.15" />
    </template>
    <path
      v-else-if="props.folder"
      d="M3 7.5A1.5 1.5 0 0 1 4.5 6h4l2 2.5h9A1.5 1.5 0 0 1 21 10v7.5A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.5Z"
      fill="currentColor"
      fill-opacity="0.15"
    />
    <template v-else>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" />
      <path d="M14 3v5h5" />
      <template v-if="kind === 'code'">
        <path d="m10 13-2 2 2 2" />
        <path d="m14 13 2 2-2 2" />
      </template>
      <template v-else-if="kind === 'text'">
        <path d="M9 13h6M9 17h4" />
      </template>
      <template v-else-if="kind === 'data'">
        <path d="M10 12.5c-1 0-1 .8-1 1.5s-.5 1-1 1c.5 0 1 .3 1 1s0 1.5 1 1.5M14 12.5c1 0 1 .8 1 1.5s.5 1 1 1c-.5 0-1 .3-1 1s0 1.5-1 1.5" />
      </template>
      <template v-else>
        <circle cx="10" cy="12.5" r="1.25" />
        <path d="m19 17-3.5-3.5L9 20" />
      </template>
    </template>
  </svg>
</template>
