<script setup lang="ts">
import type { Fixture } from '@/ui/match-fixtures'
import { MatchFixtures } from '@/ui/match-fixtures'
import { onBeforeUnmount, onMounted, ref } from 'vue'

const teams = {
  harbour: { name: 'Harbour City', short: 'HC', color: '#0ea5e9' },
  northgate: { name: 'Northgate', short: 'NGT', color: '#ef4444' },
  riverside: { name: 'Riverside', short: 'RIV', color: '#22c55e' },
  ashford: { name: 'Ashford Utd', short: 'ASH', color: '#a855f7' },
  kingsport: { name: 'Kingsport', short: 'KPT', color: '#f59e0b' },
  valemont: { name: 'Valemont', short: 'VAL', color: '#64748b' },
}

const fixtures = ref<Fixture[]>([
  {
    id: 'm1',
    group: 'Today · Matchday 12',
    home: teams.harbour,
    away: teams.northgate,
    status: 'live',
    minute: 63,
    homeScore: 1,
    awayScore: 1,
    venue: 'Quayside Stadium',
    events: [
      { id: 'e1', minute: 18, type: 'goal', team: 'home', player: 'L. Okafor', detail: 'Assist: T. Brandt' },
      { id: 'e2', minute: 34, type: 'yellow', team: 'away', player: 'M. Silva' },
      { id: 'e3', minute: 51, type: 'penalty', team: 'away', player: 'J. Haldorsen' },
      { id: 'e4', minute: 60, type: 'sub', team: 'home', player: 'K. Mensah', detail: 'Off: D. Novak' },
    ],
  },
  {
    id: 'm2',
    group: 'Today · Matchday 12',
    home: teams.riverside,
    away: teams.ashford,
    status: 'scheduled',
    kickoff: '20:45',
    venue: 'Millbank Park',
  },
  {
    id: 'm3',
    group: 'Yesterday',
    home: teams.kingsport,
    away: teams.valemont,
    status: 'finished',
    homeScore: 3,
    awayScore: 0,
    venue: 'The Anchorage',
    events: [
      { id: 'e5', minute: 9, type: 'goal', team: 'home', player: 'A. Reyes' },
      { id: 'e6', minute: 44, type: 'red', team: 'away', player: 'P. Dubois' },
      { id: 'e7', minute: 71, type: 'goal', team: 'home', player: 'A. Reyes', detail: 'Assist: O. Lund' },
      { id: 'e8', minute: 88, type: 'own-goal', team: 'home', player: 'S. Varga' },
    ],
  },
  {
    id: 'm4',
    group: 'Yesterday',
    home: teams.northgate,
    away: teams.riverside,
    status: 'finished',
    homeScore: 1,
    awayScore: 2,
    events: [
      { id: 'e9', minute: 22, type: 'goal', team: 'away', player: 'F. Costa' },
      { id: 'e10', minute: 57, type: 'goal', team: 'home', player: 'M. Silva' },
      { id: 'e11', minute: 90, type: 'goal', team: 'away', player: 'F. Costa' },
    ],
  },
])
const expanded = ref<string | null>('m1')

// Mock live feed: the clock runs fast and someone occasionally scores.
let timer: ReturnType<typeof setInterval> | undefined
let n = 0
function tick() {
  const live = fixtures.value[0]!
  if (live.status !== 'live')
    return
  const minute = Math.min(90, (live.minute ?? 0) + 1)
  const total = (live.homeScore ?? 0) + (live.awayScore ?? 0)
  const scores = minute < 90 && total < 6 && Math.random() < 0.15
  const home = Math.random() < 0.5
  fixtures.value = [
    {
      ...live,
      minute,
      status: minute >= 90 ? 'finished' : 'live',
      homeScore: (live.homeScore ?? 0) + (scores && home ? 1 : 0),
      awayScore: (live.awayScore ?? 0) + (scores && !home ? 1 : 0),
      events: scores
        ? [...(live.events ?? []), { id: `live-${n++}`, minute, type: 'goal', team: home ? 'home' : 'away', player: home ? 'L. Okafor' : 'R. Tanaka' }]
        : live.events,
    },
    ...fixtures.value.slice(1),
  ]
}
onMounted(() => (timer = setInterval(tick, 2000)))
onBeforeUnmount(() => clearInterval(timer))
</script>

<template>
  <MatchFixtures v-model:expanded="expanded" :fixtures="fixtures" />
</template>
