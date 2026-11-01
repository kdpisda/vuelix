<script setup lang="ts">
import type { TaskListItem } from '@/components/ui/task-list'
import { TaskList } from '@/components/ui/task-list'
import { onBeforeUnmount, onMounted, ref } from 'vue'

const initial = (): TaskListItem[] => [
  { id: 'read', title: 'Read the router config', description: 'src/router/index.ts', status: 'in-progress' },
  { id: 'find', title: 'Find routes without lazy loading', status: 'pending' },
  { id: 'split', title: 'Convert heavy pages to async components', status: 'pending' },
]

const items = ref<TaskListItem[]>(initial())

type Step = (list: TaskListItem[]) => void
function set(id: string, status: TaskListItem['status'], description?: string): Step {
  return (list) => {
    const item = list.find(i => i.id === id)!
    item.status = status
    if (description !== undefined)
      item.description = description
  }
}
function add(item: TaskListItem): Step {
  return list => void list.push(item)
}

// The agent works through its plan and discovers more work as it goes.
const script: Step[][] = [
  [set('read', 'done'), set('find', 'in-progress', 'Scanning 14 route records…')],
  [set('find', 'done', '4 routes import pages eagerly'), set('split', 'in-progress')],
  [add({ id: 'types', title: 'Run the type checker', status: 'pending' }), add({ id: 'build', title: 'Compare bundle size', status: 'pending' })],
  [set('split', 'done', 'Settings, Billing, Reports, Admin'), set('types', 'in-progress', 'vue-tsc --noEmit')],
  [set('types', 'done'), set('build', 'in-progress', 'vite build')],
  [set('build', 'failed', 'Build failed: chart.js is not a dependency'), add({ id: 'fix', title: 'Add the missing dependency and rebuild', status: 'in-progress' })],
  [set('fix', 'done', 'Main chunk 412 KB → 168 KB')],
]

let step = 0
let timer: ReturnType<typeof setTimeout> | undefined

function tick() {
  if (step < script.length) {
    script[step++]!.forEach(fn => fn(items.value))
    timer = setTimeout(tick, 1300)
  }
  else {
    // start over after a pause
    timer = setTimeout(() => {
      step = 0
      items.value = initial()
      timer = setTimeout(tick, 1300)
    }, 3500)
  }
}

onMounted(() => (timer = setTimeout(tick, 1400)))
onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <div class="flex min-h-[392px] w-full items-start justify-center">
    <TaskList :items="items" title="Code-split the dashboard" class="max-w-md" />
  </div>
</template>
