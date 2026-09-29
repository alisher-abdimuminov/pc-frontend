<script setup lang="ts">
import { SearchIcon, Plus, Pencil } from "@lucide/vue";

import type { Location } from "@/types/api";

import { toTypedSchema } from "@vee-validate/zod";

import z from "zod";

import { useForm } from "vee-validate";

definePageMeta({
	layout: "admin",
});

const { api, errorMessage } = useApi();

const locations = ref<Location[]>([]);

const error = ref("");
const search = ref("");
const loading = ref(false);

const addLoading = ref(false);

const currentPage = ref(1);
const total = ref(0);
const pageSize = 50;

/* ----------------------------------
 * DIALOG
 * ---------------------------------- */

const locationDialogOpen = ref(false);

const editingLocation = ref<Location | null>(null);

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

		const response = await api<any>(
			`/attendance/locations/?${params.toString()}`,
		);

		locations.value = response?.results || [];

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
 * FORM
 * ---------------------------------- */

const locationFormSchema = toTypedSchema(
	z.object({
		name: z.string().min(1, "Joylashuv nomini kiriting"),

		point_1: z.string().min(1, "1-nuqtani kiriting"),

		point_2: z.string().min(1, "2-nuqtani kiriting"),

		point_3: z.string().min(1, "3-nuqtani kiriting"),

		point_4: z.string().min(1, "4-nuqtani kiriting"),

		location: z.string().min(1, "Xarita linkini kiriting"),
	}),
);

const { handleSubmit, resetForm, setFieldValue, values, errors } = useForm({
	validationSchema: locationFormSchema,

	initialValues: {
		name: "",
		point_1: "",
		point_2: "",
		point_3: "",
		point_4: "",
		location: "",
	},
});

/* ----------------------------------
 * OPEN ADD
 * ---------------------------------- */

function openAddDialog() {
	editingLocation.value = null;

	resetForm({
		values: {
			name: "",
			point_1: "",
			point_2: "",
			point_3: "",
			point_4: "",
			location: "",
		},
	});

	locationDialogOpen.value = true;
}

/* ----------------------------------
 * OPEN EDIT
 * ---------------------------------- */

function openEditDialog(location: Location) {
	editingLocation.value = location;

	resetForm({
		values: {
			name: location.name || "",

			point_1: location.point_1 || "",

			point_2: location.point_2 || "",

			point_3: location.point_3 || "",

			point_4: location.point_4 || "",

			location: location.location || "",
		},
	});

	locationDialogOpen.value = true;
}

/* ----------------------------------
 * ADD / EDIT
 * ---------------------------------- */

const saveLocation = handleSubmit(async (data) => {
	error.value = "";

	addLoading.value = true;

	try {
		const body = {
			name: data.name,

			point_1: data.point_1,

			point_2: data.point_2,

			point_3: data.point_3,

			point_4: data.point_4,

			location: data.location,
		};

		if (editingLocation.value) {
			await api(`/attendance/locations/${editingLocation.value.uuid}/`, {
				method: "PATCH",

				body,
			});
		} else {
			await api("/attendance/locations/", {
				method: "POST",

				body,
			});
		}

		locationDialogOpen.value = false;

		editingLocation.value = null;

		await load();
	} catch (e) {
		error.value = errorMessage(e);
	} finally {
		addLoading.value = false;
	}
});
</script>

