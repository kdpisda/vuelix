<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { AnimatePresence, motion, useDomRef } from 'motion-v'
import { computed, nextTick, ref, useId } from 'vue'
import { cn } from '@/lib/utils'

export interface ConversationSidebarItem {
  id: string
  title: string
  /** Last activity; used to group into Today / Yesterday / Previous 7 days / … */
  updatedAt: Date | number | string
}

const props = withDefaults(defineProps<{
  conversations: ConversationSidebarItem[]
  /** Heading next to the collapse button. */
  title?: string
  /** Reference time for date grouping. Defaults to now. */
  now?: Date | number
  searchPlaceholder?: string
  class?: HTMLAttributes['class']
}>(), {
  title: 'Chats',
  searchPlaceholder: 'Search chats',
})

const emit = defineEmits<{
  /** "New chat" was pressed. */
  new: []
  /** A conversation was renamed inline. */
  rename: [id: string, title: string]
  delete: [id: string]
}>()

/** Id of the open conversation. */
const active = defineModel<string>('active')
/** Collapsed to an icon rail. */
const collapsed = defineModel<boolean>('collapsed', { default: false })

const uid = useId()
const indicatorId = `vx-conv-${uid}`
const root = useDomRef() // ref on a motion component → use the element, not the instance
const searchInput = ref<HTMLInputElement>()
const query = ref('')

// --- grouping -------------------------------------------------------------------
const DAY = 86_400_000
const groups = computed(() => {
  const midnight = new Date(props.now ?? Date.now())
  midnight.setHours(0, 0, 0, 0)
  const today = midnight.getTime()
  const buckets = [
    { label: 'Today', from: today },
    { label: 'Yesterday', from: today - DAY },
    { label: 'Previous 7 days', from: today - 7 * DAY },
    { label: 'Previous 30 days', from: today - 30 * DAY },
    { label: 'Older', from: Number.NEGATIVE_INFINITY },
  ].map(b => ({ ...b, items: [] as (ConversationSidebarItem & { time: number })[] }))

  const q = query.value.trim().toLowerCase()
  for (const c of props.conversations) {
    if (q && !c.title.toLowerCase().includes(q))
      continue
    const time = new Date(c.updatedAt).getTime()
    buckets.find(b => time >= b.from)!.items.push({ ...c, time })
  }
  return buckets
    .filter(b => b.items.length)
    .map(b => ({ ...b, items: b.items.sort((a, z) => z.time - a.time) }))
})

// --- inline rename ----------------------------------------------------------------
const editing = ref<string | null>(null)
const draft = ref('')
let renameEl: HTMLInputElement | null = null
const setRenameEl = (el: unknown) => (renameEl = el instanceof HTMLInputElement ? el : null)

function focusItem(id: string) {
  nextTick(() => (root.value as HTMLElement | null)?.querySelector<HTMLElement>(`[data-vx-conv="${CSS.escape(id)}"]`)?.focus())
}

function startRename(c: ConversationSidebarItem) {
  editing.value = c.id
  draft.value = c.title
  nextTick(() => {
    renameEl?.focus()
    renameEl?.select()
  })
}

function commitRename(c: ConversationSidebarItem) {
  if (editing.value !== c.id)
    return
  const title = draft.value.trim()
  editing.value = null
  if (title && title !== c.title)
    emit('rename', c.id, title)
  focusItem(c.id)
}

function cancelRename(c: ConversationSidebarItem) {
  editing.value = null
  focusItem(c.id)
}

// --- keyboard: arrows move between conversations, F2 renames ----------------------
function onItemKeydown(e: KeyboardEvent, c: ConversationSidebarItem) {
  if (e.key === 'F2') {
    e.preventDefault()
    startRename(c)
    return
  }
  const items = [...((root.value as HTMLElement | null)?.querySelectorAll<HTMLElement>('[data-vx-conv]') ?? [])]
  const i = items.indexOf(e.currentTarget as HTMLElement)
  const next = { ArrowDown: items[i + 1], ArrowUp: items[i - 1], Home: items[0], End: items.at(-1) }[e.key]
  if (next) {
    e.preventDefault()
    next.focus()
  }
}

function openSearch() {
  collapsed.value = false
  nextTick(() => searchInput.value?.focus())
}

const spring = { type: 'spring', stiffness: 360, damping: 34 } as const
const fade = { initial: { opacity: 0 }, animate: { opacity: 1, transition: { delay: 0.08 } }, exit: { opacity: 0, transition: { duration: 0.08 } } }
const iconButton = 'flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50'
</script>

