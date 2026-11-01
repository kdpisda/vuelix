# Theming

veulix uses the **same CSS variable names as shadcn-vue**. If your project already has a shadcn-vue theme, components pick it up automatically: there's nothing to configure.

## Tokens

| Token | Used for |
| --- | --- |
| `--background` / `--foreground` | Page surface and text |
| `--card` / `--card-foreground` | Cards, accordions, dialogs |
| `--popover` / `--popover-foreground` | Toasts, dock labels |
| `--primary` / `--primary-foreground` | Primary buttons, switch track |
| `--muted` / `--muted-foreground` | Tab rails, secondary text |
| `--border`, `--input`, `--ring` | Borders, inputs, focus rings |
| `--destructive` | Errors, invalid states |
| `--brand` | Optional accent (`variant="brand"`, sparklines) |

`--brand` is the only token shadcn-vue doesn't define. Add it if you want the accent:

```css
:root { --brand: oklch(0.72 0.17 162); }
.dark { --brand: oklch(0.78 0.16 162); }

@theme inline {
  --color-brand: var(--brand);
}
```

## Dark mode

Components rely on Tailwind's `dark:` variant and the token values above. Toggle a `.dark` class on `<html>` (or use the [Theme Toggle](/components/theme-toggle)) and make sure Tailwind knows about it:

```css
@custom-variant dark (&:where(.dark, .dark *));
```

## Changing the motion

Every component keeps its spring config at the top of `<script setup>`:

```ts
const spring = { type: 'spring', stiffness: 500, damping: 30, mass: 0.6 } as const
```

Raise `stiffness` for snappier motion, raise `damping` for less bounce. To slow down or disable animation globally, wrap your app in Motion's `<MotionConfig>`:

```vue
<MotionConfig reduced-motion="user">
  <RouterView />
</MotionConfig>
```
