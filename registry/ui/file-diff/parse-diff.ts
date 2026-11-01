export type FileDiffLineType = 'context' | 'add' | 'del'

export interface FileDiffLine {
  type: FileDiffLineType
  content: string
  /** Line number in the old file (context / deleted lines). */
  oldLine?: number
  /** Line number in the new file (context / added lines). */
  newLine?: number
  /** Followed by "\ No newline at end of file". */
  noNewline?: boolean
}

export interface FileDiffHunk {
  /** The raw `@@ -a,b +c,d @@` header. */
  header: string
  /** Text after the second `@@` — usually the enclosing function. */
  section: string
  oldStart: number
  oldLines: number
  newStart: number
  newLines: number
  lines: FileDiffLine[]
}

export interface FileDiffFile {
  oldPath: string
  newPath: string
  status: 'modified' | 'added' | 'deleted' | 'renamed'
  additions: number
  deletions: number
  hunks: FileDiffHunk[]
  binary?: boolean
}

const HUNK_RE = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@ ?(.*)$/
const NULL = '/dev/null'

function cleanPath(path: string) {
  const p = path.replace(/\t.*$/, '').trim()
  return p === NULL ? p : p.replace(/^[ab]\//, '')
}

/**
 * Parses a unified diff (`git diff`, `diff -u`) into files → hunks → lines.
 * Works with or without `diff --git` headers and with CRLF line endings.
 */
export function parseUnifiedDiff(diff: string): FileDiffFile[] {
  const files: FileDiffFile[] = []
  let file: FileDiffFile | undefined
  let hunk: FileDiffHunk | undefined
  // Lines still expected in the current hunk — once both reach 0 the hunk is complete,
  // so a following `--- a/…` is a new file header rather than a deleted "-- …" line.
  let oldLeft = 0
  let newLeft = 0
  let oldNo = 0
  let newNo = 0

  const newFile = () => {
    file = { oldPath: '', newPath: '', status: 'modified', additions: 0, deletions: 0, hunks: [] }
    files.push(file)
    hunk = undefined
    oldLeft = newLeft = 0
    return file
  }

  for (const line of diff.replace(/\r\n?/g, '\n').split('\n')) {
    const inHunk = hunk && (oldLeft > 0 || newLeft > 0)

    if (inHunk) {
      const marker = line[0]
      const content = line.slice(1)
      if (marker === '+') {
        hunk!.lines.push({ type: 'add', content, newLine: newNo++ })
        file!.additions++
        newLeft--
      }
      else if (marker === '-') {
        hunk!.lines.push({ type: 'del', content, oldLine: oldNo++ })
        file!.deletions++
        oldLeft--
      }
      else if (marker === '\\') {
        const prev = hunk!.lines[hunk!.lines.length - 1]
        if (prev)
          prev.noNewline = true
      }
      else {
        // ' ' context — some tools strip the space from empty context lines.
        hunk!.lines.push({ type: 'context', content, oldLine: oldNo++, newLine: newNo++ })
        oldLeft--
        newLeft--
      }
      continue
    }

    if (line.startsWith('\\') && hunk) {
      const prev = hunk.lines[hunk.lines.length - 1]
      if (prev)
        prev.noNewline = true
      continue
    }

    if (line.startsWith('diff --git ')) {
      const f = newFile()
      const m = /^diff --git a\/(.+) b\/(.+)$/.exec(line)
      if (m) {
        f.oldPath = m[1]!
        f.newPath = m[2]!
      }
      continue
    }

    if (line.startsWith('--- ')) {
      // Reuse a `diff --git` header that has no hunks yet; otherwise this starts a new file.
      const f = file && !file.hunks.length ? file : newFile()
      f.oldPath = cleanPath(line.slice(4))
      if (f.oldPath === NULL)
        f.status = 'added'
      continue
    }
    if (line.startsWith('+++ ') && file) {
      file.newPath = cleanPath(line.slice(4))
      if (file.newPath === NULL)
        file.status = 'deleted'
      continue
    }

    const h = HUNK_RE.exec(line)
    if (h) {
      const f = file ?? newFile()
      oldNo = Number(h[1])
      newNo = Number(h[3])
      oldLeft = h[2] != null ? Number(h[2]) : 1
      newLeft = h[4] != null ? Number(h[4]) : 1
      hunk = {
        header: line,
        section: (h[5] ?? '').trim(),
        oldStart: oldNo,
        oldLines: oldLeft,
        newStart: newNo,
        newLines: newLeft,
        lines: [],
      }
      f.hunks.push(hunk)
      continue
    }

    if (!file)
      continue
    if (line.startsWith('new file mode'))
      file.status = 'added'
    else if (line.startsWith('deleted file mode'))
      file.status = 'deleted'
    else if (line.startsWith('rename from '))
      file.oldPath = line.slice(12)
    else if (line.startsWith('rename to '))
      file.newPath = line.slice(10)
    else if (line.startsWith('Binary files'))
      file.binary = true
  }

  for (const f of files) {
    if (!f.newPath || f.newPath === NULL)
      f.newPath = f.oldPath
    if (!f.oldPath || f.oldPath === NULL)
      f.oldPath = f.newPath
    if (f.status === 'modified' && f.oldPath !== f.newPath)
      f.status = 'renamed'
  }
  return files
}
