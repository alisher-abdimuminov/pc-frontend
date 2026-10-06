<script setup lang="ts">
import { ChevronRightIcon } from '@lucide/vue'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { Assignment, Paginated } from '~/types'

const api = useApi()
const items = ref<Assignment[]>([])
const loading = ref(true)

onMounted(async () => {
  try {
    items.value = (await api.get<Paginated<Assignment>>('/api/assignments/')).results
  }
  finally {
    loading.value = false
  }
})

function status(a: Assignment) {
  if (a.my_submission?.grade != null)
    return { label: `Baho: ${a.my_submission.grade}`, variant: 'default' as const }
  if (a.my_submission)
    return { label: 'Topshirilgan', variant: 'secondary' as const }
  if (a.is_expired)
    return { label: 'Muddati o\'tgan', variant: 'destructive' as const }
  return { label: 'Topshirilmagan', variant: 'outline' as const }
}
</script>

<template>
  <div class="mx-auto max-w-3xl space-y-4">
    <h1 class="text-xl font-semibold">
      Topshiriqlar
    </h1>
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
          :to="`/student/assignments/${a.uuid}`"
          class="flex items-center gap-3 px-4 py-3 hover:bg-muted/50"
        >
          <div class="min-w-0 flex-1">
            <div class="truncate font-medium">
              {{ a.title }}
            </div>
            <div class="text-xs text-muted-foreground">
              Muddat: {{ formatDateTime(a.deadline) }} · {{ a.teacher }}
            </div>
          </div>
          <Badge :variant="status(a).variant">
            {{ status(a).label }}
          </Badge>
          <ChevronRightIcon class="size-4 text-muted-foreground" />
        </NuxtLink>
      </CardContent>
    </Card>
  </div>
</template>
