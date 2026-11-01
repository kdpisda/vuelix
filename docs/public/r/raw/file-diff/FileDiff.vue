<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { FileDiffFile, FileDiffHunk, FileDiffLine } from './parse-diff'
import { AnimatePresence, motion, useReducedMotion } from 'motion-v'
import { computed, nextTick, reactive, ref, useId } from 'vue'
import { cn } from '@/lib/utils'
import { parseUnifiedDiff } from './parse-diff'

export type FileDiffDecision = 'accepted' | 'rejected'

const props = withDefaults(defineProps<{
  /** A unified diff (`git diff` output). Several files are shown one after another. */
  diff: string
  /** Show Accept / Reject on every hunk. */
  reviewable?: boolean
  /** Unchanged lines kept visible around each change; longer unchanged runs fold away. */
  contextLines?: number
  class?: HTMLAttributes['class']
}>(), {
  reviewable: false,
  contextLines: 3,
})

/** Review state per hunk, keyed `"<fileIndex>:<hunkIndex>"`. */
const decisions = defineModel<Record<string, FileDiffDecision>>('decisions', { default: () => ({}) })
const emit = defineEmits<{
  accept: [hunk: FileDiffHunk, file: FileDiffFile]
  reject: [hunk: FileDiffHunk, file: FileDiffFile]
}>()

const uid = useId()
const reduced = useReducedMotion()
const spring = { type: 'spring', stiffness: 340, damping: 32, mass: 0.8 } as const

const root = ref<HTMLElement>()
const files = computed(() => parseUnifiedDiff(props.diff))
const closedFiles = reactive(new Set<number>())
const openGaps = reactive(new Set<string>())

type Row =
  | { kind: 'line', line: FileDiffLine }
  | { kind: 'gap', id: string, lines: FileDiffLine[] }

/** Fold long runs of unchanged lines, keeping `contextLines` next to every change. */
function rowsFor(hunk: FileDiffHunk, key: string): Row[] {
  const rows: Row[] = []
  const lines = hunk.lines
  const keep = props.contextLines
  let i = 0
  while (i < lines.length) {
    if (lines[i]!.type !== 'context') {
      rows.push({ kind: 'line', line: lines[i]! })
      i++
      continue
    }
    let j = i
    while (j < lines.length && lines[j]!.type === 'context') j++
    const run = lines.slice(i, j)
    const head = i === 0 ? 0 : keep
    const tail = j === lines.length ? 0 : keep
    if (run.length - head - tail >= 4) {
      run.slice(0, head).forEach(line => rows.push({ kind: 'line', line }))
      rows.push({ kind: 'gap', id: `${key}:${i}`, lines: run.slice(head, run.length - tail) })
      run.slice(run.length - tail).forEach(line => rows.push({ kind: 'line', line }))
    }
    else {
      run.forEach(line => rows.push({ kind: 'line', line }))
    }
    i = j
  }
  return rows
}

function toggleSet<T>(set: Set<T>, v: T) {
  if (set.has(v))
    set.delete(v)
  else set.add(v)
}

/** The clicked button disappears — move focus to its replacement in the same hunk header. */
function refocus(selector: string) {
  nextTick(() => root.value?.querySelector<HTMLElement>(selector)?.focus())
}

function decide(fi: number, hi: number, d: FileDiffDecision) {
  decisions.value = { ...decisions.value, [`${fi}:${hi}`]: d }
  refocus(`[data-undo="${fi}:${hi}"]`)
  const file = files.value[fi]!
  if (d === 'accepted')
    emit('accept', file.hunks[hi]!, file)
  else
    emit('reject', file.hunks[hi]!, file)
}
function undo(fi: number, hi: number) {
  const { [`${fi}:${hi}`]: _, ...rest } = decisions.value
  decisions.value = rest
  refocus(`[data-accept="${fi}:${hi}"]`)
}

/** Five-block change bar, like a code host's diffstat. */
function blocks(f: FileDiffFile) {
  const total = f.additions + f.deletions
  if (!total)
    return Array.from({ length: 5 }, () => 'bg-muted-foreground/20')
  const add = Math.round((f.additions / total) * 5)
  return Array.from({ length: 5 }, (_, i) => (i < add ? 'bg-chart-1' : 'bg-destructive'))
}

const statusBadge = {
  added: 'bg-chart-1/15 text-chart-1',
  deleted: 'bg-destructive/15 text-destructive',
  renamed: 'bg-chart-2/15 text-chart-2',
  modified: '',
} as const

