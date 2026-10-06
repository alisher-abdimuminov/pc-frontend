<script setup lang="ts">
import { CheckIcon, LoaderCircleIcon, MapPinIcon, MapPinOffIcon, RotateCwIcon } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { useLocationStore } from '~/stores/location'

/** Joylashuv holati (avtomatik olinadi). Tugma faqat qayta aniqlash uchun. */
const store = useLocationStore()

const view = computed(() => {
  switch (store.status) {
    case 'ok':
      return { title: 'Amaliyot joyidasiz', text: store.result!.location.name }
    case 'loading':
      return { title: 'Joylashuv aniqlanmoqda', text: 'Amaliyot hududi tekshirilmoqda...' }
    case 'fail':
      return {
        title: store.result ? 'Hududdan tashqarida' : 'Joylashuv aniqlanmadi',
        text: store.result?.message || store.error,
      }
    default:
      return { title: 'Joylashuv', text: 'Davomat uchun joylashuvingiz aniqlanadi' }
  }
})

const TILE = {
  idle: 'bg-lime-50 text-lime-500 dark:bg-lime-500/10',
  loading: 'bg-lime-50 text-lime-500 dark:bg-lime-500/10',
  ok: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
  fail: 'bg-rose-50 text-rose-500 dark:bg-rose-500/10',
}
</script>

<template>
  <div class="flex items-center gap-4 rounded-[2rem] border bg-card p-5 shadow-sm">
    <div class="grid size-14 shrink-0 place-items-center rounded-2xl" :class="TILE[store.status]">
      <LoaderCircleIcon v-if="store.status === 'loading'" class="size-7 animate-spin" />
      <CheckIcon v-else-if="store.status === 'ok'" class="size-7" />
      <MapPinOffIcon v-else-if="store.status === 'fail'" class="size-7" />
      <MapPinIcon v-else class="size-7" />
    </div>
    <div class="min-w-0 flex-1">
      <div class="font-semibold">
        {{ view.title }}
      </div>
      <p class="text-sm text-muted-foreground">
        {{ view.text }}
      </p>
      <p v-if="store.status === 'ok' && store.geo?.accuracy" class="text-xs text-muted-foreground">
        aniqlik ±{{ Math.round(store.geo.accuracy) }} m
      </p>
    </div>
    <Button
      variant="secondary"
      size="icon-lg"
      class="shrink-0 rounded-full"
      aria-label="Joylashuvni yangilash"
      :disabled="store.loading"
      @click="store.check()"
    >
      <RotateCwIcon class="size-5" :class="{ 'animate-spin': store.loading }" />
    </Button>
  </div>
</template>
