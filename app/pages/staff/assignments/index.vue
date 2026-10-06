<script setup lang="ts">
import DateTimePicker from '~/components/date/DateTimePicker.vue'
import { ChevronRightIcon, LoaderCircleIcon, PlusIcon } from '@lucide/vue'
import { toast } from 'vue-sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import GroupPicker from '~/components/staff/GroupPicker.vue'
import { useAuthStore } from '~/stores/auth'
import type { Assignment, GroupItem, Paginated } from '~/types'

const api = useApi()
const auth = useAuthStore()
const items = ref<Assignment[]>([])
const groups = ref<GroupItem[]>([])
const loading = ref(true)

async function load() {
  loading.value = true
  try {
    items.value = (await api.get<Paginated<Assignment>>('/api/assignments/')).results
  }
  finally {
    loading.value = false
  }
}

// --- yaratish (faqat o'qituvchi) ---
const open = ref(false)
const saving = ref(false)
const form = reactive({ title: '', description: '', deadline: '', groups: [] as string[], file: null as File | null })

async function openCreate() {
  Object.assign(form, { title: '', description: '', deadline: '', groups: [], file: null })
  if (!groups.value.length)
    groups.value = await api.get<GroupItem[]>('/api/attendance/groups/')
  open.value = true
}

async function create() {
  if (!form.deadline)
    return toast.error('Muddatni tanlang')
  if (!form.groups.length)
    return toast.error('Kamida bitta guruh tanlang')
  saving.value = true
  try {
    const body = new FormData()
    body.append('title', form.title)
    body.append('description', form.description)
    body.append('deadline', new Date(form.deadline).toISOString())
    form.groups.forEach(g => body.append('group_uuids', g))
    if (form.file)
      body.append('file', form.file)
    await api.post('/api/assignments/', body)
    open.value = false
    toast.success('Topshiriq yaratildi')
    await load()
  }
  catch (e: any) {
    toast.error(e.message)
  }
  finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between gap-3">
      <h1 class="text-xl font-semibold">
        Topshiriqlar
      </h1>
      <Button v-if="auth.isTeacher" @click="openCreate">
        <PlusIcon /> Yangi topshiriq
      </Button>
    </div>

    <Skeleton v-if="loading" class="h-40 w-full" />
    <Card v-else-if="!items.length">
      <CardContent class="py-10 text-center text-sm text-muted-foreground">
        Topshiriqlar yo'q
      </CardContent>
    </Card>
    <Card v-else class="py-0">
      <CardContent class="divide-y px-0">
        <NuxtLink
          v-for="a in items"
          :key="a.uuid"
          :to="`/staff/assignments/${a.uuid}`"
          class="flex items-center gap-3 px-4 py-3 hover:bg-muted/50"
        >
          <div class="min-w-0 flex-1">
            <div class="truncate font-medium">
              {{ a.title }}
            </div>
            <div class="text-xs text-muted-foreground">
              {{ a.groups.map(g => g.name).join(', ') }} · Muddat: {{ formatDateTime(a.deadline) }}
            </div>
          </div>
          <Badge v-if="a.is_expired" variant="outline">
            Yopilgan
          </Badge>
          <Badge variant="secondary">
            {{ a.submissions_count ?? 0 }} ta javob
          </Badge>
          <ChevronRightIcon class="size-4 text-muted-foreground" />
        </NuxtLink>
      </CardContent>
    </Card>

    <Dialog v-model:open="open">
      <DialogContent class="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Yangi topshiriq</DialogTitle>
        </DialogHeader>
        <form id="assignment-form" class="space-y-3" @submit.prevent="create">
          <div class="space-y-1.5">
            <Label>Sarlavha</Label>
            <Input v-model="form.title" required />
          </div>
          <div class="space-y-1.5">
            <Label>Tavsif</Label>
            <Textarea v-model="form.description" rows="3" />
          </div>
          <div class="space-y-1.5">
            <Label>Muddat</Label>
            <DateTimePicker v-model="form.deadline" class="w-full" />
          </div>
          <div class="space-y-1.5">
            <Label>Fayl (ixtiyoriy)</Label>
            <Input type="file" @change="form.file = ($event.target as HTMLInputElement).files?.[0] ?? null" />
          </div>
          <div class="space-y-1.5">
            <Label>Guruhlar</Label>
            <GroupPicker v-model="form.groups" :groups="groups" />
          </div>
        </form>
        <DialogFooter>
          <Button type="submit" form="assignment-form" :disabled="saving">
            <LoaderCircleIcon v-if="saving" class="animate-spin" /> Saqlash
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
