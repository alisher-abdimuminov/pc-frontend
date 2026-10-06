<script setup lang="ts">
import { MapPinIcon } from '@lucide/vue'
import { Badge } from '@/components/ui/badge'
import type { Attempt } from '~/types'

const props = defineProps<{ attempt: Attempt, showDebug?: boolean }>()

const mapUrl = computed(() =>
  props.attempt.latitude ? `https://maps.google.com/?q=${props.attempt.latitude},${props.attempt.longitude}` : null,
)
</script>

<template>
  <div class="flex gap-3 rounded-lg border bg-background p-2">
    <a :href="attempt.image" target="_blank" class="shrink-0">
      <img :src="attempt.image" class="size-20 rounded-md object-cover" alt="">
    </a>
    <div class="min-w-0 space-y-1 text-sm">
      <div class="flex flex-wrap items-center gap-2">
        <Badge :variant="attempt.success ? 'default' : 'destructive'">
          {{ attempt.success ? 'Muvaffaqiyatli' : 'Rad etildi' }}
        </Badge>
        <span class="text-xs text-muted-foreground">{{ formatDateTime(attempt.attempted_at) }}</span>
      </div>
      <p v-if="!attempt.success" class="text-xs text-destructive">
        {{ attempt.error_message }}
      </p>
      <div class="flex flex-wrap gap-x-3 text-xs text-muted-foreground">
        <span>Lokatsiya {{ attempt.location_verified ? '✓' : '✗' }}</span>
        <span>Yuz {{ attempt.face_verified ? '✓' : '✗' }}</span>
        <span v-if="showDebug && attempt.face_distance != null">
          masofa {{ attempt.face_distance.toFixed(3) }} / {{ attempt.face_threshold?.toFixed(2) }}
        </span>
      </div>
      <a v-if="mapUrl && showDebug" :href="mapUrl" target="_blank" class="inline-flex items-center gap-1 text-xs underline">
        <MapPinIcon class="size-3" /> Xaritada
      </a>
    </div>
  </div>
</template>
