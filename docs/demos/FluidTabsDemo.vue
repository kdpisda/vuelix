<script setup lang="ts">
import { FluidTabs } from '@/ui/fluid-tabs'
import { Activity, CreditCard, LayoutDashboard, Users } from 'lucide-vue-next'
import { ref } from 'vue'

const tab = ref('overview')
const tabs = [
  { value: 'overview', label: 'Overview', icon: LayoutDashboard },
  { value: 'activity', label: 'Activity', icon: Activity },
  { value: 'billing', label: 'Billing', icon: CreditCard },
  { value: 'team', label: 'Team', icon: Users },
]

const stats = [
  { label: 'Visitors', value: '48.2k', delta: '+12%' },
  { label: 'Signups', value: '1,284', delta: '+8%' },
  { label: 'Churn', value: '1.9%', delta: '−0.4%' },
]
const events = [
  { who: 'Lena', what: 'deployed main to production', when: '2m' },
  { who: 'Omar', what: 'opened PR #482 “Fluid tabs”', when: '18m' },
  { who: 'Iris', what: 'commented on the pricing page', when: '1h' },
  { who: 'Theo', what: 'invited 3 people to Acme', when: '3h' },
]
const team = [
  { name: 'Lena Fischer', role: 'Owner', color: 'from-rose-400 to-orange-300' },
  { name: 'Omar Haddad', role: 'Engineer', color: 'from-sky-400 to-indigo-400' },
  { name: 'Iris Tanaka', role: 'Designer', color: 'from-emerald-400 to-teal-300' },
]
</script>

<template>
  <div class="w-full max-w-lg">
    <FluidTabs v-model="tab" :items="tabs" label="Project" list-class="self-center">
      <template #overview>
        <div class="grid grid-cols-3 gap-3">
          <div v-for="s in stats" :key="s.label" class="rounded-xl border bg-card p-3">
            <p class="m-0 text-xs text-muted-foreground">
              {{ s.label }}
            </p>
            <p class="m-0 mt-1 text-xl font-semibold tabular-nums">
              {{ s.value }}
            </p>
            <p class="m-0 text-xs text-emerald-600 dark:text-emerald-400">
              {{ s.delta }}
            </p>
          </div>
        </div>
      </template>

      <template #activity>
        <ul class="m-0 list-none divide-y rounded-xl border bg-card p-0">
          <li v-for="e in events" :key="e.what" class="flex items-center gap-3 px-4 py-3 text-sm">
            <span class="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">{{ e.who[0] }}</span>
            <span class="min-w-0 flex-1 truncate"><span class="font-medium">{{ e.who }}</span> {{ e.what }}</span>
            <span class="text-xs text-muted-foreground">{{ e.when }}</span>
          </li>
        </ul>
      </template>

      <template #billing>
        <div class="flex items-center justify-between gap-4 rounded-xl border bg-card p-4">
          <div>
            <p class="m-0 text-sm font-medium">
              Pro plan
            </p>
            <p class="m-0 text-xs text-muted-foreground">
              $24 / month · renews Dec 1
            </p>
          </div>
          <button type="button" class="cursor-pointer rounded-lg border px-3 py-1.5 text-sm font-medium outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50">
            Manage
          </button>
        </div>
      </template>

      <template #team>
        <ul class="m-0 list-none space-y-2 p-0">
          <li v-for="m in team" :key="m.name" class="flex items-center gap-3 rounded-xl border bg-card px-4 py-2.5 text-sm">
            <span :class="['size-8 rounded-full bg-gradient-to-br', m.color]" />
            <span class="flex-1 font-medium">{{ m.name }}</span>
            <span class="text-xs text-muted-foreground">{{ m.role }}</span>
          </li>
        </ul>
      </template>
    </FluidTabs>
  </div>
</template>
