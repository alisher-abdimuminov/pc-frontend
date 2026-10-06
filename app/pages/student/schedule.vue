<script setup lang="ts">
import { CalendarDaysIcon, MapPinIcon } from '@lucide/vue'
import { Skeleton } from '@/components/ui/skeleton'
import type { Schedule } from '~/types'

const api = useApi()
const schedules = ref<Schedule[]>()

onMounted(async () => {
  schedules.value = await api.get<Schedule[]>('/api/attendance/my/schedules/')
})
</script>

<template>
  <div class="mx-auto max-w-md space-y-4">
    <h1 class="text-xl font-semibold">
      Amaliyot jadvali
    </h1>
    <Skeleton v-if="!schedules" class="h-40 w-full rounded-3xl" />
    <div v-else-if="!schedules.length" class="flex flex-col items-center gap-2 rounded-3xl border bg-card py-12 text-center text-sm text-muted-foreground">
      <CalendarDaysIcon class="size-8" />
      Sizga amaliyot jadvali biriktirilmagan
    </div>
    <div v-for="s in schedules" :key="s.uuid" class="space-y-3 rounded-3xl border bg-card p-5 shadow-sm">
      <div class="flex flex-wrap gap-1.5">
        <span
          v-for="(d, i) in WEEKDAYS"
          :key="d.key"
          class="grid size-9 place-items-center rounded-full text-xs font-medium"
          :class="s.weekdays.includes(i) ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground'"
        >
          {{ d.short }}
        </span>
      </div>
      <div class="flex items-start gap-2">
        <MapPinIcon class="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <div>
          <div class="font-medium">
            {{ s.location.name }}
          </div>
          <div v-if="s.location.location" class="text-sm text-muted-foreground">
            {{ s.location.location }}
          </div>
        </div>
      </div>
      <div class="text-xs text-muted-foreground">
        {{ formatDate(s.start_date) }} — {{ formatDate(s.end_date) }}
      </div>
    </div>
  </div>
</template>
