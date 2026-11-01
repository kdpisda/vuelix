/**
 * Where installable registry JSON lives. Override at build time with
 * VITE_REGISTRY_URL once the docs are deployed to their own domain.
 */
export const REGISTRY_URL: string
  = import.meta.env.VITE_REGISTRY_URL
    ?? 'https://raw.githubusercontent.com/kdpisda/veulix/main/docs/public/r'
