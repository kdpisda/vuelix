<script setup lang="ts">
import { BouncyAccordion } from '@/ui/bouncy-accordion'
import { ref } from 'vue'

const open = ref(['what'])
const items = [
  { value: 'what', title: 'What is veulix?', content: 'A collection of animated, copy-paste Vue components built on Tailwind CSS and Motion. You own the code.' },
  { value: 'install', title: 'How do I install a component?', content: 'Run the shadcn-vue CLI with the component URL, or copy the source from the Manual tab.' },
  { value: 'nuxt', title: 'Does it work with Nuxt?', content: 'Yes. Components are plain Vue SFCs. Add motion-v and Tailwind and you are set.' },
]
</script>

<template>
  <BouncyAccordion v-model="open" :items="items" class="max-w-md" />
</template>
