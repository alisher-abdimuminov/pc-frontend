<script setup lang="ts">
import DatePicker from '~/components/date/DatePicker.vue'
import DateRangePicker from '~/components/date/DateRangePicker.vue'
import { ArrowLeftIcon } from '@lucide/vue'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import StepStatusIcon from '~/components/attendance/StepStatusIcon.vue'
import TeacherPicker from '~/components/staff/TeacherPicker.vue'
import { useAuthStore } from '~/stores/auth'
import type { GroupDay, GroupReport } from '~/types'

const api = useApi()
const auth = useAuthStore()
const route = useRoute()
const uuid = route.params.uuid as string

// --- kunlik ---
const day = ref(isoDate())
const dayData = ref<GroupDay>()
const dayLoading = ref(false)

async function loadDay() {
  dayLoading.value = true
  try {
    dayData.value = await api.get<GroupDay>(`/api/attendance/groups/${uuid}/`, { date: day.value })
  }
  finally {
    dayLoading.value = false
  }
}

const summary = computed(() => {
  const rows = dayData.value?.students ?? []
  return {
    total: rows.length,
    came: rows.filter(r => r.passed_steps.length).length,
    full: rows.filter(r => r.passed_steps.length === 3).length,
  }
})

// --- hisobot ---
const to = ref(isoDate())
const from = ref(isoDate(new Date(Date.now() - 30 * 86400_000)))
const report = ref<GroupReport>()
const reportLoading = ref(false)

async function loadReport() {
  reportLoading.value = true
  try {
    report.value = await api.get<GroupReport>(`/api/attendance/groups/${uuid}/report/`, { from: from.value, to: to.value })
  }
  finally {
    reportLoading.value = false
  }
}

function cellClass(passed?: number) {
  if (!passed)
    return 'bg-red-50 text-red-700'
  if (passed === 3)
    return 'bg-emerald-50 text-emerald-700'
  return 'bg-amber-50 text-amber-700'
}

function studentTotal(days: Record<string, { passed: number }>) {
  return Object.values(days).filter(d => d.passed > 0).length
}

watch(day, loadDay, { immediate: true })
watch([from, to], loadReport, { immediate: true })
</script>

<template>
  <div class="space-y-4">
    <Button variant="ghost" size="sm" as-child>
      <NuxtLink to="/staff/groups">
        <ArrowLeftIcon /> Guruhlar
      </NuxtLink>
    </Button>
    <div class="flex flex-wrap items-end justify-between gap-3">
      <h1 class="min-w-0 text-xl font-semibold break-words">
        {{ dayData?.group.name || report?.group.name || 'Guruh' }}
      </h1>
      <div v-if="dayData" class="w-full space-y-1 sm:w-auto">
        <p class="text-xs text-muted-foreground">
          O'qituvchi
        </p>
        <TeacherPicker
          v-if="auth.can('users.change_group')"
          :group-uuid="dayData.group.uuid"
          :group-name="dayData.group.name"
          :teacher-uuid="dayData.group.teacher?.uuid ?? null"
          :teacher-name="dayData.group.teacher?.full_name ?? null"
          @changed="dayData.group.teacher = $event"
        />
        <p v-else class="text-sm font-medium">
          {{ dayData.group.teacher?.full_name || 'Biriktirilmagan' }}
        </p>
      </div>
    </div>

    <Tabs default-value="day">
      <TabsList>
        <TabsTrigger value="day">
          Kunlik
        </TabsTrigger>
        <TabsTrigger value="report">
          Hisobot
        </TabsTrigger>
      </TabsList>

      <TabsContent value="day" class="space-y-3">
        <div class="flex flex-wrap items-center gap-3">
          <DatePicker v-model="day" class="w-full sm:w-56" />
          <Badge v-if="dayData && !dayData.is_practice_day" variant="outline">
            Amaliyot kuni emas
          </Badge>
          <div v-if="dayData?.is_practice_day" class="flex gap-2 text-sm text-muted-foreground">
            <span>Kelgan: <b class="text-foreground">{{ summary.came }}</b>/{{ summary.total }}</span>
            <span>· To'liq (3/3): <b class="text-foreground">{{ summary.full }}</b></span>
          </div>
        </div>

        <Skeleton v-if="dayLoading && !dayData" class="h-60 w-full" />
        <Card v-else-if="dayData" class="py-0">
          <CardContent class="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Talaba</TableHead>
                  <TableHead class="w-14 text-center sm:w-20">
                    Smena
                  </TableHead>
                  <TableHead v-for="n in 3" :key="n" class="w-10 text-center sm:w-14">
                    {{ n }}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow
                  v-for="s in dayData.students"
                  :key="s.uuid"
                  class="cursor-pointer"
                  @click="navigateTo(`/staff/students/${s.uuid}?date=${day}`)"
                >
                  <TableCell>
                    <div class="flex items-center gap-2">
                      <Avatar class="size-8 max-sm:hidden">
                        <AvatarImage v-if="s.image" :src="s.image" class="object-cover" />
                        <AvatarFallback>{{ s.full_name.slice(0, 2) }}</AvatarFallback>
                      </Avatar>
                      <div class="min-w-0">
                        <div class="max-w-[40vw] truncate font-medium sm:max-w-none">
                          {{ s.full_name }}
                        </div>
                        <div class="flex items-center gap-1.5 text-xs text-muted-foreground">
                          {{ s.username }}
                          <Badge v-if="!s.is_active" variant="destructive" class="h-4 px-1.5 text-[10px]">
                            Bloklangan
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell class="text-center">
                    {{ s.shift ?? '—' }}
                  </TableCell>
                  <TableCell v-for="n in 3" :key="n" class="text-center">
                    <StepStatusIcon :status="s.steps?.[n - 1]" />
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="report" class="space-y-3">
        <div class="flex flex-wrap items-center gap-2">
          <DateRangePicker v-model:from="from" v-model:to="to" :clearable="false" class="w-full sm:w-72" />
        </div>
        <Skeleton v-if="reportLoading && !report" class="h-60 w-full" />
        <Card v-else-if="report" class="py-0">
          <CardContent class="px-0">
            <p v-if="!report.days.length" class="p-6 text-center text-sm text-muted-foreground">
              Bu davrda amaliyot kunlari yo'q
            </p>
            <Table v-else>
              <TableHeader>
                <TableRow>
                  <TableHead class="sticky left-0 z-10 bg-background">
                    Talaba
                  </TableHead>
                  <TableHead v-for="d in report.days" :key="d" class="text-center text-xs whitespace-nowrap">
                    {{ d.slice(8, 10) }}.{{ d.slice(5, 7) }}
                  </TableHead>
                  <TableHead class="text-center">
                    Jami
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-for="s in report.students" :key="s.uuid">
                  <TableCell class="sticky left-0 z-10 max-w-48 truncate bg-background font-medium">
                    <NuxtLink :to="`/staff/students/${s.uuid}`" class="hover:underline">
                      {{ s.full_name }}
                    </NuxtLink>
                  </TableCell>
                  <TableCell v-for="d in report.days" :key="d" class="p-1 text-center">
                    <span class="inline-block w-9 rounded py-1 text-xs" :class="cellClass(s.days[d]?.passed)">
                      {{ s.days[d]?.passed ?? 0 }}
                    </span>
                  </TableCell>
                  <TableCell class="text-center font-medium">
                    {{ studentTotal(s.days) }}/{{ report.days.length }}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <p class="text-xs text-muted-foreground">
          Katakdagi raqam — o'sha kuni tasdiqlangan qadamlar soni (0–3).
        </p>
      </TabsContent>
    </Tabs>
  </div>
</template>
