<script setup lang="ts">
import {
	Building2Icon,
	CalendarIcon,
	DiffIcon,
	HomeIcon,
	LayoutDashboardIcon,
	LogOutIcon,
	MapPinIcon,
	UserGroupIcon,
	UsersIcon,
} from "@lucide/vue";

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
							:isActive="$route.name === 'admin'"
							@click="navigateTo({ name: 'admin' })"
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
							:isActive="$route.name === 'admin-users'"
							@click="navigateTo({ name: 'admin-users' })"
						>
							<div class="bg-lime-600 text-white p-2 rounded-md">
								<UsersIcon />
							</div>
							<span>Foydalanuvchilar</span>
						</SidebarMenuButton>
					</SidebarMenuItem>
					<SidebarMenuItem>
						<SidebarMenuButton
							size="lg"
							:isActive="$route.name === 'admin-groups'"
							@click="navigateTo({ name: 'admin-groups' })"
						>
							<div
								class="bg-emerald-600 text-white p-2 rounded-md"
							>
								<UserGroupIcon />
							</div>
							<span>Guruhlar</span>
						</SidebarMenuButton>
					</SidebarMenuItem>
					<SidebarMenuItem>
						<SidebarMenuButton
							size="lg"
							:isActive="$route.name === 'admin-faculties'"
							@click="navigateTo({ name: 'admin-faculties' })"
						>
							<div class="bg-teal-600 text-white p-2 rounded-md">
								<Building2Icon />
							</div>
							<span>Fakultetlar</span>
						</SidebarMenuButton>
					</SidebarMenuItem>
					<SidebarMenuItem>
						<SidebarMenuButton
							size="lg"
							:isActive="$route.name === 'admin-locations'"
							@click="navigateTo({ name: 'admin-locations' })"
						>
							<div class="bg-cyan-600 text-white p-2 rounded-md">
								<MapPinIcon />
							</div>
							<span>Joylashuvlar</span>
						</SidebarMenuButton>
					</SidebarMenuItem>
					<SidebarMenuItem>
						<SidebarMenuButton
							size="lg"
							:isActive="$route.name === 'admin-schedules'"
							@click="navigateTo({ name: 'admin-schedules' })"
						>
							<div class="bg-rose-600 text-white p-2 rounded-md">
								<CalendarIcon />
							</div>
							<span>Dars jadvallari</span>
						</SidebarMenuButton>
					</SidebarMenuItem>
					<SidebarMenuItem>
						<SidebarMenuButton
							size="lg"
							:isActive="$route.name === 'admin-attendance'"
							@click="navigateTo({ name: 'admin-attendance' })"
						>
							<div class="bg-mauve-600 text-white p-2 rounded-md">
								<DiffIcon />
							</div>
							<span>Davomat</span>
						</SidebarMenuButton>
					</SidebarMenuItem>
					<SidebarMenuItem>
						<SidebarMenuButton
							size="lg"
							:isActive="$route.name === 'admin-attempts'"
							@click="navigateTo({ name: 'admin-attempts' })"
						>
							<div class="bg-olive-600 text-white p-2 rounded-md">
								<DiffIcon />
							</div>
							<span>Urinishlar</span>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarGroup>
		</SidebarContent>
		<SidebarFooter>
			<Button variant="destructive" @click="logout">
				<LogOutIcon />
				<span>Chiqish</span>
			</Button>
		</SidebarFooter>
	</Sidebar>
</template>
