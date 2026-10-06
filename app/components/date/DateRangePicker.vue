<script setup lang="ts">
import type { DateRange } from 'reka-ui'
import { getLocalTimeZone, parseDate, today } from '@internationalized/date'
import { CalendarRangeIcon, XIcon } from '@lucide/vue'
import { useMediaQuery } from '@vueuse/core'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { RangeCalendar } from '@/components/ui/range-calendar'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

/** shadcn sana oralig'i. v-model:from / v-model:to - "YYYY-MM-DD" yoki "" */
const from = defineModel<string>('from', { default: '' })
const to = defineModel<string>('to', { default: '' })
const props = withDefaults(defineProps<{
  placeholder?: string
  clearable?: boolean
  class?: string
}>(), { placeholder: 'Sana oralig\'i', clearable: true })

const open = ref(false)
const desktop = useMediaQuery('(min-width: 768px)')

const parse = (s: string) => {
  try {
    return s ? parseDate(s) : undefined
  }
  catch {
    return undefined
  }
}

// tanlash davomida qoralama: filtr faqat oraliq to'liq tanlanganda qo'llanadi
const draft = shallowRef<DateRange>({ start: undefined, end: undefined })
watch(open, (value) => {
  if (value)
    draft.value = { start: parse(from.value), end: parse(to.value) }
})

function update(value: DateRange) {
  draft.value = value
  if (value.start && value.end) {
    from.value = value.start.toString()
    to.value = value.end.toString()
    open.value = false
  }
}

const PRESETS = [
  { label: 'Bugun', days: 0 },
  { label: 'Oxirgi 7 kun', days: 6 },
  { label: 'Oxirgi 30 kun', days: 29 },
] as const

function preset(days: number) {
  const end = today(getLocalTimeZone())
  from.value = end.subtract({ days }).toString()
  to.value = end.toString()
  open.value = false
}

const label = computed(() => {
  if (!from.value && !to.value)
    return props.placeholder
  if (from.value === to.value)
    return formatDate(from.value)
  return `${from.value ? formatDate(from.value) : '…'} — ${to.value ? formatDate(to.value) : '…'}`
})
</script>

<template>
  <Popover v-model:open="open">
    <PopoverTrigger as-child>
      <Button
        variant="outline"
        :class="cn('justify-start font-normal', !from && !to && 'text-muted-foreground', props.class)"
      >
        <CalendarRangeIcon class="opacity-60" />
        <span class="truncate">{{ label }}</span>
        <span
          v-if="clearable && (from || to)"
          role="button"
          aria-label="Tozalash"
          class="ml-auto -mr-1 rounded p-0.5 opacity-60 hover:bg-muted hover:opacity-100"
          @click.stop="from = ''; to = ''"
        >
          <XIcon class="size-3.5" />
        </span>
      </Button>
    </PopoverTrigger>
    <PopoverContent class="w-auto p-0" align="start">
      <div class="flex flex-wrap gap-1 p-2">
        <Button v-for="p in PRESETS" :key="p.label" variant="secondary" size="xs" @click="preset(p.days)">
          {{ p.label }}
        </Button>
      </div>
      <Separator />
      <RangeCalendar
        :model-value="draft"
        :default-placeholder="draft.start"
        locale="uz"
        :week-starts-on="1"
        :number-of-months="desktop ? 2 : 1"
        initial-focus
        @update:model-value="update"
      />
    </PopoverContent>
  </Popover>
</template>
