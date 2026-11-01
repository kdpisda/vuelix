<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { AnimatePresence, motion, useReducedMotion } from 'motion-v'
import { computed, ref, useId, watch } from 'vue'
import { cn } from '@/lib/utils'
import FixtureCrest from './FixtureCrest.vue'
import RollingNumber from './RollingNumber.vue'

export interface FixtureTeam {
  name: string
  /** Crest initials. Defaults to the first three letters of the name. */
  short?: string
  /** Crest color (any CSS color). Defaults to the chart palette. */
  color?: string
}

export interface FixtureEvent {
  id?: string
  minute: number
  type: 'goal' | 'penalty' | 'own-goal' | 'yellow' | 'red' | 'sub'
  team: 'home' | 'away'
  player: string
  /** Extra line, e.g. the assist or the player coming off. */
  detail?: string
}

export interface Fixture {
  id: string
  /** Heading the fixture is grouped under — a date or a round. */
  group: string
  home: FixtureTeam
  away: FixtureTeam
  status: 'scheduled' | 'live' | 'halftime' | 'finished'
  homeScore?: number
  awayScore?: number
  /** Current minute for live matches. */
  minute?: number
  /** Kick-off time shown for scheduled matches, e.g. "20:45". */
  kickoff?: string
  venue?: string
  events?: FixtureEvent[]
}

const props = defineProps<{
  fixtures: Fixture[]
  class?: HTMLAttributes['class']
}>()

const expanded = defineModel<string | null>('expanded', { default: null })

const uid = useId()
const reduced = useReducedMotion()
const spring = { type: 'spring', stiffness: 340, damping: 30 } as const

const groups = computed(() => {
  const map = new Map<string, Fixture[]>()
  for (const f of props.fixtures) {
    if (!map.has(f.group))
      map.set(f.group, [])
    map.get(f.group)!.push(f)
  }
  return [...map].map(([title, fixtures]) => ({ title, fixtures }))
})


// Flash a row and announce when a score changes.
const flashes = ref<Record<string, number>>({})
const announcement = ref('')
watch(
  () => props.fixtures.map(f => `${f.id}:${f.homeScore ?? ''}-${f.awayScore ?? ''}`),
  (now, before) => {
    const prev = new Set(before)
    for (const key of now) {
      if (prev.has(key))
        continue
      const id = key.slice(0, key.lastIndexOf(':'))
      if (!before.some(b => b.startsWith(`${id}:`)))
        continue
      flashes.value[id] = (flashes.value[id] ?? 0) + 1
      const f = props.fixtures.find(x => x.id === id)
      if (f)
        announcement.value = `Goal! ${f.home.name} ${f.homeScore ?? 0}, ${f.away.name} ${f.awayScore ?? 0}`
    }
  },
)

function statusLabel(f: Fixture) {
  if (f.status === 'live')
    return `live, ${f.minute ?? 0}th minute`
  if (f.status === 'halftime')
    return 'half-time'
  if (f.status === 'finished')
    return 'full-time'
  return f.kickoff ? `kick-off ${f.kickoff}` : 'scheduled'
}
function rowLabel(f: Fixture) {
  const started = f.status !== 'scheduled'
  return started
    ? `${f.home.name} ${f.homeScore ?? 0}, ${f.away.name} ${f.awayScore ?? 0}, ${statusLabel(f)}`
    : `${f.home.name} versus ${f.away.name}, ${statusLabel(f)}`
}
const outcome = (f: Fixture, side: 'home' | 'away') => {
  if (f.status !== 'finished')
    return 'none'
  const a = f.homeScore ?? 0
  const b = f.awayScore ?? 0
  if (a === b)
    return 'none'
  return (side === 'home' ? a > b : b > a) ? 'win' : 'loss'
}
const EVENT_NAMES: Record<FixtureEvent['type'], string> = {
  'goal': 'Goal',
  'penalty': 'Penalty goal',
  'own-goal': 'Own goal',
  'yellow': 'Yellow card',
  'red': 'Red card',
  'sub': 'Substitution',
}
const sortedEvents = (f: Fixture) => [...(f.events ?? [])].sort((a, b) => a.minute - b.minute)

function toggle(id: string) {
  expanded.value = expanded.value === id ? null : id
}
</script>

