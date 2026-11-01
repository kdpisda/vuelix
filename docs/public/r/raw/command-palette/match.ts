/**
 * Small "fuzzy-ish" matcher for the command palette.
 *
 * - A contiguous substring wins (bonus at the start of the text or of a word).
 * - Otherwise every query character must appear in order (a subsequence);
 *   consecutive characters and word starts score higher, gaps score lower.
 *
 * Returns the score and the matched character indices (for highlighting),
 * or `null` when the text doesn't match.
 */
export interface CommandMatch {
  score: number
  indices: number[]
}

const BOUNDARY = /[\s\-_/.:]/

export function matchCommand(query: string, text: string): CommandMatch | null {
  const q = query.trim().toLowerCase()
  if (!q)
    return { score: 0, indices: [] }
  const t = text.toLowerCase()

  const at = t.indexOf(q)
  if (at !== -1) {
    const wordStart = at === 0 || BOUNDARY.test(t[at - 1]!)
    return {
      score: 100 + (at === 0 ? 40 : 0) + (wordStart ? 25 : 0) - at,
      indices: Array.from({ length: q.length }, (_, i) => at + i),
    }
  }

  const indices: number[] = []
  let score = 0
  let from = 0
  for (const ch of q) {
    if (ch === ' ')
      continue
    const found = t.indexOf(ch, from)
    if (found === -1)
      return null
    const prev = indices.at(-1)
    if (prev !== undefined && found === prev + 1)
      score += 6
    else if (found === 0 || BOUNDARY.test(t[found - 1]!))
      score += 4
    else
      score -= Math.min(found - from, 6) * 0.5
    indices.push(found)
    from = found + 1
  }
  return { score, indices }
}

/** Splits `text` into plain / matched runs for rendering. */
export function highlightSegments(text: string, indices: number[]) {
  const hit = new Set(indices)
  const out: { text: string, match: boolean }[] = []
  for (let i = 0; i < text.length; i++) {
    const match = hit.has(i)
    const last = out.at(-1)
    if (last && last.match === match)
      last.text += text[i]
    else
      out.push({ text: text[i]!, match })
  }
  return out
}
