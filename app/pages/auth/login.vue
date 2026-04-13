<script setup lang="ts">
import { toast } from 'vue-sonner';
import { LucideLoader } from 'lucide-vue-next';
import type { IResponse, IUser } from '~/types';


const runtimeConfig = useRuntimeConfig();

const username = ref("");
const password = ref("");

const isLoading = ref(false);
const { setUser } = useAuth();


definePageMeta({
    layout: "auth",
    middleware: ["is-not-auth"],
});

const hemisTeacherLogin = () => {
    useCookie("type").value = "teacher";
    navigateTo(
        `${runtimeConfig.public.hemisTeacherURL}?client_id=${runtimeConfig.public.hemisClientID}&client_secret=${runtimeConfig.public.hemisClientSecret}&redirect_uri=${runtimeConfig.public.hemisRedirectUri}&response_type=code`,
        {
            external: true
        }
    );
};

const hemisStudentLogin = () => {
    useCookie("type").value = "student";
    navigateTo(
        `${runtimeConfig.public.hemisStudentURL}?client_id=${runtimeConfig.public.hemisClientID}&client_secret=${runtimeConfig.public.hemisClientSecret}&redirect_uri=${runtimeConfig.public.hemisRedirectUri}&response_type=code`,
        {
            external: true
        }
    );
};

const login = async () => {
    isLoading.value = true;
    let response = await $fetch<IResponse<IUser | string>>(apify("auth/login"), {
        method: "POST",
        body: JSON.stringify({
            "username": username.value,
            "password": password.value
        })
    });

    if (response.status === "error") {
        toast("Xatolik", {
            description: response.data
        });
    } else {
        if (typeof response.data !== "string") {
            setUser(response.data);
            navigateTo({ name: "index" });
        }
    }
    isLoading.value = false;
};
</script>

<template>
    <div class="w-full md:w-1/3 flex flex-col gap-3 p-5">
        <p class="text-center text-2xl">Kirish</p>
        <div class="space-y-2">
            <Label>Foydalanuvchi nomi/Hemis ID</Label>
            <Input v-model="username" :disabled="isLoading" />
        </div>
        <div class="space-y-2">
            <Label>Kalit so'z</Label>
            <Input v-model="password" :disabled="isLoading" type="password" />
        </div>
        <Button :disabled="isLoading" @click="login">
            <LucideLoader v-if="isLoading" />
            Kirish
        </Button>
        <div class="w-full grid grid-cols-3 items-center gap-1">
            <Separator />
            <span class="text-center">Yoki</span>
            <Separator />
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 md:flex-row gap-2">
            <Button @click="hemisTeacherLogin" class="w-full" variant="outline">O'qituvchi</Button>
            <Button @click="hemisStudentLogin" class="w-full" variant="outline">Talaba</Button>
        </div>
    </div>
</template>