<script setup lang="ts">
import { LucideCheck, LucideLoader2, LucideMapPin, LucideServerCrash, LucideXCircle } from "lucide-vue-next";
import type { IArea, IAttendanceGroup, IResponse, LocationStatus } from "~/types";


const { user } = useAuth();

const step = ref(1);
const latitude = ref(0);
const longitude = ref(0);
const isLoading = ref(false);
const area = ref<IArea | null>(null);
const attendanceGroup = ref<IAttendanceGroup | null>(null);
const locationStatus = ref<LocationStatus>("loading");

// functions
const success = async (position: GeolocationPosition) => {
    isLoading.value = true;
    longitude.value = position.coords.longitude;
    latitude.value = position.coords.latitude;
    let response = await $fetch<{ status: "success" | "error", code: string, data: IArea; }>(apify("student/check_location"), {
        method: "POST",
        body: JSON.stringify({
            longitude: longitude.value,
            latitude: latitude.value,
            // latitude: "39.658603",
            // longitude: "66.914105",
        }),
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Token ${user.value?.token}`
        }
    });
    console.log(response);
    area.value = response.data;
    locationStatus.value = response.code as LocationStatus;

    isLoading.value = false;
};

const error = (err: GeolocationPositionError) => {
    locationStatus.value = "cannot_get";
    isLoading.value = false;
};

const fetchAttendanceGroup = async () => {
    try {
        const response = await $fetch<IResponse<{ a_group: IAttendanceGroup; }>>(apify("student/attendance_group"), {
            headers: {
                "Authorization": `Token ${user.value?.token}`
            }
        });
        console.log(response);
        if (response.status === "success") {
            attendanceGroup.value = response.data.a_group;

            if (attendanceGroup.value && attendanceGroup.value.step_1.is_available) {
                step.value = 1;
            } else if (attendanceGroup.value.step_2.is_available) {
                step.value = 2;
            } else if (attendanceGroup.value.step_3.is_available) {
                step.value = 3;
            }
        } else {

        }
    } catch (err) {
        console.error("Attendance fetch error:", err);
    } finally {
        isLoading.value = false;
    }
};


// onMounted
onMounted(() => {
    navigator.geolocation.getCurrentPosition(success, error);
    fetchAttendanceGroup();
});

definePageMeta({
    middleware: ["is-auth"],
});
</script>

<template>
    <div class="p-10 flex flex-col gap-5">
        <div class="rounded-lg border p-4 flex items-center gap-3 bg-muted/30">
            <template v-if="locationStatus === 'loading'">
                <LucideLoader2 class="animate-spin text-primary" />
                <span class="text-sm">Joylashuv tekshirilmoqda...</span>
            </template>

            <template v-else-if="locationStatus === 'cannot_get'">
                <LucideServerCrash class="text-muted-foreground size-5" />
                <span class="text-sm text-muted-foreground">Joylashuvingizni ololmadik.</span>
            </template>

            <template v-else-if="locationStatus === 'success' && area">
                <LucideMapPin class="text-green-500 size-4" />
                <span class="text-sm font-medium text-green-600">
                    {{ area.name }}
                </span>
            </template>

            <template v-else-if="locationStatus === 'not_in_area'">
                <LucideXCircle class="text-destructive size-5" />
                <span class="text-sm font-medium text-destructive">Noma'lum joy</span>
            </template>

            <template v-else>
                <p>🥳 Bugun dars yo'q</p>
            </template>
        </div>
        <p class="text-2xl">Salom 👋 {{ user?.full_name }}</p>

        <ClientOnly>
            <FlipClock size="sm" />
        </ClientOnly>

        <Alert>
            <AlertDescription>
                <span>Tizim test holatida ishlamoqda. Agar tizimda muammo bo'lsa</span>
                <span class="text-primary">+998 (88) 910-79-05</span>
            </AlertDescription>
        </Alert>

        <Timeline :default-value="step" v-if="attendanceGroup">
            <TimelineItem :key="1" :step="1" class="group-data-[orientation=vertical]/timeline:ms-10">
                <TimelineHeader>
                    <TimelineSeparator
                        class="group-data-[orientation=vertical]/timeline:-left-7 group-data-[orientation=vertical]/timeline:h-[calc(100%-1.5rem-0.25rem)] group-data-[orientation=vertical]/timeline:translate-y-6.5" />
                    <TimelineDate>08:00</TimelineDate>
                    <TimelineTitle>Birinchi juftlik</TimelineTitle>
                    <TimelineIndicator
                        class="group-data-completed/timeline-item:bg-green-500 group-data-completed/timeline-item:text-primary-foreground flex size-6 items-center justify-center group-data-completed/timeline-item:border-none group-data-[orientation=vertical]/timeline:-left-7">
                        <LucideCheck :size="16" class="group-not-data-completed/timeline-item:hidden" />
                    </TimelineIndicator>
                </TimelineHeader>
                <TimelineContent>
                    <p v-if="attendanceGroup.step_1">{{ attendanceGroup.step_1.created }}</p>
                    <Button @click="navigateTo({ name: 'attendance' })" v-else>Davomatdan o'tish</Button>
                </TimelineContent>
            </TimelineItem>
            <TimelineItem :key="2" :step="2" class="group-data-[orientation=vertical]/timeline:ms-10">
                <TimelineHeader>
                    <TimelineSeparator
                        class="group-data-[orientation=vertical]/timeline:-left-7 group-data-[orientation=vertical]/timeline:h-[calc(100%-1.5rem-0.25rem)] group-data-[orientation=vertical]/timeline:translate-y-6.5" />
                    <TimelineDate>10:00</TimelineDate>
                    <TimelineTitle>Ikkinchi juftlik</TimelineTitle>
                    <TimelineIndicator
                        class="group-data-completed/timeline-item:bg-green-500 group-data-completed/timeline-item:text-primary-foreground flex size-6 items-center justify-center group-data-completed/timeline-item:border-none group-data-[orientation=vertical]/timeline:-left-7">
                        <LucideCheck :size="16" class="group-not-data-completed/timeline-item:hidden" />
                    </TimelineIndicator>
                </TimelineHeader>
                <TimelineContent>
                    <p v-if="attendanceGroup?.step_2">{{ attendanceGroup.step_2.created }}</p>
                    <Button @click="navigateTo({ name: 'attendance' })"
                        v-else-if="attendanceGroup.step_2 && attendanceGroup.step_2.is_available">
                        Davomatdan o'tish
                    </Button>
                </TimelineContent>
            </TimelineItem>
            <TimelineItem :key="3" :step="3" class="group-data-[orientation=vertical]/timeline:ms-10">
                <TimelineHeader>
                    <TimelineSeparator
                        class="group-data-[orientation=vertical]/timeline:-left-7 group-data-[orientation=vertical]/timeline:h-[calc(100%-1.5rem-0.25rem)] group-data-[orientation=vertical]/timeline:translate-y-6.5" />
                    <TimelineDate>12:00</TimelineDate>
                    <TimelineTitle>Uchinchi juftlik</TimelineTitle>
                    <TimelineIndicator
                        class="group-data-completed/timeline-item:bg-green-500 group-data-completed/timeline-item:text-primary-foreground flex size-6 items-center justify-center group-data-completed/timeline-item:border-none group-data-[orientation=vertical]/timeline:-left-7">
                        <LucideCheck :size="16" class="group-not-data-completed/timeline-item:hidden" />
                    </TimelineIndicator>
                </TimelineHeader>
                <TimelineContent>
                    <p v-if="attendanceGroup?.step_3">{{ attendanceGroup.step_3.created }}</p>
                    <Button @click="navigateTo({ name: 'attendance' })"
                        v-else-if="attendanceGroup.step_3 && attendanceGroup.step_2.is_available">
                        Davomatdan o'tish
                    </Button>
                </TimelineContent>
            </TimelineItem>
        </Timeline>
    </div>
</template>