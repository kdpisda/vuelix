<script setup lang="ts">
import { CodeBlock } from '@/ui/code-block'

const code = `import { onScopeDispose, ref } from 'vue'

// Reveal a streamed answer a few characters per frame,
// so bursts from the network still read smoothly.
export function useStreamingText(speed = 3) {
  const target = ref('')
  const shown = ref('')
  let raf = 0

  function step() {
    const next = shown.value.length + speed
    shown.value = target.value.slice(0, next)
    if (shown.value.length < target.value.length)
      raf = requestAnimationFrame(step)
  }

  function push(chunk: string) {
    target.value += chunk
    cancelAnimationFrame(raf)
    raf = requestAnimationFrame(step)
  }

  onScopeDispose(() => cancelAnimationFrame(raf))
  return { shown, push }
}`

// A tiny demo-only highlighter. In an app you'd pass Shiki / highlight.js output to `html`.
const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const rules: [RegExp, string][] = [
  [/\/\/.*$/gm, 'text-muted-foreground italic'],
  [/'[^']*'/g, 'text-chart-1'],
  [/\b(?:import|from|export|function|const|let|if|return)\b/g, 'text-chart-3'],
  [/\b\w+(?=\()/g, 'text-chart-2'],
  [/\b\d+\b/g, 'text-chart-4'],
]
function highlight(src: string) {
  const re = new RegExp(rules.map(([r]) => `(${r.source})`).join('|'), 'gm')
  let out = ''
  let last = 0
  for (const m of src.matchAll(re)) {
    const rule = rules[m.slice(1).findIndex(g => g !== undefined)]!
    out += `${escape(src.slice(last, m.index))}<span class="${rule[1]}">${escape(m[0])}</span>`
    last = m.index + m[0].length
  }
  return out + escape(src.slice(last))
}
const html = highlight(code)
</script>

<template>
  <CodeBlock
    :code="code"
    :html="html"
    filename="composables/useStreamingText.ts"
    language="ts"
    highlight="6-7"
    collapsible
    :collapsed-lines="11"
    class="max-w-xl"
  />
</template>
