<script setup lang="ts">
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import type { Permission, PermissionDef } from '~/types'

/** Permission'larni bo'limlar bo'yicha belgilash. "Ko'rish"siz boshqa amal berilsa ko'rish ham avtomatik qo'shiladi. */
const model = defineModel<Permission[]>({ default: () => [] })
const props = defineProps<{ catalog: PermissionDef[] }>()

const sections = computed(() => {
  const map = new Map<string, PermissionDef[]>()
  for (const p of props.catalog)
    map.set(p.section, [...(map.get(p.section) ?? []), p])
  return [...map.entries()].map(([name, items]) => ({ name, items }))
})

const isView = (code: string) => code.split('.')[1]!.startsWith('view_')

function toggle(section: PermissionDef[], code: Permission, checked: boolean) {
  const set = new Set(model.value)
  if (checked) {
    set.add(code)
    // sahifaga kirish uchun ko'rish ruxsati ham kerak
    const view = section.find(p => isView(p.code))
    if (view)
      set.add(view.code)
  }
  else {
    set.delete(code)
    // ko'rish olib tashlansa - shu bo'limning boshqa amallari ham
    if (isView(code))
      section.forEach(p => set.delete(p.code))
  }
  model.value = [...set]
}

function sectionState(items: PermissionDef[]): boolean | 'indeterminate' {
  const n = items.filter(p => model.value.includes(p.code)).length
  return n === 0 ? false : n === items.length ? true : 'indeterminate'
}

function toggleSection(items: PermissionDef[], checked: boolean | 'indeterminate') {
  const set = new Set(model.value)
  items.forEach(p => (checked === true ? set.add(p.code) : set.delete(p.code)))
  model.value = [...set]
}
</script>

<template>
  <div class="divide-y rounded-lg border">
    <div v-for="s in sections" :key="s.name" class="space-y-2 p-3">
      <Label class="flex cursor-pointer items-center gap-2 font-medium">
        <Checkbox :model-value="sectionState(s.items)" @update:model-value="toggleSection(s.items, $event)" />
        {{ s.name }}
      </Label>
      <div class="grid gap-2 pl-6 sm:grid-cols-2">
        <Label v-for="p in s.items" :key="p.code" class="flex cursor-pointer items-center gap-2 font-normal text-muted-foreground">
          <Checkbox :model-value="model.includes(p.code)" @update:model-value="toggle(s.items, p.code, $event === true)" />
          {{ p.label }}
        </Label>
      </div>
    </div>
  </div>
</template>
