<script setup lang="ts">
import { ArrowRightIcon, CalendarDaysIcon, MapPinIcon, RefreshCwIcon, UsersIcon } from '@lucide/vue'
import { useIntervalFn } from '@vueuse/core'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import AttendanceTrendChart from '~/components/staff/AttendanceTrendChart.vue'
import { useAuthStore } from '~/stores/auth'
import type { Dashboard } from '~/types'

const api = useApi()
const auth = useAuthStore()
const NuxtLink = resolveComponent('NuxtLink')
const canGroups = computed(() => auth.can('attendance.view_attendance'))
const canAttempts = computed(() => auth.can('attendance.view_attendanceattempt'))
const data = ref<Dashboard>()
const loading = ref(false)

async function load() {
  loading.value = true
  try {
    data.value = await api.get<Dashboard>('/api/attendance/dashboard/')
  }
  finally {
    loading.value = false
  }
}

onMounted(load)
useIntervalFn(load, 60_000)

const percent = (part: number, total: number) => (total ? Math.round((part / total) * 100) : 0)
const maxError = computed(() => Math.max(1, ...(data.value?.attempts_today?.by_error.map(e => e.count) ?? [])))
const time = (iso: string) => formatTime(new Date(iso))
</script>

<template>
  <div class="space-y-5">
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold">
          Bosh sahifa
        </h1>
        <p class="text-sm text-muted-foreground">
          {{ data ? formatDate(data.date) : '' }} · {{ ROLE_LABELS[auth.user?.role ?? ''] }}
        </p>
      </div>
      <Button variant="outline" size="icon" class="rounded-full" aria-label="Yangilash" :disabled="loading" @click="load">
        <RefreshCwIcon :class="{ 'animate-spin': loading }" />
      </Button>
    </div>

    <div v-if="!data" class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Skeleton v-for="i in 4" :key="i" class="h-28 rounded-xl" />
      <Skeleton class="h-72 rounded-xl sm:col-span-2 lg:col-span-4" />
    </div>

    <template v-else>
      <!-- KPI -->
      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card class="gap-1 py-4">
          <CardContent class="px-4">
            <p class="text-xs text-muted-foreground">
              Bugun amaliyotda
            </p>
            <p class="mt-1 text-3xl font-bold tabular-nums">
              {{ data.today.expected }}
            </p>
            <p class="text-xs text-muted-foreground">
              talaba borishi kerak
            </p>
          </CardContent>
        </Card>
        <Card class="gap-1 py-4">
          <CardContent class="px-4">
            <p class="text-xs text-muted-foreground">
              Kelgan
            </p>
            <p class="mt-1 text-3xl font-bold tabular-nums">
              {{ data.today.came }}
              <span class="text-base font-medium text-muted-foreground">/ {{ data.today.expected }}</span>
            </p>
            <div class="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
              <div class="h-full rounded-full bg-[#65a30d]" :style="{ width: `${percent(data.today.came, data.today.expected)}%` }" />
            </div>
            <p class="mt-1 text-xs text-muted-foreground tabular-nums">
              {{ percent(data.today.came, data.today.expected) }}% kamida 1 qadam
            </p>
          </CardContent>
        </Card>
        <Card class="gap-1 py-4">
          <CardContent class="px-4">
            <p class="text-xs text-muted-foreground">
              To'liq (3/3)
            </p>
            <p class="mt-1 text-3xl font-bold tabular-nums">
              {{ data.today.full }}
            </p>
            <p class="text-xs text-muted-foreground tabular-nums">
              {{ percent(data.today.full, data.today.expected) }}% barcha qadamlar
            </p>
          </CardContent>
        </Card>
        <Card v-if="data.attempts_today" class="gap-1 py-4">
          <CardContent class="px-4">
            <p class="text-xs text-muted-foreground">
              Bugungi urinishlar
            </p>
            <p class="mt-1 text-3xl font-bold tabular-nums">
              {{ data.attempts_today.total }}
            </p>
            <p class="text-xs text-muted-foreground tabular-nums">
              <span class="text-emerald-600 dark:text-emerald-400">✓ {{ data.attempts_today.success }} muvaffaqiyatli</span>
              ·
              <span class="text-rose-600 dark:text-rose-400">✗ {{ data.attempts_today.failed }} rad</span>
            </p>
          </CardContent>
        </Card>
        <!-- urinishlar ko'rinmaydigan rollar uchun: topshiriqlar -->
        <Card v-else-if="data.assignments" class="gap-1 py-4">
          <CardContent class="px-4">
            <p class="text-xs text-muted-foreground">
              Baholanmagan javoblar
            </p>
            <p class="mt-1 text-3xl font-bold tabular-nums">
              {{ data.assignments.ungraded }}
            </p>
            <p class="text-xs text-muted-foreground tabular-nums">
              {{ data.assignments.active }} faol topshiriq · {{ data.assignments.submitted }} javob
            </p>
            <NuxtLink to="/staff/assignments" class="mt-1 inline-block text-xs underline underline-offset-4">
              Topshiriqlarga o'tish
            </NuxtLink>
          </CardContent>
        </Card>
      </div>

      <!-- trend -->
      <Card>
        <CardHeader>
          <CardTitle class="text-base">
            So'nggi 14 kun davomati
          </CardTitle>
          <CardDescription>Amaliyot kunlarida kamida bitta qadamni tasdiqlagan talabalar</CardDescription>
        </CardHeader>
        <CardContent>
          <AttendanceTrendChart :days="data.trend" />
        </CardContent>
      </Card>

      <div class="grid gap-4 lg:grid-cols-5">
        <!-- guruhlar bugun -->
        <Card :class="data.attempts_today ? 'lg:col-span-3' : 'lg:col-span-5'">
          <CardHeader>
            <CardTitle class="text-base">
              Guruhlar · bugun
            </CardTitle>
            <CardDescription>Bugun amaliyot kuni bo'lgan guruhlar</CardDescription>
          </CardHeader>
          <CardContent>
            <p v-if="!data.groups.length" class="py-6 text-center text-sm text-muted-foreground">
              Bugun amaliyot yo'q
            </p>
            <ul v-else class="divide-y">
              <li v-for="g in data.groups" :key="g.uuid">
                <component
                  :is="canGroups ? NuxtLink : 'div'"
                  :to="canGroups ? `/staff/groups/${g.uuid}` : undefined"
                  class="flex items-center gap-3 py-2.5"
                  :class="{ 'hover:bg-muted/40': canGroups }"
                >
                  <div class="min-w-0 flex-1">
                    <div class="truncate text-sm font-medium">
                      {{ g.name }}
                    </div>
                    <div class="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div class="h-full rounded-full bg-[#65a30d]" :style="{ width: `${percent(g.came, g.expected)}%` }" />
                    </div>
                  </div>
                  <div class="w-24 shrink-0 text-right text-sm tabular-nums">
                    <b>{{ g.came }}</b><span class="text-muted-foreground">/{{ g.expected }}</span>
                    <div class="text-xs text-muted-foreground">
                      {{ percent(g.came, g.expected) }}% · 3/3: {{ g.full }}
                    </div>
                  </div>
                </component>
              </li>
            </ul>
          </CardContent>
        </Card>

        <!-- rad etish sabablari (urinishlar ruxsati bilan) -->
        <Card v-if="data.attempts_today" class="lg:col-span-2">
          <CardHeader>
            <CardTitle class="text-base">
              Rad etish sabablari · bugun
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p v-if="!data.attempts_today.by_error.length" class="py-6 text-center text-sm text-muted-foreground">
              Bugun rad etilgan urinish yo'q
            </p>
            <ul v-else class="space-y-3">
              <li v-for="e in data.attempts_today.by_error" :key="e.code">
                <component
                  :is="canAttempts ? NuxtLink : 'div'"
                  :to="canAttempts ? `/staff/attempts?error_code=${e.code}&from=${data.date}&to=${data.date}` : undefined"
                  class="block"
                >
                  <div class="flex justify-between gap-2 text-sm">
                    <span class="truncate">{{ e.label }}</span>
                    <b class="tabular-nums">{{ e.count }}</b>
                  </div>
                  <div class="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div class="h-full rounded-full bg-[#e11d48]" :style="{ width: `${(e.count / maxError) * 100}%` }" />
                  </div>
                </component>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <!-- so'nggi muvaffaqiyatsiz urinishlar (rasmlar bilan - faqat ruxsat bo'lsa) -->
      <Card v-if="canAttempts">
        <CardHeader>
          <div class="flex items-center justify-between gap-2">
            <CardTitle class="text-base">
              So'nggi rad etilgan urinishlar
            </CardTitle>
            <NuxtLink to="/staff/attempts?result=fail" class="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              Barchasi <ArrowRightIcon class="size-4" />
            </NuxtLink>
          </div>
        </CardHeader>
        <CardContent>
          <p v-if="!data.recent_failures.length" class="py-6 text-center text-sm text-muted-foreground">
            Rad etilgan urinishlar yo'q
          </p>
          <ul v-else class="grid gap-2 md:grid-cols-2">
            <li v-for="a in data.recent_failures" :key="a.uuid">
              <NuxtLink :to="`/staff/attempts?search=${encodeURIComponent(a.student.username)}&result=fail`" class="flex items-center gap-3 rounded-lg border p-2 hover:bg-muted/40">
                <img :src="a.image" class="size-12 shrink-0 rounded-md object-cover" alt="">
                <div class="min-w-0 flex-1">
                  <div class="truncate text-sm font-medium">
                    {{ a.student.full_name }}
                  </div>
                  <div class="truncate text-xs text-rose-600 dark:text-rose-400">
                    ✗ {{ a.error_message }}
                  </div>
                  <div class="truncate text-xs text-muted-foreground">
                    {{ a.group }} · {{ a.step }}-qadam · {{ formatDate(a.date) }} {{ time(a.attempted_at) }}
                  </div>
                </div>
                <Avatar class="size-8 shrink-0">
                  <AvatarImage v-if="a.student.image" :src="a.student.image" class="object-cover" />
                  <AvatarFallback class="text-[10px]">
                    {{ a.student.full_name.slice(0, 2) }}
                  </AvatarFallback>
                </Avatar>
              </NuxtLink>
            </li>
          </ul>
        </CardContent>
      </Card>

      <!-- umumiy -->
      <div class="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <div class="flex items-center gap-2 rounded-xl border bg-card px-4 py-3">
          <UsersIcon class="size-4 text-muted-foreground" /> <b class="tabular-nums">{{ data.totals.students }}</b> talaba
        </div>
        <div class="flex items-center gap-2 rounded-xl border bg-card px-4 py-3">
          <UsersIcon class="size-4 text-muted-foreground" /> <b class="tabular-nums">{{ data.totals.groups }}</b> guruh
        </div>
        <div class="flex items-center gap-2 rounded-xl border bg-card px-4 py-3">
          <CalendarDaysIcon class="size-4 text-muted-foreground" /> <b class="tabular-nums">{{ data.totals.schedules }}</b> faol jadval
        </div>
        <div class="flex items-center gap-2 rounded-xl border bg-card px-4 py-3">
          <MapPinIcon class="size-4 text-muted-foreground" /> <b class="tabular-nums">{{ data.totals.locations }}</b> lokatsiya
        </div>
      </div>
    </template>
  </div>
</template>
