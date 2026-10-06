<script setup lang="ts">
import { CalendarDaysIcon, EllipsisVerticalIcon, ExternalLinkIcon, EyeIcon, SearchIcon, ShieldAlertIcon, ShieldCheckIcon, SlidersHorizontalIcon, XIcon } from '@lucide/vue'
import { watchDebounced } from '@vueuse/core'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import AppPagination from '~/components/AppPagination.vue'
import AttemptFilters from '~/components/staff/AttemptFilters.vue'
import type { AttemptFilterState } from '~/components/staff/AttemptFilters.vue'
import StudentStatusDialog from '~/components/staff/StudentStatusDialog.vue'
import { useAuthStore } from '~/stores/auth'
import type { AttemptListItem, GroupItem, Paginated } from '~/types'

const api = useApi()
const auth = useAuthStore()
const canAttendance = computed(() => auth.can('attendance.view_attendance'))
const route = useRoute()
const router = useRouter()

const PAGE_SIZE = 20
const ALL = 'all'

// filtrlar URL bilan sinxron - havolani ulashish / orqaga qaytish ishlaydi
const q = (key: string) => (route.query[key] as string) || ''
const filters = ref<AttemptFilterState>({
  search: q('search'),
  from: q('from'),
  to: q('to'),
  group: q('group') || ALL,
  result: q('result') || ALL,
  error_code: q('error_code') || ALL,
  step: q('step') || ALL,
})
const page = ref(Number(q('page')) || 1)

const data = ref<Paginated<AttemptListItem>>()
const loading = ref(false)
const groups = ref<GroupItem[]>([])
const errorCodes = ref<{ code: string, label: string }[]>([])

function query() {
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(filters.value)) {
    if (v && v !== ALL)
      out[k] = v
  }
  if (page.value > 1)
    out.page = String(page.value)
  return out
}

async function load() {
  loading.value = true
  router.replace({ query: query() })
  try {
    data.value = await api.get<Paginated<AttemptListItem>>('/api/attendance/attempts/', { ...query(), page_size: PAGE_SIZE })
  }
  catch (e: any) {
    // filtr o'zgarib sahifa yo'qolib qolsa - 1-sahifaga
    if (e.status === 404 && page.value > 1) {
      page.value = 1
      return
    }
    throw e
  }
  finally {
    loading.value = false
  }
}

// qidiruvdan boshqa filtrlar - darhol; qidiruv - debounce bilan
const nonSearch = computed(() => {
  const { search, ...rest } = filters.value
  return JSON.stringify(rest)
})
watch(nonSearch, () => {
  if (page.value !== 1)
    page.value = 1
  else
    load()
})
watchDebounced(() => filters.value.search, () => {
  if (page.value !== 1)
    page.value = 1
  else
    load()
}, { debounce: 350 })
watch(page, () => {
  load()
  window.scrollTo({ top: 0, behavior: 'smooth' })
})

// sana oralig'i (from + to) - bitta filtr
const activeCount = computed(() => Object.entries(filters.value).filter(([k, v]) => !['search', 'to'].includes(k) && v && v !== ALL).length
  + (!filters.value.from && filters.value.to ? 1 : 0))
function resetFilters() {
  filters.value = { search: filters.value.search, from: '', to: '', group: ALL, result: ALL, error_code: ALL, step: ALL }
}

onMounted(async () => {
  load()
  ;[groups.value, { error_codes: errorCodes.value }] = await Promise.all([
    auth.can('users.view_group') ? api.get<GroupItem[]>('/api/attendance/groups/') : Promise.resolve([]),
    api.get<{ error_codes: { code: string, label: string }[] }>('/api/attendance/attempts/filters/'),
  ])
})

const rangeText = computed(() => {
  const count = data.value?.count ?? 0
  if (!count)
    return '0 ta'
  const start = (page.value - 1) * PAGE_SIZE + 1
  return `${start}–${Math.min(count, start + PAGE_SIZE - 1)} / ${count}`
})

// --- tafsilot va bloklash ---
const selected = ref<AttemptListItem | null>(null)
const statusTarget = ref<AttemptListItem | null>(null)
const statusOpen = ref(false)

