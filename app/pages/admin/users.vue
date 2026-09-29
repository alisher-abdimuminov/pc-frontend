<script setup lang="ts">
import { SearchIcon } from "@lucide/vue";

import type { User } from "@/types/api";

definePageMeta({
	layout: "admin",
});

const { api, errorMessage } = useApi();

const users = ref<User[]>([]);
const error = ref("");
const search = ref("");
const loading = ref(false);

const currentPage = ref(1);
const total = ref(0);
const pageSize = 50;

async function load() {
	loading.value = true;
	error.value = "";

	try {
		const params = new URLSearchParams();

		params.set("page", String(currentPage.value));

		if (search.value.trim()) {
			params.set("search", search.value.trim());
		}

		const response = await api<any>(`/auth/users/?${params.toString()}`);

		users.value = response?.results || [];

		total.value = response?.count || 0;
	} catch (e) {
		error.value = errorMessage(e);
	} finally {
		loading.value = false;
	}
}

onMounted(load);

/* ----------------------------------
 * SEARCH
 * ---------------------------------- */

let searchTimer: ReturnType<typeof setTimeout> | null = null;

watch(search, () => {
	if (searchTimer) {
		clearTimeout(searchTimer);
	}

	searchTimer = setTimeout(async () => {
		currentPage.value = 1;

		await load();
	}, 400);
});

/* ----------------------------------
 * PAGE
 * ---------------------------------- */

async function handlePageChange(page: number) {
	if (page === currentPage.value) {
		return;
	}

	currentPage.value = page;

	await load();
}

/* ----------------------------------
 * ROLE
 * ---------------------------------- */

