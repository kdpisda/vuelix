# vuelix

Animated components for **Vue 3** and **Nuxt**, built on Tailwind CSS v4 and [Motion for Vue](https://motion.dev/docs/vue).

**Docs & live demos → [vuelix.dev](https://vuelix.dev)**

## Install

```bash
npm install vuelix motion-v
```

Add one line to your Tailwind CSS entry (Tailwind v4):

```css
@import "tailwindcss";
@import "vuelix/tailwind.css";
```

That registers the components' class names with Tailwind and adds default theme tokens. If you already use shadcn-vue, your existing theme wins automatically.

## Use

```vue
<script setup lang="ts">
import { SpringButton, toast, ToastStack } from 'vuelix'
</script>

<template>
  <SpringButton @click="toast.success('Saved!')">Save</SpringButton>
  <ToastStack />
</template>
```

Or register everything globally:

```ts
import { Vuelix } from 'vuelix'

app.use(Vuelix)                   // <SpringButton />
app.use(Vuelix, { prefix: 'Vx' }) // <VxSpringButton />
```

## Components

Spring Button · Animated Tabs · Spring Switch · Animated Tooltip · Bouncy Accordion · Number Ticker · Text Reveal · Tilt Card · Morphing Dialog · Dock · Theme Toggle · Toast Stack · Avatar Group · Sparkline · OTP Input

## Prefer owning the code?

Every component is also available as copy-paste source through the shadcn-vue CLI:

```bash
npx shadcn-vue@latest add https://vuelix.dev/r/dock.json
```

## License

MIT
