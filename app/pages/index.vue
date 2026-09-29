<script setup lang="ts">
import { useMiniApp } from "vue-tg";

const miniApp = useMiniApp();

miniApp.ready();
</script>

<template>
	<ClientOnly>
		<div>data: {{ miniApp.initData }}</div>
		<div>data: {{ miniApp.initDataUnsafe }}</div>
	</ClientOnly>
</template>