function roleLabel(role: string) {
	if (role === "student") {
		return "Talaba";
	}

	if (role === "teacher") {
		return "O‘qituvchi";
	}

	if (role === "admin") {
		return "Admin";
	}

	return role;
}
</script>
<template>
	<div class="p-5 grid gap-5">
		<InputGroup>
			<InputGroupInput v-model="search" />
			<InputGroupAddon align="inline-start">
				<SearchIcon />
			</InputGroupAddon>
		</InputGroup>

		<Card>
			<CardContent class="p-0 w-full">
				<div class="w-full overflow-x-auto">
					<Table class="overflow-x-auto">
						<TableHeader>
							<TableRow>
								<TableHead class="w-4">#</TableHead>
								<TableHead>Foydalanuvchi</TableHead>
								<TableHead>Fakulteti</TableHead>
								<TableHead>Guruhi</TableHead>
								<TableHead>Role</TableHead>
								<TableHead>GPA</TableHead>
								<TableHead>Holati</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							<TableRow v-for="(user, idx) in users">
								<TableCell>{{ idx + 1 }}</TableCell>
								<TableCell>
									<Sheet>
										<SheetTrigger>
											<div
												class="flex flex-col gap-1 items-start"
											>
												<span>
													{{ user.full_name || "-" }}
												</span>
												<span
													class="text-muted-foreground"
												>
													{{ user.username }}
												</span>
											</div>
										</SheetTrigger>
										<SheetContent>
											<SheetHeader>
												<SheetTitle>
													Foydalanuvchi ma'lumotlari
												</SheetTitle>
											</SheetHeader>
											<div class="overflow-auto">
												<Table>
													<TableHeader>
														<TableRow>
															<TableHead>
																Maydon
															</TableHead>
															<TableHead>
																Maydon
															</TableHead>
														</TableRow>
													</TableHeader>
													<TableBody>
														<TableRow>
															<TableCell>
																Ism
															</TableCell>
															<TableCell>
																{{
																	user.first_name
																}}
															</TableCell>
														</TableRow>
														<TableRow>
															<TableCell>
																Familiya
															</TableCell>
															<TableCell>
																{{
																	user.second_name
																}}
															</TableCell>
														</TableRow>
														<TableRow>
															<TableCell>
																Sharif
															</TableCell>
															<TableCell>
																{{
																	user.third_name
																}}
															</TableCell>
														</TableRow>
														<TableRow>
															<TableCell>
																To'liq ism
															</TableCell>
															<TableCell>
																{{
																	user.full_name
																}}
															</TableCell>
														</TableRow>
														<TableRow>
															<TableCell>
																Qisqa ism
															</TableCell>
															<TableCell>
																{{
																	user.short_name
																}}
															</TableCell>
														</TableRow>
														<TableRow>
															<TableCell>
																Email
															</TableCell>
															<TableCell>
																{{ user.email }}
															</TableCell>
														</TableRow>
														<TableRow>
															<TableCell>
																Telefon raqam
															</TableCell>
															<TableCell>
																{{ user.phone }}
															</TableCell>
														</TableRow>
														<TableRow>
															<TableCell>
																Passport PIN
															</TableCell>
															<TableCell>
																{{
																	user.passport_pin
																}}
															</TableCell>
														</TableRow>
														<TableRow>
															<TableCell>
																Passport raqami
															</TableCell>
															<TableCell>
																{{
																	user.passport_number
																}}
															</TableCell>
														</TableRow>
														<template
															v-if="
																user.role ===
																'student'
															"
														>
															<TableRow>
																<TableCell>
																	Jins
																</TableCell>
																<TableCell>
																	{{
																		user.gender
																	}}
																</TableCell>
															</TableRow>
															<TableRow>
																<TableCell>
																	To'lov
																	shakli
																</TableCell>
																<TableCell>
																	{{
																		user.payment_form
																	}}
																</TableCell>
															</TableRow>
															<TableRow>
																<TableCell>
																	Kurs
																</TableCell>
																<TableCell>
																	{{
																		user.level
																	}}
																</TableCell>
															</TableRow>
															<TableRow>
																<TableCell>
																	Smester
																</TableCell>
																<TableCell>
																	{{
																		user.smester
																	}}
																</TableCell>
															</TableRow>
															<TableRow>
																<TableCell>
																	GPA
																</TableCell>
																<TableCell>
																	{{
																		user.gpa
																	}}
																</TableCell>
															</TableRow>
															<TableRow>
																<TableCell>
																	Manzil
																</TableCell>
																<TableCell>
																	{{
																		user.address
																	}}
																</TableCell>
															</TableRow>
															<TableRow>
																<TableCell>
																	Mamlakat
																</TableCell>
																<TableCell>
																	{{
																		user.country
																	}}
																</TableCell>
															</TableRow>
															<TableRow>
																<TableCell>
																	Province
																</TableCell>
																<TableCell>
																	{{
																		user.province
																	}}
																</TableCell>
															</TableRow>
															<TableRow>
																<TableCell>
																	Tuman
																</TableCell>
																<TableCell>
																	{{
																		user.district
																	}}
																</TableCell>
															</TableRow>
														</template>
													</TableBody>
												</Table>
											</div>
										</SheetContent>
									</Sheet>
								</TableCell>
								<TableCell>{{ user.faculty_name }}</TableCell>
								<TableCell>{{ user.group_name }}</TableCell>
								<TableCell>
									<Badge>
										{{ roleLabel(user.role) }}
									</Badge>
								</TableCell>
								<TableCell>
									{{ user.gpa }}
								</TableCell>
								<TableCell>
									<Switch disabled v-model="user.is_active" />
								</TableCell>
							</TableRow>
						</TableBody>
					</Table>
				</div>
			</CardContent>
			<CardFooter>
				<Pagination
					:page="currentPage"
					:total="total"
					:items-per-page="pageSize"
					:sibling-count="1"
					show-edges
					@update:page="handlePageChange"
				>
					<PaginationContent v-slot="{ items }">
						<PaginationPrevious />

						<template v-for="(item, index) in items" :key="index">
							<PaginationItem
								v-if="item.type === 'page'"
								:value="item.value"
								:is-active="item.value === currentPage"
							>
								{{ item.value }}
							</PaginationItem>

							<PaginationEllipsis v-else :index="index" />
						</template>

						<PaginationNext />
					</PaginationContent>
				</Pagination>
			</CardFooter>
		</Card>
	</div>
</template>
