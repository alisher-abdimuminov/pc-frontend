<script setup lang="ts">
import { CalendarDaysIcon, CalendarOffIcon, MoonStarIcon } from '@lucide/vue'
import { useIntervalFn } from '@vueuse/core'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import LocationCard from '~/components/attendance/LocationCard.vue'
import StepTimeline from '~/components/attendance/StepTimeline.vue'
import { useAuthStore } from '~/stores/auth'
import type { DayState } from '~/types'

const api = useApi()
const auth = useAuthStore()

const state = ref<DayState>()

async function load() {
  state.value = await api.get<DayState>('/api/attendance/today/')
}

onMounted(load)
// qadam oynalari almashganda holat yangilanib tursin
useIntervalFn(load, 60_000)

const passedCount = computed(() => state.value?.steps.filter(s => s.status === 'passed').length ?? 0)
const subtitle = computed(() => {
  const parts = [state.value?.shift ? `${state.value.shift}-SMENA` : null, state.value?.schedule?.location.name]
  return parts.filter(Boolean).join(' • ')
})
const userLine = computed(() => [auth.user?.group?.name, auth.user?.faculty?.name].filter(Boolean).join(' • '))
</script>

<template>
  <div class="mx-auto max-w-md space-y-5">
    <!-- profil -->
    <NuxtLink to="/profile" class="flex items-center gap-4 rounded-[2rem] border bg-card p-6 shadow-sm">
      <div class="min-w-0 flex-1">
        <h1 class="truncate text-xl font-bold">
          {{ auth.user?.full_name || auth.user?.username }}
        </h1>
        <p class="mt-1 line-clamp-2 text-sm text-muted-foreground">
          {{ userLine }}
        </p>
      </div>
      <Avatar class="size-20 shrink-0 shadow-md ring-4 ring-background">
        <AvatarImage v-if="auth.user?.image" :src="auth.user.image" class="object-cover" />
        <AvatarFallback class="text-lg">
          {{ (auth.user?.short_name || '?').slice(0, 2) }}
        </AvatarFallback>
      </Avatar>
    </NuxtLink>

    <Skeleton v-if="!state" class="h-[30rem] w-full rounded-[2rem]" />

    <template v-else>
      <!-- joylashuv (faqat amaliyot kuni) -->
      <LocationCard v-if="state.schedule" />

      <!-- bugungi davomat -->
      <div class="flex items-center gap-4">
        <div class="grid size-14 shrink-0 place-items-center rounded-2xl bg-lime-400 text-lime-950">
          <CalendarDaysIcon class="size-7" />
        </div>
        <div class="min-w-0 flex-1">
          <h2 class="text-2xl font-bold">
            Bugungi davomat
          </h2>
          <p class="truncate text-sm text-muted-foreground">
            {{ subtitle || formatDate(state.date) }}
          </p>
        </div>
        <span v-if="state.steps.length" class="shrink-0 rounded-full bg-muted px-3 py-1 text-sm font-medium tabular-nums">
          {{ passedCount }} / 3
        </span>
      </div>

      <div class="rounded-[2rem] border bg-card px-5 py-8 shadow-sm">
        <StepTimeline v-if="state.steps.length" :steps="state.steps" :now="state.now" :can-attempt="state.can_attempt" />
        <div v-else class="flex flex-col items-center gap-3 py-10 text-center">
          <component :is="state.schedule ? MoonStarIcon : CalendarOffIcon" class="size-10 text-muted-foreground" />
          <p class="font-medium">
            {{ state.message }}
          </p>
          <NuxtLink to="/student/schedule" class="text-sm text-muted-foreground underline underline-offset-4">
            Amaliyot jadvalini ko'rish
          </NuxtLink>
        </div>
      </div>

      <p v-if="state.steps.length" class="px-2 text-center text-sm text-muted-foreground">
        {{ state.message }}
      </p>
      <p v-if="state.can_attempt && !state.shift_locked" class="px-2 text-center text-xs text-muted-foreground">
        Smena birinchi tasdiqlash vaqtiga qarab belgilanadi: 13:00 gacha — 1-smena, keyin — 2-smena.
      </p>
    </template>
  </div>
</template>
