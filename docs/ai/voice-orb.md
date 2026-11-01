---
title: Voice Orb
description: "A living orb for voice assistants that deforms with the audio level as it listens, thinks and speaks."
---

<script setup>
import Demo from '../demos/VoiceOrbDemo.vue'
</script>

# Voice Orb

A living orb for voice assistants that deforms with the audio level as it listens, thinks and speaks.

<ComponentPreview>
  <Demo />
  <template #code>

<<< @/demos/VoiceOrbDemo.vue

  </template>
</ComponentPreview>

## Installation

<InstallTabs name="voice-orb" />

:::: details Manual installation
Install the dependencies:

```bash
npm install motion-v
```

Then copy these files into `components/ui/voice-orb/` (plus [`lib/utils.ts`](/docs/installation#utils) if you don't have it):

::: code-group
<<< @/../registry/ui/voice-orb/VoiceOrb.vue [VoiceOrb.vue]
<<< @/../registry/ui/voice-orb/index.ts [index.ts]
:::
::::

## Usage

```ts
import { VoiceOrb } from '@/components/ui/voice-orb'
```

```vue
<VoiceOrb :state="state" :level="level" />
```

Feed `level` from a Web Audio `AnalyserNode` — the microphone while listening, your TTS output while speaking:

```ts
const analyser = audioContext.createAnalyser()
const data = new Uint8Array(analyser.frequencyBinCount)

function sample() {
  analyser.getByteTimeDomainData(data)
  let peak = 0
  for (const v of data) peak = Math.max(peak, Math.abs(v - 128) / 128)
  level.value = Math.min(1, peak * 1.6)
  requestAnimationFrame(sample)
}
```

The level runs through a spring, so noisy analyser data still moves smoothly. Each state eases
into the next instead of snapping. With `prefers-reduced-motion` the orb stops its idle loop and
only redraws when `state` or `level` change.

## API

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `state` | `'idle' \| 'listening' \| 'thinking' \| 'speaking'` | `'idle'` | Sets the colours, speed and how strongly the orb reacts to `level`. Thinking adds an orbiting arc, listening adds ripples. |
| `level` | `number` | `0` | Audio level from 0 to 1. Only deforms the orb while listening or speaking. |
| `size` | `number` | `176` | Diameter in px. |
| `label` | `string` | per state | Text announced to screen readers when the state changes. |
