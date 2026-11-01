export { default as Stepper } from './Stepper.vue'

export interface StepperStep {
  title: string
  description?: string
  /** Never clickable, even when completed. */
  disabled?: boolean
}
