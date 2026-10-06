<script setup lang="ts">
import { CheckIcon, LoaderCircleIcon, LockIcon, MapPinOffIcon, ScanFaceIcon, TriangleAlertIcon } from '@lucide/vue'
import { useIntervalFn } from '@vueuse/core'
import { useLocationStore } from '~/stores/location'
import type { StepState, StepStatus } from '~/types'

/**
 * Smena qadamlarini vaqt o'qida ko'rsatadi. Kartochka balandligi qadam davomiyligiga mos,
 * qizil chiziq - hozirgi vaqt (server/Toshkent vaqti bo'yicha, har 15 soniyada siljiydi).
 */
const props = defineProps<{
  steps: StepState[]
  /** server qaytargan hozirgi vaqt (ISO, +05:00) */
  now: string
  canAttempt: boolean
}>()

const HOUR_PX = 128

// FaceID faqat joylashuv serverda tasdiqlangan bo'lsa faol
const location = useLocationStore()
const faceIdEnabled = computed(() => props.canAttempt && location.isOk)

function availableText() {
  if (!props.canAttempt)
    return 'Kuting...'
  if (location.status === 'loading')
    return 'Joylashuv tekshirilmoqda'
  if (!location.isOk)
    return 'Avval amaliyot joyida bo\'ling'
  return META.available.text
}

const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number)
  return h! * 60 + m!
}

const range = computed(() => {
  const start = Math.min(...props.steps.map(s => toMin(s.start)))
  const end = Math.max(...props.steps.map(s => toMin(s.end)))
  return { start, end }
})

const hours = computed(() => {
  const list: number[] = []
  for (let m = range.value.start; m <= range.value.end; m += 60)
    list.push(m)
  return list
})

