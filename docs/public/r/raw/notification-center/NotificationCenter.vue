<script setup lang="ts">
import type { PanInfo } from 'motion-v'
import type { HTMLAttributes } from 'vue'
import { AnimatePresence, motion, useAnimate, useReducedMotion } from 'motion-v'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'
import { cn } from '@/lib/utils'

export interface NotificationCenterItem {
  id: string | number
  /** Notifications are grouped (and stacked) by app. */
  app: string
  title: string
  body?: string
  /** Pre-formatted, e.g. "2m ago". */
  time?: string
  read?: boolean
  /** Image shown instead of the app icon (e.g. a sender avatar). */
  avatar?: string
}

const props = withDefaults(defineProps<{
  /** Accessible name of the bell and panel. */
  label?: string
  /** Cards visible in a collapsed stack. */
  stack?: number
  /** Which edge of the bell the panel aligns to. */
  align?: 'start' | 'end'
  /** Mark everything as read when the panel closes. */
  markReadOnClose?: boolean
  class?: HTMLAttributes['class']
  panelClass?: HTMLAttributes['class']
}>(), {
  label: 'Notifications',
  stack: 3,
  align: 'end',
  markReadOnClose: true,
})

const notifications = defineModel<NotificationCenterItem[]>('notifications', { default: () => [] })
const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{
  dismiss: [item: NotificationCenterItem]
  clear: []
}>()

defineSlots<{
  /** App icon for a group / card. */
  icon?: (props: { app: string, item?: NotificationCenterItem }) => any
  empty?: () => any
}>()

const SPRING = { type: 'spring', stiffness: 420, damping: 34 } as const
const PEEK = 8
const panelId = `vx-notif-${useId()}`
const reduced = useReducedMotion()

const unread = computed(() => notifications.value.filter(n => !n.read).length)

const groups = computed(() => {
  const map = new Map<string, NotificationCenterItem[]>()
  for (const n of notifications.value) {
    if (!map.has(n.app))
      map.set(n.app, [])
    map.get(n.app)!.push(n)
  }
  return [...map].map(([app, items]) => ({ app, items }))
})

const expanded = ref<string[]>([])
const isOpen = (app: string, count: number) => count === 1 || expanded.value.includes(app)
function toggleGroup(app: string) {
  expanded.value = expanded.value.includes(app) ? expanded.value.filter(a => a !== app) : [...expanded.value, app]
}

/** Transform of a card inside a collapsed stack. */
function stackPose(i: number, openGroup: boolean) {
  if (openGroup)
    return { y: 0, scale: 1, opacity: 1 }
  const depth = Math.min(i, props.stack - 1)
  return { y: depth * PEEK, scale: 1 - depth * 0.05, opacity: i < props.stack ? 1 - depth * 0.15 : 0 }
}

// ---------------------------------------------------------------------------
// Dismissing
// ---------------------------------------------------------------------------
const exitDir = ref<Record<string | number, number>>({})
const clearing = ref(false)

function dismiss(item: NotificationCenterItem, dir = 1) {
  exitDir.value[item.id] = dir
  notifications.value = notifications.value.filter(n => n.id !== item.id)
  emit('dismiss', item)
}

function onDragEnd(item: NotificationCenterItem, info: PanInfo) {
  if (Math.abs(info.offset.x) > 110 || Math.abs(info.velocity.x) > 600)
    dismiss(item, Math.sign(info.offset.x || info.velocity.x))
}

function clearGroup(app: string) {
  notifications.value = notifications.value.filter(n => n.app !== app)
  expanded.value = expanded.value.filter(a => a !== app)
}

async function clearAll() {
  clearing.value = true
  await nextTick() // let the staggered exit props render before the items leave
  notifications.value = []
  expanded.value = []
  emit('clear')
  setTimeout(() => (clearing.value = false), 900)
  document.getElementById(panelId)?.focus()
}

function groupExit(gi: number) {
  return clearing.value
    ? { x: 80, opacity: 0, transition: { delay: gi * 0.07, duration: 0.28, ease: [0.4, 0, 1, 1] } }
    : { opacity: 0, scale: 0.96, transition: { duration: 0.18 } }
}

// ---------------------------------------------------------------------------
// Open / close
// ---------------------------------------------------------------------------
const root = ref<HTMLElement>()
const bell = ref<HTMLButtonElement>()

function onDocPointer(e: PointerEvent) {
  if (!root.value?.contains(e.target as Node))
    open.value = false
}
function onDocKey(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    open.value = false
    bell.value?.focus()
  }
}

/** Nudge the panel sideways so it never hangs off a narrow screen. */
const nudge = ref(0)
function fitToViewport(el: HTMLElement | null) {
  if (!el)
    return
  // Measure from the anchored edge: the panel may still be mid scale-in.
  const rect = el.getBoundingClientRect()
  const right = (props.align === 'end' ? rect.right : rect.left + el.offsetWidth) - nudge.value
  const left = right - el.offsetWidth
  const max = document.documentElement.clientWidth - 8
  nudge.value = left < 8 ? 8 - left : right > max ? max - right : 0
}

