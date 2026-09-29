<script setup lang="ts">
import { HomeIcon, ListIcon, UserGroupIcon, UsersIcon } from "@lucide/vue";

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
							:isActive="$route.name === 'teacher'"
							@click="navigateTo({ name: 'teacher' })"
						>
							<div class="bg-amber-600 text-white p-2 rounded-md">
								<HomeIcon />
							</div>
							<span>Bosh sahifa</span>
						</SidebarMenuButton>
					</SidebarMenuItem>
					<SidebarMenuItem>
						<SidebarMenuButton
							size="lg"
							:isActive="$route.name === 'teacher-groups'"
							@click="navigateTo({ name: 'teacher-groups' })"
						>
							<div class="bg-lime-600 text-white p-2 rounded-md">
								<UsersIcon />
							</div>
							<span>Guruhlar</span>
						</SidebarMenuButton>
					</SidebarMenuItem>
					<SidebarMenuItem>
						<SidebarMenuButton
							size="lg"
							:isActive="$route.name === 'teacher-attendance'"
							@click="navigateTo({ name: 'teacher-attendance' })"
						>
							<div
								class="bg-emerald-600 text-white p-2 rounded-md"
							>
								<UserGroupIcon />
							</div>
							<span>Davomat</span>
						</SidebarMenuButton>
					</SidebarMenuItem>
					<SidebarMenuItem>
						<SidebarMenuButton
							size="lg"
							:isActive="$route.name === 'teacher-assignments'"
							@click="navigateTo({ name: 'teacher-assignments' })"
						>
							<div class="bg-teal-600 text-white p-2 rounded-md">
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
