<script setup lang="ts">
import { Checkbox } from '@/components/ui/checkbox'
import type { GroupItem } from '~/types'

/** Guruhlarni belgilash ro'yxati (v-model: uuid[]) */
const model = defineModel<string[]>({ default: () => [] })
defineProps<{ groups: GroupItem[] }>()

function toggle(uuid: string, checked: boolean | 'indeterminate') {
  model.value = checked === true ? [...model.value, uuid] : model.value.filter(u => u !== uuid)
}
</script>

<template>
  <div class="max-h-48 space-y-1 overflow-y-auto rounded-md border p-2">
    <p v-if="!groups.length" class="p-2 text-sm text-muted-foreground">
      Guruhlar yo'q
    </p>
    <label v-for="g in groups" :key="g.uuid" class="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted">
      <Checkbox :model-value="model.includes(g.uuid)" @update:model-value="toggle(g.uuid, $event)" />
      {{ g.name }}
    </label>
  </div>
</template>
