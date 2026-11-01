<script setup lang="ts">
import { computed, ref } from 'vue'
import { REGISTRY_URL } from '../../registry'

const props = defineProps<{ name: string }>()

const managers = ['pnpm', 'npm', 'yarn', 'bun'] as const
type Manager = typeof managers[number]

const runner: Record<Manager, string> = {
  pnpm: 'pnpm dlx',
  npm: 'npx',
  yarn: 'yarn dlx',
  bun: 'bunx --bun',
}

const pm = ref<Manager>('pnpm')
const copied = ref(false)
const command = computed(() => `${runner[pm.value]} shadcn-vue@latest add ${REGISTRY_URL}/${props.name}.json`)

async function copy() {
  await navigator.clipboard.writeText(command.value)
  copied.value = true
  setTimeout(() => (copied.value = false), 1500)
}
</script>

<template>
  <div class="vp-raw my-4 overflow-hidden rounded-xl border bg-[var(--vp-code-block-bg)]">
    <div class="flex items-center justify-between border-b px-3">
      <div class="flex">
        <button
          v-for="m in managers"
          :key="m"
          type="button"
          class="relative px-3 py-2 text-xs font-medium transition-colors"
          :class="pm === m ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'"
          @click="pm = m"
        >
          {{ m }}
          <span v-if="pm === m" class="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-brand" />
        </button>
      </div>
      <button
        type="button"
        class="rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
        @click="copy"
      >
        {{ copied ? 'Copied!' : 'Copy' }}
      </button>
    </div>
    <pre class="m-0 overflow-x-auto px-4 py-3.5 font-mono text-[13px] leading-6 text-[var(--vp-code-block-color)]"><code>{{ command }}</code></pre>
  </div>
</template>
