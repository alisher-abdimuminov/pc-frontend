<script setup lang="ts">
import { CrosshairIcon, ExternalLinkIcon, LoaderCircleIcon, PencilIcon, PlusIcon, Trash2Icon } from '@lucide/vue'
import { toast } from 'vue-sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuthStore } from '~/stores/auth'
import type { Location } from '~/types'

const api = useApi()
const auth = useAuthStore()
const canAdd = computed(() => auth.can('attendance.add_location'))
const canEdit = computed(() => auth.can('attendance.change_location'))
const canDelete = computed(() => auth.can('attendance.delete_location'))
const items = ref<Location[]>([])
const loading = ref(true)

async function load() {
  loading.value = true
  try {
    items.value = await api.get<Location[]>('/api/attendance/locations/')
  }
  finally {
    loading.value = false
  }
}
onMounted(load)

const POINTS = ['point_1', 'point_2', 'point_3', 'point_4'] as const
type PointKey = typeof POINTS[number]

const open = ref(false)
const saving = ref(false)
const editing = ref<Location | null>(null)
const form = reactive({ name: '', location: '', is_active: true, point_1: '', point_2: '', point_3: '', point_4: '' })
const locating = ref<PointKey | null>(null)

function openForm(l?: Location) {
  editing.value = l ?? null
  Object.assign(form, {
    name: l?.name ?? '',
    location: l?.location ?? '',
    is_active: l?.is_active ?? true,
    point_1: l?.point_1 ?? '',
    point_2: l?.point_2 ?? '',
    point_3: l?.point_3 ?? '',
    point_4: l?.point_4 ?? '',
  })
  open.value = true
}

/** Joyida turib burchak nuqtasini olish */
async function useMyLocation(key: PointKey) {
  locating.value = key
  try {
    const geo = await getCurrentLocation()
    form[key] = `${geo.latitude.toFixed(6)},${geo.longitude.toFixed(6)}`
    if (geo.accuracy && geo.accuracy > 30)
      toast.warning(`Aniqlik past: ±${Math.round(geo.accuracy)} m`)
  }
  catch (e: any) {
    toast.error(e.message)
  }
  finally {
    locating.value = null
  }
}

// forma ichidagi polygon preview
const preview = computed(() => {
  const pts = POINTS.map((k) => {
    const [lat, lng] = form[k].split(',').map(v => Number.parseFloat(v))
    return Number.isFinite(lat) && Number.isFinite(lng) ? [lat!, lng!] as const : null
  })
  if (pts.some(p => !p))
    return null
  const lats = pts.map(p => p![0])
  const lngs = pts.map(p => p![1])
  const [minLat, maxLat, minLng, maxLng] = [Math.min(...lats), Math.max(...lats), Math.min(...lngs), Math.max(...lngs)]
  const span = Math.max(maxLat - minLat, maxLng - minLng) || 1e-6
  const svg = pts.map(p => `${((p![1] - minLng) / span) * 160 + 20},${((maxLat - p![0]) / span) * 160 + 20}`).join(' ')
  // taxminiy o'lcham (metr)
  const height = (maxLat - minLat) * 111_320
  const width = (maxLng - minLng) * 111_320 * Math.cos((minLat * Math.PI) / 180)
  return { svg, width: Math.round(width), height: Math.round(height), center: `${(minLat + maxLat) / 2},${(minLng + maxLng) / 2}` }
})

