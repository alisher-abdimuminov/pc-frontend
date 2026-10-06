<script setup lang="ts">
import { BookOpenIcon, CalendarDaysIcon, ClipboardListIcon, HomeIcon, LayoutDashboardIcon, LogOutIcon, MapPinIcon, MoonStarIcon, ScanFaceIcon, ScrollTextIcon, ShieldUserIcon, SunIcon, UserIcon, UsersIcon } from '@lucide/vue'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import BottomNav from '~/components/BottomNav.vue'
import type { NavItem } from '~/components/BottomNav.vue'
import type { User } from '~/types'
import { useAuthStore } from '~/stores/auth'
import { useLocationStore } from '~/stores/location'

const auth = useAuthStore()
const route = useRoute()
const { isDark, toggle } = useTheme()

const studentNav: NavItem[] = [
  { to: '/student', label: 'Bosh sahifa', icon: HomeIcon, exact: true },
  { to: '/student/schedule', label: 'Jadval', icon: CalendarDaysIcon },
  { to: '/student/assignments', label: 'Topshiriq', icon: BookOpenIcon },
]

const STAFF_NAV: NavItem[] = [
  { to: '/staff', label: 'Bosh sahifa', icon: LayoutDashboardIcon, exact: true },
  { to: '/staff/groups', label: 'Guruhlar', icon: UsersIcon },
  { to: '/staff/attempts', label: 'Urinishlar', icon: ScanFaceIcon },
  { to: '/staff/assignments', label: 'Topshiriqlar', icon: ClipboardListIcon },
  { to: '/staff/schedules', label: 'Jadvallar', icon: CalendarDaysIcon },
  { to: '/admin/locations', label: 'Lokatsiyalar', icon: MapPinIcon },
  { to: '/staff/audit', label: 'Audit', icon: ScrollTextIcon },
  { to: '/admin/staff', label: 'Xodimlar', icon: ShieldUserIcon },
]

// faqat ruxsat berilgan bo'limlar (little - admin bergan permission'lar bo'yicha)
const staffNav = computed(() => STAFF_NAV.filter((item) => {
  const access = routeAccess(item.to)
  return !access || (access === 'admin' ? auth.isAdmin : auth.can(access))
}))

const api = useApi()

onMounted(async () => {
  // talaba ilovaga kirishi bilan joylashuv avtomatik olinib serverda tekshiriladi
  if (auth.isStudent)
    useLocationStore().startAuto()
  // rol / permission'lar o'zgargan bo'lishi mumkin - har kirishda yangilanadi
  try {
    auth.setUser(await api.get<User>('/api/auth/me/'))
    const access = routeAccess(route.path)
    if (access && !(access === 'admin' ? auth.isAdmin : auth.can(access)))
      await navigateTo('/staff')
  }
  catch {}
})

const isActive = (item: NavItem) => (item.exact ? route.path === item.to : route.path.startsWith(item.to))
const initials = computed(() => (auth.user?.short_name || auth.user?.username || '?').slice(0, 2).toUpperCase())

function logout() {
  useLocationStore().reset()
  auth.logout()
  navigateTo('/login')
}
</script>

<template>
  <!-- talaba: mobil ilova ko'rinishi, faqat pastki navigatsiya -->
  <div v-if="auth.isStudent" class="min-h-dvh bg-muted/40">
    <main class="mx-auto max-w-3xl px-4 pt-[calc(env(safe-area-inset-top)+1.25rem)] pb-32">
      <slot />
    </main>
    <BottomNav :items="studentNav" show-logout @logout="logout" />
  </div>

  <!-- o'qituvchi / dekan / admin -->
  <div v-else class="min-h-dvh bg-muted/40">
    <header class="sticky top-0 z-30 border-b bg-background/95 pt-[env(safe-area-inset-top)] backdrop-blur">
      <div class="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4">
        <NuxtLink to="/" class="flex shrink-0 items-center gap-2 font-semibold">
          <span class="grid size-8 place-items-center rounded-md bg-primary text-xs text-primary-foreground">PC</span>
          <span class="whitespace-nowrap max-md:inline md:hidden 2xl:inline">Amaliyot nazorati</span>
        </NuxtLink>

        <!-- md..xl: faqat ikonka (tooltip bilan), xl+: ikonka + nom -->
        <TooltipProvider :delay-duration="200">
          <nav class="ml-2 hidden min-w-0 items-center gap-1 md:flex">
            <Tooltip v-for="item in staffNav" :key="item.to">
              <TooltipTrigger as-child>
                <Button
                  variant="ghost"
                  size="sm"
                  class="whitespace-nowrap"
                  :class="isActive(item) ? 'bg-muted font-medium text-foreground' : 'text-muted-foreground'"
                  as-child
                >
                  <NuxtLink :to="item.to" :aria-label="item.label">
                    <component :is="item.icon" />
                    <span class="hidden xl:inline">{{ item.label }}</span>
                  </NuxtLink>
                </Button>
              </TooltipTrigger>
              <TooltipContent class="xl:hidden">
                {{ item.label }}
              </TooltipContent>
            </Tooltip>
          </nav>
        </TooltipProvider>

        <DropdownMenu>
          <DropdownMenuTrigger class="ml-auto rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Avatar class="size-8">
              <AvatarImage v-if="auth.user?.image" :src="auth.user.image" />
              <AvatarFallback>{{ initials }}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" class="w-60">
            <DropdownMenuLabel class="font-normal">
              <div class="truncate font-medium">
                {{ auth.user?.full_name || auth.user?.username }}
              </div>
              <div class="text-xs text-muted-foreground">
                {{ ROLE_LABELS[auth.user?.role ?? ''] }}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem @select="navigateTo('/profile')">
              <UserIcon /> Profil
            </DropdownMenuItem>
            <DropdownMenuItem @select="toggle">
              <SunIcon v-if="isDark" /><MoonStarIcon v-else />
              {{ isDark ? "Yorug' rejim" : "Qorong'i rejim" }}
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" @select="logout">
              <LogOutIcon /> Chiqish
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>

    <main class="mx-auto max-w-7xl px-4 pt-4 pb-28 md:pb-10">
      <slot />
    </main>

    <div class="md:hidden">
      <BottomNav :items="staffNav" />
    </div>
  </div>
</template>
