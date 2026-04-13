<script setup lang="ts">
import 'vue-sonner/style.css';
import { Toaster } from '@/components/ui/sonner';
</script>

<template>
	<div>
		<NuxtRouteAnnouncer />
		<Toaster />
		<NuxtLayout>
			<NuxtPage />
		</NuxtLayout>
	</div>
</template>
