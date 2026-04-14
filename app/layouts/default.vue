<script setup lang="ts">
import { LucideCalendar, LucideCalendarDays, LucideHome, LucideListChecks, LucideLogOut, LucideMoonStar, LucideSun, LucideUser } from "lucide-vue-next";


const { theme } = useTheme();
const { user, logout } = useAuth();
</script>

<template>
    <div class="relative">
        <div class="fixed flex items-center justify-center w-full bottom-0 left-0 h-20">
            <div class="flex items-center gap-5 border p-5 rounded-3xl bg-background/70">
                <NuxtLink :to="{ name: 'index' }" class="text-muted-foreground"
                    :class="{ 'text-primary': $route.name === 'index' }">
                    <LucideHome class="hover:size-10 transition-all duration-300" />
                </NuxtLink>
                <NuxtLink :to="{ name: 'tasks' }" class="text-muted-foreground"
                    :class="{ 'text-primary': $route.name === 'tasks' }">
                    <LucideListChecks class="hover:size-10 transition-all duration-300" />
                </NuxtLink>
                <NuxtLink :to="{ name: 'schedule' }" class="text-muted-foreground"
                    :class="{ 'text-primary': $route.name === 'schedule' }">
                    <LucideCalendarDays class="hover:size-10 transition-all duration-300" />
                </NuxtLink>
                <div class="text-muted-foreground hover:text-primary"
                    @click="theme = theme === 'dark' ? 'light' : 'dark'">
                    <LucideSun v-if="theme === 'dark'" class="hover:size-10 transition-all duration-300" />
                    <LucideMoonStar v-else class="hover:size-10 transition-all duration-300" />
                </div>
                <div>
                    <LucideLogOut @click="logout" class="text-red-500 hover:size-10 transition-all duration-300" />
                </div>
            </div>
        </div>
        <slot />
    </div>
</template>