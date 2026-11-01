import type { Component } from 'vue'

export type SwipeActionTone = 'default' | 'brand' | 'muted' | 'destructive'

export interface SwipeAction {
  /** Emitted back to you with the `action` event. */
  id: string
  label: string
  /** Any component, e.g. a lucide icon. */
  icon?: Component
  tone?: SwipeActionTone
  /** Extra classes for the action surface (e.g. a custom background). */
  class?: string
}

export type SwipeSide = 'leading' | 'trailing'
