<script setup lang="ts">
import DatePicker from '~/components/date/DatePicker.vue'
import { watchDebounced } from '@vueuse/core'
import { ChevronsUpDownIcon, LoaderCircleIcon, PencilIcon, PlusIcon, Trash2Icon } from '@lucide/vue'
import { toast } from 'vue-sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Command, CommandGroup, CommandItem, CommandList } from '@/components/ui/command'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuthStore } from '~/stores/auth'
import type { GroupItem, Location, Schedule, StudentShort, Weekday } from '~/types'

const api = useApi()
const auth = useAuthStore()
const canEdit = computed(() => auth.can('attendance.change_schedule'))
const canDelete = computed(() => auth.can('attendance.delete_schedule'))

const items = ref<Schedule[]>([])
const groups = ref<GroupItem[]>([])
const locations = ref<Location[]>([])
const loading = ref(true)
const groupFilter = ref('all')
const onlyActive = ref(true)

async function load() {
  loading.value = true
  try {
    const query: Record<string, string> = {}
    if (groupFilter.value !== 'all')
      query.group = groupFilter.value
    if (onlyActive.value)
      query.active = '1'
    items.value = await api.get<Schedule[]>('/api/attendance/schedules/', query)
  }
  finally {
    loading.value = false
  }
}

onMounted(async () => {
  ;[groups.value, locations.value] = await Promise.all([
    auth.can('users.view_group') ? api.get<GroupItem[]>('/api/attendance/groups/') : Promise.resolve([]),
    auth.can('attendance.view_location') ? api.get<Location[]>('/api/attendance/locations/') : Promise.resolve([]),
  ])
})
watch([groupFilter, onlyActive], load, { immediate: true })

// --- forma ---
type Target = 'group' | 'user'
const open = ref(false)
const saving = ref(false)
const editing = ref<Schedule | null>(null)
const target = ref<Target>('group')
const form = reactive({
  name: '',
  start_date: '',
  end_date: '',
  location_uuid: '',
  group_uuid: '',
  user_uuid: '',
  user_label: '',
  is_active: true,
  days: [] as Weekday[],
})

function openForm(s?: Schedule) {
  editing.value = s ?? null
  target.value = s?.user ? 'user' : 'group'
  Object.assign(form, {
    name: s?.name ?? '',
    start_date: s?.start_date ?? '',
    end_date: s?.end_date ?? '',
    location_uuid: s?.location.uuid ?? '',
    group_uuid: s?.group?.uuid ?? '',
    user_uuid: s?.user?.uuid ?? '',
    user_label: s?.user?.full_name ?? '',
    is_active: s?.is_active ?? true,
    days: s ? WEEKDAYS.filter(d => s[d.key]).map(d => d.key) : [],
  })
  studentSearch.value = ''
  students.value = []
  open.value = true
}

function toggleDay(day: Weekday, checked: boolean | 'indeterminate') {
  form.days = checked === true ? [...form.days, day] : form.days.filter(d => d !== day)
}

// talaba qidirish (shaxsiy jadval uchun)
const studentSearch = ref('')
const students = ref<StudentShort[]>([])
const studentLoading = ref(false)
watchDebounced(studentSearch, async (q: string) => {
  if (q.trim().length < 2) {
    students.value = []
    return
  }
  studentLoading.value = true
  try {
    students.value = await api.get<StudentShort[]>('/api/auth/students/', { search: q })
  }
  finally {
    studentLoading.value = false
  }
}, { debounce: 300 })

const studentOpen = ref(false)

function pickStudent(s: StudentShort) {
  form.user_uuid = s.uuid
  form.user_label = `${s.full_name} (${s.group ?? ''})`
  studentOpen.value = false
}

