<script setup lang="ts">
import type { DateValue } from '@internationalized/date'
import { parseDate } from '@internationalized/date'
import { CalendarClockIcon } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

/** Sana + vaqt (shadcn Calendar + Select). v-model - mahalliy "YYYY-MM-DDTHH:MM" yoki "" */
const model = defineModel<string>({ default: '' })
const props = withDefaults(defineProps<{ placeholder?: string, class?: string, id?: string }>(), {
  placeholder: 'Sana va vaqt',
})

const open = ref(false)
const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'))

const datePart = computed(() => model.value.slice(0, 10))
const hour = computed(() => model.value.slice(11, 13) || '23')
const minute = computed(() => model.value.slice(14, 16) || '55')

const value = computed(() => {
  try {
    return datePart.value ? parseDate(datePart.value) : undefined
  }
  catch {
    return undefined
  }
})

function set(date: string, h: string, m: string) {
  model.value = `${date}T${h}:${m}`
}

function selectDate(date: DateValue | undefined) {
  if (date)
    set(date.toString(), hour.value, minute.value)
}
</script>

<template>
  <Popover v-model:open="open">
    <PopoverTrigger as-child>
      <Button :id="id" variant="outline" :class="cn('justify-start font-normal', !model && 'text-muted-foreground', props.class)">
        <CalendarClockIcon class="opacity-60" />
        <span class="truncate">{{ model ? `${formatDate(datePart)}, ${hour}:${minute}` : placeholder }}</span>
      </Button>
    </PopoverTrigger>
    <PopoverContent class="w-auto p-0" align="start">
      <Calendar
        :model-value="value"
        :default-placeholder="value"
        locale="uz"
        :week-starts-on="1"
        initial-focus
        @update:model-value="selectDate"
      />
      <Separator />
      <div class="flex items-center gap-2 p-3">
        <Label class="text-xs text-muted-foreground">Vaqt</Label>
        <Select :model-value="hour" :disabled="!datePart" @update:model-value="set(datePart, String($event), minute)">
          <SelectTrigger size="sm" class="w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent class="max-h-60">
            <SelectItem v-for="h in HOURS" :key="h" :value="h">
              {{ h }}
            </SelectItem>
          </SelectContent>
        </Select>
        <span>:</span>
        <Select :model-value="minute" :disabled="!datePart" @update:model-value="set(datePart, hour, String($event))">
          <SelectTrigger size="sm" class="w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent class="max-h-60">
            <SelectItem v-for="m in MINUTES" :key="m" :value="m">
              {{ m }}
            </SelectItem>
          </SelectContent>
        </Select>
        <Button size="sm" class="ml-auto" :disabled="!datePart" @click="open = false">
          Tayyor
        </Button>
      </div>
    </PopoverContent>
  </Popover>
</template>
