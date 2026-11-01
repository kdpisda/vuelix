<script setup lang="ts">
import type { Component, HTMLAttributes } from 'vue'
import { AnimatePresence, motion, useReducedMotion } from 'motion-v'
import { computed, onBeforeUnmount, onMounted, reactive, ref, useId, watch } from 'vue'
import { cn } from '@/lib/utils'
import AuthField from './AuthField.vue'
import { passwordStrength } from './strength'

export type AuthFormMode = 'sign-in' | 'sign-up'

export interface AuthFormPayload {
  mode: AuthFormMode
  name?: string
  email: string
  password: string
}

export interface AuthFormProvider {
  id: string
  label: string
  icon?: Component
}

const props = withDefaults(defineProps<{
  /** Social sign-in buttons. `'google'` and `'github'` come with icons. */
  providers?: Array<'google' | 'github' | AuthFormProvider>
  /** Async submit handler. Pending → spinner, resolved → success, thrown Error → message. */
  action?: (payload: AuthFormPayload) => Promise<unknown> | unknown
  /** Minimum strength score (1–4) required to sign up. */
  minStrength?: number
  class?: HTMLAttributes['class']
}>(), {
  providers: () => ['google', 'github'],
  minStrength: 2,
})

const mode = defineModel<AuthFormMode>('mode', { default: 'sign-in' })
const emit = defineEmits<{
  submit: [payload: AuthFormPayload]
  social: [provider: string]
  forgot: [email: string]
}>()

const SPRING = { type: 'spring', stiffness: 420, damping: 36 } as const
const HEIGHT = { type: 'spring', stiffness: 300, damping: 32 } as const
const reduced = useReducedMotion()
const uid = useId()
const ids = {
  tabIn: `vx-auth-tab-in-${uid}`,
  tabUp: `vx-auth-tab-up-${uid}`,
  panel: `vx-auth-panel-${uid}`,
  meter: `vx-auth-meter-${uid}`,
  pill: `vx-auth-pill-${uid}`,
}

const form = reactive({ name: '', email: '', password: '' })
const touched = reactive({ name: false, email: false, password: false })
const showPassword = ref(false)
const status = ref<'idle' | 'loading' | 'success'>('idle')
const formError = ref('')

const isSignUp = computed(() => mode.value === 'sign-up')
const strength = computed(() => passwordStrength(form.password))

const errors = computed(() => ({
  name: isSignUp.value && !form.name.trim() ? 'Tell us what to call you' : '',
  email: !form.email.trim()
    ? 'Email is required'
    : !/^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/.test(form.email.trim()) ? 'That doesn\'t look like an email address' : '',
  password: !form.password
    ? 'Password is required'
    : isSignUp.value && strength.value.score < props.minStrength ? 'Pick a stronger password' : '',
}))
const visibleError = (field: keyof typeof touched) => (touched[field] ? errors.value[field] : '')

watch(mode, () => {
  touched.name = touched.email = touched.password = false
  status.value = 'idle'
  formError.value = ''
})
watch(form, () => {
  if (status.value === 'success')
    status.value = 'idle'
})

async function submit() {
  touched.email = touched.password = true
  touched.name = isSignUp.value
  if (errors.value.name || errors.value.email || errors.value.password || status.value === 'loading')
    return
  const payload: AuthFormPayload = {
    mode: mode.value,
    email: form.email.trim(),
    password: form.password,
    ...(isSignUp.value ? { name: form.name.trim() } : {}),
  }
  formError.value = ''
  emit('submit', payload)
  if (props.action) {
    status.value = 'loading'
    try {
      await props.action(payload)
    }
    catch (e) {
      status.value = 'idle'
      formError.value = e instanceof Error ? e.message : 'Something went wrong'
      return
    }
  }
  status.value = 'success'
}

function onTabKey(e: KeyboardEvent) {
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key))
    return
  e.preventDefault()
  const next: AuthFormMode = e.key === 'Home' ? 'sign-in' : e.key === 'End' ? 'sign-up' : isSignUp.value ? 'sign-in' : 'sign-up'
  mode.value = next
  ;(document.getElementById(next === 'sign-in' ? ids.tabIn : ids.tabUp) as HTMLElement | null)?.focus()
}

// Animate the panel height as fields come and go.
const inner = ref<HTMLElement>()
const height = ref<number | 'auto'>('auto')
let observer: ResizeObserver | undefined
onMounted(() => {
  if (!inner.value || typeof ResizeObserver === 'undefined')
    return
  observer = new ResizeObserver(([entry]) => (height.value = entry!.borderBoxSize?.[0]?.blockSize ?? entry!.contentRect.height))
  observer.observe(inner.value)
})
onBeforeUnmount(() => observer?.disconnect())

