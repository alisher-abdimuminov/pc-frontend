<script setup lang="ts">
import type { IResponse, ISchedule } from "~/types";


const { user } = useAuth();

const schedule = ref<ISchedule[]>([]);


const getSchedule = async () => {
    let response = await $fetch<IResponse<{ "schedule": ISchedule[]; }>>(apify("student/schedule"), {
        headers: {
            "Authorization": `Token ${user.value?.token}`
        }
    });

    if (response.status === "success") {
        schedule.value = response.data.schedule;
    }
};

onMounted(() => {
    getSchedule();
});
</script>

<template>
    <div class="p-10 flex flex-col gap-5">
        <Alert v-for="s in schedule">
            <AlertDescription>
                <span v-if="s.weekday === 0">Dushanba</span>
                <span v-if="s.weekday === 1">Seshanba</span>
                <span v-if="s.weekday === 2">Chorshanba</span>
                <span v-if="s.weekday === 3">Payshanba</span>
                <span v-if="s.weekday === 4">Juma</span>
                <span v-if="s.weekday === 5">Shanba</span>
                &nbsp;
                <span>{{ s.area.name }}</span>
            </AlertDescription>
        </Alert>
    </div>
</template>