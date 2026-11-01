<script setup lang="ts">
import type { ToolCallStatus } from '@/components/ui/tool-call'
import { ToolCall } from '@/components/ui/tool-call'
import { FileText, FlaskConical, Search } from 'lucide-vue-next'
import { motion } from 'motion-v'
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue'

interface Call {
  id: string
  name: string
  description: string
  args: unknown
  status: ToolCallStatus
  open: boolean
  result?: unknown
  error?: string
  /** when it finishes */
  outcome: { status: ToolCallStatus, result?: unknown, error?: string, description: string }
  ms: number
}

function makeCalls(): Call[] {
  return [
    {
      id: 'search',
      name: 'search_docs',
      description: 'Searching “useReducedMotion”…',
      args: { query: 'useReducedMotion', limit: 3 },
      status: 'running',
      open: true,
      ms: 1400,
      outcome: {
        status: 'success',
        description: '2 results',
        result: [
          { title: 'Accessibility', path: '/docs/motion#a11y', score: 0.92 },
          { title: 'Tilt Card', path: '/components/tilt-card', score: 0.71 },
        ],
      },
    },
    {
      id: 'read',
      name: 'read_file',
      description: 'Reading TiltCard.vue',
      args: { path: 'registry/ui/tilt-card/TiltCard.vue', lines: [1, 40] },
      status: 'running',
      open: false,
      ms: 1100,
      outcome: { status: 'success', description: '40 lines · 1.6 KB', result: { lines: 40, bytes: 1638, truncated: false } },
    },
    {
      id: 'test',
      name: 'run_tests',
      description: 'vitest run tilt-card',
      args: { pattern: 'tilt-card', watch: false },
      status: 'running',
      open: false,
      ms: 1900,
      outcome: { status: 'error', description: '1 of 6 tests failed', error: 'AssertionError: expected rotateX to be 0 when prefers-reduced-motion is set\n  at tilt-card.spec.ts:42:18' },
    },
  ]
}

// Components stay out of reactive state.
const icons = { search: Search, read: FileText, test: FlaskConical }
const calls = reactive<Call[]>([])
const done = ref(false)
const timers: ReturnType<typeof setTimeout>[] = []

function run(i: number) {
  const all = makeCalls()
  if (i >= all.length) {
    done.value = true
    return
  }
  calls.push(all[i]!)
  const call = calls[calls.length - 1]!
  timers.push(setTimeout(() => {
    Object.assign(call, call.outcome)
    if (call.outcome.status === 'error')
      call.open = true
    timers.push(setTimeout(() => run(i + 1), 500))
  }, call.ms))
}

function restart() {
  timers.forEach(clearTimeout)
  calls.splice(0)
  done.value = false
  run(0)
}

onMounted(() => run(0))
onBeforeUnmount(() => timers.forEach(clearTimeout))
</script>

<template>
  <div class="flex min-h-[400px] w-full max-w-lg flex-col gap-2">
    <motion.div
      v-for="call in calls"
      :key="call.id"
      :initial="{ opacity: 0, y: 8 }"
      :animate="{ opacity: 1, y: 0 }"
      :transition="{ type: 'spring', stiffness: 400, damping: 30 }"
    >
      <ToolCall
        v-model:open="call.open"
        :name="call.name"
        :description="call.description"
        :status="call.status"
        :args="call.args"
        :result="call.result"
        :error="call.error"
      >
        <template #icon>
          <component :is="icons[call.id as keyof typeof icons]" class="size-3.5" />
        </template>
      </ToolCall>
    </motion.div>
    <button
      v-if="done"
      type="button"
      class="mt-1 self-center rounded-md px-2 py-1 text-xs text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
      @click="restart"
    >
      Run again
    </button>
  </div>
</template>
