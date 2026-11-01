<script setup lang="ts">
import type { SpringDrawerSide } from '@/components/ui/spring-drawer'
import { SpringButton } from '@/components/ui/spring-button'
import { SpringDrawer } from '@/components/ui/spring-drawer'
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, X } from 'lucide-vue-next'
import { ref } from 'vue'

const open = ref(false)
const side = ref<SpringDrawerSide>('right')
const sides = [
  { side: 'left', icon: ArrowLeft },
  { side: 'top', icon: ArrowUp },
  { side: 'bottom', icon: ArrowDown },
  { side: 'right', icon: ArrowRight },
] as const

function show(s: SpringDrawerSide) {
  side.value = s
  open.value = true
}

const settings = ref([
  { id: 'mentions', label: 'Mentions', hint: 'When someone @mentions you', on: true },
  { id: 'deploys', label: 'Deploys', hint: 'Production deploys finish or fail', on: true },
  { id: 'digest', label: 'Weekly digest', hint: 'A Monday summary of activity', on: false },
])
</script>

<template>
  <div class="flex flex-col items-center gap-4">
    <div class="flex flex-wrap justify-center gap-2">
      <SpringButton v-for="s in sides" :key="s.side" variant="outline" class="capitalize" @click="show(s.side)">
        <component :is="s.icon" class="size-4" /> {{ s.side }}
      </SpringButton>
    </div>
    <p class="m-0 text-xs text-muted-foreground">
      Drag the handle to dismiss, or press Escape.
    </p>

    <SpringDrawer v-model:open="open" :side="side" label="Notification settings" class="vp-raw">
      <template #default="{ close }">
        <div class="mx-auto flex w-full max-w-lg flex-1 flex-col">
          <div class="flex items-center justify-between border-b px-6 py-4">
            <div>
              <p class="m-0 font-semibold">
                Notifications
              </p>
              <p class="m-0 text-xs text-muted-foreground">
                Choose what reaches your inbox.
              </p>
            </div>
            <button
              type="button"
              aria-label="Close"
              class="inline-flex size-8 items-center justify-center rounded-full text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
              @click="close()"
            >
              <X class="size-4" />
            </button>
          </div>
          <ul class="m-0 flex-1 list-none space-y-1 p-3">
            <li v-for="item in settings" :key="item.id">
              <label class="flex cursor-pointer items-center justify-between gap-4 rounded-xl px-3 py-3 hover:bg-muted/60">
                <span>
                  <span class="block text-sm font-medium">{{ item.label }}</span>
                  <span class="block text-xs text-muted-foreground">{{ item.hint }}</span>
                </span>
                <input v-model="item.on" type="checkbox" class="size-4 accent-emerald-500">
              </label>
            </li>
          </ul>
          <div class="flex justify-end gap-2 border-t px-6 py-4">
            <SpringButton variant="ghost" @click="close()">
              Cancel
            </SpringButton>
            <SpringButton @click="close()">
              Save
            </SpringButton>
          </div>
        </div>
      </template>
    </SpringDrawer>
  </div>
</template>
