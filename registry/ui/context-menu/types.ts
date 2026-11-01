import type { Component } from 'vue'

/** A selectable row. Give it `children` to turn it into a submenu trigger. */
export interface ContextMenuAction {
  type?: 'item'
  label: string
  /** Optional id passed back through `select`. */
  value?: string
  /** Any component (e.g. a lucide icon). */
  icon?: Component
  /** Display-only shortcut hint, e.g. `⌘C`. */
  shortcut?: string
  disabled?: boolean
  /** Paint the row in the destructive color. */
  destructive?: boolean
  /** Nested entries shown in a submenu that slides out to the side. */
  children?: ContextMenuEntry[]
  onSelect?: () => void
}

export interface ContextMenuSeparator {
  type: 'separator'
}

export interface ContextMenuHeading {
  type: 'label'
  label: string
}

export type ContextMenuEntry = ContextMenuAction | ContextMenuSeparator | ContextMenuHeading

export function isAction(entry: ContextMenuEntry | undefined): entry is ContextMenuAction {
  return !!entry && (entry.type === undefined || entry.type === 'item')
}
