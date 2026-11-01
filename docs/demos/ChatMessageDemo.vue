<script setup lang="ts">
import type { ChatMessageFeedback } from '@/components/ui/chat-message'
import { ChatMessage } from '@/components/ui/chat-message'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

type Block = { type: 'p', text: string } | { type: 'ul', items: string[] }

const answer: Block[] = [
  { type: 'p', text: 'Use `defineModel()` — it replaces the old `modelValue` prop + `update:modelValue` emit pair with a single ref:' },
  { type: 'ul', items: [
    'Reading it gives you the current value from the parent.',
    'Assigning to it emits the update for you.',
    'Pass a name for extra models, like `defineModel(\'open\')`.',
  ] },
  { type: 'p', text: 'It needs **Vue 3.4+** and works with any `v-model` on the parent.' },
]

// Count words so we can reveal the answer progressively, like a token stream.
const words = (s: string) => s.split(' ').length
const total = answer.reduce((n, b) => n + (b.type === 'p' ? words(b.text) : b.items.reduce((m, i) => m + words(i), 0)), 0)

const shown = ref(0)
const streaming = ref(false)
const feedback = ref<ChatMessageFeedback>(null)
let timer: ReturnType<typeof setInterval> | undefined

function take(text: string, budget: { left: number }) {
  const w = text.split(' ')
  const n = Math.min(w.length, budget.left)
  budget.left -= n
  return w.slice(0, n).join(' ')
}

const visible = computed(() => {
  const budget = { left: shown.value }
  const out: Block[] = []
  for (const b of answer) {
    if (budget.left <= 0)
      break
    if (b.type === 'p')
      out.push({ type: 'p', text: take(b.text, budget) })
    else
      out.push({ type: 'ul', items: b.items.map(i => take(i, budget)).filter(Boolean) })
  }
  return out
})

/** `code` and **bold** → segments (demo-only formatting). */
function segments(text: string) {
  return text.split(/(`[^`]*`?|\*\*[^*]*\**)/).filter(Boolean).map(s =>
    s.startsWith('`')
      ? { kind: 'code', text: s.replace(/`/g, '') }
      : s.startsWith('**') ? { kind: 'strong', text: s.replace(/\*/g, '') } : { kind: 'text', text: s })
}

function stream() {
  clearInterval(timer)
  shown.value = 0
  feedback.value = null
  streaming.value = true
  setTimeout(() => {
    timer = setInterval(() => {
      shown.value += 1 + Math.floor(Math.random() * 2)
      if (shown.value >= total) {
        shown.value = total
        streaming.value = false
        clearInterval(timer)
      }
    }, 70)
  }, 900)
}

onMounted(stream)
onBeforeUnmount(() => clearInterval(timer))
</script>

<template>
  <div class="flex w-full max-w-xl flex-col gap-5">
    <ChatMessage
      from="user"
      author="Maya"
      initials="MR"
      timestamp="10:42 AM"
      content="What's the cleanest way to do v-model on a custom component now?"
    />
    <ChatMessage
      v-model:feedback="feedback"
      author="vuelix assistant"
      timestamp="10:42 AM"
      :streaming="streaming"
      @retry="stream"
    >
      <template v-if="shown > 0">
        <template v-for="(block, i) in visible" :key="i">
          <p v-if="block.type === 'p'">
            <template v-for="(s, j) in segments(block.text)" :key="j">
              <code v-if="s.kind === 'code'">{{ s.text }}</code>
              <strong v-else-if="s.kind === 'strong'">{{ s.text }}</strong>
              <template v-else>
                {{ s.text }}
              </template>
            </template>
          </p>
          <ul v-else>
            <li v-for="(item, j) in block.items" :key="j">
              <template v-for="(s, k) in segments(item)" :key="k">
                <code v-if="s.kind === 'code'">{{ s.text }}</code>
                <template v-else>
                  {{ s.text }}
                </template>
              </template>
            </li>
          </ul>
        </template>
      </template>
    </ChatMessage>
  </div>
</template>
