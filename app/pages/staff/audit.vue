<script setup lang="ts">
import { SearchIcon, XIcon } from '@lucide/vue'
import { watchDebounced } from '@vueuse/core'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import AppPagination from '~/components/AppPagination.vue'
import DateRangePicker from '~/components/date/DateRangePicker.vue'
import type { AuditAction, AuditLogItem, Paginated } from '~/types'

const api = useApi()
const route = useRoute()
const router = useRouter()

const PAGE_SIZE = 30
const ALL = 'all'
const q = (key: string) => (route.query[key] as string) || ''

const filters = ref({
  search: q('search'),
  action: q('action') || ALL,
  model: q('model') || ALL,
  from: q('from'),
  to: q('to'),
})
const page = ref(Number(q('page')) || 1)
const data = ref<Paginated<AuditLogItem>>()
const loading = ref(false)
const options = ref<{ actions: { value: AuditAction, label: string }[], models: { value: string, label: string }[] }>({ actions: [], models: [] })

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
    data.value = await api.get<Paginated<AuditLogItem>>('/api/auth/audit-logs/', { ...query(), page_size: PAGE_SIZE })
  }
  finally {
    loading.value = false
  }
}

const nonSearch = computed(() => {
  const { search, ...rest } = filters.value
  return JSON.stringify(rest)
})
const reload = () => (page.value !== 1 ? (page.value = 1) : load())
watch(nonSearch, reload)
watchDebounced(() => filters.value.search, reload, { debounce: 350 })
watch(page, () => {
  load()
  window.scrollTo({ top: 0, behavior: 'smooth' })
})

// sana oralig'i (from + to) - bitta filtr
const activeCount = computed(() => Object.entries(filters.value).filter(([k, v]) => !['search', 'to'].includes(k) && v && v !== ALL).length
  + (!filters.value.from && filters.value.to ? 1 : 0))
function resetFilters() {
  filters.value = { search: filters.value.search, action: ALL, model: ALL, from: '', to: '' }
}

onMounted(async () => {
  load()
  options.value = await api.get('/api/auth/audit-logs/filters/')
})

const ACTION_VARIANT: Record<AuditAction, string> = {
  CREATE: 'bg-emerald-600 text-white',
  UPDATE: 'bg-sky-600 text-white',
  DELETE: 'bg-destructive text-white',
  LOGIN: 'bg-secondary text-secondary-foreground',
  LOGOUT: 'bg-secondary text-secondary-foreground',
}

const selected = ref<AuditLogItem | null>(null)