const lineBg = { add: 'bg-chart-1/10', del: 'bg-destructive/10', context: '' } as const
const gutterBg = { add: 'bg-chart-1/15', del: 'bg-destructive/15', context: '' } as const
const markerCls = { add: 'text-chart-1', del: 'text-destructive', context: 'text-transparent' } as const
const srLabel = { add: 'Added: ', del: 'Removed: ', context: '' } as const
</script>

<template>
  <div ref="root" :class="cn('flex w-full flex-col gap-3', props.class)">
    <section
      v-for="(file, fi) in files"
      :key="`${fi}-${file.newPath}`"
      :aria-label="`Changes to ${file.newPath}`"
      class="overflow-hidden rounded-xl border bg-card text-card-foreground shadow-xs"
    >
      <h3 class="m-0 text-base">
        <button
          type="button"
          class="flex w-full items-center gap-2 bg-muted/40 px-3 py-2 text-left outline-none transition-colors hover:bg-muted/70 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-inset"
          :aria-expanded="!closedFiles.has(fi)"
          :aria-controls="`${uid}-file-${fi}`"
          @click="toggleSet(closedFiles, fi)"
        >
          <motion.svg
            class="size-3.5 shrink-0 text-muted-foreground"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.25"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
            :initial="false"
            :animate="{ rotate: closedFiles.has(fi) ? -90 : 0 }"
            :transition="spring"
          >
            <path d="m6 9 6 6 6-6" />
          </motion.svg>
          <span class="min-w-0 flex-1 truncate font-mono text-xs">
            <template v-if="file.status === 'renamed'">
              <span class="text-muted-foreground">{{ file.oldPath }} → </span>
            </template>{{ file.newPath }}
          </span>
          <span v-if="file.status !== 'modified'" :class="cn('rounded-md px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide', statusBadge[file.status])">
            {{ file.status }}
          </span>
          <span class="font-mono text-xs tabular-nums">
            <span class="text-chart-1">+{{ file.additions }}</span>
            <span class="ml-1.5 text-destructive">−{{ file.deletions }}</span>
          </span>
          <span class="flex gap-0.5" aria-hidden="true">
            <span v-for="(c, i) in blocks(file)" :key="i" :class="cn('size-2 rounded-[2px]', c)" />
          </span>
        </button>
      </h3>

      <AnimatePresence :initial="false">
        <motion.div
          v-if="!closedFiles.has(fi)"
          :id="`${uid}-file-${fi}`"
          class="overflow-hidden"
          :initial="{ height: 0 }"
          :animate="{ height: 'auto' }"
          :exit="{ height: 0 }"
          :transition="reduced ? { duration: 0 } : spring"
        >
          <p v-if="file.binary || !file.hunks.length" class="m-0 border-t px-4 py-3 text-xs text-muted-foreground">
            {{ file.binary ? 'Binary file not shown.' : 'No content changes.' }}
          </p>

          <div v-for="(hunk, hi) in file.hunks" :key="hi" class="border-t">
            <!-- hunk header -->
            <div class="flex min-h-9 items-center gap-2 bg-chart-2/5 py-1 pl-3 pr-1.5 font-mono text-[11px] text-muted-foreground">
              <span class="min-w-0 flex-1 truncate">
                <span class="text-chart-2">@@ -{{ hunk.oldStart }},{{ hunk.oldLines }} +{{ hunk.newStart }},{{ hunk.newLines }} @@</span>
                <span v-if="hunk.section" class="ml-2">{{ hunk.section }}</span>
              </span>

              <template v-if="props.reviewable">
                <AnimatePresence mode="popLayout" :initial="false">
                  <motion.span
                    v-if="decisions[`${fi}:${hi}`]"
                    :key="`decided-${decisions[`${fi}:${hi}`]}`"
                    class="flex items-center gap-1 font-sans"
                    :initial="{ opacity: 0, scale: 0.8 }"
                    :animate="{ opacity: 1, scale: 1 }"
                    :exit="{ opacity: 0, scale: 0.8 }"
                    :transition="spring"
                  >
                    <span
                      :class="cn(
                        'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium',
                        decisions[`${fi}:${hi}`] === 'accepted' ? 'bg-chart-1/15 text-chart-1' : 'bg-destructive/15 text-destructive',
                      )"
                    >
                      {{ decisions[`${fi}:${hi}`] === 'accepted' ? 'Accepted' : 'Rejected' }}
                    </span>
                    <button
                      type="button"
                      class="rounded-md px-1.5 py-1 text-[11px] font-medium text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
                      :data-undo="`${fi}:${hi}`"
                      :aria-label="`Undo decision on hunk ${hi + 1}`"
                      @click="undo(fi, hi)"
                    >
                      Undo
                    </button>
                  </motion.span>
                  <motion.span
                    v-else
                    key="actions"
                    class="flex items-center gap-1 font-sans"
                    :initial="{ opacity: 0, scale: 0.8 }"
                    :animate="{ opacity: 1, scale: 1 }"
                    :exit="{ opacity: 0, scale: 0.8 }"
                    :transition="spring"
                  >
                    <button
                      type="button"
                      class="inline-flex h-7 items-center gap-1 rounded-md px-2 text-[11px] font-medium text-muted-foreground outline-none transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:ring-[3px] focus-visible:ring-ring/50"
                      :aria-label="`Reject hunk ${hi + 1} in ${file.newPath}`"
                      @click="decide(fi, hi, 'rejected')"
                    >
                      <svg class="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
                      Reject
                    </button>
                    <button
                      type="button"
                      class="inline-flex h-7 items-center gap-1 rounded-md bg-primary px-2 text-[11px] font-medium text-primary-foreground outline-none transition-opacity hover:opacity-90 focus-visible:ring-[3px] focus-visible:ring-ring/50"
                      :data-accept="`${fi}:${hi}`"
                      :aria-label="`Accept hunk ${hi + 1} in ${file.newPath}`"
                      @click="decide(fi, hi, 'accepted')"
                    >
                      <svg class="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5 10 17 19 7" /></svg>
                      Accept
                    </button>
                  </motion.span>
                </AnimatePresence>
              </template>
            </div>

            <!-- hunk body: folds away once a decision is made -->
            <AnimatePresence :initial="false">
              <motion.div
                v-if="!decisions[`${fi}:${hi}`]"
                class="overflow-hidden"
                :initial="{ height: 0, opacity: 0 }"
                :animate="{ height: 'auto', opacity: 1 }"
                :exit="{ height: 0, opacity: 0 }"
                :transition="reduced ? { duration: 0 } : spring"
              >
                <div class="overflow-x-auto">
                  <div class="w-max min-w-full font-mono text-xs leading-5">
                    <template v-for="(row, ri) in rowsFor(hunk, `${fi}:${hi}`)" :key="row.kind === 'gap' ? row.id : ri">
                      <template v-if="row.kind === 'gap'">
                        <button
                          v-if="!openGaps.has(row.id)"
                          type="button"
                          class="flex w-full items-center gap-2 bg-muted/50 py-1 pl-3 text-left font-sans text-[11px] text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-inset"
                          :aria-expanded="false"
                          @click="openGaps.add(row.id)"
                        >
                          <svg class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m7 15 5 5 5-5" /><path d="m7 9 5-5 5 5" /></svg>
                          Show {{ row.lines.length }} unchanged lines
                        </button>
                        <motion.div
                          v-else
                          class="overflow-hidden"
                          :initial="{ height: 0 }"
                          :animate="{ height: 'auto' }"
                          :transition="reduced ? { duration: 0 } : spring"
                        >
                          <div v-for="(line, li) in row.lines" :key="li" class="flex">
                            <span class="w-11 shrink-0 select-none pr-2 text-right text-muted-foreground/60" aria-hidden="true">{{ line.oldLine }}</span>
                            <span class="w-11 shrink-0 select-none pr-2 text-right text-muted-foreground/60" aria-hidden="true">{{ line.newLine }}</span>
                            <span class="w-5 shrink-0 select-none text-center text-transparent" aria-hidden="true"> </span>
                            <span class="whitespace-pre pr-6 text-foreground/80">{{ line.content || ' ' }}</span>
                          </div>
                        </motion.div>
                      </template>
                      <div v-else :class="cn('flex', lineBg[row.line.type])">
                        <span :class="cn('w-11 shrink-0 select-none pr-2 text-right text-muted-foreground/60', gutterBg[row.line.type])" aria-hidden="true">{{ row.line.oldLine }}</span>
                        <span :class="cn('w-11 shrink-0 select-none pr-2 text-right text-muted-foreground/60', gutterBg[row.line.type])" aria-hidden="true">{{ row.line.newLine }}</span>
                        <span :class="cn('w-5 shrink-0 select-none text-center', markerCls[row.line.type])" aria-hidden="true">{{ row.line.type === 'add' ? '+' : row.line.type === 'del' ? '−' : ' ' }}</span>
                        <span class="whitespace-pre pr-6 text-foreground/90"><span v-if="srLabel[row.line.type]" class="sr-only">{{ srLabel[row.line.type] }}</span>{{ row.line.content || ' ' }}<span v-if="row.line.noNewline" class="ml-3 font-sans text-[10px] text-muted-foreground">no newline at end of file</span></span>
                      </div>
                    </template>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </AnimatePresence>
    </section>
  </div>
</template>
