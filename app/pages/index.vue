<script setup lang="ts">
const tma = useTelegramWebApp();

const telegramUser = computed(() => tma.telegramUser.value);

onMounted(async () => {
	await tma.init();

	await tma.initLocationManager();
});

onBeforeUnmount(() => {
	tma.cleanup();
});
</script>

<template>
	<div>
		Platform:
		{{ tma.platform }}
	</div>

	<div>
		Location:
		{{
			tma.locationAccessGranted ? "Ruxsat berilgan" : "Ruxsat berilmagan"
		}}
	</div>
	<div>
		{{ telegramUser }}
	</div>
</template>