const providerList = computed(() => props.providers.map(p =>
  typeof p === 'string' ? { id: p, label: p === 'google' ? 'Google' : 'GitHub', icon: undefined } : p,
))

const meterColor = computed(() => ['bg-muted', 'bg-destructive', 'bg-chart-4', 'bg-chart-2', 'bg-brand'][strength.value.score])
const meterText = computed(() => ['text-muted-foreground', 'text-destructive', 'text-chart-4', 'text-chart-2', 'text-brand'][strength.value.score])
const requirements = computed(() => [
  { key: 'length', label: '8+ characters', ok: strength.value.checks.length },
  { key: 'mixedCase', label: 'Upper & lower case', ok: strength.value.checks.mixedCase },
  { key: 'number', label: 'A number', ok: strength.value.checks.number },
  { key: 'symbol', label: 'A symbol', ok: strength.value.checks.symbol },
])

const direction = computed(() => (isSignUp.value ? 1 : -1))
</script>

<template>
  <div :class="cn('w-full max-w-sm rounded-2xl border bg-card p-6 text-card-foreground shadow-sm', props.class)">
    <div class="relative h-14 overflow-hidden text-center">
      <AnimatePresence :initial="false">
        <motion.div
          :key="mode"
          class="absolute inset-x-0 top-0"
          :initial="{ opacity: 0, y: 12 }"
          :animate="{ opacity: 1, y: 0 }"
          :exit="{ opacity: 0, y: -12 }"
          :transition="SPRING"
        >
          <p class="m-0 text-lg font-semibold tracking-tight">
            {{ isSignUp ? 'Create your account' : 'Welcome back' }}
          </p>
          <p class="m-0 mt-0.5 text-sm text-muted-foreground">
            {{ isSignUp ? 'Start your 14-day free trial.' : 'Sign in to continue to your workspace.' }}
          </p>
        </motion.div>
      </AnimatePresence>
    </div>

    <div role="tablist" aria-label="Authentication mode" class="mt-4 grid grid-cols-2 gap-1 rounded-xl bg-muted p-1" @keydown="onTabKey">
      <button
        v-for="tab in ([['sign-in', 'Sign in', ids.tabIn], ['sign-up', 'Create account', ids.tabUp]] as const)"
        :id="tab[2]"
        :key="tab[0]"
        type="button"
        role="tab"
        :aria-selected="mode === tab[0]"
        :aria-controls="ids.panel"
        :tabindex="mode === tab[0] ? 0 : -1"
        :class="cn(
          'relative rounded-lg py-1.5 text-sm font-medium outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50',
          mode === tab[0] ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
        )"
        @click="mode = tab[0]"
      >
        <motion.span
          v-if="mode === tab[0]"
          :layout-id="ids.pill"
          aria-hidden="true"
          class="absolute inset-0 rounded-lg bg-background shadow-sm"
          :transition="SPRING"
        />
        <span class="relative">{{ tab[1] }}</span>
      </button>
    </div>

    <motion.div
      :id="ids.panel"
      role="tabpanel"
      :aria-labelledby="isSignUp ? ids.tabUp : ids.tabIn"
      class="relative -mx-1 overflow-hidden px-1"
      :animate="{ height }"
      :transition="reduced ? { duration: 0 } : HEIGHT"
    >
      <div ref="inner" class="pb-1 pt-5">
        <form novalidate class="space-y-3" @submit.prevent="submit">
          <AnimatePresence :initial="false">
            <motion.div
              v-if="isSignUp"
              key="name"
              class="origin-top"
              :initial="{ opacity: 0, x: 24 * direction }"
              :animate="{ opacity: 1, x: 0 }"
              :exit="{ opacity: 0, x: -24, transition: { duration: 0.12 } }"
              :transition="SPRING"
            >
              <AuthField
                v-model="form.name"
                label="Full name"
                name="name"
                autocomplete="name"
                :error="visibleError('name')"
                @blur="touched.name = true"
              />
            </motion.div>
          </AnimatePresence>

          <AuthField
            v-model="form.email"
            label="Email"
            type="email"
            name="email"
            autocomplete="email"
            :error="visibleError('email')"
            @blur="touched.email = true"
          />

          <AuthField
            v-model="form.password"
            label="Password"
            :type="showPassword ? 'text' : 'password'"
            name="password"
            :autocomplete="isSignUp ? 'new-password' : 'current-password'"
            :error="visibleError('password')"
            :describedby="isSignUp && form.password ? ids.meter : undefined"
            @blur="touched.password = true"
          >
            <template #trailing>
              <button
                type="button"
                :aria-label="showPassword ? 'Hide password' : 'Show password'"
                :aria-pressed="showPassword"
                class="mr-2 inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
                @click="showPassword = !showPassword"
              >
                <AnimatePresence mode="popLayout" :initial="false">
                  <motion.svg
                    v-if="showPassword"
                    key="hide"
                    class="size-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    aria-hidden="true"
                    :initial="{ opacity: 0, scale: 0.5, rotate: -45 }"
                    :animate="{ opacity: 1, scale: 1, rotate: 0 }"
                    :exit="{ opacity: 0, scale: 0.5, rotate: 45 }"
                    :transition="SPRING"
                  >
                    <path d="M10.7 5.1A10.7 10.7 0 0 1 22 12a13.2 13.2 0 0 1-1.7 2.7M14.1 14.2a3 3 0 0 1-4.2-4.2M17.5 17.5A10.7 10.7 0 0 1 2 12a13.2 13.2 0 0 1 4.5-5.5M2 2l20 20" />
                  </motion.svg>
                  <motion.svg
                    v-else
                    key="show"
                    class="size-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    aria-hidden="true"
                    :initial="{ opacity: 0, scale: 0.5, rotate: 45 }"
                    :animate="{ opacity: 1, scale: 1, rotate: 0 }"
                    :exit="{ opacity: 0, scale: 0.5, rotate: -45 }"
                    :transition="SPRING"
                  >
                    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
                    <circle cx="12" cy="12" r="3" />
                  </motion.svg>
                </AnimatePresence>
              </button>
            </template>
          </AuthField>

          <!-- Strength meter (sign-up only) -->
          <AnimatePresence :initial="false">
            <motion.div
              v-if="isSignUp && form.password"
              :id="ids.meter"
              key="meter"
              class="overflow-hidden"
              :initial="{ opacity: 0, height: 0 }"
              :animate="{ opacity: 1, height: 'auto' }"
              :exit="{ opacity: 0, height: 0 }"
              :transition="SPRING"
            >
              <div class="flex items-center gap-3 px-1 pt-0.5">
                <div class="grid flex-1 grid-cols-4 gap-1.5" aria-hidden="true">
                  <span v-for="n in 4" :key="n" class="h-1.5 overflow-hidden rounded-full bg-muted">
                    <motion.span
                      :class="cn('block h-full origin-left rounded-full transition-colors duration-300', meterColor)"
                      :initial="false"
                      :animate="{ scaleX: strength.score >= n ? 1 : 0 }"
                      :transition="{ ...SPRING, delay: strength.score >= n ? (n - 1) * 0.04 : (4 - n) * 0.03 }"
                    />
                  </span>
                </div>
                <span :class="cn('w-12 text-right text-xs font-medium transition-colors', meterText)">
                  {{ strength.label }}
                </span>
              </div>
              <ul class="m-0 mt-2 grid list-none grid-cols-2 gap-x-3 gap-y-1 p-0 px-1">
                <li
                  v-for="req in requirements"
                  :key="req.key"
                  :class="cn('flex items-center gap-1.5 text-xs transition-colors', req.ok ? 'text-foreground' : 'text-muted-foreground')"
                >
                  <span :class="cn('relative flex size-3.5 items-center justify-center rounded-full border transition-colors', req.ok ? 'border-transparent bg-brand text-background' : 'border-border')">
                    <AnimatePresence>
                      <motion.svg
                        v-if="req.ok"
                        class="size-2.5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="4"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        aria-hidden="true"
                        :initial="{ scale: 0 }"
                        :animate="{ scale: 1 }"
                        :exit="{ scale: 0 }"
                        :transition="{ type: 'spring', stiffness: 600, damping: 18 }"
                      >
                        <path d="M20 6 9 17l-5-5" />
                      </motion.svg>
                    </AnimatePresence>
                  </span>
                  {{ req.label }}
                  <span class="sr-only">{{ req.ok ? '(met)' : '(not met)' }}</span>
                </li>
              </ul>
            </motion.div>
          </AnimatePresence>

          <AnimatePresence :initial="false">
            <motion.div
              v-if="!isSignUp"
              key="forgot"
              class="flex justify-end"
              :initial="{ opacity: 0 }"
              :animate="{ opacity: 1 }"
              :exit="{ opacity: 0, transition: { duration: 0.1 } }"
            >
              <button
                type="button"
                class="rounded text-xs font-medium text-muted-foreground underline-offset-4 outline-none hover:text-foreground hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
                @click="emit('forgot', form.email)"
              >
                Forgot password?
              </button>
            </motion.div>
          </AnimatePresence>

          <AnimatePresence :initial="false">
            <motion.p
              v-if="formError"
              key="form-error"
              role="alert"
              class="m-0 overflow-hidden rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive"
              :initial="{ opacity: 0, height: 0, paddingTop: 0, paddingBottom: 0 }"
              :animate="{ opacity: 1, height: 'auto', paddingTop: 8, paddingBottom: 8 }"
              :exit="{ opacity: 0, height: 0, paddingTop: 0, paddingBottom: 0 }"
            >
              {{ formError }}
            </motion.p>
          </AnimatePresence>

          <motion.button
            type="submit"
            :aria-busy="status === 'loading'"
            :class="cn(
              'relative inline-flex h-11 w-full items-center justify-center overflow-hidden rounded-xl text-sm font-medium outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50',
              status === 'success' ? 'bg-brand text-background' : 'bg-primary text-primary-foreground hover:bg-primary/90',
            )"
            :while-press="{ scale: 0.98 }"
            :transition="SPRING"
          >
            <AnimatePresence mode="popLayout" :initial="false">
              <motion.span
                :key="status === 'idle' ? mode : status"
                class="inline-flex items-center gap-2"
                :initial="{ opacity: 0, y: 14, filter: 'blur(4px)' }"
                :animate="{ opacity: 1, y: 0, filter: 'blur(0px)' }"
                :exit="{ opacity: 0, y: -14, filter: 'blur(4px)' }"
                :transition="SPRING"
              >
                <template v-if="status === 'loading'">
                  <svg class="size-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-opacity=".25" stroke-width="3" /><path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" stroke-width="3" stroke-linecap="round" /></svg>
                  {{ isSignUp ? 'Creating account…' : 'Signing in…' }}
                </template>
                <template v-else-if="status === 'success'">
                  <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <motion.path d="M5 12.5 10 17 19 7.5" :initial="{ pathLength: 0 }" :animate="{ pathLength: 1 }" :transition="{ duration: 0.3, delay: 0.1 }" />
                  </svg>
                  {{ isSignUp ? 'Account created' : 'Signed in' }}
                </template>
                <template v-else>
                  {{ isSignUp ? 'Create account' : 'Sign in' }}
                </template>
              </motion.span>
            </AnimatePresence>
          </motion.button>
          <p class="sr-only" aria-live="polite">
            {{ status === 'success' ? (isSignUp ? 'Account created' : 'Signed in') : '' }}
          </p>
        </form>
      </div>
    </motion.div>

    <template v-if="providerList.length">
      <div class="my-5 flex items-center gap-3 text-xs text-muted-foreground">
        <span class="h-px flex-1 bg-border" />
        or continue with
        <span class="h-px flex-1 bg-border" />
      </div>
      <div :class="cn('grid gap-2', providerList.length > 1 ? 'grid-cols-2' : 'grid-cols-1')">
        <motion.button
          v-for="p in providerList"
          :key="p.id"
          type="button"
          class="inline-flex h-10 items-center justify-center gap-2 rounded-xl border bg-background text-sm font-medium outline-none transition-colors hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50"
          :while-press="{ scale: 0.97 }"
          :transition="SPRING"
          @click="emit('social', p.id)"
        >
          <component :is="p.icon" v-if="p.icon" class="size-4" />
          <svg v-else-if="p.id === 'github'" class="size-4" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" /></svg>
          <svg v-else-if="p.id === 'google'" class="size-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.19-1.79 4.13-1.15 1.15-2.93 2.4-6.05 2.4-4.83 0-8.6-3.89-8.6-8.72s3.77-8.72 8.6-8.72c2.6 0 4.51 1.03 5.91 2.35l2.31-2.31C18.75 1.44 16.13 0 12.48 0 5.87 0 .31 5.39.31 12s5.56 12 12.17 12c3.57 0 6.27-1.17 8.37-3.36 2.16-2.16 2.84-5.21 2.84-7.67 0-.76-.05-1.47-.17-2.05H12.48Z" /></svg>
          {{ p.label }}
        </motion.button>
      </div>
    </template>
  </div>
</template>
