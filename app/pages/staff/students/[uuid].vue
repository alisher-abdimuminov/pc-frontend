<script setup lang="ts">
import DatePicker from '~/components/date/DatePicker.vue'
import { ArrowLeftIcon, ShieldAlertIcon, ShieldCheckIcon } from '@lucide/vue'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import AttemptCard from '~/components/attendance/AttemptCard.vue'
import StepStatusIcon from '~/components/attendance/StepStatusIcon.vue'
import StudentStatusDialog from '~/components/staff/StudentStatusDialog.vue'
import { useAuthStore } from '~/stores/auth'
import type { AttendanceDetail, StatusHistoryItem, StudentAttendances } from '~/types'

const api = useApi()
const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const date = ref((route.query.date as string) || '')
const data = ref<StudentAttendances>()

async function load() {
  data.value = await api.get<StudentAttendances>(
    `/api/attendance/students/${route.params.uuid}/`,
    date.value ? { date: date.value } : undefined,
  )
}

// bloklash tarixi (oxirgi yozuv - joriy bloklash sababi)
const history = ref<StatusHistoryItem[]>([])
async function loadHistory() {
  history.value = await api.get<StatusHistoryItem[]>(`/api/auth/students/${route.params.uuid}/status/history/`)
}
onMounted(() => auth.can('users.view_user') && loadHistory())

const stepOf = (a: AttendanceDetail, n: number) => a.steps.find(s => s.step === n)

const statusOpen = ref(false)
function onStatusChanged(isActive: boolean) {
  if (data.value)
    data.value.student.is_active = isActive
  loadHistory()
}

watch(date, (value) => {
  router.replace({ query: value ? { date: value } : {} })
  load()
}, { immediate: true })
</script>

<template>
  <div class="mx-auto max-w-4xl space-y-4">
    <Button variant="ghost" size="sm" @click="router.back()">
      <ArrowLeftIcon /> Orqaga
    </Button>

    <template v-if="data">
      <div class="flex flex-wrap items-center gap-3">
        <Avatar class="size-16">
          <AvatarImage v-if="data.student.image" :src="data.student.image" class="object-cover" />
          <AvatarFallback>{{ data.student.full_name.slice(0, 2) }}</AvatarFallback>
        </Avatar>
        <div class="min-w-0 flex-1">
          <h1 class="flex flex-wrap items-center gap-2 text-lg font-semibold">
            {{ data.student.full_name }}
            <Badge v-if="!data.student.is_active" variant="destructive">
              Bloklangan
            </Badge>
          </h1>
          <p class="text-sm text-muted-foreground">
            {{ data.student.username }} · {{ data.student.group }}
          </p>
        </div>
        <template v-if="auth.can('users.change_user')">
          <Button v-if="data.student.is_active" variant="destructive" class="max-sm:w-full" @click="statusOpen = true">
            <ShieldAlertIcon /> Bloklash
          </Button>
          <Button v-else variant="outline" class="max-sm:w-full" @click="statusOpen = true">
            <ShieldCheckIcon /> Qayta faollashtirish
          </Button>
        </template>
      </div>

      <Alert v-if="!data.student.is_active" variant="destructive">
        <ShieldAlertIcon />
        <AlertTitle>Talaba bloklangan</AlertTitle>
        <AlertDescription>
          <template v-if="history[0] && !history[0].is_active">
            {{ history[0].reason }} — {{ history[0].by }}, {{ formatDateTime(history[0].at) }}
          </template>
          <template v-else>
            Tizimga kira olmaydi.
          </template>
        </AlertDescription>
      </Alert>

      <StudentStatusDialog v-model:open="statusOpen" :student="data.student" @changed="onStatusChanged" />

      <div class="flex items-center gap-2">
        <DatePicker v-model="date" placeholder="Barcha kunlar" clearable class="w-full sm:w-60" />
      </div>

      <Card v-if="!data.attendances.length">
        <CardContent class="py-10 text-center text-sm text-muted-foreground">
          Davomat yo'q
        </CardContent>
      </Card>

      <Card v-for="a in data.attendances" :key="a.uuid">
        <CardHeader>
          <CardTitle class="flex flex-wrap items-center gap-2 text-base">
            {{ formatDate(a.date) }}
            <Badge variant="outline">
              {{ a.shift }}-smena
            </Badge>
            <Badge>{{ a.passed_steps.length }}/3</Badge>
            <span class="text-sm font-normal text-muted-foreground">{{ a.location }}</span>
          </CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <!-- har doim 3 qadam: urinish bo'lmagan qadam ham "tasdiqlanmagan" bo'lib ko'rinadi -->
          <div v-for="n in 3" :key="n" class="space-y-2">
            <div class="flex items-center gap-2 text-sm font-medium">
              <StepStatusIcon :status="a.passed_steps.includes(n) ? 'passed' : 'missed'" />
              {{ n }}-qadam
              <span :class="a.passed_steps.includes(n) ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'">
                — {{ a.passed_steps.includes(n) ? 'tasdiqlangan' : 'tasdiqlanmagan' }}
              </span>
            </div>
            <!-- urinishlar (rasm, GPS, yuz) - faqat ruxsat bo'lsa -->
            <div v-if="data.can_view_attempts && stepOf(a, n)?.attempts?.length" class="grid gap-2 md:grid-cols-2">
              <AttemptCard v-for="at in stepOf(a, n)!.attempts" :key="at.uuid" :attempt="at" show-debug />
            </div>
          </div>
        </CardContent>
      </Card>
    </template>
  </div>
</template>
