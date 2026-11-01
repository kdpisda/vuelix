<script setup lang="ts">
import { ExpandingModal } from '@/ui/expanding-modal'
import { CalendarPlus, Clock, HelpCircle, Keyboard, MousePointer2 } from 'lucide-vue-next'
import { ref } from 'vue'

const colors = ['bg-emerald-500', 'bg-sky-500', 'bg-violet-500', 'bg-amber-500', 'bg-rose-500']
const color = ref(colors[0])
const title = ref('Design review')
</script>

<template>
  <div class="flex flex-wrap items-center justify-center gap-4">
    <ExpandingModal label="New event" content-class="vp-raw">
      <template #trigger>
        <CalendarPlus class="size-4" /> New event
      </template>
      <template #default="{ close }">
        <div class="p-6">
          <p class="m-0 text-lg font-semibold">
            New event
          </p>
          <p class="m-0 mt-1 text-sm text-muted-foreground">
            It grew out of the button — and will shrink right back into it.
          </p>
          <label class="mt-5 block text-xs font-medium text-muted-foreground" for="vx-em-title">Title</label>
          <input
            id="vx-em-title"
            v-model="title"
            class="mt-1.5 h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
          <div class="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <Clock class="size-4" /> Thu, 14:00 – 15:00
          </div>
          <div class="mt-4 flex items-center gap-2" role="radiogroup" aria-label="Color">
            <button
              v-for="c in colors"
              :key="c"
              type="button"
              role="radio"
              :aria-checked="color === c"
              :aria-label="c.split('-')[1]"
              :class="[
                'size-6 rounded-full outline-none ring-offset-2 ring-offset-card transition-shadow focus-visible:ring-[3px] focus-visible:ring-ring/50',
                c,
                color === c && 'ring-2 ring-foreground/70',
              ]"
              @click="color = c"
            />
          </div>
          <div class="mt-6 flex justify-end gap-2">
            <button
              type="button"
              class="h-9 rounded-full px-4 text-sm font-medium text-muted-foreground outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50"
              @click="close()"
            >
              Cancel
            </button>
            <button
              type="button"
              class="h-9 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
              @click="close()"
            >
              Create
            </button>
          </div>
        </div>
      </template>
    </ExpandingModal>

    <ExpandingModal
      label="Help"
      class="size-12 bg-gradient-to-br from-sky-500 to-violet-500 px-0 text-white"
      content-class="vp-raw w-[min(22rem,calc(100vw-2rem))]"
    >
      <template #trigger>
        <HelpCircle class="size-5" />
        <span class="sr-only">Help</span>
      </template>
      <div class="p-6">
        <p class="m-0 text-lg font-semibold">
          Shortcuts
        </p>
        <ul class="m-0 mt-4 list-none space-y-3 p-0 text-sm">
          <li class="flex items-center gap-3">
            <Keyboard class="size-4 text-muted-foreground" />
            <span class="flex-1">Command menu</span>
            <kbd class="rounded-md border bg-muted px-1.5 py-0.5 text-xs">⌘K</kbd>
          </li>
          <li class="flex items-center gap-3">
            <MousePointer2 class="size-4 text-muted-foreground" />
            <span class="flex-1">Multi-select</span>
            <kbd class="rounded-md border bg-muted px-1.5 py-0.5 text-xs">⇧ Click</kbd>
          </li>
        </ul>
      </div>
    </ExpandingModal>
  </div>
</template>
