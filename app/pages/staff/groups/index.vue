<script setup lang="ts">
import {
  ChevronRightIcon,
  SearchIcon,
  UserRoundIcon,
  UsersIcon,
} from "@lucide/vue";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TeacherPicker from "~/components/staff/TeacherPicker.vue";
import { useAuthStore } from "~/stores/auth";
import type { GroupItem } from "~/types";

const api = useApi();
const auth = useAuthStore();
const NuxtLink = resolveComponent("NuxtLink");
const canAttendance = computed(() => auth.can("attendance.view_attendance"));
const groups = ref<GroupItem[]>([]);
const loading = ref(true);
const syncing = ref(false);
const search = ref("");
const filter = ref<"all" | "no-teacher">("all");

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase();
  return groups.value.filter(
    (g) =>
      (!q ||
        g.name.toLowerCase().includes(q) ||
        g.teacher?.toLowerCase().includes(q)) &&
      (filter.value === "all" || !g.teacher_uuid),
  );
});
const withoutTeacher = computed(
  () => groups.value.filter((g) => !g.teacher_uuid).length,
);

function onTeacherChanged(
  group: GroupItem,
  teacher: { uuid: string; full_name: string } | null,
) {
  group.teacher = teacher?.full_name ?? null;
  group.teacher_uuid = teacher?.uuid ?? null;
}

async function syncGroups() {
  syncing.value = true;

  try {
    const response = await api.post<any>(
      "/api/attendance/groups/sync-groups/",
      {
        method: "POST",
      },
    );

    groups.value = await api.get<GroupItem[]>("/api/attendance/groups/");
  } finally {
    syncing.value = false;
  }
}

onMounted(async () => {
  try {
    groups.value = await api.get<GroupItem[]>("/api/attendance/groups/");
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-xl font-semibold">Guruhlar</h1>
        <p class="text-sm text-muted-foreground">
          {{ groups.length }} ta guruh<template v-if="withoutTeacher">
            · {{ withoutTeacher }} tasiga o'qituvchi biriktirilmagan
          </template>
        </p>
      </div>
      <div class="flex w-full flex-wrap items-center gap-2 sm:w-auto">
        <Button @click="syncGroups">Guruhlarni yuklash</Button>
        <Tabs v-if="auth.can('users.change_group')" v-model="filter">
          <TabsList>
            <TabsTrigger value="all"> Barchasi </TabsTrigger>
            <TabsTrigger value="no-teacher">
              O'qituvchisiz
              <Badge
                v-if="withoutTeacher"
                variant="secondary"
                class="ml-1 h-5 px-1.5 tabular-nums"
              >
                {{ withoutTeacher }}
              </Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <div class="relative min-w-0 flex-1 sm:w-64 sm:flex-none">
          <SearchIcon
            class="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            v-model="search"
            placeholder="Guruh yoki o'qituvchi"
            class="pl-8"
          />
        </div>
      </div>
    </div>

    <div v-if="loading" class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      <Skeleton v-for="i in 6" :key="i" class="h-40 rounded-xl" />
    </div>
    <Card v-else-if="!filtered.length">
      <CardContent class="py-10 text-center text-sm text-muted-foreground">
        Guruhlar topilmadi
      </CardContent>
    </Card>
    <div v-else class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      <Card
        v-for="g in filtered"
        :key="g.uuid"
        class="gap-0 py-0 transition-colors hover:border-foreground/30"
      >
        <component
          :is="canAttendance ? NuxtLink : 'div'"
          :to="canAttendance ? `/staff/groups/${g.uuid}` : undefined"
          class="block"
        >
          <CardContent class="flex items-start gap-3 p-4">
            <div class="min-w-0 flex-1 space-y-1">
              <div class="line-clamp-2 font-semibold">
                {{ g.name }}
              </div>
              <div class="truncate text-xs text-muted-foreground">
                {{ g.faculty || "—" }}
              </div>
              <div
                class="flex items-center gap-1 text-xs text-muted-foreground"
              >
                <UsersIcon class="size-3.5" /> {{ g.students_count }} talaba
              </div>
              <div class="flex flex-wrap gap-1 pt-1">
                <Badge
                  v-for="s in g.schedules"
                  :key="s.uuid"
                  variant="secondary"
                  class="max-w-full truncate"
                >
                  {{ s.weekdays.map((i) => WEEKDAYS[i]?.short).join("+") }} ·
                  {{ s.location.name }}
                </Badge>
                <Badge v-if="!g.schedules.length" variant="outline">
                  Jadval yo'q
                </Badge>
              </div>
            </div>
            <ChevronRightIcon
              v-if="canAttendance"
              class="size-4 shrink-0 text-muted-foreground"
            />
          </CardContent>
        </component>
        <CardFooter class="border-t px-4 py-3">
          <TeacherPicker
            v-if="auth.can('users.change_group')"
            :group-uuid="g.uuid"
            :group-name="g.name"
            :teacher-uuid="g.teacher_uuid"
            :teacher-name="g.teacher"
            full
            @changed="onTeacherChanged(g, $event)"
          />
          <div v-else class="flex min-w-0 items-center gap-2 text-sm">
            <UserRoundIcon class="size-4 shrink-0 text-muted-foreground" />
            <span
              class="truncate"
              :class="{ 'text-muted-foreground': !g.teacher }"
              >{{ g.teacher || "O'qituvchi biriktirilmagan" }}</span
            >
          </div>
        </CardFooter>
      </Card>
    </div>
  </div>
</template>
