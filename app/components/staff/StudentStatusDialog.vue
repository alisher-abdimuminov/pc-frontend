<script setup lang="ts">
import { LoaderCircleIcon, ShieldAlertIcon, ShieldCheckIcon } from '@lucide/vue'
import { toast } from 'vue-sonner'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

/**
 * Shubhali urinish bo'yicha talabani bloklash (is_active=false) yoki qayta faollashtirish.
 * Bloklashda sabab majburiy - AuditLog'ga yoziladi.
 */
const open = defineModel<boolean>('open', { default: false })
const props = defineProps<{
  student: { uuid: string, full_name: string, is_active: boolean }
  attemptUuid?: string | null
}>()
const emit = defineEmits<{ changed: [isActive: boolean] }>()

const api = useApi()
const reason = ref('')
const saving = ref(false)
const blocking = computed(() => props.student.is_active)

const QUICK_REASONS = [
  'Boshqa odamning yuzi',
  'Ekran yoki fotosuratdan olingan rasm',
  'Soxta joylashuv (GPS)',
  'Takroriy shubhali urinishlar',
]

watch(open, (value) => {
  if (value)
    reason.value = ''
})

async function submit() {
  if (blocking.value && !reason.value.trim())
    return
  saving.value = true
  try {
    const res = await api.post<{ is_active: boolean }>(`/api/auth/students/${props.student.uuid}/status/`, {
      is_active: !blocking.value,
      reason: reason.value.trim(),
      attempt_uuid: props.attemptUuid ?? null,
    })
    emit('changed', res.is_active)
    toast.success(res.is_active ? `${props.student.full_name} qayta faollashtirildi` : `${props.student.full_name} bloklandi`)
    open.value = false
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
  <AlertDialog v-model:open="open">
    <AlertDialogContent>
      <AlertDialogHeader>
        <div
          class="mb-1 grid size-11 place-items-center rounded-full"
          :class="blocking ? 'bg-destructive/10 text-destructive' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10'"
        >
          <ShieldAlertIcon v-if="blocking" class="size-5" />
          <ShieldCheckIcon v-else class="size-5" />
        </div>
        <AlertDialogTitle>
          {{ blocking ? 'Talabani bloklash' : 'Talabani qayta faollashtirish' }}
        </AlertDialogTitle>
        <AlertDialogDescription>
          <b class="text-foreground">{{ student.full_name }}</b>
          <template v-if="blocking">
            tizimga kira olmaydi va ochiq sessiyasi darhol to'xtaydi. Keyinchalik qayta faollashtirish mumkin.
          </template>
          <template v-else>
            yana tizimga kira oladi va davomatni tasdiqlay oladi.
          </template>
        </AlertDialogDescription>
      </AlertDialogHeader>

      <div v-if="blocking" class="space-y-2">
        <Label for="block-reason">Sabab</Label>
        <div class="flex flex-wrap gap-1.5">
          <Badge
            v-for="r in QUICK_REASONS"
            :key="r"
            as="button"
            type="button"
            :variant="reason === r ? 'default' : 'outline'"
            class="cursor-pointer"
            @click="reason = r"
          >
            {{ r }}
          </Badge>
        </div>
        <Textarea id="block-reason" v-model="reason" rows="3" placeholder="Nima uchun bloklanmoqda?" />
      </div>

      <AlertDialogFooter>
        <AlertDialogCancel :disabled="saving">
          Bekor qilish
        </AlertDialogCancel>
        <Button
          :variant="blocking ? 'destructive' : 'default'"
          :disabled="saving || (blocking && !reason.trim())"
          @click="submit"
        >
          <LoaderCircleIcon v-if="saving" class="animate-spin" />
          {{ blocking ? 'Bloklash' : 'Faollashtirish' }}
        </Button>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
