<script setup lang="ts">
import { CheckIcon, CircleDotIcon, XIcon } from '@lucide/vue'
import type { StepStatus } from '~/types'

/** Xodimlar jadvalidagi bitta qadam holati: rang + belgi + matn (faqat rangga tayanmaydi) */
defineProps<{ status: StepStatus | null | undefined }>()

const LABEL: Record<StepStatus, string> = {
  passed: 'Tasdiqlangan',
  missed: "O'tkazilgan",
  available: 'Hozir ochiq',
  upcoming: 'Kutilmoqda',
}
</script>

<template>
  <span v-if="!status" class="text-muted-foreground" title="Amaliyot kuni emas">—</span>
  <span
    v-else
    class="inline-grid size-7 place-items-center rounded-full"
    :class="{
      'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400': status === 'passed',
      'bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400': status === 'missed',
      'bg-lime-100 text-lime-700 dark:bg-lime-500/15 dark:text-lime-400': status === 'available',
      'text-muted-foreground': status === 'upcoming',
    }"
    :title="LABEL[status]"
    role="img"
    :aria-label="LABEL[status]"
  >
    <CheckIcon v-if="status === 'passed'" class="size-4" stroke-width="3" />
    <XIcon v-else-if="status === 'missed'" class="size-4" stroke-width="3" />
    <CircleDotIcon v-else-if="status === 'available'" class="size-4" />
    <span v-else class="size-1.5 rounded-full bg-current" />
  </span>
</template>
