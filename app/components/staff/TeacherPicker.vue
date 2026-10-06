<script setup lang="ts">
import { CheckIcon, ChevronsUpDownIcon, LoaderCircleIcon, UserRoundXIcon } from '@lucide/vue'
import { toast } from 'vue-sonner'
import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import type { Teacher } from '~/types'

/** Guruhga o'qituvchi biriktirish: qidiruvli ro'yxat (Popover + Command), tanlanishi bilan saqlanadi */
const props = defineProps<{
  groupUuid: string
  groupName: string
  teacherUuid: string | null
  teacherName: string | null
  /** trigger to'liq kenglikda */
  full?: boolean
}>()
const emit = defineEmits<{ changed: [teacher: { uuid: string, full_name: string } | null] }>()

const api = useApi()
const open = ref(false)
const saving = ref(false)
const teachers = ref<Teacher[]>()

watch(open, async (value) => {
  if (value && !teachers.value)
    teachers.value = await api.get<Teacher[]>('/api/auth/teachers/')
})

async function select(uuid: string | null) {
  open.value = false
  if (uuid === props.teacherUuid)
    return
  saving.value = true
  try {
    const res = await api.patch<{ teacher: { uuid: string, full_name: string } | null }>(
      `/api/auth/groups/${props.groupUuid}/teacher/`,
      { teacher_uuid: uuid },
    )
    emit('changed', res.teacher)
    toast.success(res.teacher ? `${props.groupName}: ${res.teacher.full_name} biriktirildi` : `${props.groupName}: o'qituvchi olib tashlandi`)
  }
  catch (e: any) {
    toast.error(e.message)
  }
  finally {
    saving.value = false
  }
}
</script>

<template>
  <Popover v-model:open="open">
    <PopoverTrigger as-child>
      <Button
        variant="outline"
        size="sm"
        role="combobox"
        :aria-expanded="open"
        class="justify-between font-normal"
        :class="full ? 'w-full' : 'w-full sm:w-64'"
        :disabled="saving"
        @click.stop
      >
        <span class="truncate" :class="{ 'text-muted-foreground': !teacherName }">
          {{ teacherName || "O'qituvchi biriktirilmagan" }}
        </span>
        <LoaderCircleIcon v-if="saving" class="animate-spin opacity-60" />
        <ChevronsUpDownIcon v-else class="opacity-50" />
      </Button>
    </PopoverTrigger>
    <PopoverContent class="w-[min(20rem,calc(100vw-2rem))] p-0" align="start" @click.stop>
      <Command>
        <CommandInput placeholder="O'qituvchini qidirish..." />
        <CommandList>
          <div v-if="!teachers" class="grid place-items-center py-6">
            <LoaderCircleIcon class="size-5 animate-spin text-muted-foreground" />
          </div>
          <template v-else>
            <CommandEmpty>O'qituvchi topilmadi</CommandEmpty>
            <CommandGroup heading="O'qituvchilar">
              <CommandItem
                v-for="t in teachers"
                :key="t.uuid"
                :value="`${t.full_name} ${t.username}`"
                @select="select(t.uuid)"
              >
                <div class="min-w-0 flex-1">
                  <div class="truncate">
                    {{ t.full_name }}
                  </div>
                  <div class="text-xs text-muted-foreground">
                    {{ t.username }} · {{ t.groups_count }} guruh
                  </div>
                </div>
                <CheckIcon v-if="t.uuid === teacherUuid" class="size-4" />
              </CommandItem>
            </CommandGroup>
            <template v-if="teacherUuid">
              <CommandSeparator />
              <CommandGroup>
                <CommandItem value="__remove__" class="text-destructive" @select="select(null)">
                  <UserRoundXIcon /> Biriktirishni bekor qilish
                </CommandItem>
              </CommandGroup>
            </template>
          </template>
        </CommandList>
      </Command>
      <p v-if="teachers && !teachers.length" class="border-t p-3 text-xs text-muted-foreground">
        O'qituvchilar HEMIS orqali birinchi marta tizimga kirganda ro'yxatda paydo bo'ladi.
      </p>
    </PopoverContent>
  </Popover>
</template>
