// A deliberately tiny Markdown subset for streamed AI answers: paragraphs, `#` headings,
// `-` / `1.` lists, **bold** and `code`. Every inline remembers its offset in the source
// string so the renderer can tell which characters arrived in which chunk.
//
// Unclosed markers (`**bol` mid-stream) are rendered optimistically as if they were closed,
// so text doesn't flash from plain to bold when the closing marker arrives.

export interface StreamInline {
  kind: 'text' | 'strong' | 'code'
  /** Offset of the first visible character in the source string. */
  start: number
  text: string
}

export interface StreamRow {
  key: string
  inlines: StreamInline[]
}

export interface StreamBlock {
  key: string
  type: 'p' | 'h' | 'ul' | 'ol' | 'plain'
  level?: number
  /** First number of an ordered list. */
  startNumber?: number
  /** One row for paragraphs / headings, one per item for lists. */
  rows: StreamRow[]
}

function parseInline(line: string, offset: number): StreamInline[] {
  const out: StreamInline[] = []
  let buf = ''
  let bufStart = offset
  const flush = () => {
    if (buf)
      out.push({ kind: 'text', start: bufStart, text: buf })
    buf = ''
  }

  let i = 0
  while (i < line.length) {
    const marker = line.startsWith('**', i) ? '**' : line[i] === '`' ? '`' : ''
    if (!marker) {
      if (!buf)
        bufStart = offset + i
      buf += line[i]
      i++
      continue
    }
    flush()
    const open = i + marker.length
    const close = line.indexOf(marker, open)
    const end = close === -1 ? line.length : close
    const text = line.slice(open, end)
    if (text)
      out.push({ kind: marker === '`' ? 'code' : 'strong', start: offset + open, text })
    i = close === -1 ? line.length : close + marker.length
  }
  flush()
  return out
}

const HEADING = /^(#{1,3})\s+(.*)$/
const BULLET = /^\s*[-*+]\s+(.*)$/
const NUMBERED = /^\s*(\d+)[.)]\s+(.*)$/

export function parseStreamMarkdown(source: string): StreamBlock[] {
  const blocks: StreamBlock[] = []
  let current = null as StreamBlock | null
  let offset = 0

  for (const line of source.split('\n')) {
    const lineStart = offset
    offset += line.length + 1

    if (!line.trim()) {
      current = null
      continue
    }

    const heading = HEADING.exec(line)
    if (heading) {
      const contentStart = lineStart + line.length - heading[2]!.length
      blocks.push({
        key: `h${lineStart}`,
        type: 'h',
        level: heading[1]!.length,
        rows: [{ key: `r${lineStart}`, inlines: parseInline(heading[2]!, contentStart) }],
      })
      current = null
      continue
    }

    const bullet = BULLET.exec(line)
    const numbered = bullet ? null : NUMBERED.exec(line)
    if (bullet || numbered) {
      const type = bullet ? 'ul' : 'ol'
      const content = (bullet ? bullet[1] : numbered![2])!
      const contentStart = lineStart + line.length - content.length
      if (current?.type !== type) {
        current = { key: `${type}${lineStart}`, type, rows: [], startNumber: numbered ? Number(numbered[1]) : undefined }
        blocks.push(current)
      }
      current.rows.push({ key: `r${lineStart}`, inlines: parseInline(content, contentStart) })
      continue
    }

    const indented = /^\s/.test(line)
    const open = current as StreamBlock | null
    if (open && (open.type === 'p' || ((open.type === 'ul' || open.type === 'ol') && indented))) {
      // Continuation line: join with a space, like Markdown does.
      const row = open.rows.at(-1)!
      row.inlines.push({ kind: 'text', start: lineStart - 1, text: ' ' })
      const trimmed = line.trimStart()
      row.inlines.push(...parseInline(trimmed, lineStart + line.length - trimmed.length))
      continue
    }

    current = { key: `p${lineStart}`, type: 'p', rows: [{ key: `r${lineStart}`, inlines: parseInline(line, lineStart) }] }
    blocks.push(current)
  }
  return blocks
}

export function plainBlock(source: string): StreamBlock[] {
  return source
    ? [{ key: 'plain', type: 'plain', rows: [{ key: 'r0', inlines: [{ kind: 'text', start: 0, text: source }] }] }]
    : []
}
