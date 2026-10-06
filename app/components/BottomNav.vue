<script setup lang="ts">
import type { Component } from 'vue'
import { LogOutIcon, MoonStarIcon, SunIcon } from '@lucide/vue'
import { Button } from '@/components/ui/button'

export interface NavItem {
  to: string
  label: string
  icon: Component
  exact?: boolean
}

/** Suzuvchi pill navigatsiya: faol bo'lim belgi + nom bilan, qolganlari faqat belgi */
defineProps<{ items: NavItem[], showLogout?: boolean }>()
const emit = defineEmits<{ logout: [] }>()

const route = useRoute()
const { isDark, toggle } = useTheme()

const isActive = (item: NavItem) => (item.exact ? route.path === item.to : route.path.startsWith(item.to))
</script>

<template>
  <nav class="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
    <div class="pointer-events-auto flex max-w-full items-center gap-1 overflow-x-auto rounded-full bg-muted/90 p-1.5 shadow-lg ring-1 ring-border backdrop-blur [scrollbar-width:none]">
      <NuxtLink
        v-for="item in items"
        :key="item.to"
        :to="item.to"
        :aria-label="item.label"
        class="flex h-10 shrink-0 items-center gap-2 rounded-full px-2.5 text-muted-foreground transition-all"
        :class="isActive(item) ? 'bg-background px-3.5 text-foreground shadow-sm' : 'hover:text-foreground'"
      >
        <component :is="item.icon" class="size-5 shrink-0" />
        <span v-if="isActive(item)" class="text-sm font-medium whitespace-nowrap">{{ item.label }}</span>
      </NuxtLink>

      <span class="mx-0.5 h-6 w-px bg-border" />

      <Button
        variant="ghost"
        size="icon-lg"
        class="shrink-0 rounded-full text-muted-foreground"
        :aria-label="isDark ? 'Yorug\' rejim' : 'Qorong\'i rejim'"
        @click="toggle"
      >
        <SunIcon v-if="isDark" class="size-5" />
        <MoonStarIcon v-else class="size-5" />
      </Button>
      <Button
        v-if="showLogout"
        variant="ghost"
        size="icon-lg"
        class="shrink-0 rounded-full text-muted-foreground"
        aria-label="Chiqish"
        @click="emit('logout')"
      >
        <LogOutIcon class="size-5" />
      </Button>
    </div>
  </nav>
</template>
