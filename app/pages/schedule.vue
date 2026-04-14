<script setup lang="ts">
import type { IResponse, ISchedule } from "~/types";


const { user } = useAuth();

const schedule = ref < ISchedule[] > ([]);


const getSchedule = async () => {
    let response = await $fetch < IResponse < { "schedule": ISchedule[] } >> (apify("student/schedule"), {
        headers: {
            "Authorization": `Token ${user.value?.token}`
        }
    });

    if (response.status === "success") {
        schedule.value = response.data.schedule;
    }
};
</script>

<template>
    <div class="p-10 flex flex-col gap-5">
        <Alert v-for="s in schedule">
            <AlertDescription>
                {{ s.area }}
                {{ s.weekday }}
            </AlertDescription>
        </Alert>
    </div>
</template>