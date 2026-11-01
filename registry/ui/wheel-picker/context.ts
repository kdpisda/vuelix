import type { InjectionKey } from 'vue'

export type WheelPickerOption = string | number | { value: string | number, label: string }

export interface WheelPickerGroupContext {
  itemHeight: number
  visibleCount: number
}

/** Provided by <WheelPickerGroup> so several wheels share one selection band. */
export const WHEEL_GROUP_KEY: InjectionKey<WheelPickerGroupContext> = Symbol('vx-wheel-group')
