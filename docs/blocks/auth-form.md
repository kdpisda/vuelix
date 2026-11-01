---
title: Auth Form
description: "Sign-in / sign-up card with a sliding mode switch, floating labels, a live strength meter and a morphing submit."
---

<script setup>
import Demo from '../demos/AuthFormDemo.vue'
</script>

# Auth Form

Sign-in / sign-up card with a sliding mode switch, floating labels, a live strength meter and a morphing submit.

<ComponentPreview>
  <Demo />
  <template #code>

<<< @/demos/AuthFormDemo.vue

  </template>
</ComponentPreview>

## Installation

<InstallTabs name="auth-form" />

:::: details Manual installation
Install the dependencies:

```bash
npm install motion-v
```

Then copy these files into `components/ui/auth-form/` (plus [`lib/utils.ts`](/docs/installation#utils) if you don't have it):

::: code-group
<<< @/../registry/ui/auth-form/AuthForm.vue [AuthForm.vue]
<<< @/../registry/ui/auth-form/AuthField.vue [AuthField.vue]
<<< @/../registry/ui/auth-form/strength.ts [strength.ts]
<<< @/../registry/ui/auth-form/index.ts [index.ts]
:::
::::

## Usage

```ts
import { AuthForm, type AuthFormPayload } from '@/components/ui/auth-form'

async function action({ mode, name, email, password }: AuthFormPayload) {
  const res = await fetch(`/api/auth/${mode}`, { method: 'POST', body: JSON.stringify({ name, email, password }) })
  if (!res.ok)
    throw new Error((await res.json()).message) // shown above the submit button
}
```

```vue
<AuthForm
  v-model:mode="mode"
  :action="action"
  :providers="['google', 'github']"
  @social="signInWith"
  @forgot="openReset"
/>
```

Switching modes slides the tab pill, swaps the heading and animates the card height as the name
field and strength meter come and go. Errors appear once a field is blurred (or on submit) and are
wired up with `aria-invalid` / `aria-describedby`. The strength heuristic is exported as
`passwordStrength()` if you want it elsewhere — or replace it with your own rules.

## API

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `v-model:mode` | `'sign-in' \| 'sign-up'` | `'sign-in'` | Which form is shown. |
| `action` | `(payload) => Promise<unknown>` | — | Async submit. Pending shows a spinner, resolving shows success, a thrown `Error` shows its message. |
| `providers` | `Array<'google' \| 'github' \| { id, label, icon? }>` | `['google', 'github']` | Social buttons. Pass `[]` to hide them. |
| `minStrength` | `number` | `2` | Minimum strength score (1–4) needed to sign up. |

| Event | Payload | Description |
| --- | --- | --- |
| `submit` | `{ mode, name?, email, password }` | The form passed validation. |
| `social` | `(provider: string)` | A social button was pressed. |
| `forgot` | `(email: string)` | "Forgot password?" was pressed. |
