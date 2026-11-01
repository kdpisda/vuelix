import { reactive } from 'vue'

export type ToastVariant = 'default' | 'success' | 'error' | 'info'

export interface Toast {
  id: number
  title: string
  description?: string
  variant: ToastVariant
  duration: number
}

export interface ToastOptions {
  description?: string
  variant?: ToastVariant
  /** Milliseconds before auto-dismiss. `0` keeps it open. */
  duration?: number
}

const state = reactive<{ toasts: Toast[] }>({ toasts: [] })
const timers = new Map<number, ReturnType<typeof setTimeout>>()
let nextId = 1

export function dismissToast(id: number) {
  clearTimeout(timers.get(id))
  timers.delete(id)
  const i = state.toasts.findIndex(t => t.id === id)
  if (i !== -1)
    state.toasts.splice(i, 1)
}

function schedule(t: Toast) {
  if (t.duration > 0)
    timers.set(t.id, setTimeout(() => dismissToast(t.id), t.duration))
}

/** Pause every auto-dismiss timer (e.g. while the stack is hovered). */
export function pauseToasts() {
  timers.forEach(clearTimeout)
  timers.clear()
}

export function resumeToasts() {
  state.toasts.forEach(schedule)
}

export function toast(title: string, options: ToastOptions = {}) {
  const t: Toast = {
    id: nextId++,
    title,
    description: options.description,
    variant: options.variant ?? 'default',
    duration: options.duration ?? 4000,
  }
  state.toasts.push(t)
  schedule(t)
  return t.id
}

toast.success = (title: string, o: Omit<ToastOptions, 'variant'> = {}) => toast(title, { ...o, variant: 'success' })
toast.error = (title: string, o: Omit<ToastOptions, 'variant'> = {}) => toast(title, { ...o, variant: 'error' })
toast.info = (title: string, o: Omit<ToastOptions, 'variant'> = {}) => toast(title, { ...o, variant: 'info' })
toast.dismiss = dismissToast

export function useToast() {
  return { toasts: state.toasts, toast, dismiss: dismissToast }
}
