<script setup lang="ts">
import { MasonryGrid } from '@/ui/masonry-grid'
import { Heart } from 'lucide-vue-next'
import { ref } from 'vue'

interface Shot {
  id: number
  seed: string
  ratio: number
  title: string
  author: string
  likes: number
}

const words = ['fjord', 'neon', 'dune', 'cedar', 'harbor', 'alpine', 'mesa', 'tide', 'ember', 'grove', 'quartz', 'atlas', 'drift', 'lumen', 'basalt', 'meadow']
const authors = ['Ana Silva', 'Kenji Tanaka', 'Priya Nair', 'Lucas Martin', 'Zoe Clarke']
const ratios = [1.25, 0.75, 1, 1.5, 0.8, 1.33, 0.66]

function page(start: number, count: number): Shot[] {
  return Array.from({ length: count }, (_, i) => {
    const n = start + i
    const word = words[n % words.length]!
    return {
      id: n,
      seed: `${word}${n}`,
      ratio: ratios[(n * 5) % ratios.length]!,
      title: word[0]!.toUpperCase() + word.slice(1),
      author: authors[n % authors.length]!,
      likes: 40 + ((n * 37) % 260),
    }
  })
}

const shots = ref<Shot[]>(page(0, 12))
const loading = ref(false)
const hasMore = ref(true)
const columns = ref<number | undefined>()

function loadMore() {
  loading.value = true
  setTimeout(() => {
    shots.value = [...shots.value, ...page(shots.value.length, 9)]
    hasMore.value = shots.value.length < 48
    loading.value = false
  }, 900)
}
</script>

<template>
  <div class="w-full max-w-2xl">
    <div class="mb-3 flex items-center justify-between gap-3">
      <p class="m-0 text-sm font-semibold">
        Explore
      </p>
      <div class="flex items-center gap-1 rounded-lg bg-muted p-1 text-xs" role="group" aria-label="Columns">
        <button
          v-for="c in [undefined, 2, 3, 4]"
          :key="String(c)"
          type="button"
          :aria-pressed="columns === c"
          class="rounded-md px-2 py-1 font-medium outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50"
          :class="columns === c ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'"
          @click="columns = c"
        >
          {{ c ?? 'Auto' }}
        </button>
      </div>
    </div>
    <div class="h-[460px] overflow-y-auto rounded-2xl border bg-muted/30 p-3">
      <MasonryGrid
        :items="shots"
        :columns="columns"
        :min-column-width="150"
        :gap="12"
        :loading="loading"
        :has-more="hasMore"
        label="Photos"
        @load-more="loadMore"
      >
        <template #default="{ item }">
          <figure class="group m-0 overflow-hidden rounded-xl border bg-card shadow-xs">
            <img
              :src="`https://picsum.photos/seed/${item.seed}/400/${Math.round(400 / item.ratio)}`"
              :alt="item.title"
              loading="lazy"
              class="block w-full bg-muted object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              :style="{ aspectRatio: String(item.ratio) }"
            >
            <figcaption class="flex items-center justify-between gap-2 px-3 py-2">
              <span class="min-w-0">
                <span class="block truncate text-sm font-medium">{{ item.title }}</span>
                <span class="block truncate text-xs text-muted-foreground">{{ item.author }}</span>
              </span>
              <span class="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Heart class="size-3.5" /> {{ item.likes }}
              </span>
            </figcaption>
          </figure>
        </template>
      </MasonryGrid>
    </div>
  </div>
</template>
