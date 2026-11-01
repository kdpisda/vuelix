/** Public site origin. */
export const SITE_URL = 'https://vuelix.dev'

/**
 * Where installable registry JSON lives (built into docs/public/r).
 * Override at build time with VITE_REGISTRY_URL, e.g. for preview deployments.
 */
export const REGISTRY_URL: string
  = import.meta.env.VITE_REGISTRY_URL ?? `${SITE_URL}/r`
