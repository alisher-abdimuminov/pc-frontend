<script setup lang="ts">
import type { DateValue } from '@internationalized/date'
import { parseDate } from '@internationalized/date'
import { CalendarIcon, XIcon } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

/** shadcn sana tanlash. v-model - "YYYY-MM-DD" yoki "" */
const model = defineModel<string>({ default: '' })
const props = withDefaults(defineProps<{
  placeholder?: string
  clearable?: boolean
  min?: string
  max?: string
  class?: string
  id?: string
}>(), { placeholder: 'Sana tanlang', clearable: false })

const open = ref(false)

const toValue = (s?: string) => {
  try {
    return s ? parseDate(s) : undefined
  }
  catch {
    return undefined
  }
}

const value = computed(() => toValue(model.value))

function select(date: DateValue | undefined) {
  if (!date)
    return
  model.value = date.toString()
  open.value = false
}
</script>

<template>
  <Popover v-model:open="open">
    <PopoverTrigger as-child>
      <Button
        :id="id"
        variant="outline"
        :class="cn('justify-start font-normal', !model && 'text-muted-foreground', props.class)"
      >
        <CalendarIcon class="opacity-60" />
        <span class="truncate">{{ model ? formatDate(model) : placeholder }}</span>
        <span
          v-if="clearable && model"
          role="button"
          aria-label="Tozalash"
          class="ml-auto -mr-1 rounded p-0.5 opacity-60 hover:bg-muted hover:opacity-100"
          @click.stop="model = ''"
        >
          <XIcon class="size-3.5" />
        </span>
      </Button>
    </PopoverTrigger>
    <PopoverContent class="w-auto p-0" align="start">
      <Calendar
        :model-value="value"
        :default-placeholder="value"
        :min-value="toValue(min)"
        :max-value="toValue(max)"
        locale="uz"
        :week-starts-on="1"
        initial-focus
        @update:model-value="select"
      />
    </PopoverContent>
  </Popover>
</template>