const height = computed(() => ((range.value.end - range.value.start) / 60) * HOUR_PX)
const y = (minutes: number) => ((minutes - range.value.start) / 60) * HOUR_PX
const label = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`

// --- hozirgi vaqt: server vaqtidan boshlab qurilma soati bilan oldinga suriladi ---
const fetchedAt = ref(Date.now())
const tick = ref(Date.now())
watch(() => props.now, () => {
  fetchedAt.value = Date.now()
  tick.value = Date.now()
})
useIntervalFn(() => (tick.value = Date.now()), 15_000)

const nowMin = computed(() => {
  // "2026-10-02T14:39:12.123+05:00" -> Toshkent vaqtidagi daqiqa (qurilma TZ dan qat'i nazar)
  const [, hh, mm, ss] = props.now.match(/T(\d{2}):(\d{2}):(\d{2})/) ?? []
  const base = Number(hh) * 60 + Number(mm) + Number(ss) / 60
  return base + (tick.value - fetchedAt.value) / 60_000
})
const nowVisible = computed(() => nowMin.value >= range.value.start && nowMin.value <= range.value.end)
const nowLabel = computed(() => label(Math.floor(nowMin.value)))

const META: Record<StepStatus, { badge: string, text: string, card: string, accent: string, chip: string }> = {
  missed: {
    badge: "O'tkazildi",
    text: 'Vaqti tugagan',
    card: 'border-dashed border-rose-400 bg-rose-50 dark:bg-rose-950/40 dark:border-rose-500/70',
    accent: 'text-rose-600 dark:text-rose-400',
    chip: 'bg-rose-200/70 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300',
  },
  available: {
    badge: 'Ochiq',
    text: 'Tasdiqlash mumkin',
    card: 'border-dashed border-lime-400 bg-lime-50 dark:bg-lime-950/40 dark:border-lime-500/70',
    accent: 'text-lime-600 dark:text-lime-400',
    chip: 'bg-lime-400 text-lime-950',
  },
  passed: {
    badge: 'Tasdiqlandi',
    text: 'FaceID va joylashuv tasdiqlandi',
    card: 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 dark:border-emerald-500/70',
    accent: 'text-emerald-600 dark:text-emerald-400',
    chip: 'bg-emerald-500 text-white',
  },
  upcoming: {
    badge: 'Yopiq',
    text: 'Vaqti kelmagan',
    card: 'border-border bg-muted/60',
    accent: 'text-foreground',
    chip: 'border border-border bg-background text-muted-foreground',
  },
}

function cardStyle(s: StepState) {
  const top = y(toMin(s.start))
  return { top: `${top + 4}px`, height: `${y(toMin(s.end)) - top - 8}px` }
}
</script>

<template>
  <div class="relative" :style="{ height: `${height}px` }">
    <!-- soat chiziqlari -->
    <div
      v-for="h in hours"
      :key="h"
      class="absolute inset-x-0 flex items-center"
      :style="{ top: `${y(h)}px` }"
    >
      <span class="w-14 -translate-y-1/2 text-xs font-medium text-muted-foreground tabular-nums">{{ label(h) }}</span>
      <span class="h-px flex-1 -translate-y-1/2 border-t border-dashed border-border" />
    </div>
    <div class="absolute top-0 bottom-0 left-[3.75rem] w-px bg-border" />

    <!-- qadamlar -->
    <div
      v-for="s in steps"
      :key="s.step"
      class="absolute right-0 left-[4.5rem] flex flex-col rounded-2xl border-2 p-3 transition-colors"
      :class="META[s.status].card"
      :style="cardStyle(s)"
    >
      <div class="flex items-start justify-between gap-2">
        <div class="min-w-0">
          <div class="font-semibold" :class="META[s.status].accent">
            {{ s.step }}-qadam
          </div>
          <div class="text-xs tabular-nums" :class="s.status === 'upcoming' ? 'text-muted-foreground' : META[s.status].accent">
            {{ s.start }} — {{ s.end }}
          </div>
        </div>
        <span class="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium" :class="META[s.status].chip">
          {{ META[s.status].badge }}
        </span>
      </div>

      <div class="mt-auto flex items-end justify-between gap-2">
        <div class="min-w-0">
          <div v-if="s.status === 'available'" class="text-[11px]" :class="META[s.status].accent">
            FaceID va joylashuv
          </div>
          <div
            class="text-sm"
            :class="[s.status === 'available' ? 'font-semibold' : '', s.status === 'upcoming' ? 'text-muted-foreground' : META[s.status].accent]"
          >
            {{ s.status === 'available' ? availableText() : META[s.status].text }}
          </div>
        </div>

        <NuxtLink
          v-if="s.status === 'available' && faceIdEnabled"
          to="/student/check-in"
          aria-label="FaceID orqali tasdiqlash"
          class="grid size-12 shrink-0 place-items-center rounded-full bg-lime-400 text-lime-950 shadow-sm transition-transform hover:scale-105 active:scale-95"
        >
          <ScanFaceIcon class="size-6" />
        </NuxtLink>
        <span
          v-else-if="s.status === 'available'"
          role="button"
          aria-disabled="true"
          aria-label="FaceID o'chirilgan: joylashuv tasdiqlanmagan"
          class="grid size-12 shrink-0 cursor-not-allowed place-items-center rounded-full bg-muted text-muted-foreground"
        >
          <LoaderCircleIcon v-if="location.status === 'loading'" class="size-5 animate-spin" />
          <MapPinOffIcon v-else class="size-5" />
        </span>
        <TriangleAlertIcon v-else-if="s.status === 'missed'" class="size-6 shrink-0 text-rose-500" />
        <span v-else-if="s.status === 'passed'" class="grid size-10 shrink-0 place-items-center rounded-full bg-emerald-500 text-white">
          <CheckIcon class="size-5" />
        </span>
        <span v-else-if="s.status === 'upcoming'" class="grid size-10 shrink-0 place-items-center rounded-full bg-background text-muted-foreground">
          <LockIcon class="size-4" />
        </span>
      </div>
    </div>

    <!-- hozirgi vaqt -->
    <div
      v-if="nowVisible"
      class="pointer-events-none absolute inset-x-0 z-10 flex items-center"
      :style="{ top: `${y(nowMin)}px` }"
    >
      <span class="-translate-y-1/2 rounded-full bg-rose-500 px-2 py-0.5 text-[11px] font-semibold text-white tabular-nums shadow">
        {{ nowLabel }}
      </span>
      <span class="size-2 -translate-x-0.5 -translate-y-1/2 rounded-full bg-rose-500 ring-2 ring-background" />
      <span class="h-0.5 flex-1 -translate-y-1/2 bg-rose-500" />
    </div>
  </div>
</template>
