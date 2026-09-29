<script setup lang="ts">
import { SearchIcon, Pencil, ChevronDown } from "@lucide/vue";

import type { Group, User } from "@/types/api";

definePageMeta({
	layout: "admin",
});

const { api, errorMessage } = useApi();

const groups = ref<Group[]>([]);
const teachers = ref<User[]>([]);

const error = ref("");
const search = ref("");
const loading = ref(false);
const editLoading = ref(false);

const currentPage = ref(1);
const total = ref(0);
const pageSize = 50;

/* ----------------------------------
 * EDIT
 * ---------------------------------- */

const editDialogOpen = ref(false);

const editingGroup = ref<Group | null>(null);

const teacherOpen = ref(false);

const selectedTeacher = ref("");

/* ----------------------------------
 * LOAD
 * ---------------------------------- */

async function load() {
	loading.value = true;
	error.value = "";

	try {
		const params = new URLSearchParams();

		params.set("page", String(currentPage.value));

		if (search.value.trim()) {
			params.set("search", search.value.trim());
		}

		const response = await api<any>(`/auth/groups/?${params.toString()}`);

		groups.value = response?.results || [];

		total.value = response?.count || 0;
	} catch (e) {
		error.value = errorMessage(e);
	} finally {
		loading.value = false;
	}
}

/* ----------------------------------
 * TEACHERS
 * ---------------------------------- */

async function loadTeachers() {
	try {
		const response = await api<any>("/auth/users/?type=teacher");

		teachers.value = Array.isArray(response)
			? response
			: response?.results || [];
	} catch (e) {
		error.value = errorMessage(e);
	}
}

onMounted(async () => {
	await Promise.all([load(), loadTeachers()]);
});

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
 * SELECTED TEACHER
 * ---------------------------------- */

function getSelectedTeacher() {
	return teachers.value.find(
		(teacher) => String(teacher.uuid) === selectedTeacher.value,
	);
}

function selectTeacher(value: string) {
	selectedTeacher.value = value;

	teacherOpen.value = false;
}

/* ----------------------------------
 * OPEN EDIT
 * ---------------------------------- */

function openEditDialog(group: Group) {
	editingGroup.value = group;

	selectedTeacher.value = group.teacher ? String(group.teacher) : "";

	editDialogOpen.value = true;
}

/* ----------------------------------
 * SAVE EDIT
 * ---------------------------------- */

async function saveGroup() {
	if (!editingGroup.value || !selectedTeacher.value) {
		return;
	}

	editLoading.value = true;
	error.value = "";

	try {
		await api(`/auth/groups/${editingGroup.value.uuid}/`, {
			method: "PATCH",

			body: {
				teacher: selectedTeacher.value,
			},
		});

		editDialogOpen.value = false;

		editingGroup.value = null;

		selectedTeacher.value = "";

		await load();
	} catch (e) {
		error.value = errorMessage(e);
	} finally {
		editLoading.value = false;
	}
}
</script>

<template>
	<div class="grid gap-5 p-5">
		<InputGroup>
			<InputGroupInput v-model="search" />

			<InputGroupAddon align="inline-start">
				<SearchIcon />
			</InputGroupAddon>
		</InputGroup>

		<div
			v-if="error"
			class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
		>
			{{ error }}
		</div>

		<Card>
			<CardContent class="w-full p-0">
				<div class="w-full overflow-x-auto">
					<Table class="overflow-x-auto">
						<TableHeader>
							<TableRow>
								<TableHead class="w-4"> # </TableHead>

								<TableHead> Nomi </TableHead>

								<TableHead> O'qituvchi </TableHead>

								<TableHead> Talabalar soni </TableHead>

								<TableHead class="w-20 text-right">
									Amal
								</TableHead>
							</TableRow>
						</TableHeader>

						<TableBody>
							<TableRow
								v-for="(group, idx) in groups"
								:key="group.uuid"
							>
								<TableCell>
									{{ idx + 1 }}
								</TableCell>

								<TableCell>
									{{ group.name }}
								</TableCell>

								<TableCell>
									{{
										group.teacher_name || "Biriktirilmagan"
									}}
								</TableCell>

								<TableCell>
									{{ group.student_count }}
								</TableCell>

								<TableCell>
									<div class="flex justify-end">
										<Button
											variant="outline"
											size="icon"
											@click="openEditDialog(group)"
										>
											<Pencil class="h-4 w-4" />
										</Button>
									</div>
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

		<!-- EDIT GROUP -->

		<Dialog v-model:open="editDialogOpen">
			<DialogContent class="sm:max-w-md">
				<DialogHeader>
					<DialogTitle> Guruhni tahrirlash </DialogTitle>
				</DialogHeader>

				<div class="grid gap-5">
					<div class="grid gap-2">
						<Label> Guruh </Label>

						<Input :model-value="editingGroup?.name" disabled />
					</div>

					<!-- TEACHER -->

					<div class="grid gap-2">
						<Label> O'qituvchi </Label>

						<Popover v-model:open="teacherOpen">
							<PopoverTrigger as-child>
								<Button
									type="button"
									variant="outline"
									role="combobox"
									:aria-expanded="teacherOpen"
									class="w-full justify-between px-3 font-normal"
								>
									<span
										v-if="selectedTeacher"
										class="truncate"
									>
										{{
											getSelectedTeacher()?.full_name ||
											getSelectedTeacher()?.username
										}}
									</span>

									<span v-else class="text-muted-foreground">
										O'qituvchini tanlang
									</span>

									<ChevronDown
										class="h-4 w-4 shrink-0 text-muted-foreground"
									/>
								</Button>
							</PopoverTrigger>

							<PopoverContent
								class="w-full min-w-(--reka-popper-anchor-width) p-0"
								align="start"
							>
								<Command>
									<CommandInput
										placeholder="O'qituvchini qidirish..."
									/>

									<CommandList>
										<CommandEmpty>
											O'qituvchi topilmadi.
										</CommandEmpty>

										<CommandGroup>
											<CommandItem
												v-for="teacher in teachers"
												:key="teacher.uuid"
												:value="`${teacher.full_name || ''} ${teacher.username || ''}`"
												@select="
													selectTeacher(
														String(teacher.uuid),
													)
												"
											>
												<div class="min-w-0">
													<div class="truncate">
														{{
															teacher.full_name ||
															teacher.username
														}}
													</div>

													<div
														class="truncate text-xs text-muted-foreground"
													>
														{{ teacher.username }}
													</div>
												</div>
											</CommandItem>
										</CommandGroup>
									</CommandList>
								</Command>
							</PopoverContent>
						</Popover>
					</div>
				</div>

				<DialogFooter>
					<Button
						type="button"
						variant="outline"
						@click="editDialogOpen = false"
					>
						Bekor qilish
					</Button>

					<Button
						type="button"
						:disabled="editLoading || !selectedTeacher"
						@click="saveGroup"
					>
						{{ editLoading ? "Saqlanmoqda..." : "Saqlash" }}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	</div>
</template>
