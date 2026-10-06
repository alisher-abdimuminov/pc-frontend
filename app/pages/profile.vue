<script setup lang="ts">
import { LogOutIcon } from '@lucide/vue'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useAuthStore } from '~/stores/auth'
import type { User } from '~/types'

const api = useApi()
const auth = useAuthStore()

onMounted(async () => {
  try {
    auth.setUser(await api.get<User>('/api/auth/me/'))
  }
  catch {}
})

const rows = computed(() => {
  const u = auth.user
  if (!u)
    return []
  return [
    ['Login', u.username],
    ['Fakultet', u.faculty?.name],
    ['Guruh', u.group?.name],
    ['Kurs', u.level],
    ['Semestr', u.semester],
    ['Telefon', u.phone],
  ].filter(([, v]) => v) as [string, string][]
})

function logout() {
  auth.logout()
  navigateTo('/login')
}
</script>

<template>
  <div class="mx-auto max-w-lg space-y-4">
    <Card>
      <CardContent class="flex flex-col items-center gap-3 text-center">
        <Avatar class="size-24">
          <AvatarImage v-if="auth.user?.image" :src="auth.user.image" class="object-cover" />
          <AvatarFallback class="text-2xl">
            {{ (auth.user?.short_name || '?').slice(0, 2) }}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 class="text-lg font-semibold">
            {{ auth.user?.full_name || auth.user?.username }}
          </h1>
          <Badge variant="secondary" class="mt-1">
            {{ ROLE_LABELS[auth.user?.role ?? ''] }}
          </Badge>
        </div>
      </CardContent>
    </Card>
    <Card>
      <CardContent class="divide-y py-0">
        <div v-for="[label, value] in rows" :key="label" class="flex justify-between gap-4 py-3 text-sm">
          <span class="text-muted-foreground">{{ label }}</span>
          <span class="text-right font-medium">{{ value }}</span>
        </div>
      </CardContent>
    </Card>
    <p v-if="auth.isStudent" class="text-center text-xs text-muted-foreground">
      FaceID shu profil rasmi bilan solishtiriladi. Rasm noto'g'ri bo'lsa adminga murojaat qiling.
    </p>
    <Button variant="outline" class="w-full" @click="logout">
      <LogOutIcon /> Chiqish
    </Button>
  </div>
</template>
