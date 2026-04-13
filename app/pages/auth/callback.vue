<script setup lang="ts">
import type { IResponse, IUser } from '~/types';


const error = ref();
const route = useRoute();

const { setUser } = useAuth();


onMounted(async () => {
    let response = await $fetch<IResponse<IUser>>(apify("auth/hemis/callback"), {
        method: "POST",
        body: JSON.stringify({
            "code": route.query.code,
            "type": useCookie("type").value
        })
    });

    if (response.status === "error") {
        error.value = response.data;
        navigateTo({ name: "auth-login" });
    } else {
        setUser(response.data);
        navigateTo({ name: "index" });
    }
});
</script>

<template>
    <div>
        Kuting...
        {{ error }}
    </div>
</template>