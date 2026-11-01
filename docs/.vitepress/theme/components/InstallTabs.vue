<script setup lang="ts">
import { computed, ref } from 'vue'
import { REGISTRY_URL } from '../../registry'

const props = defineProps<{
  name: string
  /** Named exports to show for the npm package (defaults to the PascalCase name). */
  imports?: string[]
}>()

const managers = ['pnpm', 'npm', 'yarn', 'bun'] as const
type Manager = typeof managers[number]

const runner: Record<Manager, string> = { pnpm: 'pnpm dlx', npm: 'npx', yarn: 'yarn dlx', bun: 'bunx --bun' }
const adder: Record<Manager, string> = { pnpm: 'pnpm add', npm: 'npm install', yarn: 'yarn add', bun: 'bun add' }

const mode = ref<'cli' | 'package'>('cli')
const pm = ref<Manager>('pnpm')
const copied = ref(false)

const pascal = computed(() => props.name.split('-').map(p => p[0]!.toUpperCase() + p.slice(1)).join(''))
const command = computed(() => mode.value === 'cli'
  ? `${runner[pm.value]} shadcn-vue@latest add ${REGISTRY_URL}/${props.name}.json`
  : `${adder[pm.value]} vuelix motion-v`)
const importLine = computed(() => `import { ${(props.imports ?? [pascal.value]).join(', ')} } from 'vuelix'`)

async function copy() {
  await navigator.clipboard.writeText(command.value)
  copied.value = true
  setTimeout(() => (copied.value = false), 1500)
}
</script>

<template>
  <div class="vp-raw my-4">
    <div class="mb-2 inline-flex rounded-lg bg-muted p-0.5 text-xs font-medium">
      <button
        v-for="m in ([['cli', 'Copy source (CLI)'], ['package', 'npm package']] as const)"
        :key="m[0]"
        type="button"
        class="rounded-md px-2.5 py-1 transition-colors"
        :class="mode === m[0] ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'"
        @click="mode = m[0]"
      >
        {{ m[1] }}
      </button>
    </div>
    <div class="overflow-hidden rounded-xl border bg-[var(--vp-code-block-bg)]">
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
        <button type="button" class="rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground" @click="copy">
          {{ copied ? 'Copied!' : 'Copy' }}
        </button>
      </div>
      <pre class="m-0 overflow-x-auto px-4 py-3.5 font-mono text-[13px] leading-6 text-[var(--vp-code-block-color)]"><code>{{ command }}</code></pre>
    </div>
    <p v-if="mode === 'package'" class="mt-2 text-sm text-muted-foreground">
      Add <code class="rounded bg-muted px-1 py-0.5 text-[13px]">@import "vuelix/tailwind.css";</code> after
      <code class="rounded bg-muted px-1 py-0.5 text-[13px]">@import "tailwindcss";</code>, then
      <code class="rounded bg-muted px-1 py-0.5 text-[13px]">{{ importLine }}</code>.
      <a href="/docs/installation#npm-package" class="text-brand underline-offset-2 hover:underline">More</a>
    </p>
  </div>
</template>
