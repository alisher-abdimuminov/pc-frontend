<script setup lang="ts">
import { KeyRoundIcon, LoaderCircleIcon, PencilIcon, PlusIcon, SearchIcon, ShieldUserIcon } from '@lucide/vue'
import { toast } from 'vue-sonner'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import PermissionEditor from '~/components/staff/PermissionEditor.vue'
import type { Permission, PermissionDef, StaffUser } from '~/types'

/** little roli xodimlari: faqat admin boshqaradi. Har bir xodim faqat berilgan permission'lar bo'yicha bo'limlarni ko'radi. */
const api = useApi()
const items = ref<StaffUser[]>()
const catalog = ref<PermissionDef[]>([])
const search = ref('')

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  return (items.value ?? []).filter(u => !q || u.full_name.toLowerCase().includes(q) || u.username.toLowerCase().includes(q))
})

async function load() {
  ;[items.value, catalog.value] = await Promise.all([
    api.get<StaffUser[]>('/api/auth/staff/'),
    api.get<PermissionDef[]>('/api/auth/permissions/'),
  ])
}
onMounted(load)

// bo'lim bo'yicha qisqa ko'rinish: "Lokatsiyalar (3)"
function summary(perms: Permission[]) {
  const sections = new Map<string, number>()
  for (const code of perms) {
    const def = catalog.value.find(p => p.code === code)
    if (def)
      sections.set(def.section, (sections.get(def.section) ?? 0) + 1)
  }
  return [...sections.entries()]
}

// --- forma ---
const open = ref(false)
const saving = ref(false)
const editing = ref<StaffUser | null>(null)
const form = reactive({ username: '', full_name: '', password: '', is_active: true, permissions: [] as Permission[] })

function openForm(user?: StaffUser) {
  editing.value = user ?? null
  Object.assign(form, {
    username: user?.username ?? '',
    full_name: user?.full_name ?? '',
    password: '',
    is_active: user?.is_active ?? true,
    permissions: [...(user?.permissions ?? [])],
  })
  open.value = true
}

async function save() {
  if (!editing.value && form.password.length < 6)
    return toast.error('Parol kamida 6 belgidan iborat bo\'lsin')
  saving.value = true
  try {
    const body: Record<string, any> = {
      full_name: form.full_name,
      is_active: form.is_active,
      permissions: form.permissions,
    }
    if (form.password)
      body.password = form.password
    if (editing.value) {
      await api.patch(`/api/auth/staff/${editing.value.uuid}/`, body)
    }
    else {
      await api.post('/api/auth/staff/', { ...body, username: form.username })
    }
    toast.success('Saqlandi')
    open.value = false
    await load()
  }
  catch (e: any) {
    toast.error(e.message)
  }
  finally {
    saving.value = false
  }
}