async function save() {
  if (!form.start_date || !form.end_date)
    return toast.error('Boshlanish va tugash sanasini tanlang')
  if (!form.days.length)
    return toast.error('Kamida bitta hafta kunini tanlang')
  if (!form.location_uuid)
    return toast.error('Lokatsiyani tanlang')
  saving.value = true
  try {
    const body: Record<string, any> = {
      name: form.name,
      start_date: form.start_date,
      end_date: form.end_date,
      location_uuid: form.location_uuid,
      group_uuid: target.value === 'group' ? form.group_uuid || null : null,
      user_uuid: target.value === 'user' ? form.user_uuid || null : null,
      is_active: form.is_active,
    }
    for (const d of WEEKDAYS)
      body[d.key] = form.days.includes(d.key)

    if (editing.value)
      await api.patch(`/api/attendance/schedules/${editing.value.uuid}/`, body)
    else
      await api.post('/api/attendance/schedules/', body)
    open.value = false
    toast.success('Saqlandi')
    await load()
  }
  catch (e: any) {
    toast.error(e.message)
  }
  finally {
    saving.value = false
  }
}

const deleting = ref<Schedule | null>(null)
async function remove() {
  if (!deleting.value)
    return
  try {
    await api.del(`/api/attendance/schedules/${deleting.value.uuid}/`)
    deleting.value = null
    await load()
  }
  catch (e: any) {
    toast.error(e.message)
  }
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h1 class="text-xl font-semibold">
        Amaliyot jadvallari
      </h1>
      <Button v-if="auth.can('attendance.add_schedule')" @click="openForm()">
        <PlusIcon /> Yangi jadval
      </Button>
    </div>

    <div class="flex flex-wrap items-center gap-3">
      <Select v-model="groupFilter">
        <SelectTrigger class="w-56">
          <SelectValue placeholder="Guruh" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            Barcha guruhlar
          </SelectItem>
          <SelectItem v-for="g in groups" :key="g.uuid" :value="g.uuid">
            {{ g.name }}
          </SelectItem>
        </SelectContent>
      </Select>
      <label class="flex items-center gap-2 text-sm">
        <Checkbox v-model="onlyActive" /> Faqat faollari
      </label>
    </div>

    <Skeleton v-if="loading && !items.length" class="h-60 w-full" />
    <Card v-else class="py-0">
      <CardContent class="px-0">
        <p v-if="!items.length" class="p-8 text-center text-sm text-muted-foreground">
          Jadvallar yo'q
        </p>
        <Table v-else>
          <TableHeader>
            <TableRow>
              <TableHead>Nomi</TableHead>
              <TableHead>Kimga</TableHead>
              <TableHead>Kunlar</TableHead>
              <TableHead>Lokatsiya</TableHead>
              <TableHead>Davr</TableHead>
              <TableHead v-if="canEdit || canDelete" />
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="s in items" :key="s.uuid" :class="{ 'opacity-50': !s.is_active }">
              <TableCell class="font-medium">
                {{ s.name }}
              </TableCell>
              <TableCell>
                <Badge v-if="s.user" variant="outline">
                  {{ s.user.full_name }}
                </Badge>
                <span v-else>{{ s.group?.name }}</span>
              </TableCell>
              <TableCell>{{ s.weekdays.map(i => WEEKDAYS[i]?.short).join(', ') }}</TableCell>
              <TableCell>{{ s.location.name }}</TableCell>
              <TableCell class="text-xs whitespace-nowrap">
                {{ s.start_date }} — {{ s.end_date }}
              </TableCell>
              <TableCell v-if="canEdit || canDelete" class="text-right whitespace-nowrap">
                <Button v-if="canEdit" variant="ghost" size="icon-sm" aria-label="Tahrirlash" @click="openForm(s)">
                  <PencilIcon />
                </Button>
                <Button v-if="canDelete" variant="ghost" size="icon-sm" aria-label="O'chirish" @click="deleting = s">
                  <Trash2Icon />
                </Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>

    <Dialog v-model:open="open">
      <DialogContent class="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{{ editing ? 'Jadvalni tahrirlash' : 'Yangi jadval' }}</DialogTitle>
        </DialogHeader>
        <form id="schedule-form" class="space-y-3" @submit.prevent="save">
          <div class="space-y-1.5">
            <Label>Nomi</Label>
            <Input v-model="form.name" required placeholder="Masalan: 101-guruh kuzgi amaliyot" />
          </div>

          <Tabs v-model="target">
            <TabsList class="w-full">
              <TabsTrigger value="group" class="flex-1">
                Guruhga
              </TabsTrigger>
              <TabsTrigger value="user" class="flex-1">
                Talabaga (alohida)
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div v-if="target === 'group'" class="space-y-1.5">
            <Label>Guruh</Label>
            <Select v-model="form.group_uuid">
              <SelectTrigger class="w-full">
                <SelectValue placeholder="Guruhni tanlang" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="g in groups" :key="g.uuid" :value="g.uuid">
                  {{ g.name }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div v-else class="space-y-1.5">
            <Label>Talaba</Label>
            <Popover v-model:open="studentOpen">
              <PopoverTrigger as-child>
                <Button variant="outline" role="combobox" class="w-full justify-between font-normal" :class="{ 'text-muted-foreground': !form.user_uuid }">
                  <span class="truncate">{{ form.user_label || 'Talabani tanlang' }}</span>
                  <ChevronsUpDownIcon class="opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent class="w-(--reka-popover-trigger-width) p-0" align="start">
                <!-- qidiruv serverda: Command'ning ichki filtri ishlatilmaydi (natija kechikib keladi) -->
                <div class="border-b p-2">
                  <Input v-model="studentSearch" placeholder="F.I.Sh yoki ID (kamida 2 harf)" class="h-8" autofocus />
                </div>
                <Command>
                  <CommandList>
                    <p v-if="!students.length" class="py-6 text-center text-sm text-muted-foreground">
                      {{ studentSearch.trim().length < 2 ? 'Qidirish uchun yozing' : studentLoading ? 'Qidirilmoqda...' : 'Talaba topilmadi' }}
                    </p>
                    <CommandGroup v-else>
                      <CommandItem
                        v-for="st in students"
                        :key="st.uuid"
                        :value="st.uuid"
                        @select="pickStudent(st)"
                      >
                        <div class="min-w-0">
                          <div class="truncate">
                            {{ st.full_name }}
                          </div>
                          <div class="text-xs text-muted-foreground">
                            {{ st.username }} · {{ st.group }}
                          </div>
                        </div>
                      </CommandItem>
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <p class="text-xs text-muted-foreground">
              Shaxsiy jadval shu kunlarda guruh jadvalidan ustun turadi.
            </p>
          </div>

          <div class="space-y-1.5">
            <Label>Lokatsiya</Label>
            <Select v-model="form.location_uuid">
              <SelectTrigger class="w-full">
                <SelectValue placeholder="Amaliyot joyini tanlang" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="l in locations.filter(l => l.is_active)" :key="l.uuid" :value="l.uuid">
                  {{ l.name }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="space-y-1.5">
            <Label>Hafta kunlari</Label>
            <div class="grid grid-cols-3 gap-2">
              <label v-for="d in WEEKDAYS" :key="d.key" class="flex items-center gap-2 rounded-md border px-2 py-1.5 text-sm">
                <Checkbox :model-value="form.days.includes(d.key)" @update:model-value="toggleDay(d.key, $event)" />
                {{ d.label }}
              </label>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1.5">
              <Label>Boshlanish</Label>
              <DatePicker v-model="form.start_date" class="w-full" />
            </div>
            <div class="space-y-1.5">
              <Label>Tugash</Label>
              <DatePicker v-model="form.end_date" :min="form.start_date" class="w-full" />
            </div>
          </div>

          <label class="flex items-center gap-2 text-sm">
            <Checkbox v-model="form.is_active" /> Faol
          </label>
        </form>
        <DialogFooter>
          <Button type="submit" form="schedule-form" :disabled="saving">
            <LoaderCircleIcon v-if="saving" class="animate-spin" /> Saqlash
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog :open="!!deleting" @update:open="!$event && (deleting = null)">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Jadvalni o'chirasizmi?</DialogTitle>
          <DialogDescription>{{ deleting?.name }}. Davomat bo'lsa o'chirib bo'lmaydi — nofaol qiling.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" @click="deleting = null">
            Bekor qilish
          </Button>
          <Button variant="destructive" @click="remove">
            O'chirish
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
