<script setup lang="ts">
import { MultiSelect } from '@/components/ui/multi-select'
import { ref } from 'vue'

const labels = ref(['bug', 'design'])
const options = [
  { value: 'bug', label: 'Bug' },
  { value: 'feature', label: 'Feature' },
  { value: 'design', label: 'Design' },
  { value: 'docs', label: 'Documentation' },
  { value: 'perf', label: 'Performance' },
  { value: 'a11y', label: 'Accessibility' },
  { value: 'security', label: 'Security' },
  { value: 'wontfix', label: 'Won’t fix', disabled: true },
]
</script>

<template>
  <div class="flex w-full max-w-sm flex-col gap-2">
    <label for="labels-select" class="text-sm font-medium">Labels</label>
    <MultiSelect id="labels-select" v-model="labels" :options="options" placeholder="Add labels…" name="labels" />
    <p class="m-0 text-xs text-muted-foreground">
      Type to filter · Enter toggles · Backspace removes the last label.
    </p>
  </div>
</template>
