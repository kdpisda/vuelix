<script setup lang="ts">
import { ImageGeneration } from '@/components/ui/image-generation'
import { RotateCcw, Zap } from 'lucide-vue-next'
import { onBeforeUnmount, onMounted, ref } from 'vue'

// A self-contained "generated" artwork so the demo works offline.
const art = `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">
<defs>
<linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1e1b4b"/><stop offset=".45" stop-color="#6d28d9"/><stop offset=".78" stop-color="#f472b6"/><stop offset="1" stop-color="#fdba74"/></linearGradient>
<linearGradient id="w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8b5cf6"/><stop offset="1" stop-color="#1e1b4b"/></linearGradient>
<radialGradient id="g"><stop offset="0" stop-color="#fff7ed"/><stop offset=".35" stop-color="#fdba74" stop-opacity=".8"/><stop offset="1" stop-color="#fdba74" stop-opacity="0"/></radialGradient>
<linearGradient id="b" x1="0" x2="1"><stop offset="0" stop-color="#fef3c7" stop-opacity=".75"/><stop offset="1" stop-color="#fef3c7" stop-opacity="0"/></linearGradient>
</defs>
<rect width="800" height="600" fill="url(#s)"/>
<g fill="#fff" opacity=".7"><circle cx="90" cy="60" r="1.6"/><circle cx="240" cy="110" r="1.2"/><circle cx="420" cy="50" r="1.8"/><circle cx="600" cy="90" r="1.2"/><circle cx="720" cy="40" r="1.6"/><circle cx="330" cy="150" r="1"/><circle cx="680" cy="170" r="1"/></g>
<circle cx="560" cy="400" r="190" fill="url(#g)"/>
<circle cx="560" cy="404" r="48" fill="#fff1e6"/>
<path d="M0 404 120 366 260 390 380 356 520 396 660 372 800 388V404Z" fill="#4c1d95" opacity=".75"/>
<rect y="404" width="800" height="196" fill="url(#w)"/>
<g fill="#fdba74" opacity=".55"><rect x="500" y="420" width="120" height="4" rx="2"/><rect x="520" y="440" width="80" height="3" rx="1.5"/><rect x="535" y="458" width="50" height="3" rx="1.5"/><rect x="546" y="476" width="28" height="2" rx="1"/></g>
<path d="M156 172 800 70V280Z" fill="url(#b)"/>
<circle cx="150" cy="173" r="34" fill="#fde68a" opacity=".35"/>
<path d="M0 600V330l60-30 90-4 70 24 40 50 40 50 30 50 20 130Z" fill="#0f0a1f"/>
<path d="M134 300 142 190h16l8 110Z" fill="#f8fafc"/>
<path d="M137.4 262h25.2l1.3 16h-27.8ZM140.2 222h19.6l1.1 14h-21.8Z" fill="#e11d48"/>
<rect x="136" y="182" width="28" height="8" rx="2" fill="#1e1b4b"/>
<rect x="142" y="164" width="16" height="18" fill="#fde68a"/>
<path d="M138 166 150 150l12 16Z" fill="#1e1b4b"/>
</svg>`)}`

const progress = ref(0)
const error = ref<string | false>(false)
const failNext = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined

function generate() {
  clearTimeout(timer)
  progress.value = 0
  error.value = false
  const shouldFail = failNext.value
  failNext.value = false
  const step = () => {
    // Diffusion steps arrive unevenly: small bumps with the odd longer pause.
    progress.value = Math.min(1, progress.value + 0.02 + Math.random() * 0.06)
    if (shouldFail && progress.value > 0.6) {
      error.value = 'The GPU worker timed out.'
      return
    }
    if (progress.value < 1)
      timer = setTimeout(step, Math.random() < 0.15 ? 700 : 220)
  }
  timer = setTimeout(step, 400)
}

onMounted(generate)
onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <div class="flex w-full max-w-sm flex-col gap-3">
    <ImageGeneration
      :progress="progress"
      :src="art"
      :preview="art"
      :error="error"
      alt="A lighthouse on a cliff at dusk, its beam crossing a violet sky"
      aspect-ratio="4 / 3"
      @retry="generate"
    />
    <div class="flex items-start justify-between gap-3">
      <p class="m-0 text-xs leading-5 text-muted-foreground">
        “A lighthouse on a cliff at dusk, violet sky, soft film grain, 35mm”
      </p>
      <div class="flex shrink-0 items-center gap-1">
        <button
          type="button"
          :aria-pressed="failNext"
          title="Make the next run fail"
          :class="[
            'inline-flex size-7 items-center justify-center rounded-md outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50',
            failNext ? 'bg-destructive/10 text-destructive' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
          ]"
          @click="failNext = !failNext"
        >
          <Zap class="size-3.5" />
          <span class="sr-only">Fail next run</span>
        </button>
        <button
          type="button"
          class="inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-xs text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
          @click="generate"
        >
          <RotateCcw class="size-3" />
          Regenerate
        </button>
      </div>
    </div>
  </div>
</template>
