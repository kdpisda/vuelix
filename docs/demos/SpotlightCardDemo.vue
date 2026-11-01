<script setup lang="ts">
import { SpotlightCard } from '@/components/ui/spotlight-card'
import { ArrowUpRight, Cpu, Globe } from 'lucide-vue-next'
</script>

<template>
  <div class="grid w-full max-w-2xl gap-4 sm:grid-cols-2">
    <SpotlightCard>
      <template #header>
        <div class="flex items-center gap-3">
          <span class="flex size-9 items-center justify-center rounded-lg border bg-background">
            <Globe class="size-4" />
          </span>
          <div>
            <p class="m-0 text-sm font-semibold">
              Edge Network
            </p>
            <p class="m-0 text-xs text-muted-foreground">
              312 points of presence
            </p>
          </div>
        </div>
      </template>
      <p class="m-0 text-sm leading-6 text-muted-foreground">
        Serve every request from the region closest to your users, with
        automatic failover and 38&nbsp;ms median latency.
      </p>
      <template #footer>
        <a href="#" class="inline-flex items-center gap-1 rounded-md text-sm font-medium text-foreground no-underline outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50" @click.prevent>
          Explore regions <ArrowUpRight class="size-3.5" />
        </a>
      </template>
    </SpotlightCard>

    <SpotlightCard color="var(--chart-3)">
      <template #header>
        <div class="flex items-center gap-3">
          <span class="flex size-9 items-center justify-center rounded-lg border bg-background">
            <Cpu class="size-4" />
          </span>
          <div>
            <p class="m-0 text-sm font-semibold">
              GPU Workers
            </p>
            <p class="m-0 text-xs text-muted-foreground">
              Now in public beta
            </p>
          </div>
        </div>
      </template>
      <p class="m-0 text-sm leading-6 text-muted-foreground">
        Run inference next to your data. Scale to zero when idle and pay
        only for the milliseconds your model is busy.
      </p>
      <template #footer>
        <a href="#" class="inline-flex items-center gap-1 rounded-md text-sm font-medium text-foreground no-underline outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50" @click.prevent>
          Join the beta <ArrowUpRight class="size-3.5" />
        </a>
      </template>
    </SpotlightCard>
  </div>
</template>
