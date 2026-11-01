# Motion Patterns

A few patterns cover almost every component in vuelix. They're worth knowing when you customise components or build your own.

## 1. Springs, not durations

Interactive motion uses springs, so it responds to interruption naturally: click a switch twice quickly and the thumb reverses mid-flight instead of restarting.

```vue
<motion.div :animate="{ x: on ? 20 : 0 }" :transition="{ type: 'spring', stiffness: 700, damping: 32 }" />
```

Use durations only for things that aren't interactive: fades, draw-ins, loops.

## 2. Shared layout (`layout-id`)

When two elements share a `layout-id`, Motion measures both and animates between them. This drives the tab indicator and the morphing dialog.

```vue
<motion.span v-if="active" layout-id="tab-indicator" />
```

Use a unique id per component instance (`useId()`) so separate components on one page don't swap indicators.

## 3. Presence (`AnimatePresence`)

Elements leaving the DOM get an `exit` animation. `mode="popLayout"` lets the incoming element take the space right away, which makes label swaps feel instant.

```vue
<AnimatePresence mode="popLayout">
  <motion.span v-if="loading" key="a" :exit="{ opacity: 0, y: -12 }" />
  <motion.span v-else key="b" :exit="{ opacity: 0, y: -12 }" />
</AnimatePresence>
```

## 4. Motion values for continuous input

Pointer-driven effects (tilt card, dock) never go through Vue reactivity. They write to a `MotionValue`, which updates styles directly without re-rendering:

```ts
const x = useMotionValue(0)
const smooth = useSpring(x, { stiffness: 260, damping: 22 })
const rotate = useTransform(smooth, v => v * 20)
```

## 5. Variants + stagger

Parents orchestrate children through variant names. This is how Text Reveal staggers words:

```vue
<motion.div initial="hidden" while-in-view="visible" :variants="{ visible: { transition: { staggerChildren: 0.06 } } }">
  <motion.span v-for="w in words" :variants="{ hidden: { opacity: 0 }, visible: { opacity: 1 } }">{{ w }}</motion.span>
</motion.div>
```

## Accessibility

- Decorative motion (tilt, glare) checks `useReducedMotion()`.
- Motion never replaces semantics: tabs are `role="tab"`, the switch is `role="switch"`, the dialog traps `Escape` and restores focus.
