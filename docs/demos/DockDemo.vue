<script setup lang="ts">
import { Dock, DockItem } from '@/ui/dock'
import { Calendar, Camera, Home, Mail, Music, Settings } from 'lucide-vue-next'

const apps = [
  { label: 'Home', icon: Home, active: true },
  { label: 'Mail', icon: Mail, active: true },
  { label: 'Calendar', icon: Calendar },
  { label: 'Music', icon: Music },
  { label: 'Camera', icon: Camera },
  { label: 'Settings', icon: Settings },
]
</script>

<template>
  <div class="flex h-40 items-end">
    <Dock>
      <DockItem v-for="app in apps" :key="app.label" :label="app.label" :active="app.active">
        <component :is="app.icon" />
      </DockItem>
    </Dock>
  </div>
</template>
