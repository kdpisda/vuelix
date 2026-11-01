<script setup lang="ts">
import { ExpandingButton } from '@/components/ui/expanding-button'
import { Check, Link, Mail, MessageCircle, Plus, Send, Share2 } from 'lucide-vue-next'
import { ref } from 'vue'

const copied = ref(false)
const targets = [
  { label: 'Email', icon: Mail },
  { label: 'Messages', icon: MessageCircle },
  { label: 'Send to app', icon: Send },
]

function copy() {
  copied.value = true
  setTimeout(() => (copied.value = false), 1400)
}

const email = ref('')
const joined = ref('')
function join(close: () => void) {
  if (!email.value.includes('@'))
    return
  joined.value = email.value
  email.value = ''
  close()
}
</script>

<template>
  <div class="flex flex-col items-center gap-8">
    <ExpandingButton label="Share">
      <template #trigger>
        <Share2 /> Share
      </template>
      <template #default>
        <button
          type="button"
          class="inline-flex h-8 items-center gap-1.5 rounded-full bg-muted px-3 text-xs font-medium outline-none transition-colors hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50"
          @click="copy"
        >
          <component :is="copied ? Check : Link" class="size-3.5" />
          {{ copied ? 'Copied' : 'Copy link' }}
        </button>
        <button
          v-for="t in targets"
          :key="t.label"
          type="button"
          :aria-label="t.label"
          class="inline-flex size-8 items-center justify-center rounded-full text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <component :is="t.icon" class="size-4" />
        </button>
      </template>
    </ExpandingButton>

    <div class="flex flex-col items-center gap-2">
      <ExpandingButton label="Join the waitlist" panel-label="Join the waitlist" variant="outline">
        <template #trigger>
          <Plus /> Join the waitlist
        </template>
        <template #default="{ close }">
          <form class="flex items-center gap-1.5" @submit.prevent="join(close)">
            <input
              v-model="email"
              type="email"
              required
              placeholder="you@company.com"
              aria-label="Email address"
              class="h-8 w-48 rounded-full border bg-background px-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
            <button
              type="submit"
              class="h-8 rounded-full bg-primary px-3 text-xs font-medium text-primary-foreground outline-none transition-opacity hover:opacity-90 focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              Join
            </button>
          </form>
        </template>
      </ExpandingButton>
      <p class="m-0 h-4 text-xs text-muted-foreground" aria-live="polite">
        <template v-if="joined">
          Thanks — we'll email {{ joined }}.
        </template>
      </p>
    </div>
  </div>
</template>