/** changes: {maydon: [oldin, keyin]} yoki boshqa qo'shimcha ma'lumot */
const changeRows = computed(() => {
  const changes = selected.value?.changes ?? {}
  return Object.entries(changes).map(([field, value]) =>
    Array.isArray(value) && value.length === 2
      ? { field, before: value[0], after: value[1], pair: true }
      : { field, before: null, after: value, pair: false },
  )
})
const show = (v: unknown) => (v === null || v === undefined || v === '' ? '—' : typeof v === 'object' ? JSON.stringify(v) : String(v))
const summaryOf = (log: AuditLogItem) => {
  if (log.action === 'LOGIN')
    return log.changes.success ? 'Muvaffaqiyatli kirish' : `Kirish rad etildi (${log.changes.login ?? ''})`
  if (log.action === 'UPDATE')
    return Object.keys(log.changes).filter(k => !['reason', 'attempt'].includes(k)).join(', ')
  return ''
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-end justify-between gap-2">
      <div>
        <h1 class="text-xl font-semibold">
          Audit jurnal
        </h1>
        <p class="text-sm text-muted-foreground">
          Tizimdagi barcha amallar: kim, qachon, nimani o'zgartirdi
        </p>
      </div>
      <span class="text-sm text-muted-foreground tabular-nums">{{ data?.count ?? 0 }} ta yozuv</span>
    </div>

    <div class="flex flex-wrap items-center gap-2">
      <div class="relative w-full min-w-0 sm:w-60">
        <SearchIcon class="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input v-model="filters.search" placeholder="Foydalanuvchi yoki obyekt" class="pl-8" />
      </div>
      <Select v-model="filters.action">
        <SelectTrigger class="w-[calc(50%-0.25rem)] sm:w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem :value="ALL">
            Barcha amallar
          </SelectItem>
          <SelectItem v-for="a in options.actions" :key="a.value" :value="a.value">
            {{ a.label }}
          </SelectItem>
        </SelectContent>
      </Select>
      <Select v-model="filters.model">
        <SelectTrigger class="w-[calc(50%-0.25rem)] sm:w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem :value="ALL">
            Barcha obyektlar
          </SelectItem>
          <SelectItem v-for="m in options.models" :key="m.value" :value="m.value">
            {{ m.label }}
          </SelectItem>
        </SelectContent>
      </Select>
      <DateRangePicker v-model:from="filters.from" v-model:to="filters.to" class="w-full sm:w-64" />
      <Button v-if="activeCount" variant="ghost" size="sm" @click="resetFilters">
        <XIcon /> Tozalash ({{ activeCount }})
      </Button>
    </div>

    <Skeleton v-if="!data" class="h-96 w-full" />
    <Card v-else-if="!data.results.length">
      <CardContent class="py-12 text-center text-sm text-muted-foreground">
        Yozuvlar topilmadi
      </CardContent>
    </Card>

    <template v-else>
      <!-- desktop -->
      <Card class="hidden py-0 md:block" :class="{ 'opacity-60': loading }">
        <CardContent class="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead class="pl-4">
                  Vaqt
                </TableHead>
                <TableHead>Foydalanuvchi</TableHead>
                <TableHead>Amal</TableHead>
                <TableHead>Obyekt</TableHead>
                <TableHead>IP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="log in data.results" :key="log.uuid" class="cursor-pointer" @click="selected = log">
                <TableCell class="pl-4 text-sm whitespace-nowrap tabular-nums">
                  {{ formatDateTime(log.created_at) }}
                </TableCell>
                <TableCell>
                  <template v-if="log.user">
                    <div class="max-w-48 truncate font-medium">
                      {{ log.user.full_name }}
                    </div>
                    <div class="text-xs text-muted-foreground">
                      {{ ROLE_LABELS[log.user.role] }} · {{ log.user.username }}
                    </div>
                  </template>
                  <span v-else class="text-muted-foreground">Tizim / mehmon</span>
                </TableCell>
                <TableCell>
                  <Badge :class="ACTION_VARIANT[log.action]">
                    {{ log.action_display }}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div class="max-w-72 truncate">
                    <span v-if="log.model" class="text-muted-foreground">{{ log.model.label }}:</span>
                    {{ log.object_repr || '—' }}
                  </div>
                  <div v-if="summaryOf(log)" class="max-w-72 truncate text-xs text-muted-foreground">
                    {{ summaryOf(log) }}
                  </div>
                </TableCell>
                <TableCell class="text-xs text-muted-foreground tabular-nums">
                  {{ log.ip_address || '—' }}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <!-- mobil -->
      <div class="grid gap-2 md:hidden" :class="{ 'opacity-60': loading }">
        <Card v-for="log in data.results" :key="log.uuid" class="gap-0 py-0" @click="selected = log">
          <CardContent class="space-y-1 p-3">
            <div class="flex items-center justify-between gap-2">
              <Badge :class="ACTION_VARIANT[log.action]">
                {{ log.action_display }}
              </Badge>
              <span class="text-xs text-muted-foreground tabular-nums">{{ formatDateTime(log.created_at) }}</span>
            </div>
            <div class="truncate text-sm">
              <span v-if="log.model" class="text-muted-foreground">{{ log.model.label }}:</span>
              {{ log.object_repr || '—' }}
            </div>
            <div class="truncate text-xs text-muted-foreground">
              {{ log.user?.full_name || 'Tizim / mehmon' }}
            </div>
          </CardContent>
        </Card>
      </div>

      <AppPagination v-if="data.count > PAGE_SIZE" v-model:page="page" :total="data.count" :per-page="PAGE_SIZE" :disabled="loading" />
    </template>

    <Sheet :open="!!selected" @update:open="!$event && (selected = null)">
      <SheetContent v-if="selected" class="w-full sm:max-w-xl">
        <SheetHeader>
          <SheetTitle class="flex items-center gap-2">
            <Badge :class="ACTION_VARIANT[selected.action]">
              {{ selected.action_display }}
            </Badge>
            <span class="truncate">{{ selected.object_repr || selected.model?.label || '—' }}</span>
          </SheetTitle>
          <SheetDescription>
            {{ formatDateTime(selected.created_at) }} ·
            {{ selected.user ? `${selected.user.full_name} (${ROLE_LABELS[selected.user.role]})` : 'Tizim / mehmon' }}
          </SheetDescription>
        </SheetHeader>
        <ScrollArea class="min-h-0 flex-1 px-4">
          <dl class="mb-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
            <dt class="text-muted-foreground">
              Obyekt
            </dt>
            <dd>{{ selected.model?.label || '—' }} <span v-if="selected.object_id" class="text-muted-foreground">#{{ selected.object_id }}</span></dd>
            <dt class="text-muted-foreground">
              So'rov
            </dt>
            <dd class="break-all">
              {{ selected.method }} {{ selected.path || '—' }}
            </dd>
            <dt class="text-muted-foreground">
              IP
            </dt>
            <dd>{{ selected.ip_address || '—' }}</dd>
            <dt class="text-muted-foreground">
              Qurilma
            </dt>
            <dd class="text-xs break-all text-muted-foreground">
              {{ selected.user_agent || '—' }}
            </dd>
          </dl>

          <Table v-if="changeRows.length">
            <TableHeader>
              <TableRow>
                <TableHead>Maydon</TableHead>
                <TableHead>Oldin</TableHead>
                <TableHead>Keyin</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="row in changeRows" :key="row.field">
                <TableCell class="align-top font-medium">
                  {{ row.field }}
                </TableCell>
                <TableCell class="align-top break-all whitespace-normal text-muted-foreground">
                  {{ row.pair ? show(row.before) : '' }}
                </TableCell>
                <TableCell class="align-top break-all whitespace-normal">
                  {{ show(row.after) }}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
          <p v-else class="text-sm text-muted-foreground">
            Qo'shimcha ma'lumot yo'q
          </p>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  </div>
</template>