function listen(on: boolean) {
  const method = on ? 'addEventListener' : 'removeEventListener'
  document[method]('pointerdown', onDocPointer as EventListener, true)
  document[method]('keydown', onDocKey as EventListener)
}

// Open from the start (e.g. v-model:open="true"): listen, but don't steal focus.
onMounted(() => {
  if (!open.value)
    return
  listen(true)
  requestAnimationFrame(() => fitToViewport(document.getElementById(panelId)))
})

watch(open, async (v) => {
  if (typeof document === 'undefined')
    return
  listen(v)
  if (v) {
    await nextTick()
    // The panel mounts inside AnimatePresence, so look it up once it's in the DOM.
    requestAnimationFrame(() => {
      const el = document.getElementById(panelId)
      el?.focus()
      fitToViewport(el)
    })
  }
  else {
    expanded.value = []
    if (props.markReadOnClose && unread.value)
      notifications.value = notifications.value.map(n => (n.read ? n : { ...n, read: true }))
  }
})

onBeforeUnmount(() => typeof document !== 'undefined' && listen(false))

// A little ring when new notifications arrive.
const [bellScope, animateBell] = useAnimate()
watch(unread, (now, before) => {
  if (now > before && bellScope.value && !reduced.value)
    animateBell(bellScope.value, { rotate: [0, -16, 13, -9, 6, -2, 0] }, { duration: 0.7 })
})

function initials(app: string) {
  return app.slice(0, 2)
}
</script>

