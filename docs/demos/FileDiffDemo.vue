<script setup lang="ts">
import type { FileDiffDecision } from '@/ui/file-diff'
import { FileDiff } from '@/ui/file-diff'
import { computed, ref } from 'vue'

// Exactly what `git diff` prints — the agent's proposed change.
const diff = `diff --git a/src/composables/useChat.ts b/src/composables/useChat.ts
index 4f2a1c9..b81e0d4 100644
--- a/src/composables/useChat.ts
+++ b/src/composables/useChat.ts
@@ -1,6 +1,7 @@
 import { ref } from 'vue'
+import { nanoid } from 'nanoid'

 export interface ChatMessage {
   id: string
   role: 'user' | 'assistant'
   content: string
@@ -20,21 +21,23 @@ export function useChat(endpoint: string) {
   const messages = ref<ChatMessage[]>([])
   const pending = ref(false)

   async function send(text: string) {
-    messages.value.push({ id: crypto.randomUUID(), role: 'user', content: text })
+    const id = nanoid()
+    messages.value.push({ id, role: 'user', content: text })
     pending.value = true
     try {
       const res = await fetch(endpoint, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ messages: messages.value }),
       })
       const reply = await res.json()
       messages.value.push(reply)
     }
     finally {
       pending.value = false
     }
+    return id
   }

   return { messages, pending, send }
diff --git a/src/components/StopButton.vue b/src/components/StopButton.vue
new file mode 100644
index 0000000..3b18e51
--- /dev/null
+++ b/src/components/StopButton.vue
@@ -0,0 +1,7 @@
+<script setup lang="ts">
+defineEmits<{ stop: [] }>()
+<\/script>
+
+<template>
+  <button type="button" @click="$emit('stop')">Stop</button>
+</template>
`

const decisions = ref<Record<string, FileDiffDecision>>({})
const reviewed = computed(() => Object.keys(decisions.value).length)
</script>

<template>
  <div class="flex w-full max-w-2xl flex-col gap-3">
    <div class="flex items-center justify-between text-xs text-muted-foreground">
      <span>Proposed by the agent · 2 files</span>
      <span class="tabular-nums" aria-live="polite">{{ reviewed }} of 3 hunks reviewed</span>
    </div>
    <FileDiff v-model:decisions="decisions" :diff="diff" reviewable />
  </div>
</template>
