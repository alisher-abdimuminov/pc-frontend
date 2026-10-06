<script setup lang="ts">
import DateTimePicker from '~/components/date/DateTimePicker.vue'
import { ArrowLeftIcon, FileIcon, LoaderCircleIcon, PencilIcon, Trash2Icon } from '@lucide/vue'
import { toast } from 'vue-sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import GroupPicker from '~/components/staff/GroupPicker.vue'
import { useAuthStore } from '~/stores/auth'
import type { Assignment, GroupItem, Submission, SubmissionRow } from '~/types'

const api = useApi()
const auth = useAuthStore()
const route = useRoute()
const uuid = route.params.uuid as string

const item = ref<Assignment>()
const rows = ref<SubmissionRow[]>([])

async function load() {
  ;[item.value, rows.value] = await Promise.all([
    api.get<Assignment>(`/api/assignments/${uuid}/`),
    api.get<SubmissionRow[]>(`/api/assignments/${uuid}/submissions/`),
  ])
}

const submittedCount = computed(() => rows.value.filter(r => r.submission).length)

// --- baholash ---
const grading = ref<Submission | null>(null)
const gradeForm = reactive({ grade: '', feedback: '' })
const saving = ref(false)

function openGrade(s: Submission) {
  grading.value = s
  gradeForm.grade = s.grade != null ? String(s.grade) : ''
  gradeForm.feedback = s.feedback
}

async function saveGrade() {
  if (!grading.value)
    return
  saving.value = true
  try {
    const updated = await api.post<Submission>(`/api/submissions/${grading.value.uuid}/grade/`, {
      grade: Number(gradeForm.grade),
      feedback: gradeForm.feedback,
    })
    const row = rows.value.find(r => r.submission?.uuid === updated.uuid)
    if (row)
      row.submission = updated
    grading.value = null
    toast.success('Baho qo\'yildi')
  }
  catch (e: any) {
    toast.error(e.message)
  }
  finally {
    saving.value = false
  }
}

// --- tahrirlash / o'chirish ---
const editOpen = ref(false)
const groups = ref<GroupItem[]>([])
const editForm = reactive({ title: '', description: '', deadline: '', groups: [] as string[] })

async function openEdit() {
  if (!item.value)
    return
  Object.assign(editForm, {
    title: item.value.title,
    description: item.value.description,
    deadline: toLocalInput(item.value.deadline),
    groups: item.value.groups.map(g => g.uuid),
  })
  if (!groups.value.length)
    groups.value = await api.get<GroupItem[]>('/api/attendance/groups/')
  editOpen.value = true
}

async function saveEdit() {
  if (!editForm.deadline)
    return toast.error('Muddatni tanlang')
  saving.value = true
  try {
    item.value = await api.patch<Assignment>(`/api/assignments/${uuid}/`, {
      title: editForm.title,
      description: editForm.description,
      deadline: new Date(editForm.deadline).toISOString(),
      group_uuids: editForm.groups,
    })
    editOpen.value = false
    rows.value = await api.get<SubmissionRow[]>(`/api/assignments/${uuid}/submissions/`)
  }
  catch (e: any) {
    toast.error(e.message)
  }
  finally {
    saving.value = false
  }
}

const deleteOpen = ref(false)
async function remove() {
  try {
    await api.del(`/api/assignments/${uuid}/`)
    toast.success('O\'chirildi')
    await navigateTo('/staff/assignments')
  }
  catch (e: any) {
    toast.error(e.message)
  }
}

onMounted(load)
</script>

