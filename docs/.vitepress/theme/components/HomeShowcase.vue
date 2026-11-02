<script setup lang="ts">
import { AnimatedTabs } from '@/components/ui/animated-tabs'
import { AvatarGroup } from '@/components/ui/avatar-group'
import { Dock, DockItem } from '@/components/ui/dock'
import { NumberTicker } from '@/components/ui/number-ticker'
import { OtpInput } from '@/components/ui/otp-input'
import { Sparkline } from '@/components/ui/sparkline'
import { SpringButton } from '@/components/ui/spring-button'
import { SpringSwitch } from '@/components/ui/spring-switch'
import { TextReveal } from '@/components/ui/text-reveal'
import { TiltCard } from '@/components/ui/tilt-card'
import { toast, ToastStack } from '@/components/ui/toast-stack'
import { Calendar, Home, Mail, Music, Settings } from 'lucide-vue-next'
import { ref } from 'vue'
import catalog from '../../../../registry/catalog.json'

const tab = ref('code')
const on = ref(true)
const code = ref('')
const loading = ref(false)

function save() {
  loading.value = true
  setTimeout(() => {
    loading.value = false
    toast.success('Saved', { description: 'Your changes are live.' })
  }, 1400)
}

const people = [
  { name: 'Ana Silva', src: 'https://i.pravatar.cc/96?img=47' },
  { name: 'Kenji Tanaka', src: 'https://i.pravatar.cc/96?img=12' },
  { name: 'Priya Nair', src: 'https://i.pravatar.cc/96?img=32' },
  { name: 'Zoe Clarke', src: 'https://i.pravatar.cc/96?img=5' },
  { name: 'Omar Haddad' },
  { name: 'Mia Chen' },
]
</script>

<template>
  <div class="vp-raw mx-auto max-w-[1152px] px-6 pb-24 text-foreground">
    <div class="grid auto-rows-[minmax(180px,auto)] gap-4 md:grid-cols-3">
      <a href="/components/animated-tabs" class="relative flex flex-col gap-3 overflow-hidden rounded-[20px] border bg-card p-5 text-foreground no-underline transition-[border-color,box-shadow] duration-200 hover:border-brand/50 hover:shadow-[0_10px_40px_-20px_var(--brand)] md:col-span-2">
        <span class="text-xs font-medium text-muted-foreground">Animated Tabs</span>
        <div class="flex flex-1 items-center justify-center" @click.prevent.stop>
          <AnimatedTabs v-model="tab" :items="[{ value: 'code', label: 'Code' }, { value: 'preview', label: 'Preview' }, { value: 'docs', label: 'Docs' }, { value: 'api', label: 'API' }]" />
        </div>
      </a>
      <a href="/components/number-ticker" class="relative flex flex-col gap-3 overflow-hidden rounded-[20px] border bg-card p-5 text-foreground no-underline transition-[border-color,box-shadow] duration-200 hover:border-brand/50 hover:shadow-[0_10px_40px_-20px_var(--brand)]">
        <span class="text-xs font-medium text-muted-foreground">Number Ticker · Sparkline</span>
        <div class="flex flex-1 flex-col justify-center">
          <NumberTicker :value="128940" class="text-4xl font-semibold" />
          <Sparkline :data="[8, 14, 11, 19, 16, 24, 21, 30, 27, 36]" :width="260" :height="56" class="mt-2 w-full text-brand" />
        </div>
      </a>
      <a href="/components/tilt-card" class="relative flex flex-col gap-3 overflow-hidden rounded-[20px] border bg-card p-5 text-foreground no-underline transition-[border-color,box-shadow] duration-200 hover:border-brand/50 hover:shadow-[0_10px_40px_-20px_var(--brand)] md:row-span-2">
        <span class="text-xs font-medium text-muted-foreground">Tilt Card</span>
        <div class="flex flex-1 items-center justify-center" @click.prevent.stop>
          <TiltCard class="w-full max-w-60">
            <div class="h-44 bg-gradient-to-br from-emerald-400 via-teal-500 to-sky-500" />
            <div class="p-4">
              <p class="m-0 font-semibold">
                Aurora
              </p>
              <p class="m-0 text-sm text-muted-foreground">
                Hover me
              </p>
            </div>
          </TiltCard>
        </div>
      </a>
      <a href="/components/spring-button" class="relative flex flex-col gap-3 overflow-hidden rounded-[20px] border bg-card p-5 text-foreground no-underline transition-[border-color,box-shadow] duration-200 hover:border-brand/50 hover:shadow-[0_10px_40px_-20px_var(--brand)]">
        <span class="text-xs font-medium text-muted-foreground">Spring Button · Toast</span>
        <div class="flex flex-1 items-center justify-center gap-3" @click.prevent.stop>
          <SpringButton :loading="loading" @click="save">
            Deploy
            <template #loading>
              Deploying…
            </template>
          </SpringButton>
          <SpringSwitch v-model="on" aria-label="Demo switch" />
        </div>
      </a>
      <a href="/components/avatar-group" class="relative flex flex-col gap-3 overflow-hidden rounded-[20px] border bg-card p-5 text-foreground no-underline transition-[border-color,box-shadow] duration-200 hover:border-brand/50 hover:shadow-[0_10px_40px_-20px_var(--brand)]">
        <span class="text-xs font-medium text-muted-foreground">Avatar Group</span>
        <div class="flex flex-1 items-center justify-center pt-6">
          <AvatarGroup :items="people" :max="4" />
        </div>
      </a>
      <a href="/components/otp-input" class="relative flex flex-col gap-3 overflow-hidden rounded-[20px] border bg-card p-5 text-foreground no-underline transition-[border-color,box-shadow] duration-200 hover:border-brand/50 hover:shadow-[0_10px_40px_-20px_var(--brand)] md:col-span-2">
        <span class="text-xs font-medium text-muted-foreground">OTP Input</span>
        <div class="flex flex-1 items-center justify-center" @click.prevent.stop>
          <OtpInput v-model="code" :length="6" :group-size="3" />
        </div>
      </a>
      <a href="/components/dock" class="relative flex flex-col gap-3 overflow-hidden rounded-[20px] border bg-card p-5 text-foreground no-underline transition-[border-color,box-shadow] duration-200 hover:border-brand/50 hover:shadow-[0_10px_40px_-20px_var(--brand)] md:col-span-3">
        <span class="text-xs font-medium text-muted-foreground">Dock</span>
        <div class="flex flex-1 items-end justify-center pt-10" @click.prevent.stop>
          <Dock>
            <DockItem label="Home" active>
              <Home />
            </DockItem>
            <DockItem label="Mail">
              <Mail />
            </DockItem>
            <DockItem label="Calendar">
              <Calendar />
            </DockItem>
            <DockItem label="Music">
              <Music />
            </DockItem>
            <DockItem label="Settings">
              <Settings />
            </DockItem>
          </Dock>
        </div>
      </a>
    </div>

    <div class="mt-24 text-center">
      <TextReveal as="h2" text="Copy. Paste. Make it move." class="m-0 text-3xl font-semibold tracking-tight sm:text-4xl" />
      <p class="mx-auto mt-3 max-w-xl text-muted-foreground">
        {{ catalog.length }} components and counting. Each one is a single command away, and the code is yours.
      </p>
      <pre class="mx-auto mt-6 inline-block max-w-full overflow-x-auto rounded-xl border bg-muted px-5 py-3 text-left font-mono text-xs sm:text-sm">npx shadcn-vue@latest add @vuelix/dock</pre>
    </div>

    <ToastStack />
  </div>
</template>
