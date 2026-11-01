<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { motion, useReducedMotion } from 'motion-v'
import { computed, nextTick, ref, useId } from 'vue'
import { cn } from '@/lib/utils'

export interface FolderStackItem {
  id: string | number
  title: string
  subtitle?: string
  image?: string
}

const props = withDefaults(defineProps<{
  items: FolderStackItem[]
  /** Folder / stack name shown underneath. */
  label: string
  /** `folder`: cards fan out of a folder. `stack`: a pile that spreads into a grid. */
  variant?: 'folder' | 'stack'
  /** Open on hover (pointer devices) as well as on click. Defaults to true for `folder`. */
  hover?: boolean
  /** Grid columns for the `stack` variant. */
  columns?: number
  class?: HTMLAttributes['class']
}>(), {
  variant: 'folder',
  hover: undefined,
  columns: 3,
})

const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ select: [item: FolderStackItem] }>()

defineSlots<{
  /** Custom card face. */
  card?: (props: { item: FolderStackItem, index: number }) => any
}>()

const SPRING = { type: 'spring', stiffness: 320, damping: 24 } as const
const FLAP = { type: 'spring', stiffness: 260, damping: 20 } as const
const reduced = useReducedMotion()
const listId = `vx-folder-${useId()}`

const isFolder = computed(() => props.variant === 'folder')
const hoverable = computed(() => props.hover ?? isFolder.value)
const shown = computed(() => (isFolder.value ? props.items.slice(0, 5) : props.items))

// ---------------------------------------------------------------------------
// Poses
// ---------------------------------------------------------------------------
function folderPose(i: number) {
  const n = shown.value.length
  const o = i - (n - 1) / 2
  if (!open.value)
    return { x: o * 5, y: 0, rotate: o * 2.5, scale: 0.94 }
  const spread = Math.min(70, 300 / Math.max(n, 1))
  const lift = reduced.value ? 0 : (Math.abs((n - 1) / 2) - Math.abs(o)) * 10
  return { x: o * spread, y: -96 - lift, rotate: reduced.value ? 0 : o * 9, scale: 1 }
}

const CARD = { w: 156, h: 108, gap: 12 }
const PILE_TILT = [-5, 4, -2, 7, -7, 3, -3, 6]
const rows = computed(() => Math.ceil(shown.value.length / props.columns))
const gridW = computed(() => Math.min(props.columns, shown.value.length) * (CARD.w + CARD.gap) - CARD.gap)
const gridH = computed(() => rows.value * (CARD.h + CARD.gap) - CARD.gap)

function stackPose(i: number) {
  if (!open.value) {
    const depth = Math.min(i, 4)
    return { x: 0, y: depth * -3, rotate: reduced.value ? 0 : PILE_TILT[i % PILE_TILT.length]!, scale: 1 - depth * 0.02 }
  }
  const cols = Math.min(props.columns, shown.value.length)
  const col = i % cols
  const row = Math.floor(i / cols)
  return {
    x: col * (CARD.w + CARD.gap) - (gridW.value - CARD.w) / 2,
    y: row * (CARD.h + CARD.gap) - (gridH.value - CARD.h) / 2,
    rotate: 0,
    scale: 1,
  }
}

function delay(i: number) {
  return open.value ? i * 0.045 : (shown.value.length - 1 - i) * 0.025
}

// ---------------------------------------------------------------------------
// Interaction
// ---------------------------------------------------------------------------
const toggleBtn = ref<HTMLButtonElement>()
const root = ref<HTMLElement>()

function onEnter(e: PointerEvent) {
  if (hoverable.value && e.pointerType === 'mouse')
    open.value = true
}
function onLeave(e: PointerEvent) {
  if (hoverable.value && e.pointerType === 'mouse' && !root.value?.contains(document.activeElement))
    open.value = false
}
function onFocusOut() {
  // Wait a frame: focus may be moving between our own elements.
  requestAnimationFrame(() => {
    if (open.value && !root.value?.contains(document.activeElement))
      open.value = false
  })
}
function onToggle(e: MouseEvent) {
  // With hover enabled the mouse already opened it — a click shouldn't slam it shut.
  if (hoverable.value && (e as PointerEvent).pointerType === 'mouse')
    open.value = true
  else
    open.value = !open.value
}
async function spread() {
  open.value = true
  await nextTick()
  root.value?.querySelector<HTMLElement>('li button')?.focus()
}
async function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && open.value) {
    open.value = false
    await nextTick()
    toggleBtn.value?.focus()
  }
}
function pick(item: FolderStackItem) {
  emit('select', item)
}
</script>

