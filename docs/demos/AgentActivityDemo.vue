<script setup lang="ts">
import type { AgentActivityStep } from '@/components/ui/agent-activity'
import { AgentActivity } from '@/components/ui/agent-activity'
import { RotateCcw } from 'lucide-vue-next'
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue'

interface ScriptStep {
  step: Pick<AgentActivityStep, 'id' | 'kind' | 'label' | 'detail'>
  ms?: number
  children?: { label: string, result: string, ms: number }[]
}

const script: ScriptStep[] = [
  { step: { id: 'search', kind: 'search', label: 'Searching the codebase', detail: 'refreshToken(' }, ms: 1100 },
  {
    step: { id: 'read', kind: 'read', label: 'Reading 3 files' },
    children: [
      { label: 'src/auth/session.ts', result: '142 lines', ms: 450 },
      { label: 'src/auth/refresh.ts', result: '88 lines', ms: 400 },
      { label: 'src/api/client.ts', result: '203 lines', ms: 500 },
    ],
  },
  { step: { id: 'plan', kind: 'think', label: 'Planning the fix', detail: 'Concurrent 401s each start a refresh; share one in-flight promise' }, ms: 1500 },
  { step: { id: 'edit', kind: 'edit', label: 'Editing src/auth/refresh.ts', detail: '+18 −6' }, ms: 1100 },
  {
    step: { id: 'test', kind: 'command', label: 'Running the auth tests', detail: 'pnpm vitest run src/auth' },
    children: [
      { label: 'session.spec.ts', result: '12 passed', ms: 700 },
      { label: 'refresh.spec.ts', result: '9 passed', ms: 900 },
      { label: 'client.spec.ts', result: '7 passed', ms: 600 },
    ],
  },
]

const steps = ref<AgentActivityStep[]>([])
const running = ref(true)
const startedAt = ref<number>()
const endedAt = ref<number>()
let run = 0
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

async function start() {
  const id = ++run
  steps.value = []
  running.value = true
  startedAt.value = Date.now()
  endedAt.value = undefined

  for (const { step: base, ms, children } of script) {
    const step = reactive<AgentActivityStep>({ ...base, status: 'running', startedAt: Date.now(), children: children ? [] : undefined })
    steps.value.push(step)
    for (const c of children ?? []) {
      const child = reactive<AgentActivityStep>({ id: c.label, label: c.label, status: 'running', startedAt: Date.now() })
      step.children!.push(child)
      await sleep(c.ms)
      if (id !== run)
        return
      Object.assign(child, { status: 'done', detail: c.result, duration: c.ms })
    }
    if (ms)
      await sleep(ms)
    if (id !== run)
      return
    Object.assign(step, { status: 'done', duration: Date.now() - step.startedAt! })
  }
  running.value = false
  endedAt.value = Date.now()
}

onMounted(start)
onBeforeUnmount(() => run++)
</script>

<template>
  <div class="flex w-full max-w-md flex-col items-end gap-2">
    <AgentActivity
      title="Fix the token refresh race in the API client"
      :steps="steps"
      :running="running"
      :started-at="startedAt"
      :ended-at="endedAt"
    />
    <button
      type="button"
      :class="[
        'inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground outline-none transition hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50',
        running && 'invisible',
      ]"
      @click="start"
    >
      <RotateCcw class="size-3" />
      Run again
    </button>
  </div>
</template>