<template>
	<div class="grid gap-5 p-5">
		<div class="flex items-center gap-3">
			<InputGroup class="flex-1">
				<InputGroupInput v-model="search" />

				<InputGroupAddon align="inline-start">
					<SearchIcon />
				</InputGroupAddon>
			</InputGroup>

			<Button @click="openAddDialog">
				<Plus class="mr-2 h-4 w-4" />

				Joylashuv qo‘shish
			</Button>
		</div>

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

								<TableHead> 1-Nuqta </TableHead>

								<TableHead> 2-Nuqta </TableHead>

								<TableHead> 3-Nuqta </TableHead>

								<TableHead> 4-Nuqta </TableHead>

								<TableHead> Xaritada </TableHead>

								<TableHead class="w-20 text-right">
									Amal
								</TableHead>
							</TableRow>
						</TableHeader>

						<TableBody>
							<TableRow
								v-for="(location, idx) in locations"
								:key="location.uuid"
							>
								<TableCell>
									{{ idx + 1 }}
								</TableCell>

								<TableCell>
									{{ location.name }}
								</TableCell>

								<TableCell
									class="text-muted-foreground text-xs"
								>
									{{ location.point_1 }}
								</TableCell>

								<TableCell
									class="text-muted-foreground text-xs"
								>
									{{ location.point_2 }}
								</TableCell>

								<TableCell
									class="text-muted-foreground text-xs"
								>
									{{ location.point_3 }}
								</TableCell>

								<TableCell
									class="text-muted-foreground text-xs"
								>
									{{ location.point_4 }}
								</TableCell>

								<TableCell>
									<NuxtLink
										:to="location.location"
										:external="true"
										target="_blank"
									>
										Ochish
									</NuxtLink>
								</TableCell>

								<TableCell>
									<div class="flex justify-end">
										<Button
											variant="outline"
											size="icon"
											@click="openEditDialog(location)"
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

		<!-- =========================
		     ADD / EDIT LOCATION
		     ========================= -->

		<Dialog v-model:open="locationDialogOpen">
			<DialogContent class="sm:max-w-xl">
				<DialogHeader>
					<DialogTitle>
						{{
							editingLocation
								? "Joylashuvni tahrirlash"
								: "Yangi joylashuv qo‘shish"
						}}
					</DialogTitle>
				</DialogHeader>

				<form class="grid gap-4" @submit.prevent="saveLocation">
					<!-- NAME -->

					<div class="grid gap-2">
						<Label> Nomi </Label>

						<Input
							:model-value="values.name"
							placeholder="Joylashuv nomi"
							@update:model-value="
								setFieldValue('name', String($event))
							"
						/>

						<p v-if="errors.name" class="text-sm text-destructive">
							{{ errors.name }}
						</p>
					</div>

					<!-- POINT 1 -->

					<div class="grid gap-2">
						<Label> 1-Nuqta </Label>

						<Input
							:model-value="values.point_1"
							placeholder="39.67148042759319, 66.85035720521523"
							@update:model-value="
								setFieldValue('point_1', String($event))
							"
						/>

						<p
							v-if="errors.point_1"
							class="text-sm text-destructive"
						>
							{{ errors.point_1 }}
						</p>
					</div>

					<!-- POINT 2 -->

					<div class="grid gap-2">
						<Label> 2-Nuqta </Label>

						<Input
							:model-value="values.point_2"
							placeholder="39.67130699267699, 66.85165612347313"
							@update:model-value="
								setFieldValue('point_2', String($event))
							"
						/>

						<p
							v-if="errors.point_2"
							class="text-sm text-destructive"
						>
							{{ errors.point_2 }}
						</p>
					</div>

					<!-- POINT 3 -->

					<div class="grid gap-2">
						<Label> 3-Nuqta </Label>

						<Input
							:model-value="values.point_3"
							placeholder="39.670657458043614, 66.85148823607925"
							@update:model-value="
								setFieldValue('point_3', String($event))
							"
						/>

						<p
							v-if="errors.point_3"
							class="text-sm text-destructive"
						>
							{{ errors.point_3 }}
						</p>
					</div>

					<!-- POINT 4 -->

					<div class="grid gap-2">
						<Label> 4-Nuqta </Label>

						<Input
							:model-value="values.point_4"
							placeholder="39.67097032365555, 66.8502776796076"
							@update:model-value="
								setFieldValue('point_4', String($event))
							"
						/>

						<p
							v-if="errors.point_4"
							class="text-sm text-destructive"
						>
							{{ errors.point_4 }}
						</p>
					</div>

					<!-- MAP URL -->

					<div class="grid gap-2">
						<Label> Xarita linki </Label>

						<Input
							:model-value="values.location"
							placeholder="https://maps.google.com/..."
							@update:model-value="
								setFieldValue('location', String($event))
							"
						/>

						<p
							v-if="errors.location"
							class="text-sm text-destructive"
						>
							{{ errors.location }}
						</p>
					</div>

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							@click="locationDialogOpen = false"
						>
							Bekor qilish
						</Button>

						<Button type="submit" :disabled="addLoading">
							{{
								addLoading
									? "Saqlanmoqda..."
									: editingLocation
										? "Saqlash"
										: "Qo‘shish"
							}}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	</div>
</template>
