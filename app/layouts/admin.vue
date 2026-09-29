<script setup lang="ts">
import { LucideMoonStar } from "@lucide/vue";
</script>

<template>
	<SidebarProvider class="h-screen">
		<AppSidebar />
		<SidebarInset>
			<header
				class="flex items-center justify-between h-16 sticky border-b shrink-0 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12"
			>
				<div class="pl-4">
					<SidebarTrigger class="-ml-1" />
				</div>
				<div class="pr-4">
					<Button size="icon" @click="$toggleTheme">
						<LucideMoonStar />
					</Button>
				</div>
			</header>
			<ScrollArea class="w-full h-[calc(100%-5rem)]">
				<slot />
			</ScrollArea>
		</SidebarInset>
	</SidebarProvider>
</template>
