---
title: Match Fixtures
description: "A fixtures and results list with live minutes, rolling scores, goal flashes and an expandable events timeline."
---

<script setup>
import Demo from '../demos/MatchFixturesDemo.vue'
</script>

# Match Fixtures

A fixtures and results list with live minutes, rolling scores, goal flashes and an expandable events timeline.

<ComponentPreview>
  <Demo />
  <template #code>

<<< @/demos/MatchFixturesDemo.vue

  </template>
</ComponentPreview>

## Installation

<InstallTabs name="match-fixtures" />

:::: details Manual installation
Install the dependencies:

```bash
npm install motion-v
```

Then copy these files into `components/ui/match-fixtures/` (plus [`lib/utils.ts`](/docs/installation#utils) if you don't have it):

::: code-group
<<< @/../registry/ui/match-fixtures/MatchFixtures.vue [MatchFixtures.vue]
<<< @/../registry/ui/match-fixtures/FixtureCrest.vue [FixtureCrest.vue]
<<< @/../registry/ui/match-fixtures/RollingNumber.vue [RollingNumber.vue]
<<< @/../registry/ui/match-fixtures/index.ts [index.ts]
:::
::::

## Usage

```ts
import { type Fixture, MatchFixtures } from '@/components/ui/match-fixtures'
```

```vue
<MatchFixtures
  v-model:expanded="expanded"
  :fixtures="[{
    id: 'm1',
    group: 'Today',
    home: { name: 'Harbour City', short: 'HC' },
    away: { name: 'Northgate' },
    status: 'live',
    minute: 63,
    homeScore: 1,
    awayScore: 1,
    events: [{ minute: 18, type: 'goal', team: 'home', player: 'L. Okafor' }],
  }]"
/>
```

Fixtures are grouped by their `group` string, in the order they first appear. Update `minute`,
scores and `events` from your live feed: minutes and scores roll digit by digit, a changed score
flashes its row and is announced to screen readers, and the open timeline staggers new events in.

## API

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `fixtures` | `Fixture[]` | — | See below. |
| `v-model:expanded` | `string \| null` | `null` | Id of the fixture whose timeline is open. |

`Fixture`: `{ id, group, home, away, status, homeScore?, awayScore?, minute?, kickoff?, venue?, events? }`
where `status` is `'scheduled' | 'live' | 'halftime' | 'finished'`.

`FixtureTeam`: `{ name, short?, color? }` — `short` is the crest text (defaults to the first three
letters), `color` any CSS color (defaults to the chart palette).

`FixtureEvent`: `{ id?, minute, type, team: 'home' | 'away', player, detail? }` where `type` is
`'goal' | 'penalty' | 'own-goal' | 'yellow' | 'red' | 'sub'`.
