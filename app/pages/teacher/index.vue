<script setup lang="ts">
definePageMeta({
	layout: "teacher",
});

const auth = useAuthStore();
</script>
<template>
	<div class="p-5">
		<Card>
			<CardHeader class="border-b">
				<CardTitle>
					Assalomu alayykum, {{ auth.user?.full_name }}
				</CardTitle>
			</CardHeader>
			<CardContent>
				<p>Sizga biriktirilgan guruhlar - 2</p>
				<p>Sizga biriktirilgan talabalar - 20</p>
			</CardContent>
		</Card>
	</div>
</template>