<template>
  <div :class="cn('flex w-full max-w-xl flex-col gap-5', props.class)">
    <section v-for="g in groups" :key="g.title" :aria-labelledby="`${uid}-${g.title}`">
      <div class="mb-2 flex items-baseline justify-between px-1">
        <h3 :id="`${uid}-${g.title}`" class="m-0 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {{ g.title }}
        </h3>
        <span class="text-xs text-muted-foreground">{{ g.fixtures.length }} {{ g.fixtures.length === 1 ? 'match' : 'matches' }}</span>
      </div>

      <ul class="m-0 list-none divide-y overflow-hidden rounded-2xl border bg-card p-0 text-card-foreground shadow-sm">
        <li v-for="f in g.fixtures" :key="f.id" class="relative">
          <!-- Goal flash -->
          <AnimatePresence>
            <motion.span
              v-if="flashes[f.id] && !reduced"
              :key="flashes[f.id]"
              aria-hidden="true"
              class="pointer-events-none absolute inset-0 bg-brand/20"
              :initial="{ opacity: 1 }"
              :animate="{ opacity: 0 }"
              :transition="{ duration: 1.6, ease: 'easeOut' }"
            />
          </AnimatePresence>

          <button
            :id="`${uid}-${f.id}-row`"
            type="button"
            :aria-expanded="expanded === f.id"
            :aria-controls="`${uid}-${f.id}-panel`"
            :aria-label="rowLabel(f)"
            class="relative grid w-full grid-cols-[2.75rem_1fr_1rem] items-center gap-3 px-3 py-3 text-left text-sm outline-none transition-colors hover:bg-muted/50 focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/50 sm:grid-cols-[3.5rem_1fr_auto_1fr_1rem] sm:px-4"
            @click="toggle(f.id)"
          >
            <!-- Status -->
            <span class="flex items-center gap-1.5 text-xs font-medium tabular-nums">
              <template v-if="f.status === 'live'">
                <span class="relative flex size-2 shrink-0">
                  <span class="absolute inset-0 rounded-full bg-destructive opacity-70 motion-safe:animate-ping motion-reduce:hidden" />
                  <span class="relative size-2 rounded-full bg-destructive" />
                </span>
                <span class="flex items-baseline">
                  <RollingNumber :value="f.minute ?? 0" />
                  <span class="motion-safe:animate-pulse">'</span>
                </span>
              </template>
              <span v-else-if="f.status === 'halftime'" class="rounded bg-muted px-1.5 py-0.5">HT</span>
              <span v-else-if="f.status === 'finished'" class="text-muted-foreground">FT</span>
              <span v-else class="text-muted-foreground">{{ f.kickoff ?? 'TBD' }}</span>
            </span>

            <!-- Narrow screens: one line per team -->
            <span class="flex min-w-0 flex-col gap-1.5 sm:hidden">
              <span v-for="side in (['home', 'away'] as const)" :key="side" class="flex min-w-0 items-center gap-2">
                <FixtureCrest :team="f[side]" />
                <span :class="cn('flex-1 truncate', outcome(f, side) === 'loss' && 'text-muted-foreground', outcome(f, side) === 'win' && 'font-semibold')">{{ f[side].name }}</span>
                <RollingNumber
                  v-if="f.status !== 'scheduled'"
                  :value="(side === 'home' ? f.homeScore : f.awayScore) ?? 0"
                  :class="cn('font-semibold', outcome(f, side) === 'loss' && 'text-muted-foreground')"
                />
              </span>
            </span>

            <!-- Home -->
            <span class="hidden min-w-0 items-center justify-end gap-2 sm:flex">
              <span
                :class="cn('truncate text-right', outcome(f, 'home') === 'loss' && 'text-muted-foreground', outcome(f, 'home') === 'win' && 'font-semibold')"
              >{{ f.home.name }}</span>
              <FixtureCrest :team="f.home" />
            </span>

            <!-- Score -->
            <span
              :class="cn(
                'hidden min-w-14 items-center justify-center gap-1.5 rounded-lg px-2 py-1 text-base font-semibold sm:flex',
                f.status === 'live' || f.status === 'halftime' ? 'bg-muted' : '',
              )"
            >
              <template v-if="f.status !== 'scheduled'">
                <RollingNumber :value="f.homeScore ?? 0" />
                <span class="text-muted-foreground">–</span>
                <RollingNumber :value="f.awayScore ?? 0" />
              </template>
              <span v-else class="text-xs font-medium text-muted-foreground">vs</span>
            </span>

            <!-- Away -->
            <span class="hidden min-w-0 items-center gap-2 sm:flex">
              <FixtureCrest :team="f.away" />
              <span
                :class="cn('truncate', outcome(f, 'away') === 'loss' && 'text-muted-foreground', outcome(f, 'away') === 'win' && 'font-semibold')"
              >{{ f.away.name }}</span>
            </span>

            <motion.svg
              class="size-4 text-muted-foreground"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
              :animate="{ rotate: expanded === f.id ? 180 : 0 }"
              :transition="spring"
            >
              <path d="m6 9 6 6 6-6" />
            </motion.svg>
          </button>

          <!-- Events timeline -->
          <AnimatePresence :initial="false">
            <motion.div
              v-if="expanded === f.id"
              :id="`${uid}-${f.id}-panel`"
              role="region"
              :aria-labelledby="`${uid}-${f.id}-row`"
              class="overflow-hidden"
              :initial="{ height: 0, opacity: 0 }"
              :animate="{ height: 'auto', opacity: 1 }"
              :exit="{ height: 0, opacity: 0 }"
              :transition="reduced ? { duration: 0 } : spring"
            >
              <div class="border-t border-dashed px-4 pb-4 pt-3">
                <p v-if="f.venue" class="m-0 mb-3 text-center text-xs text-muted-foreground">
                  {{ f.venue }}<template v-if="f.kickoff">
                    · {{ f.kickoff }}
                  </template>
                </p>
                <ol v-if="sortedEvents(f).length" class="relative m-0 flex list-none flex-col gap-2 p-0">
                  <span aria-hidden="true" class="absolute inset-y-1 left-1/2 w-px -translate-x-1/2 bg-border" />
                  <motion.li
                    v-for="(e, i) in sortedEvents(f)"
                    :key="e.id ?? `${e.minute}-${e.player}-${e.type}`"
                    class="relative grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-xs"
                    :initial="{ opacity: 0, x: e.team === 'home' ? -12 : 12 }"
                    :animate="{ opacity: 1, x: 0, transition: { ...spring, delay: reduced ? 0 : 0.06 + i * 0.05 } }"
                  >
                    <span class="relative z-10 col-start-2 row-start-1 min-w-9 rounded-full border bg-card px-1.5 py-0.5 text-center font-semibold tabular-nums">
                      {{ e.minute }}'
                    </span>
                    <span
                      :class="cn(
                        'row-start-1 flex min-w-0 items-center gap-2',
                        e.team === 'home' ? 'col-start-1 flex-row-reverse text-right' : 'col-start-3',
                      )"
                    >
                      <span class="flex size-4 shrink-0 items-center justify-center" aria-hidden="true">
                        <span v-if="e.type === 'yellow'" class="h-3.5 w-2.5 rounded-[2px] bg-chart-4" />
                        <span v-else-if="e.type === 'red'" class="h-3.5 w-2.5 rounded-[2px] bg-destructive" />
                        <svg v-else-if="e.type === 'sub'" class="size-3.5 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 4v16M3 8l4-4 4 4M17 20V4M21 16l-4 4-4-4" /></svg>
                        <svg v-else class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9" /><path d="m12 7 4 3-1.5 4.5h-5L8 10z" fill="currentColor" /></svg>
                      </span>
                      <span class="min-w-0">
                        <span class="sr-only">{{ EVENT_NAMES[e.type] }}, {{ e.team === 'home' ? f.home.name : f.away.name }}:</span>
                        <span class="block truncate font-medium">{{ e.player }}<template v-if="e.type === 'penalty'"> (pen)</template><template v-if="e.type === 'own-goal'"> (og)</template></span>
                        <span v-if="e.detail" class="block truncate text-muted-foreground">{{ e.detail }}</span>
                      </span>
                    </span>
                  </motion.li>
                </ol>
                <p v-else class="m-0 text-center text-xs text-muted-foreground">
                  {{ f.status === 'scheduled' ? 'No events yet — check back at kick-off.' : 'No events yet.' }}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </li>
      </ul>
    </section>
    <p class="sr-only" role="status" aria-live="polite">
      {{ announcement }}
    </p>
  </div>
</template>