<template>
  <div ref="root" :class="cn('relative inline-flex', props.class)">
    <button
      ref="bell"
      type="button"
      :aria-label="unread ? `${props.label}, ${unread} unread` : props.label"
      aria-haspopup="dialog"
      :aria-expanded="open"
      :aria-controls="open ? panelId : undefined"
      class="relative inline-flex size-10 items-center justify-center rounded-full border bg-card text-foreground shadow-xs outline-none transition-colors hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50"
      @click="open = !open"
    >
      <span ref="bellScope" class="inline-flex origin-top">
        <svg class="size-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
      </span>
      <AnimatePresence>
        <motion.span
          v-if="unread"
          key="badge"
          aria-hidden="true"
          class="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center overflow-hidden rounded-full bg-destructive px-1 text-[11px] font-semibold tabular-nums text-white ring-2 ring-background"
          :initial="{ scale: 0 }"
          :animate="{ scale: 1 }"
          :exit="{ scale: 0 }"
          :transition="{ type: 'spring', stiffness: 600, damping: 22 }"
        >
          <AnimatePresence mode="popLayout" :initial="false">
            <motion.span
              :key="unread"
              :initial="{ y: 10, opacity: 0 }"
              :animate="{ y: 0, opacity: 1 }"
              :exit="{ y: -10, opacity: 0 }"
              :transition="SPRING"
            >
              {{ unread > 99 ? '99+' : unread }}
            </motion.span>
          </AnimatePresence>
        </motion.span>
      </AnimatePresence>
    </button>

    <AnimatePresence>
      <motion.div
        v-if="open"
        :id="panelId"
        key="panel"
        role="dialog"
        :aria-label="props.label"
        tabindex="-1"
        :class="cn(
          'absolute top-full z-50 mt-2 w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-2xl border bg-popover text-popover-foreground shadow-xl outline-none',
          props.align === 'end' ? 'right-0 origin-top-right' : 'left-0 origin-top-left',
          props.panelClass,
        )"
        :style="nudge ? { translate: `${nudge}px 0` } : undefined"
        :initial="{ opacity: 0, scale: 0.94, y: -6 }"
        :animate="{ opacity: 1, scale: 1, y: 0 }"
        :exit="{ opacity: 0, scale: 0.96, y: -4, transition: { duration: 0.15 } }"
        :transition="SPRING"
      >
        <div class="flex items-center justify-between border-b px-4 py-3">
          <p class="m-0 text-sm font-semibold">
            {{ props.label }}
          </p>
          <button
            v-if="notifications.length"
            type="button"
            class="rounded-md px-2 py-1 text-xs font-medium text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
            @click="clearAll"
          >
            Clear all
          </button>
        </div>

        <motion.div class="max-h-[420px] overflow-y-auto overflow-x-hidden p-3" layout-scroll>
          <AnimatePresence>
            <motion.section
              v-for="(group, gi) in groups"
              :key="group.app"
              layout="position"
              :aria-label="`${group.app}, ${group.items.length} notifications`"
              class="mb-3 last:mb-0"
              :exit="groupExit(gi)"
              :transition="SPRING"
            >
              <div class="flex h-7 items-center gap-2 px-1">
                <p class="m-0 flex-1 truncate text-xs font-semibold text-muted-foreground">
                  {{ group.app }}
                  <span v-if="group.items.length > 1" class="ml-1 font-normal tabular-nums opacity-80">{{ group.items.length }}</span>
                </p>
                <button
                  v-if="group.items.length > 1 && expanded.includes(group.app)"
                  type="button"
                  :aria-expanded="true"
                  class="rounded-md px-1.5 py-0.5 text-xs text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  @click="toggleGroup(group.app)"
                >
                  Show less
                </button>
                <button
                  type="button"
                  :aria-label="`Clear ${group.app} notifications`"
                  class="inline-flex size-6 items-center justify-center rounded-full text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  @click="clearGroup(group.app)"
                >
                  <svg class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
                </button>
              </div>

              <div
                class="relative flex flex-col gap-2"
                :style="{ paddingBottom: isOpen(group.app, group.items.length) ? '0px' : `${Math.min(group.items.length - 1, props.stack - 1) * PEEK}px` }"
              >
                <AnimatePresence :initial="false">
                  <motion.article
                    v-for="(item, i) in group.items"
                    :key="item.id"
                    layout
                    :drag="isOpen(group.app, group.items.length) ? 'x' : false"
                    :drag-snap-to-origin="true"
                    :drag-elastic="0.7"
                    :class="cn(
                      'group/card flex touch-pan-y items-start gap-3 rounded-xl border bg-card p-3 text-card-foreground shadow-xs',
                      !isOpen(group.app, group.items.length) && i > 0 && 'pointer-events-none absolute inset-x-0 top-0',
                    )"
                    :style="{
                      zIndex: group.items.length - i,
                      bottom: !isOpen(group.app, group.items.length) && i > 0 ? `${Math.min(group.items.length - 1, props.stack - 1) * PEEK}px` : undefined,
                    }"
                    :aria-hidden="!isOpen(group.app, group.items.length) && i > 0 ? true : undefined"
                    :initial="{ opacity: 0, y: -12, scale: 0.96 }"
                    :animate="stackPose(i, isOpen(group.app, group.items.length))"
                    :exit="{ x: (exitDir[item.id] ?? 1) * 360, opacity: 0, transition: { duration: 0.25 } }"
                    :transition="SPRING"
                    @drag-end="(_e: PointerEvent, info: PanInfo) => onDragEnd(item, info)"
                  >
                    <motion.div
                      class="flex min-w-0 flex-1 items-start gap-3"
                      :animate="{ opacity: !isOpen(group.app, group.items.length) && i > 0 ? 0 : 1 }"
                      :transition="{ duration: 0.18 }"
                    >
                      <span class="relative mt-0.5 flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted text-xs font-semibold uppercase text-muted-foreground">
                        <img v-if="item.avatar" :src="item.avatar" alt="" class="size-full object-cover" draggable="false">
                        <slot v-else name="icon" :app="group.app" :item="item">{{ initials(group.app) }}</slot>
                      </span>
                      <div class="min-w-0 flex-1">
                        <div class="flex items-baseline gap-2">
                          <p class="m-0 min-w-0 flex-1 truncate text-sm font-medium">
                            {{ item.title }}
                          </p>
                          <span v-if="item.time" class="shrink-0 text-xs text-muted-foreground">{{ item.time }}</span>
                          <span v-if="!item.read" class="size-2 shrink-0 self-center rounded-full bg-brand" aria-label="Unread" />
                        </div>
                        <p v-if="item.body" class="m-0 mt-0.5 line-clamp-2 text-sm text-muted-foreground">
                          {{ item.body }}
                        </p>
                      </div>
                    </motion.div>
                    <button
                      v-if="isOpen(group.app, group.items.length)"
                      type="button"
                      :aria-label="`Dismiss: ${item.title}`"
                      class="-mr-1 -mt-1 inline-flex size-6 shrink-0 items-center justify-center rounded-full text-muted-foreground opacity-0 outline-none transition-[opacity,color] hover:text-foreground focus-visible:opacity-100 focus-visible:ring-[3px] focus-visible:ring-ring/50 group-hover/card:opacity-100 [@media(hover:none)]:opacity-100"
                      @click="dismiss(item)"
                    >
                      <svg class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
                    </button>
                  </motion.article>
                </AnimatePresence>
                <button
                  v-if="!isOpen(group.app, group.items.length)"
                  type="button"
                  :aria-label="`Show ${group.items.length} ${group.app} notifications`"
                  :aria-expanded="false"
                  class="absolute inset-0 z-[60] cursor-pointer rounded-xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  @click="toggleGroup(group.app)"
                />
              </div>
            </motion.section>
          </AnimatePresence>

          <AnimatePresence>
            <motion.div
              v-if="!notifications.length"
              key="empty"
              class="flex flex-col items-center gap-2 px-4 py-10 text-center"
              :initial="{ opacity: 0, y: 8 }"
              :animate="{ opacity: 1, y: 0, transition: { delay: clearing ? 0.35 : 0 } }"
            >
              <slot name="empty">
                <span class="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
                </span>
                <p class="m-0 text-sm font-medium">
                  You're all caught up
                </p>
                <p class="m-0 text-xs text-muted-foreground">
                  New notifications will show up here.
                </p>
              </slot>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  </div>
</template>
