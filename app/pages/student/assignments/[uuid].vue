<script setup lang="ts">
import { ArrowLeftIcon, FileIcon, LoaderCircleIcon, UploadIcon } from '@lucide/vue'
import { toast } from 'vue-sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import type { Assignment, Submission } from '~/types'

const api = useApi()
const route = useRoute()
const item = ref<Assignment>()
const file = ref<File | null>(null)
const sending = ref(false)

async function load() {
  item.value = await api.get<Assignment>(`/api/assignments/${route.params.uuid}/`)
}

const canSubmit = computed(() => item.value && !item.value.is_expired && !item.value.my_submission?.graded_at)

async function submit() {
  if (!file.value)
    return
  sending.value = true
  try {
    const form = new FormData()
    form.append('file', file.value)
    const submission = await api.post<Submission>(`/api/assignments/${route.params.uuid}/submit/`, form)
    item.value!.my_submission = submission
    file.value = null
    toast.success('Topshiriq yuborildi')
  }
  catch (e: any) {
    toast.error(e.message)
  }
  finally {
    sending.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="mx-auto max-w-3xl space-y-4">
    <Button variant="ghost" size="sm" as-child>
      <NuxtLink to="/student/assignments">
        <ArrowLeftIcon /> Orqaga
      </NuxtLink>
    </Button>

    <template v-if="item">
      <Card>
        <CardHeader>
          <CardTitle>{{ item.title }}</CardTitle>
          <CardDescription>
            {{ item.teacher }} · Muddat: {{ formatDateTime(item.deadline) }}
            <Badge v-if="item.is_expired" variant="destructive" class="ml-1">
              Muddati o'tgan
            </Badge>
          </CardDescription>
        </CardHeader>
        <CardContent class="space-y-3">
          <p v-if="item.description" class="whitespace-pre-line text-sm">
            {{ item.description }}
          </p>
          <a v-if="item.file" :href="item.file" target="_blank" class="inline-flex items-center gap-2 text-sm underline">
            <FileIcon class="size-4" /> Topshiriq fayli
          </a>
        </CardContent>
      </Card>

      <Card v-if="item.my_submission">
        <CardHeader>
          <CardTitle class="text-base">
            Mening javobim
          </CardTitle>
          <CardDescription>Yuborilgan: {{ formatDateTime(item.my_submission.submitted_at) }}</CardDescription>
        </CardHeader>
        <CardContent class="space-y-2 text-sm">
          <a :href="item.my_submission.file" target="_blank" class="inline-flex items-center gap-2 underline">
            <FileIcon class="size-4" /> Yuborilgan fayl
          </a>
          <div v-if="item.my_submission.graded_at" class="rounded-lg bg-muted p-3">
            <div class="font-medium">
              Baho: {{ item.my_submission.grade }}
            </div>
            <p v-if="item.my_submission.feedback" class="mt-1 whitespace-pre-line text-muted-foreground">
              {{ item.my_submission.feedback }}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card v-if="canSubmit">
        <CardHeader>
          <CardTitle class="text-base">
            {{ item.my_submission ? 'Qayta yuborish' : 'Javob yuborish' }}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form class="flex flex-col gap-3 sm:flex-row" @submit.prevent="submit">
            <Input type="file" required @change="file = ($event.target as HTMLInputElement).files?.[0] ?? null" />
            <Button type="submit" :disabled="!file || sending">
              <LoaderCircleIcon v-if="sending" class="animate-spin" />
              <UploadIcon v-else /> Yuborish
            </Button>
          </form>
        </CardContent>
      </Card>
    </template>
  </div>
</template>
