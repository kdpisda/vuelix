<script setup lang="ts">
import { AvatarGroup } from '@/ui/avatar-group'

const people = [
  { name: 'Ana Silva', src: 'https://i.pravatar.cc/96?img=47' },
  { name: 'Kenji Tanaka', src: 'https://i.pravatar.cc/96?img=12' },
  { name: 'Priya Nair', src: 'https://i.pravatar.cc/96?img=32' },
  { name: 'Lucas Martin' },
  { name: 'Zoe Clarke', src: 'https://i.pravatar.cc/96?img=5' },
  { name: 'Omar Haddad' },
  { name: 'Mia Chen' },
]
</script>

<template>
  <div class="pt-8">
    <AvatarGroup :items="people" :max="5" />
  </div>
</template>
