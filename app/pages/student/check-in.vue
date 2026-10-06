<script setup lang="ts">
import { ArrowLeftIcon, CheckCircle2Icon, LoaderCircleIcon, MapPinIcon, MapPinOffIcon, RotateCcwIcon, XCircleIcon } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import FaceCamera from '~/components/attendance/FaceCamera.vue'
import { useLocationStore } from '~/stores/location'
import type { Attempt, CheckInResponse, DayState } from '~/types'

/**
 * Tasdiqlash: 1) joylashuv backendda tekshiriladi - hududda bo'lmasa kamera umuman ochilmaydi;
 * 2) FaceID (3 soniya yashil -> avtomatik rasm); 3) natija.
 */
const api = useApi()
const location = useLocationStore()

type Phase = 'checking' | 'location' | 'location-failed' | 'camera' | 'sending' | 'result' | 'blocked'
const phase = ref<Phase>('checking')
const state = ref<DayState>()
const error = ref('')
const attempt = ref<Attempt>()

async function init() {
  phase.value = 'checking'
  error.value = ''
  state.value = await api.get<DayState>('/api/attendance/today/')
  if (!state.value.can_attempt) {
    phase.value = 'blocked'
    return
  }
  await locate(!location.isOk)
}

async function locate(force = true) {
  phase.value = 'location'
  if (force)
    await location.check()
  phase.value = location.isOk ? 'camera' : 'location-failed'
}

async function onCapture(blob: Blob) {
  phase.value = 'sending'
  // rasm olingan paytdagi joylashuv - backend uni ham hudud bo'yicha qayta tekshiradi
  let geo = location.geo!
  try {
    geo = await getCurrentLocation()
  }
  catch {}

  const form = new FormData()
  form.append('latitude', String(geo.latitude))
  form.append('longitude', String(geo.longitude))
  form.append('accuracy', String(Math.round(geo.accuracy ?? 9999)))
  form.append('location_token', location.result?.token ?? '')
  form.append('image', blob, 'face.jpg')

  try {
    const res = await api.post<CheckInResponse>('/api/attendance/check-in/', form)
    attempt.value = res.attempt
    state.value = res.state
    phase.value = 'result'
  }
  catch (e: any) {
    error.value = e.message
    phase.value = 'blocked'
  }
}

onMounted(() => init().catch((e) => {
  error.value = e.message
  phase.value = 'blocked'
}))
</script>

<template>
  <div class="mx-auto max-w-md space-y-4">
    <div class="flex items-center gap-3">
      <Button variant="outline" size="icon-lg" class="rounded-full" aria-label="Orqaga" as-child>
        <NuxtLink to="/student">
          <ArrowLeftIcon />
        </NuxtLink>
      </Button>
      <div>
        <h1 class="text-xl font-bold">
          {{ state?.current_step ? `${state.current_step}-qadam` : 'Tasdiqlash' }}
        </h1>
        <p class="text-sm text-muted-foreground">
          Joylashuv va FaceID
        </p>
      </div>
    </div>

    <!-- bosqichlar -->
    <div class="grid grid-cols-2 gap-2 text-sm">
      <div
        class="flex items-center gap-2 rounded-full px-3 py-2"
        :class="location.isOk ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-muted text-muted-foreground'"
      >
        <MapPinIcon class="size-4" /> Joylashuv
      </div>
      <div
        class="flex items-center gap-2 rounded-full px-3 py-2"
        :class="attempt?.face_verified ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : phase === 'camera' ? 'bg-lime-400 text-lime-950' : 'bg-muted text-muted-foreground'"
      >
        <CheckCircle2Icon class="size-4" /> FaceID
      </div>
    </div>

    <div class="rounded-[2rem] border bg-card p-5 shadow-sm">
      <div v-if="phase === 'checking' || phase === 'location'" class="flex flex-col items-center gap-3 py-12 text-center">
        <LoaderCircleIcon class="size-8 animate-spin text-muted-foreground" />
        <p class="text-sm text-muted-foreground">
          {{ phase === 'location' ? 'Joylashuv tekshirilmoqda...' : 'Yuklanmoqda...' }}
        </p>
      </div>

      <div v-else-if="phase === 'location-failed'" class="flex flex-col items-center gap-3 py-8 text-center">
        <div class="grid size-16 place-items-center rounded-2xl bg-rose-50 text-rose-500 dark:bg-rose-500/10">
          <MapPinOffIcon class="size-8" />
        </div>
        <h2 class="text-lg font-semibold">
          FaceID'ga o'tib bo'lmaydi
        </h2>
        <p class="text-sm text-muted-foreground">
          {{ location.result?.message || location.error }}
        </p>
        <p class="text-xs text-muted-foreground">
          Tasdiqlash faqat amaliyot joyi hududida mumkin.
        </p>
        <Button size="lg" class="mt-2 rounded-full bg-lime-400 px-5 text-lime-950 hover:bg-lime-300" @click="locate()">
          <RotateCcwIcon /> Qayta aniqlash
        </Button>
      </div>

      <FaceCamera v-else-if="phase === 'camera'" @capture="onCapture" />

      <div v-else-if="phase === 'sending'" class="flex flex-col items-center gap-3 py-12 text-center">
        <LoaderCircleIcon class="size-8 animate-spin text-muted-foreground" />
        <p class="text-sm text-muted-foreground">
          Yuz va joylashuv tekshirilmoqda...
        </p>
      </div>

      <div v-else-if="phase === 'result' && attempt" class="flex flex-col items-center gap-3 py-6 text-center">
        <CheckCircle2Icon v-if="attempt.success" class="size-16 text-emerald-500" />
        <XCircleIcon v-else class="size-16 text-rose-500" />
        <h2 class="text-lg font-semibold">
          {{ attempt.success ? `${attempt.step}-qadam tasdiqlandi` : 'Tasdiqlanmadi' }}
        </h2>
        <p v-if="!attempt.success" class="text-sm text-muted-foreground">
          {{ attempt.error_message }}
        </p>
        <div class="flex gap-2 text-sm">
          <span class="rounded-full bg-muted px-3 py-1">Joylashuv {{ attempt.location_verified ? '✓' : '✗' }}</span>
          <span class="rounded-full bg-muted px-3 py-1">Yuz {{ attempt.face_verified ? '✓' : '✗' }}</span>
        </div>
        <div class="mt-2 flex w-full flex-col gap-2">
          <Button
            v-if="!attempt.success && state?.can_attempt"
            size="lg"
            class="rounded-full bg-lime-400 text-lime-950 hover:bg-lime-300"
            @click="init"
          >
            <RotateCcwIcon /> Qayta urinish
          </Button>
          <Button variant="secondary" size="lg" class="rounded-full" as-child>
            <NuxtLink to="/student">
              Bosh sahifa
            </NuxtLink>
          </Button>
        </div>
      </div>

      <div v-else-if="phase === 'blocked'" class="flex flex-col items-center gap-3 py-8 text-center">
        <h2 class="text-lg font-semibold">
          Hozir tasdiqlab bo'lmaydi
        </h2>
        <p class="text-sm text-muted-foreground">
          {{ error || state?.message }}
        </p>
        <Button variant="secondary" size="lg" class="mt-2 w-full rounded-full" as-child>
          <NuxtLink to="/student">
            Bosh sahifa
          </NuxtLink>
        </Button>
      </div>
    </div>
  </div>
</template>
