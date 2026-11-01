import type { MotionValue } from 'motion-v'
import type { InjectionKey } from 'vue'

export interface DockContext {
  mouseX: MotionValue<number>
  baseSize: number
  magnification: number
  distance: number
}

export const DOCK_KEY: InjectionKey<DockContext> = Symbol('VuelixDock')
