<script setup lang="ts">
import { useMiniApp } from "vue-tg";

const miniApp = useMiniApp();
</script>

<template>
	<div>data: {{ miniApp.initData }}</div>
	<div>data: {{ miniApp.initDataUnsafe }}</div>
</template>
