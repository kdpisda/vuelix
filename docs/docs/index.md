# Introduction

**vuelix** is a collection of animated, copy-paste components for **Vue 3** and **Nuxt**, built on [Tailwind CSS](https://tailwindcss.com) and [Motion for Vue](https://motion.dev/docs/vue) (`motion-v`).

It is not a package you install and import from `node_modules`. You pull the **source** of each component into your project with the `shadcn-vue` CLI (or copy it by hand), then change anything you like: styles, springs, markup, behaviour.

## Principles

- **You own the code.** Every component is a plain `.vue` file in your repo. No wrapper APIs, no lock-in.
- **Motion with intent.** Springs instead of durations, layout animations instead of manual measuring, and `prefers-reduced-motion` respected where motion is decorative.
- **Fits your theme.** Components use the same CSS variables as [shadcn-vue](https://shadcn-vue.com) (`--primary`, `--muted`, `--border`, …), so they inherit your existing theme.
- **Accessible by default.** Real buttons, ARIA roles, keyboard support and focus rings.

## Stack

| Layer | Choice |
| --- | --- |
| Framework | Vue 3.5+ / Nuxt 3+ |
| Styling | Tailwind CSS v4 + CSS variables |
| Animation | `motion-v` |
| Distribution | shadcn-vue registry (`shadcn-vue add <url>`) |

## Next steps

- [Install](/docs/installation) your first component.
- Learn how [theming](/docs/theming) works.
- Read the [motion patterns](/docs/motion) the library is built on.
