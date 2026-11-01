---
title: OTP Input
description: One-time-code input with popping digits, a blinking caret and an error shake.
---

<script setup>
import Demo from '../demos/OtpInputDemo.vue'
</script>

# OTP Input

One-time-code input with popping digits, a blinking caret and an error shake.

<ComponentPreview>
  <Demo />
  <template #code>

<<< @/demos/OtpInputDemo.vue

  </template>
</ComponentPreview>

## Installation

<InstallTabs name="otp-input" />

:::: details Manual installation
Install the dependencies:

```bash
npm install motion-v
```

Then copy these files into `components/ui/otp-input/` (plus [`lib/utils.ts`](/docs/installation#utils) if you don't have it):

::: code-group
<<< @/../registry/ui/otp-input/OtpInput.vue [OtpInput.vue]
<<< @/../registry/ui/otp-input/index.ts [index.ts]
:::
::::

## Usage

```ts
import { OtpInput } from '@/components/ui/otp-input'
```

```vue
<OtpInput v-model="code" :group-size="3" @complete="verify" />
```

## API

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `v-model` | `string` | `''` | Current code. |
| `length` | `number` | `6` | Number of slots. |
| `numeric` | `boolean` | `true` | Digits only. |
| `groupSize` | `number` | — | Insert a separator every N slots. |
| `invalid` | `boolean` | `false` | Red ring + shake when it turns true. |
| `@complete` | `(value: string) => void` | — | Fires when every slot is filled. |

Uses a single real `<input>` with `autocomplete="one-time-code"`, so paste and SMS autofill work.