<template>
  <motion.nav
    ref="root"
    :aria-label="props.title"
    :class="cn('flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border bg-card text-card-foreground', props.class)"
    :initial="false"
    :animate="{ width: collapsed ? 56 : 272 }"
    :transition="spring"
  >
    <!-- Header -->
    <div class="flex items-center gap-1 p-2.5 pb-1">
      <button
        type="button"
        :class="iconButton"
        :aria-label="collapsed ? 'Expand sidebar' : 'Collapse sidebar'"
        :aria-expanded="!collapsed"
        @click="collapsed = !collapsed"
      >
        <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <rect x="3" y="4" width="18" height="16" rx="3" />
          <path d="M9 4v16" />
        </svg>
      </button>
      <AnimatePresence>
        <motion.span v-if="!collapsed" key="title" class="truncate whitespace-nowrap px-1 text-sm font-semibold" v-bind="fade">
          {{ props.title }}
        </motion.span>
      </AnimatePresence>
    </div>

    <div class="flex flex-col gap-1.5 px-2.5 py-1.5">
      <button
        type="button"
        :title="collapsed ? 'New chat' : undefined"
        class="flex h-9 w-full items-center gap-2.5 overflow-hidden whitespace-nowrap rounded-lg px-2.5 text-sm font-medium outline-none transition-colors hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50"
        @click="emit('new')"
      >
        <svg class="size-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M12 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6" />
          <path d="M17.6 3.4a2 2 0 0 1 3 3L13 14l-4 1 1-4Z" />
        </svg>
        <span :class="collapsed && 'sr-only'">New chat</span>
      </button>

      <button
        v-if="collapsed"
        type="button"
        :class="iconButton"
        aria-label="Search chats"
        title="Search chats"
        @click="openSearch"
      >
        <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
          <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
        </svg>
      </button>
      <motion.div v-else class="relative" v-bind="fade">
        <svg class="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
          <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
        </svg>
        <input
          ref="searchInput"
          v-model="query"
          type="search"
          :placeholder="props.searchPlaceholder"
          :aria-label="props.searchPlaceholder"
          class="h-9 w-full rounded-lg border bg-background pl-8 pr-2.5 text-sm text-foreground outline-none transition-shadow placeholder:text-muted-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
          @keydown.esc="query = ''"
        >
      </motion.div>
    </div>

    <!-- Conversations -->
    <AnimatePresence>
      <motion.div
        v-if="!collapsed"
        key="list"
        class="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-2.5 pb-2.5"
        v-bind="fade"
      >
        <p v-if="!groups.length" class="m-0 px-2 py-8 text-center text-xs text-muted-foreground">
          {{ query ? `No chats match “${query}”` : 'No chats yet' }}
        </p>
        <section v-for="group in groups" :key="group.label" class="mt-3 first:mt-2" :aria-labelledby="`${uid}-${group.label}`">
          <h3 :id="`${uid}-${group.label}`" class="m-0 whitespace-nowrap px-2.5 pb-1 text-[11px] font-medium text-muted-foreground">
            {{ group.label }}
          </h3>
          <ul class="m-0 flex list-none flex-col gap-px p-0">
            <AnimatePresence :initial="false">
              <motion.li
                v-for="c in group.items"
                :key="c.id"
                class="group/item relative"
                :initial="{ opacity: 0, height: 0 }"
                :animate="{ opacity: 1, height: 'auto' }"
                :exit="{ opacity: 0, height: 0, transition: { duration: 0.2 } }"
                :transition="spring"
              >
                <motion.span
                  v-if="active === c.id"
                  :layout-id="indicatorId"
                  aria-hidden="true"
                  class="absolute inset-0 rounded-lg bg-accent"
                  :transition="spring"
                >
                  <span class="absolute inset-y-2.5 left-0 w-[3px] rounded-full bg-brand" />
                </motion.span>

                <input
                  v-if="editing === c.id"
                  :ref="setRenameEl"
                  v-model="draft"
                  aria-label="Chat title"
                  class="relative h-9 w-full rounded-lg border bg-background px-2.5 text-sm text-foreground outline-none ring-[3px] ring-ring/40"
                  @keydown.enter.prevent="commitRename(c)"
                  @keydown.esc.prevent="cancelRename(c)"
                  @blur="commitRename(c)"
                >
                <template v-else>
                  <button
                    type="button"
                    :data-vx-conv="c.id"
                    :aria-current="active === c.id ? 'page' : undefined"
                    :class="cn(
                      'relative flex h-9 w-full items-center rounded-lg px-2.5 text-left text-sm outline-none transition-[padding,color,background-color] focus-visible:ring-[3px] focus-visible:ring-ring/50 group-hover/item:pr-16 group-focus-within/item:pr-16',
                      active === c.id ? 'font-medium text-foreground' : 'text-foreground/80 hover:bg-accent/60 hover:text-foreground',
                    )"
                    @click="active = c.id"
                    @keydown="onItemKeydown($event, c)"
                  >
                    <span class="truncate">{{ c.title }}</span>
                  </button>
                  <div class="absolute right-1 top-1/2 flex -translate-y-1/2 items-center opacity-0 transition-opacity group-focus-within/item:opacity-100 group-hover/item:opacity-100">
                    <button
                      type="button"
                      class="flex size-7 items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-background hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
                      :aria-label="`Rename “${c.title}”`"
                      title="Rename (F2)"
                      @click="startRename(c)"
                    >
                      <svg class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16Z" /><path d="m13.5 6.5 4 4" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      class="flex size-7 items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:ring-[3px] focus-visible:ring-ring/50"
                      :aria-label="`Delete “${c.title}”`"
                      title="Delete"
                      @click="emit('delete', c.id)"
                    >
                      <svg class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
                      </svg>
                    </button>
                  </div>
                </template>
              </motion.li>
            </AnimatePresence>
          </ul>
        </section>
      </motion.div>
    </AnimatePresence>

    <div v-if="$slots.footer" class="mt-auto border-t p-2.5">
      <slot name="footer" :collapsed="collapsed" />
    </div>
  </motion.nav>
</template>