async function toggleActive(user: StaffUser, value: boolean) {
  try {
    await api.patch(`/api/auth/staff/${user.uuid}/`, { is_active: value })
    user.is_active = value
    toast.success(value ? `${user.full_name} faollashtirildi` : `${user.full_name} o'chirildi`)
  }
  catch (e: any) {
    toast.error(e.message)
  }
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="text-xl font-semibold">
          Xodimlar
        </h1>
        <p class="text-sm text-muted-foreground">
          "Little" roli: faqat berilgan ruxsatlar bo'yicha bo'limlarni ko'radi
        </p>
      </div>
      <div class="flex w-full gap-2 sm:w-auto">
        <div class="relative min-w-0 flex-1 sm:w-60">
          <SearchIcon class="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input v-model="search" placeholder="Ism yoki login" class="pl-8" />
        </div>
        <Button @click="openForm()">
          <PlusIcon /> <span class="max-sm:hidden">Yangi xodim</span>
        </Button>
      </div>
    </div>

    <Skeleton v-if="!items" class="h-60 w-full" />
    <Card v-else-if="!filtered.length">
      <CardContent class="flex flex-col items-center gap-2 py-12 text-center text-sm text-muted-foreground">
        <ShieldUserIcon class="size-8" />
        Xodimlar yo'q
      </CardContent>
    </Card>

    <template v-else>
      <!-- desktop -->
      <Card class="hidden py-0 md:block">
        <CardContent class="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead class="pl-4">
                  Xodim
                </TableHead>
                <TableHead>Ruxsatlar</TableHead>
                <TableHead>Oxirgi kirish</TableHead>
                <TableHead>Faol</TableHead>
                <TableHead class="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="u in filtered" :key="u.uuid">
                <TableCell class="pl-4">
                  <div class="font-medium">
                    {{ u.full_name }}
                  </div>
                  <div class="text-xs text-muted-foreground">
                    {{ u.username }}
                  </div>
                </TableCell>
                <TableCell>
                  <div class="flex max-w-md flex-wrap gap-1">
                    <Badge v-for="[section, n] in summary(u.permissions)" :key="section" variant="secondary">
                      {{ section }} ({{ n }})
                    </Badge>
                    <span v-if="!u.permissions.length" class="text-xs text-muted-foreground">Faqat bosh sahifa</span>
                  </div>
                </TableCell>
                <TableCell class="text-sm whitespace-nowrap text-muted-foreground">
                  {{ u.last_login ? formatDateTime(u.last_login) : '—' }}
                </TableCell>
                <TableCell>
                  <Switch :model-value="u.is_active" :aria-label="`${u.full_name} faol`" @update:model-value="toggleActive(u, $event)" />
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon-sm" aria-label="Tahrirlash" @click="openForm(u)">
                    <PencilIcon />
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <!-- mobil -->
      <div class="grid gap-2 md:hidden">
        <Card v-for="u in filtered" :key="u.uuid" class="gap-0 py-0">
          <CardContent class="space-y-2 p-4">
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0">
                <div class="truncate font-medium">
                  {{ u.full_name }}
                </div>
                <div class="text-xs text-muted-foreground">
                  {{ u.username }}
                </div>
              </div>
              <Switch :model-value="u.is_active" :aria-label="`${u.full_name} faol`" @update:model-value="toggleActive(u, $event)" />
            </div>
            <div class="flex flex-wrap gap-1">
              <Badge v-for="[section, n] in summary(u.permissions)" :key="section" variant="secondary">
                {{ section }} ({{ n }})
              </Badge>
              <span v-if="!u.permissions.length" class="text-xs text-muted-foreground">Faqat bosh sahifa</span>
            </div>
            <Button variant="outline" size="sm" class="w-full" @click="openForm(u)">
              <PencilIcon /> Tahrirlash
            </Button>
          </CardContent>
        </Card>
      </div>
    </template>

    <Sheet v-model:open="open">
      <SheetContent class="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{{ editing ? 'Xodimni tahrirlash' : 'Yangi xodim' }}</SheetTitle>
          <SheetDescription>"Little" roli. Belgilanmagan bo'limlar unga ko'rinmaydi.</SheetDescription>
        </SheetHeader>
        <form id="staff-form" class="space-y-4 px-4" @submit.prevent="save">
          <div class="grid gap-1.5">
            <Label for="staff-name">F.I.Sh</Label>
            <Input id="staff-name" v-model="form.full_name" required />
          </div>
          <div class="grid gap-1.5">
            <Label for="staff-login">Login</Label>
            <Input id="staff-login" v-model="form.username" required :disabled="!!editing" autocomplete="off" />
          </div>
          <div class="grid gap-1.5">
            <Label for="staff-password">{{ editing ? 'Yangi parol (ixtiyoriy)' : 'Parol' }}</Label>
            <div class="relative">
              <KeyRoundIcon class="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="staff-password" v-model="form.password" type="password" class="pl-8" autocomplete="new-password" :required="!editing" minlength="6" />
            </div>
          </div>
          <Label class="flex items-center justify-between rounded-lg border p-3 font-normal">
            <span>
              <span class="block font-medium">Faol</span>
              <span class="text-xs text-muted-foreground">O'chirilsa tizimga kira olmaydi</span>
            </span>
            <Switch v-model="form.is_active" />
          </Label>
          <div class="space-y-2">
            <Label>Ruxsatlar</Label>
            <Alert v-if="!form.permissions.length">
              <AlertDescription>Ruxsat berilmasa xodim faqat bosh sahifani ko'radi.</AlertDescription>
            </Alert>
            <PermissionEditor v-model="form.permissions" :catalog="catalog" />
          </div>
        </form>
        <SheetFooter>
          <Button type="submit" form="staff-form" :disabled="saving">
            <LoaderCircleIcon v-if="saving" class="animate-spin" /> Saqlash
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  </div>
</template>
