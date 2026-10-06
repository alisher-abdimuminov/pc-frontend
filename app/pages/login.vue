<script setup lang="ts">
import { LoaderCircleIcon } from '@lucide/vue'
import { toast } from 'vue-sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { homeFor, useAuthStore } from '~/stores/auth'
import type { LoginResponse } from '~/types'

definePageMeta({ layout: 'blank' })

const api = useApi()
const auth = useAuthStore()

const login = ref('')
const password = ref('')
const loading = ref(false)

async function submit() {
  loading.value = true
  try {
    const data = await api.post<LoginResponse>('/api/auth/login/', {
      login: login.value,
      password: password.value,
    })
    auth.setSession(data)
    await navigateTo(homeFor(data.user.role))
  }
  catch (e: any) {
    toast.error(e.message)
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="grid min-h-dvh place-items-center p-4">
    <Card class="w-full max-w-sm">
      <CardHeader class="text-center">
        <div class="mx-auto mb-2 grid size-12 place-items-center rounded-xl bg-primary text-primary-foreground font-semibold">
          PC
        </div>
        <CardTitle class="text-xl">
          Amaliyot nazorati
        </CardTitle>
        <CardDescription>HEMIS login va parolingiz bilan kiring</CardDescription>
      </CardHeader>
      <CardContent>
        <form class="space-y-4" @submit.prevent="submit">
          <div class="space-y-2">
            <Label for="login">Login</Label>
            <Input id="login" v-model="login" autocomplete="username" required placeholder="Talaba ID raqami yoki login" />
          </div>
          <div class="space-y-2">
            <Label for="password">Parol</Label>
            <Input id="password" v-model="password" type="password" autocomplete="current-password" required />
          </div>
          <Button type="submit" class="w-full" size="lg" :disabled="loading">
            <LoaderCircleIcon v-if="loading" class="animate-spin" />
            Kirish
          </Button>
          <p class="text-center text-xs text-muted-foreground">
            Birinchi kirishda ma'lumotlaringiz HEMIS'dan olinadi
          </p>
        </form>
      </CardContent>
    </Card>
  </div>
</template>
