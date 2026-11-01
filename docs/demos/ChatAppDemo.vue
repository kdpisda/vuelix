<script setup lang="ts">
import type { ChatAppMessage } from '@/ui/chat-app'
import { ChatApp } from '@/ui/chat-app'
import { onBeforeUnmount, ref } from 'vue'

const messages = ref<ChatAppMessage[]>([])
const loading = ref(false)
let timer: ReturnType<typeof setInterval> | undefined
let n = 0

const replies: Record<string, string> = {
  default: 'Here\'s a quick take: start with the smallest version that proves the idea, ship it to a few people, and let their feedback decide what to build next. Want me to turn that into a checklist?',
  springs: 'Springs feel natural because they model momentum: an interrupted animation keeps its velocity instead of restarting. In vuelix, raise stiffness for snappier motion and damping for less bounce.',
  email: 'Sure! Here\'s a draft:\n\nHi team, quick update: the new components are live on vuelix.dev. Have a look and send feedback by Friday. Thanks!',
  plan: 'A 3-day plan: Day 1, set up Vue + Tailwind and install vuelix. Day 2, build the core screens with the components. Day 3, polish the motion, test on mobile and deploy to Cloudflare Pages.',
}

function pick(text: string) {
  const t = text.toLowerCase()
  if (t.includes('spring'))
    return replies.springs!
  if (t.includes('email'))
    return replies.email!
  if (t.includes('plan'))
    return replies.plan!
  return replies.default!
}

function onSend(text: string) {
  messages.value = [...messages.value, { id: `m${++n}`, from: 'user', content: text, timestamp: new Date() }]
  const words = pick(text).split(/(\s+)/)
  const id = `m${++n}`
  loading.value = true
  setTimeout(() => {
    messages.value = [...messages.value, { id, from: 'assistant', content: '', streaming: true, timestamp: new Date() }]
    let i = 0
    timer = setInterval(() => {
      i += 2
      const done = i >= words.length
      messages.value = messages.value.map(m => (m.id === id ? { ...m, content: words.slice(0, i).join(''), streaming: !done } : m))
      if (done)
        stop()
    }, 45)
  }, 500)
}

function stop() {
  clearInterval(timer)
  loading.value = false
  messages.value = messages.value.map(m => (m.streaming ? { ...m, streaming: false } : m))
}

function onRetry(message: ChatAppMessage) {
  const index = messages.value.findIndex(m => m.id === message.id)
  const prompt = messages.value.slice(0, index).reverse().find(m => m.from === 'user')
  messages.value = messages.value.slice(0, index)
  if (prompt) {
    messages.value = messages.value.filter(m => m.id !== prompt.id)
    onSend(prompt.content)
  }
}

onBeforeUnmount(() => clearInterval(timer))
</script>

<template>
  <ChatApp
    v-model:messages="messages"
    class="max-w-3xl"
    :title="messages.length ? 'Shipping a side project' : 'New chat'"
    subtitle="vuelix assistant · demo"
    :loading="loading"
    :suggestions="['Explain why springs feel natural', 'Draft a short team email', 'Make a 3-day launch plan', 'What should I build first?']"
    @send="onSend"
    @stop="stop"
    @retry="onRetry"
  />
</template>
