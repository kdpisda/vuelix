<script setup lang="ts">
import type { ExpandableTabItem, ExpandableTabSeparator } from '@/ui/expandable-tabs'
import { ExpandableTabs } from '@/ui/expandable-tabs'
import { Bell, Bookmark, Compass, House, Inbox, Settings, User } from 'lucide-vue-next'
import { computed, ref } from 'vue'

const tab = ref('discover')
const items: (ExpandableTabItem | ExpandableTabSeparator)[] = [
  { value: 'home', label: 'Home', icon: House },
  { value: 'discover', label: 'Discover', icon: Compass },
  { value: 'inbox', label: 'Inbox', icon: Inbox },
  { value: 'saved', label: 'Saved', icon: Bookmark },
  { separator: true },
  { value: 'alerts', label: 'Notifications', icon: Bell },
  { value: 'profile', label: 'Profile', icon: User },
  { value: 'settings', label: 'Settings', icon: Settings },
]

const blurbs: Record<string, string> = {
  home: 'Your feed, freshly sorted.',
  discover: 'Trending collections picked for you.',
  inbox: '3 unread conversations.',
  saved: '12 items saved for later.',
  alerts: 'You’re all caught up.',
  profile: 'Signed in as @ana.',
  settings: 'Theme, privacy and connected apps.',
}
const blurb = computed(() => blurbs[tab.value])
</script>

<template>
  <div class="flex flex-col items-center gap-6">
    <ExpandableTabs v-model="tab" :items="items" label="Sections" />
    <p class="m-0 text-sm text-muted-foreground" aria-live="polite">
      {{ blurb }}
    </p>
  </div>
</template>