function openStatus(a: AttemptListItem) {
  statusTarget.value = a
  statusOpen.value = true
}

function onStatusChanged(isActive: boolean) {
  const uuid = statusTarget.value?.student.uuid
  // shu talabaning barcha qatorlari yangilanadi
  for (const item of data.value?.results ?? []) {
    if (item.student.uuid === uuid)
      item.student.is_active = isActive
  }
}

const mapUrl = (a: AttemptListItem) => `https://maps.google.com/?q=${a.latitude},${a.longitude}`
const time = (iso: string) => formatTime(new Date(iso))
const studentUrl = (a: AttemptListItem) => `/staff/students/${a.student.uuid}?date=${a.date}`
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-end justify-between gap-2">
      <div>
        <h1 class="text-xl font-semibold">
          Urinishlar
        </h1>
        <p class="text-sm text-muted-foreground">
          Joylashuv va FaceID bo'yicha barcha urinishlar
        </p>
      </div>
      <span class="text-sm text-muted-foreground tabular-nums">{{ rangeText }}</span>
    </div>

    <!-- qidiruv + filtrlar -->
    <div class="flex flex-wrap items-center gap-2">
      <div class="relative min-w-0 flex-1 lg:max-w-60">
        <SearchIcon class="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input v-model="filters.search" placeholder="F.I.Sh yoki ID" class="pl-8" />
      </div>

      <!-- mobil/planshet: filtrlar Sheet ichida -->
      <Sheet>
        <SheetTrigger as-child>
          <Button variant="outline" class="lg:hidden">
            <SlidersHorizontalIcon /> Filtrlar
            <Badge v-if="activeCount" class="ml-1 h-5 min-w-5 rounded-full px-1.5 tabular-nums">
              {{ activeCount }}
            </Badge>
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" class="max-h-[85dvh] overflow-y-auto rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>Filtrlar</SheetTitle>
            <SheetDescription>{{ rangeText }}</SheetDescription>
          </SheetHeader>
          <div class="px-4">
            <AttemptFilters v-model="filters" :groups="groups" :error-codes="errorCodes" :all="ALL" layout="stack" />
          </div>
          <SheetFooter class="flex-row">
            <Button variant="outline" class="flex-1" :disabled="!activeCount" @click="resetFilters">
              Tozalash
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <!-- desktop: bir qatorda -->
      <div class="hidden lg:contents">
        <AttemptFilters v-model="filters" :groups="groups" :error-codes="errorCodes" :all="ALL" layout="row" />
        <Button v-if="activeCount" variant="ghost" size="sm" @click="resetFilters">
          <XIcon /> Tozalash ({{ activeCount }})
        </Button>
      </div>
    </div>

    <Skeleton v-if="!data" class="h-96 w-full" />

    <Card v-else-if="!data.results.length">
      <CardContent class="py-12 text-center text-sm text-muted-foreground">
        Urinishlar topilmadi
      </CardContent>
    </Card>

    <template v-else>
      <!-- desktop: jadval -->
      <Card class="hidden py-0 md:block" :class="{ 'opacity-60': loading }">
        <CardContent class="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead class="w-16 pl-4">
                  Rasm
                </TableHead>
                <TableHead>Talaba</TableHead>
                <TableHead>Vaqt</TableHead>
                <TableHead class="text-center">
                  Qadam
                </TableHead>
                <TableHead class="text-center">
                  Joy
                </TableHead>
                <TableHead class="text-center">
                  Yuz
                </TableHead>
                <TableHead>Natija</TableHead>
                <TableHead class="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="a in data.results" :key="a.uuid" class="cursor-pointer" @click="selected = a">
                <TableCell class="pl-4">
                  <img :src="a.image" class="size-11 rounded-md object-cover" alt="" loading="lazy">
                </TableCell>
                <TableCell>
                  <div class="flex items-center gap-2">
                    <span class="max-w-52 truncate font-medium">{{ a.student.full_name }}</span>
                    <Badge v-if="!a.student.is_active" variant="destructive" class="shrink-0">
                      Bloklangan
                    </Badge>
                  </div>
                  <div class="max-w-60 truncate text-xs text-muted-foreground">
                    {{ a.student.username }} · {{ a.group }}
                  </div>
                </TableCell>
                <TableCell class="whitespace-nowrap">
                  <div>{{ formatDate(a.date) }}</div>
                  <div class="text-xs text-muted-foreground tabular-nums">
                    {{ time(a.attempted_at) }}
                  </div>
                </TableCell>
                <TableCell class="text-center whitespace-nowrap">
                  {{ a.step }}<span class="text-xs text-muted-foreground"> · {{ a.shift }}-sm</span>
                </TableCell>
                <TableCell class="text-center">
                  <span :class="a.location_verified ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'">
                    {{ a.location_verified ? '✓' : '✗' }}
                  </span>
                </TableCell>
                <TableCell class="text-center whitespace-nowrap">
                  <span v-if="a.face_distance == null && !a.face_verified" class="text-muted-foreground">—</span>
                  <template v-else>
                    <span :class="a.face_verified ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'">
                      {{ a.face_verified ? '✓' : '✗' }}
                    </span>
                    <div v-if="a.face_distance != null" class="text-[10px] text-muted-foreground tabular-nums">
                      {{ a.face_distance.toFixed(2) }}
                    </div>
                  </template>
                </TableCell>
                <TableCell>
                  <Badge v-if="a.success" class="bg-emerald-600 text-white">
                    ✓ Tasdiqlandi
                  </Badge>
                  <div v-else>
                    <Badge variant="destructive">
                      ✗ Rad etildi
                    </Badge>
                    <div class="mt-0.5 max-w-48 truncate text-xs text-muted-foreground">
                      {{ a.error_message }}
                    </div>
                  </div>
                </TableCell>
                <TableCell @click.stop>
                  <DropdownMenu>
                    <DropdownMenuTrigger as-child>
                      <Button variant="ghost" size="icon-sm" aria-label="Amallar">
                        <EllipsisVerticalIcon />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" class="w-56">
                      <DropdownMenuItem @select="selected = a">
                        <EyeIcon /> Batafsil
                      </DropdownMenuItem>
                      <DropdownMenuItem v-if="canAttendance" @select="navigateTo(studentUrl(a))">
                        <CalendarDaysIcon /> Shu kungi davomat
                      </DropdownMenuItem>
                      <template v-if="auth.can('users.change_user')">
                        <DropdownMenuSeparator />
                        <DropdownMenuItem v-if="a.student.is_active" variant="destructive" @select="openStatus(a)">
                          <ShieldAlertIcon /> Talabani bloklash
                        </DropdownMenuItem>
                        <DropdownMenuItem v-else @select="openStatus(a)">
                          <ShieldCheckIcon /> Qayta faollashtirish
                        </DropdownMenuItem>
                      </template>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <!-- mobil: kartochkalar -->
      <div class="grid gap-2 md:hidden" :class="{ 'opacity-60': loading }">
        <Card v-for="a in data.results" :key="a.uuid" class="gap-0 py-0" @click="selected = a">
          <CardContent class="flex gap-3 p-3">
            <img :src="a.image" class="size-16 shrink-0 rounded-lg object-cover" alt="" loading="lazy">
            <div class="min-w-0 flex-1 space-y-1">
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                  <div class="truncate text-sm font-medium">
                    {{ a.student.full_name }}
                  </div>
                  <div class="truncate text-xs text-muted-foreground">
                    {{ a.group }}
                  </div>
                </div>
                <Badge v-if="a.success" class="shrink-0 bg-emerald-600 text-white">
                  ✓
                </Badge>
                <Badge v-else variant="destructive" class="shrink-0">
                  ✗
                </Badge>
              </div>
              <p v-if="!a.success" class="truncate text-xs text-rose-600 dark:text-rose-400">
                {{ a.error_message }}
              </p>
              <div class="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground tabular-nums">
                <span>{{ formatDate(a.date) }} {{ time(a.attempted_at) }}</span>
                <span>· {{ a.step }}-qadam</span>
                <Badge v-if="!a.student.is_active" variant="destructive" class="h-4 px-1.5 text-[10px]">
                  Bloklangan
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <AppPagination v-if="data.count > PAGE_SIZE" v-model:page="page" :total="data.count" :per-page="PAGE_SIZE" :disabled="loading" />
    </template>

    <!-- batafsil -->
    <Dialog :open="!!selected" @update:open="!$event && (selected = null)">
      <DialogContent v-if="selected" class="max-h-[92dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle class="flex flex-wrap items-center gap-2 pr-6">
            {{ selected.student.full_name }}
            <Badge v-if="!selected.student.is_active" variant="destructive">
              Bloklangan
            </Badge>
          </DialogTitle>
          <DialogDescription>
            {{ selected.group }} · {{ formatDate(selected.date) }} {{ time(selected.attempted_at) }} ·
            {{ selected.step }}-qadam, {{ selected.shift }}-smena
          </DialogDescription>
        </DialogHeader>

        <div class="grid grid-cols-2 gap-3">
          <figure class="space-y-1">
            <img :src="selected.image" class="aspect-[3/4] w-full rounded-lg object-cover" alt="">
            <figcaption class="text-center text-xs text-muted-foreground">
              Urinishdagi rasm
            </figcaption>
          </figure>
          <figure class="space-y-1">
            <img v-if="selected.student.image" :src="selected.student.image" class="aspect-[3/4] w-full rounded-lg object-cover" alt="">
            <div v-else class="grid aspect-[3/4] place-items-center rounded-lg bg-muted text-sm text-muted-foreground">
              Rasm yo'q
            </div>
            <figcaption class="text-center text-xs text-muted-foreground">
              Profil (HEMIS) rasmi
            </figcaption>
          </figure>
        </div>

        <dl class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
          <dt class="text-muted-foreground">
            Natija
          </dt>
          <dd :class="selected.success ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'">
            {{ selected.success ? '✓ Tasdiqlandi' : `✗ ${selected.error_message}` }}
          </dd>
          <dt class="text-muted-foreground">
            Joylashuv
          </dt>
          <dd>
            {{ selected.location_verified ? '✓ hududda' : '✗ hududdan tashqarida' }} · {{ selected.location_name }}
            <a :href="mapUrl(selected)" target="_blank" class="ml-1 inline-flex items-center gap-0.5 underline">
              xarita <ExternalLinkIcon class="size-3" />
            </a>
          </dd>
          <dt class="text-muted-foreground">
            Jonli yuz
          </dt>
          <dd>{{ selected.liveness_verified ? '✓ anti-spoofing o\'tdi' : '—' }}</dd>
          <dt class="text-muted-foreground">
            O'xshashlik
          </dt>
          <dd class="tabular-nums">
            <template v-if="selected.face_distance != null">
              masofa {{ selected.face_distance.toFixed(3) }} (chegara {{ selected.face_threshold?.toFixed(2) }})
              {{ selected.face_verified ? '✓' : '✗' }}
            </template>
            <template v-else>
              —
            </template>
          </dd>
          <dt class="text-muted-foreground">
            IP
          </dt>
          <dd class="tabular-nums">
            {{ selected.ip_address || '—' }}
          </dd>
        </dl>

        <Separator />

        <DialogFooter class="gap-2 sm:justify-between">
          <Button v-if="canAttendance" variant="outline" as-child>
            <NuxtLink :to="studentUrl(selected)">
              <CalendarDaysIcon /> Shu kungi davomat
            </NuxtLink>
          </Button>
          <template v-if="auth.can('users.change_user')">
            <Button v-if="selected.student.is_active" variant="destructive" @click="openStatus(selected)">
              <ShieldAlertIcon /> Shubhali — talabani bloklash
            </Button>
            <Button v-else variant="outline" @click="openStatus(selected)">
              <ShieldCheckIcon /> Qayta faollashtirish
            </Button>
          </template>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <StudentStatusDialog
      v-if="statusTarget"
      v-model:open="statusOpen"
      :student="statusTarget.student"
      :attempt-uuid="statusTarget.uuid"
      @changed="onStatusChanged"
    />
  </div>
</template>
