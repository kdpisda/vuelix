import type { InjectionKey, Ref } from 'vue'

export interface CitationSource {
  title: string
  url?: string
  /** A short excerpt shown in the hover card. */
  snippet?: string
  /** Favicon URL. Falls back to the domain's first letter. */
  favicon?: string
  /** Display domain. Derived from `url` when omitted. */
  domain?: string
}

export interface CitationsContext {
  sources: Ref<CitationSource[]>
  /** 1-based number of the citation currently hovered / focused, in chips or the list. */
  active: Ref<number | null>
  uid: string
}

export const CITATIONS_KEY: InjectionKey<CitationsContext> = Symbol('vx-citations')

export function sourceDomain(source: CitationSource) {
  if (source.domain)
    return source.domain
  try {
    return new URL(source.url ?? '').hostname.replace(/^www\./, '')
  }
  catch {
    return ''
  }
}
