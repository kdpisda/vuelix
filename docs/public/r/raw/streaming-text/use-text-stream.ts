import type { MaybeRefOrGetter, Ref } from 'vue'
import { getCurrentInstance, getCurrentScope, onMounted, onScopeDispose, ref, toValue } from 'vue'

export interface TextStreamOptions {
  /** Average milliseconds between chunks (each gap is jittered ±50%). */
  interval?: number
  /** Milliseconds to wait before the first chunk — the "time to first token". */
  delay?: number
  /** Start streaming as soon as the calling component mounts. */
  autoStart?: boolean
}

/**
 * Cuts text into chunks that look like LLM tokens: one to three words at a time,
 * with long words split into 3–6 character pieces.
 */
export function chunkText(text: string): string[] {
  const parts = text.match(/\s+|[^\s]+/g) ?? []
  const tokens: string[] = []
  for (const part of parts) {
    if (part.length <= 7 || /^\s+$/.test(part)) {
      tokens.push(part)
      continue
    }
    for (let i = 0; i < part.length;) {
      const size = 3 + Math.floor(Math.random() * 4)
      tokens.push(part.slice(i, i + size))
      i += size
    }
  }
  const chunks: string[] = []
  for (let i = 0; i < tokens.length;) {
    const take = 1 + Math.floor(Math.random() * 3)
    chunks.push(tokens.slice(i, i + take).join(''))
    i += take
  }
  return chunks
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
const jitter = (ms: number) => ms * (0.5 + Math.random())

/** An async iterable that yields `text` in token-like chunks — handy for the `stream` prop and tests. */
export async function* createTextStream(text: string, options: Pick<TextStreamOptions, 'interval' | 'delay'> = {}) {
  const { interval = 32, delay = 0 } = options
  if (delay)
    await sleep(delay)
  for (const chunk of chunkText(text)) {
    yield chunk
    await sleep(jitter(interval))
  }
}

/**
 * Simulates a streamed response: `text` grows chunk by chunk after `start()`.
 *
 * ```ts
 * const { text, streaming, start } = useTextStream(answer, { autoStart: true })
 * ```
 */
export function useTextStream(source: MaybeRefOrGetter<string>, options: TextStreamOptions = {}): {
  text: Ref<string>
  streaming: Ref<boolean>
  start: () => void
  stop: () => void
  complete: () => void
} {
  const { interval = 32, delay = 0, autoStart = false } = options
  const text = ref('')
  const streaming = ref(false)
  let timer: ReturnType<typeof setTimeout> | undefined

  function stop() {
    clearTimeout(timer)
    streaming.value = false
  }

  function start() {
    stop()
    text.value = ''
    streaming.value = true
    const chunks = chunkText(toValue(source))
    let i = 0
    const tick = () => {
      if (i >= chunks.length) {
        streaming.value = false
        return
      }
      text.value += chunks[i++]
      timer = setTimeout(tick, jitter(interval))
    }
    timer = setTimeout(tick, delay)
  }

  /** Jump straight to the full text. */
  function complete() {
    stop()
    text.value = toValue(source)
  }

  if (getCurrentScope())
    onScopeDispose(stop)
  if (autoStart && getCurrentInstance())
    onMounted(start)

  return { text, streaming, start, stop, complete }
}
