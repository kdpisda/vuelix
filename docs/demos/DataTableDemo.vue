<script setup lang="ts">
import type { DataTableColumn } from '@/ui/data-table'
import { DataTable } from '@/ui/data-table'
import { Archive, Inbox } from 'lucide-vue-next'
import { ref } from 'vue'

interface Customer {
  id: number
  name: string
  email: string
  plan: 'Starter' | 'Pro' | 'Enterprise'
  status: 'Active' | 'Trial' | 'Past due'
  mrr: number
  joined: string
}

const initial: Customer[] = [
  { id: 1, name: 'Amara Okafor', email: 'amara@lumen.io', plan: 'Enterprise', status: 'Active', mrr: 2400, joined: '2023-02-14' },
  { id: 2, name: 'Jonas Lindqvist', email: 'jonas@fjord.se', plan: 'Pro', status: 'Active', mrr: 490, joined: '2024-06-02' },
  { id: 3, name: 'Priya Raman', email: 'priya@kitehq.com', plan: 'Starter', status: 'Trial', mrr: 0, joined: '2025-01-19' },
  { id: 4, name: 'Mateo García', email: 'mateo@sol.mx', plan: 'Pro', status: 'Past due', mrr: 490, joined: '2023-11-08' },
  { id: 5, name: 'Hana Sato', email: 'hana@origami.jp', plan: 'Enterprise', status: 'Active', mrr: 3150, joined: '2022-09-30' },
  { id: 6, name: 'Leo Martin', email: 'leo@atelier.fr', plan: 'Starter', status: 'Active', mrr: 49, joined: '2024-12-11' },
]

const rows = ref<Customer[]>([...initial])
const selected = ref<Array<string | number>>([2, 5])

const columns: DataTableColumn<Customer>[] = [
  { key: 'name', label: 'Customer', sortable: true },
  { key: 'status', label: 'Status' },
  { key: 'mrr', label: 'MRR', sortable: true, align: 'right' },
  { key: 'joined', label: 'Joined', sortable: true, align: 'right', sortValue: row => new Date(row.joined) },
]

const statusTone: Record<Customer['status'], string> = {
  'Active': 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  'Trial': 'bg-sky-500/15 text-sky-700 dark:text-sky-300',
  'Past due': 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
}

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
const date = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' })

function archive(keys: Array<string | number>) {
  rows.value = rows.value.filter(row => !keys.includes(row.id))
  selected.value = []
}
</script>

<template>
  <DataTable
    v-model:selected="selected"
    :columns="columns"
    :rows="rows"
    selectable
    caption="Customers"
    class="max-w-2xl"
  >
    <template #cell-name="{ row }">
      <div class="flex items-center gap-2.5">
        <img
          :src="`https://picsum.photos/seed/${row.name.split(' ')[0]}/64/64`"
          alt=""
          class="size-7 rounded-full object-cover"
        >
        <div class="min-w-0">
          <div class="truncate font-medium">
            {{ row.name }}
          </div>
          <div class="truncate text-xs text-muted-foreground">
            {{ row.email }}
          </div>
        </div>
      </div>
    </template>
    <template #cell-status="{ value }">
      <span class="whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium" :class="statusTone[value as Customer['status']]">
        {{ value }}
      </span>
    </template>
    <template #cell-mrr="{ value }">
      <span class="tabular-nums">{{ money.format(value) }}</span>
    </template>
    <template #cell-joined="{ value }">
      <span class="whitespace-nowrap text-muted-foreground">{{ date.format(new Date(value)) }}</span>
    </template>
    <template #actions="{ selected: keys }">
      <button
        type="button"
        class="inline-flex items-center gap-1.5 rounded-md border bg-background px-2.5 py-1 text-xs font-medium outline-none transition-colors hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50"
        @click="archive(keys)"
      >
        <Archive class="size-3.5" /> Archive
      </button>
    </template>
    <template #empty>
      <div class="flex flex-col items-center gap-2">
        <Inbox class="size-6" />
        <p class="m-0">
          No customers left.
        </p>
        <button
          type="button"
          class="rounded-md px-2 py-1 text-xs font-medium text-foreground underline-offset-4 outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
          @click="rows = [...initial]"
        >
          Restore sample data
        </button>
      </div>
    </template>
  </DataTable>
</template>
