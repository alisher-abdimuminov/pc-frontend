<script setup lang="ts">
import DateRangePicker from '~/components/date/DateRangePicker.vue'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { GroupItem } from '~/types'

export interface AttemptFilterState {
  search: string
  from: string
  to: string
  group: string
  result: string
  error_code: string
  step: string
}

/** Urinishlar filtrlari. layout="row" - desktop (bir qator), "stack" - mobil Sheet ichida (yorliqlar bilan) */
const filters = defineModel<AttemptFilterState>({ required: true })
defineProps<{
  groups: GroupItem[]
  errorCodes: { code: string, label: string }[]
  layout: 'row' | 'stack'
  all: string
}>()
</script>

<template>
  <div :class="layout === 'row' ? 'flex flex-wrap items-center gap-2' : 'grid gap-4'">
    <div :class="layout === 'stack' ? 'grid gap-1.5' : 'flex items-center gap-1'">
      <Label v-if="layout === 'stack'">Sana oralig'i</Label>
      <DateRangePicker v-model:from="filters.from" v-model:to="filters.to" :class="layout === 'row' ? 'w-60' : 'w-full'" />
    </div>

    <div :class="layout === 'stack' && 'grid gap-1.5'">
      <Label v-if="layout === 'stack'">Guruh</Label>
      <Select v-model="filters.group">
        <SelectTrigger :class="layout === 'row' ? 'w-48' : 'w-full'">
          <SelectValue placeholder="Guruh" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem :value="all">
            Barcha guruhlar
          </SelectItem>
          <SelectItem v-for="g in groups" :key="g.uuid" :value="g.uuid">
            {{ g.name }}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>

    <div :class="layout === 'stack' && 'grid gap-1.5'">
      <Label v-if="layout === 'stack'">Natija</Label>
      <Select v-model="filters.result">
        <SelectTrigger :class="layout === 'row' ? 'w-40' : 'w-full'">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem :value="all">
            Barcha natijalar
          </SelectItem>
          <SelectItem value="success">
            Muvaffaqiyatli
          </SelectItem>
          <SelectItem value="fail">
            Rad etilgan
          </SelectItem>
        </SelectContent>
      </Select>
    </div>

    <div :class="layout === 'stack' && 'grid gap-1.5'">
      <Label v-if="layout === 'stack'">Rad etish sababi</Label>
      <Select v-model="filters.error_code">
        <SelectTrigger :class="layout === 'row' ? 'w-48' : 'w-full'">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem :value="all">
            Barcha sabablar
          </SelectItem>
          <SelectItem v-for="e in errorCodes" :key="e.code" :value="e.code">
            {{ e.label }}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>

    <div :class="layout === 'stack' && 'grid gap-1.5'">
      <Label v-if="layout === 'stack'">Qadam</Label>
      <Select v-model="filters.step">
        <SelectTrigger :class="layout === 'row' ? 'w-32' : 'w-full'">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem :value="all">
            Barcha qadam
          </SelectItem>
          <SelectItem v-for="n in 3" :key="n" :value="String(n)">
            {{ n }}-qadam
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  </div>
</template>
