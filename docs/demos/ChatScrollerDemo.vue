<script setup lang="ts">
import { ChatMessage } from '@/ui/chat-message'
import { ChatScroller } from '@/ui/chat-scroller'
import { onBeforeUnmount, onMounted, ref } from 'vue'

interface Msg { id: number, from: 'user' | 'assistant', text: string, time: string, streaming?: boolean, appear?: boolean }

let nextId = 100
const messages = ref<Msg[]>([
  { id: 1, from: 'user', time: '9:12 AM', text: 'Our checkout test fails about one run in ten on CI. Locally it always passes.' },
  { id: 2, from: 'assistant', time: '9:12 AM', text: 'Classic race. Does the test wait for the payment iframe, or for a fixed timeout?' },
  { id: 3, from: 'user', time: '9:13 AM', text: 'A fixed waitForTimeout(500) after clicking Pay.' },
  { id: 4, from: 'assistant', time: '9:13 AM', text: 'That\'s the culprit. CI machines are slower, so 500 ms is sometimes not enough. Wait for the confirmation instead: await expect(page.getByText(\'Order placed\')).toBeVisible().' },
  { id: 5, from: 'user', time: '9:15 AM', text: 'Swapped it — 40 green runs in a row.' },
])

// Older history, prepended in batches when the user scrolls to the top.
const older: Msg[][] = [
  [
    { id: 11, from: 'user', time: '9:08 AM', text: 'Morning! Can you look at a flaky Playwright test with me?' },
    { id: 12, from: 'assistant', time: '9:08 AM', text: 'Sure — paste the failing spec and the CI log.' },
    { id: 13, from: 'user', time: '9:10 AM', text: 'It\'s checkout.spec.ts, the "pays with card" case.' },
  ],
  [
    { id: 21, from: 'user', time: 'Yesterday', text: 'Thanks for the help with the Docker cache yesterday.' },
    { id: 22, from: 'assistant', time: 'Yesterday', text: 'Anytime. Builds should be about 3× faster now.' },
  ],
]
const loading = ref(false)
const exhausted = ref(false)

function loadOlder() {
  if (loading.value || exhausted.value)
    return
  loading.value = true
  setTimeout(() => {
    const batch = older.shift()
    if (batch)
      messages.value.unshift(...batch.map(m => ({ ...m, appear: false })))
    exhausted.value = older.length === 0
    loading.value = false
  }, 700)
}

const replies = [
  'Three things I\'d add:\n\n1. Give each test its own seeded user so runs never share a cart.\n2. Mock the payment provider at the network layer with page.route() — no real iframe, no flake.\n3. Turn on retries: 1 only in CI and fail the build if a retry was needed, so flakes stay visible.',
  'One more: record a trace on the first retry (trace: \'on-first-retry\'). When something does flake, you get a full timeline of network, DOM and console instead of guessing.',
  'And keep an eye on test isolation — if any spec relies on state from a previous one, run the suite with --shard locally to shake it out.',
]
let replyIndex = 0
let streamTimer: ReturnType<typeof setInterval> | undefined
const busy = ref(false)

function ask() {
  if (busy.value)
    return
  busy.value = true
  messages.value.push({ id: nextId++, from: 'user', time: 'now', text: replyIndex === 0 ? 'Anything else worth hardening?' : 'Anything else?' })
  const reply: Msg = { id: nextId++, from: 'assistant', time: 'now', text: '', streaming: true }
  setTimeout(() => {
    messages.value.push(reply)
    const live = messages.value[messages.value.length - 1]!
    const words = replies[replyIndex++ % replies.length]!.split(/(?<= )/)
    let i = 0
    setTimeout(() => {
      streamTimer = setInterval(() => {
        live.text += words.slice(i, i + 2).join('')
        i += 2
        if (i >= words.length) {
          clearInterval(streamTimer)
          live.streaming = false
          busy.value = false
        }
      }, 60)
    }, 700)
  }, 350)
}

let kickoff: ReturnType<typeof setTimeout> | undefined
onMounted(() => (kickoff = setTimeout(ask, 1400)))
onBeforeUnmount(() => {
  clearTimeout(kickoff)
  clearInterval(streamTimer)
})
</script>

<template>
  <div class="flex h-[440px] w-full max-w-xl flex-col overflow-hidden rounded-2xl border bg-background shadow-sm">
    <div class="flex items-center justify-between border-b px-4 py-2.5">
      <div class="flex items-center gap-2 text-sm font-medium">
        <span class="size-2 rounded-full bg-brand" aria-hidden="true" />
        Debugging session
      </div>
      <span class="text-xs text-muted-foreground">Scroll up to load history</span>
    </div>

    <ChatScroller class="flex-1" label="Debugging session" @reach-top="loadOlder">
      <template #top>
        <p class="m-0 py-1 text-center text-xs text-muted-foreground">
          <template v-if="exhausted">
            Beginning of conversation
          </template>
          <template v-else-if="loading">
            Loading earlier messages…
          </template>
          <template v-else>
            Scroll up for earlier messages
          </template>
        </p>
      </template>
      <ChatMessage
        v-for="m in messages"
        :key="m.id"
        :from="m.from"
        :author="m.from === 'user' ? 'Sam' : 'Assistant'"
        :timestamp="m.time"
        :content="m.text"
        :streaming="m.streaming"
        :appear="m.appear !== false"
        :actions="[]"
      />
    </ChatScroller>

    <div class="flex items-center justify-between gap-3 border-t px-4 py-2.5">
      <span class="text-xs text-muted-foreground">Scroll up while it streams — the view stays put.</span>
      <button
        type="button"
        class="inline-flex h-8 shrink-0 items-center rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground outline-none transition-opacity focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50"
        :disabled="busy"
        @click="ask"
      >
        Ask a follow-up
      </button>
    </div>
  </div>
</template>