<template>
  <div
    ref="root"
    :class="cn('relative inline-flex flex-col items-center gap-4', props.class)"
    @pointerenter="onEnter"
    @pointerleave="onLeave"
    @focusout="onFocusOut"
    @keydown="onKeydown"
  >
    <!-- ───────────── Folder ───────────── -->
    <div v-if="isFolder" class="relative mt-32 h-44 w-64 [perspective:700px]">
      <!-- back panel + tab -->
      <div aria-hidden="true" class="absolute inset-0 rounded-2xl rounded-tl-none bg-brand/70 shadow-sm">
        <span class="absolute -top-4 left-0 h-5 w-24 rounded-t-xl bg-brand/70" />
        <span class="absolute inset-x-3 top-3 h-px bg-background/30" />
      </div>

      <ul :id="listId" class="absolute inset-x-0 top-0 m-0 list-none p-0" :aria-label="`${props.label} contents`">
        <motion.li
          v-for="(item, i) in shown"
          :key="item.id"
          class="absolute -top-3 left-1/2 -ml-14 origin-bottom"
          :style="{ zIndex: 10 - Math.round(Math.abs(i - (shown.length - 1) / 2) * 2) }"
          :initial="false"
          :animate="folderPose(i)"
          :transition="{ ...SPRING, delay: delay(i) }"
        >
          <motion.button
            type="button"
            :tabindex="open ? 0 : -1"
            :aria-hidden="!open || undefined"
            class="block w-28 overflow-hidden rounded-xl border bg-card text-left text-card-foreground shadow-md outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
            :while-hover="open && !reduced ? { y: -8, scale: 1.05 } : undefined"
            :while-press="open ? { scale: 0.97 } : undefined"
            :transition="SPRING"
            @click="pick(item)"
          >
            <slot name="card" :item="item" :index="i">
              <img v-if="item.image" :src="item.image" alt="" class="block h-24 w-full bg-muted object-cover" draggable="false">
              <span v-else class="block h-24 w-full bg-muted" />
              <span class="block px-2 py-1.5">
                <span class="block truncate text-xs font-medium">{{ item.title }}</span>
                <span v-if="item.subtitle" class="block truncate text-[10px] text-muted-foreground">{{ item.subtitle }}</span>
              </span>
            </slot>
          </motion.button>
        </motion.li>
      </ul>

      <!-- front flap -->
      <motion.div
        aria-hidden="true"
        class="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[86%] origin-bottom rounded-2xl border border-background/20 bg-brand shadow-lg"
        :style="{ backgroundImage: 'linear-gradient(to bottom, color-mix(in oklab, var(--background) 22%, transparent), transparent 60%)' }"
        :initial="false"
        :animate="open && !reduced ? { rotateX: -42, y: 2 } : { rotateX: 0, y: 0 }"
        :transition="FLAP"
      >
        <span class="absolute bottom-4 left-4 flex items-center gap-1.5 text-background/90">
          <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" /></svg>
          <span class="text-xs font-semibold tabular-nums">{{ props.items.length }}</span>
        </span>
      </motion.div>
      <!-- the toggle sits over the flap -->
      <button
        ref="toggleBtn"
        type="button"
        :aria-expanded="open"
        :aria-controls="listId"
        :aria-label="`${props.label}, ${props.items.length} items`"
        class="absolute inset-x-0 bottom-0 z-20 h-[86%] cursor-pointer rounded-2xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        @click="onToggle"
      />
    </div>

    <!-- ───────────── Stack ───────────── -->
    <div
      v-else
      class="relative"
      :style="{ width: `${gridW}px`, height: `${gridH}px` }"
    >
      <ul :id="listId" class="m-0 list-none p-0" :aria-label="`${props.label} projects`">
        <motion.li
          v-for="(item, i) in shown"
          :key="item.id"
          class="absolute left-1/2 top-1/2"
          :style="{ zIndex: shown.length - i, width: `${CARD.w}px`, height: `${CARD.h}px`, marginLeft: `${-CARD.w / 2}px`, marginTop: `${-CARD.h / 2}px` }"
          :initial="false"
          :animate="stackPose(i)"
          :transition="{ ...SPRING, delay: delay(i) }"
        >
          <motion.button
            type="button"
            :tabindex="open ? 0 : -1"
            :aria-hidden="!open || undefined"
            class="relative block size-full overflow-hidden rounded-xl border bg-card text-left text-card-foreground shadow-md outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
            :while-hover="open && !reduced ? { y: -4, scale: 1.03 } : undefined"
            :while-press="open ? { scale: 0.97 } : undefined"
            :transition="SPRING"
            @click="pick(item)"
          >
            <slot name="card" :item="item" :index="i">
              <img v-if="item.image" :src="item.image" alt="" class="absolute inset-0 size-full bg-muted object-cover" draggable="false">
              <span class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/90 via-background/60 to-transparent px-2.5 pb-2 pt-5">
                <span class="block truncate text-xs font-semibold">{{ item.title }}</span>
                <span v-if="item.subtitle" class="block truncate text-[10px] text-muted-foreground">{{ item.subtitle }}</span>
              </span>
            </slot>
          </motion.button>
        </motion.li>
      </ul>
      <button
        v-if="!open"
        ref="toggleBtn"
        type="button"
        :aria-expanded="false"
        :aria-controls="listId"
        :aria-label="`${props.label}: spread ${props.items.length} projects`"
        class="absolute left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        :style="{ width: `${CARD.w + 16}px`, height: `${CARD.h + 16}px` }"
        @click="spread"
      />
    </div>

    <div class="flex items-center gap-2 text-sm">
      <span class="font-medium">{{ props.label }}</span>
      <span class="text-muted-foreground tabular-nums">{{ props.items.length }} {{ isFolder ? 'files' : 'projects' }}</span>
      <button
        v-if="!isFolder && open"
        ref="toggleBtn"
        type="button"
        :aria-expanded="true"
        :aria-controls="listId"
        class="rounded-md px-1.5 py-0.5 text-xs text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
        @click="open = false"
      >
        Stack
      </button>
    </div>
  </div>
</template>