async function save() {
  saving.value = true
  try {
    const body = { ...form }
    if (editing.value)
      await api.patch(`/api/attendance/locations/${editing.value.uuid}/`, body)
    else
      await api.post('/api/attendance/locations/', body)
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

const deleting = ref<Location | null>(null)
async function remove() {
  if (!deleting.value)
    return
  try {
    await api.del(`/api/attendance/locations/${deleting.value.uuid}/`)
    deleting.value = null
    await load()
  }
  catch (e: any) {
    toast.error(e.message)
  }
}

function mapLink(l: Location) {
  const p = l.polygon[0]
  return p ? `https://maps.google.com/?q=${p[0]},${p[1]}` : '#'
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h1 class="text-xl font-semibold">
        Lokatsiyalar
      </h1>
      <Button v-if="canAdd" @click="openForm()">
        <PlusIcon /> Yangi lokatsiya
      </Button>
    </div>

    <Skeleton v-if="loading && !items.length" class="h-40 w-full" />
    <Card v-else-if="!items.length">
      <CardContent class="py-10 text-center text-sm text-muted-foreground">
        Lokatsiyalar yo'q
      </CardContent>
    </Card>
    <div v-else class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <Card v-for="l in items" :key="l.uuid" :class="{ 'opacity-60': !l.is_active }">
        <CardContent class="space-y-2">
          <div class="flex items-start justify-between gap-2">
            <div class="min-w-0">
              <div class="font-semibold">
                {{ l.name }}
              </div>
              <div class="truncate text-xs text-muted-foreground">
                {{ l.location || '—' }}
              </div>
            </div>
            <Badge v-if="!l.is_active" variant="outline">
              Nofaol
            </Badge>
          </div>
          <div class="flex gap-1">
            <Button v-if="canEdit" variant="outline" size="sm" @click="openForm(l)">
              <PencilIcon /> Tahrirlash
            </Button>
            <Button variant="ghost" size="sm" as-child>
              <a :href="mapLink(l)" target="_blank"><ExternalLinkIcon /> Xarita</a>
            </Button>
            <Button v-if="canDelete" variant="ghost" size="icon-sm" class="ml-auto" aria-label="O'chirish" @click="deleting = l">
              <Trash2Icon />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>

    <Dialog v-model:open="open">
      <DialogContent class="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{{ editing ? 'Lokatsiyani tahrirlash' : 'Yangi lokatsiya' }}</DialogTitle>
          <DialogDescription>
            Hududning 4 ta burchak nuqtasi "kenglik,uzunlik" formatida (masalan: 39.654321,66.987654).
            Joyida bo'lsangiz nishon tugmasi orqali joriy nuqtani olishingiz mumkin.
          </DialogDescription>
        </DialogHeader>
        <form id="location-form" class="space-y-3" @submit.prevent="save">
          <div class="space-y-1.5">
            <Label>Nomi</Label>
            <Input v-model="form.name" required placeholder="Masalan: 12-maktab" />
          </div>
          <div class="space-y-1.5">
            <Label>Manzil / izoh</Label>
            <Input v-model="form.location" />
          </div>
          <div v-for="(key, i) in POINTS" :key="key" class="space-y-1.5">
            <Label>{{ i + 1 }}-nuqta</Label>
            <div class="flex gap-2">
              <Input v-model="form[key]" required placeholder="39.654321,66.987654" />
              <Button type="button" variant="outline" size="icon" :disabled="!!locating" @click="useMyLocation(key)">
                <LoaderCircleIcon v-if="locating === key" class="animate-spin" />
                <CrosshairIcon v-else />
              </Button>
            </div>
          </div>
          <div v-if="preview" class="flex items-center gap-4 rounded-md border p-3">
            <svg viewBox="0 0 200 200" class="size-28 shrink-0 rounded bg-muted">
              <polygon :points="preview.svg" class="fill-primary/20 stroke-primary" stroke-width="2" />
            </svg>
            <div class="space-y-1 text-xs text-muted-foreground">
              <div>Taxminan {{ preview.width }} × {{ preview.height }} m</div>
              <div>Nuqtalar ketma-ket (soat strelkasi bo'yicha yoki teskari) kiritilishi kerak.</div>
              <a :href="`https://maps.google.com/?q=${preview.center}`" target="_blank" class="underline">Xaritada ko'rish</a>
            </div>
          </div>
          <label class="flex items-center gap-2 text-sm">
            <Checkbox v-model="form.is_active" /> Faol
          </label>
        </form>
        <DialogFooter>
          <Button type="submit" form="location-form" :disabled="saving">
            <LoaderCircleIcon v-if="saving" class="animate-spin" /> Saqlash
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog :open="!!deleting" @update:open="!$event && (deleting = null)">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Lokatsiyani o'chirasizmi?</DialogTitle>
          <DialogDescription>{{ deleting?.name }}. Ishlatilgan bo'lsa o'chirib bo'lmaydi — nofaol qiling.</DialogDescription>
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
