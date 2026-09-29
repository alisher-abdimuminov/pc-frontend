<script setup lang="ts">
import { LayoutDashboardIcon, ListIcon } from "@lucide/vue";

const auth = useAuthStore();

function logout() {
	auth.clear();
	navigateTo({ name: "auth-login" });
}
</script>

<template>
	<Sidebar v-bind="$props" variant="inset">
		<SidebarHeader>
			<SidebarMenu>
				<SidebarMenuItem class="flex items-center gap-2">
					<img src="/images/logo.png" class="size-10" alt="" />
					<span class="text-xl font-bold">Practicum</span>
				</SidebarMenuItem>
			</SidebarMenu>
		</SidebarHeader>
		<SidebarContent>
			<SidebarGroup>
				<SidebarGroupLabel>Asosiy</SidebarGroupLabel>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton
							size="lg"
							:isActive="$route.name === 'student'"
							@click="navigateTo({ name: 'student' })"
						>
							<div class="bg-amber-600 text-white p-2 rounded-md">
								<LayoutDashboardIcon />
							</div>
							<span>Bosh sahifa</span>
						</SidebarMenuButton>
					</SidebarMenuItem>
					<SidebarMenuItem>
						<SidebarMenuButton
							size="lg"
							:isActive="$route.name === 'student-assignments'"
							@click="navigateTo({ name: 'student-assignments' })"
						>
							<div class="bg-lime-600 text-white p-2 rounded-md">
								<ListIcon />
							</div>
							<span>Topshiriqlar</span>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarGroup>
		</SidebarContent>
		<SidebarFooter>
			<Button variant="destructive" @click="logout"> Chiqish </Button>
		</SidebarFooter>
	</Sidebar>
</template>