<template>
  <div class="space-y-4">
    <Button variant="ghost" size="sm" as-child>
      <NuxtLink to="/staff/assignments">
        <ArrowLeftIcon /> Topshiriqlar
      </NuxtLink>
    </Button>

    <template v-if="item">
      <Card>
        <CardHeader>
          <div class="flex flex-wrap items-start justify-between gap-2">
            <div>
              <CardTitle>{{ item.title }}</CardTitle>
              <CardDescription>
                {{ item.groups.map(g => g.name).join(', ') }} · Muddat: {{ formatDateTime(item.deadline) }}
              </CardDescription>
            </div>
            <div v-if="auth.isTeacher" class="flex gap-2">
              <Button variant="outline" size="sm" @click="openEdit">
                <PencilIcon /> Tahrirlash
              </Button>
              <Button variant="destructive" size="sm" @click="deleteOpen = true">
                <Trash2Icon />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent class="space-y-2">
          <p v-if="item.description" class="whitespace-pre-line text-sm">
            {{ item.description }}
          </p>
          <a v-if="item.file" :href="item.file" target="_blank" class="inline-flex items-center gap-2 text-sm underline">
            <FileIcon class="size-4" /> Topshiriq fayli
          </a>
        </CardContent>
      </Card>

      <div class="text-sm text-muted-foreground">
        Topshirganlar: <b class="text-foreground">{{ submittedCount }}</b> / {{ rows.length }}
      </div>

      <Card class="py-0">
        <CardContent class="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Talaba</TableHead>
                <TableHead>Holat</TableHead>
                <TableHead>Baho</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="r in rows" :key="r.student.uuid">
                <TableCell>
                  <div class="font-medium">
                    {{ r.student.full_name }}
                  </div>
                  <div class="text-xs text-muted-foreground">
                    {{ r.student.group }}
                  </div>
                </TableCell>
                <TableCell>
                  <template v-if="r.submission">
                    <a :href="r.submission.file" target="_blank" class="inline-flex items-center gap-1 text-sm underline">
                      <FileIcon class="size-3.5" /> Fayl
                    </a>
                    <div class="text-xs text-muted-foreground">
                      {{ formatDateTime(r.submission.submitted_at) }}
                    </div>
                  </template>
                  <Badge v-else variant="outline">
                    Topshirmagan
                  </Badge>
                </TableCell>
                <TableCell>
                  {{ r.submission?.grade ?? '—' }}
                </TableCell>
                <TableCell class="text-right">
                  <Button v-if="r.submission && auth.isTeacher" size="sm" variant="outline" @click="openGrade(r.submission)">
                    Baholash
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </template>

    <Dialog :open="!!grading" @update:open="!$event && (grading = null)">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Baholash</DialogTitle>
          <DialogDescription>{{ grading?.student.full_name }}</DialogDescription>
        </DialogHeader>
        <form id="grade-form" class="space-y-3" @submit.prevent="saveGrade">
          <div class="space-y-1.5">
            <Label>Baho (0–100)</Label>
            <Input v-model="gradeForm.grade" type="number" min="0" max="100" step="0.1" required />
          </div>
          <div class="space-y-1.5">
            <Label>Izoh</Label>
            <Textarea v-model="gradeForm.feedback" rows="3" />
          </div>
        </form>
        <DialogFooter>
          <Button type="submit" form="grade-form" :disabled="saving">
            <LoaderCircleIcon v-if="saving" class="animate-spin" /> Saqlash
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog v-model:open="editOpen">
      <DialogContent class="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Tahrirlash</DialogTitle>
        </DialogHeader>
        <form id="edit-form" class="space-y-3" @submit.prevent="saveEdit">
          <div class="space-y-1.5">
            <Label>Sarlavha</Label>
            <Input v-model="editForm.title" required />
          </div>
          <div class="space-y-1.5">
            <Label>Tavsif</Label>
            <Textarea v-model="editForm.description" rows="3" />
          </div>
          <div class="space-y-1.5">
            <Label>Muddat</Label>
            <DateTimePicker v-model="editForm.deadline" class="w-full" />
          </div>
          <div class="space-y-1.5">
            <Label>Guruhlar</Label>
            <GroupPicker v-model="editForm.groups" :groups="groups" />
          </div>
        </form>
        <DialogFooter>
          <Button type="submit" form="edit-form" :disabled="saving">
            Saqlash
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog v-model:open="deleteOpen">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Topshiriqni o'chirasizmi?</DialogTitle>
          <DialogDescription>Talabalar yuborgan javoblar ham o'chadi.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" @click="deleteOpen = false">
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
