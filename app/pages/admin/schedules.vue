<script setup lang="ts">
import {
	SearchIcon,
	ChevronDown,
	Plus,
	Pencil,
	CalendarIcon,
} from "@lucide/vue";

import type { Schedule, User, Group, Location } from "@/types/api";

import {
	DateFormatter,
	getLocalTimeZone,
	parseDate,
	type DateValue,
} from "@internationalized/date";

import { toTypedSchema } from "@vee-validate/zod";
import z from "zod";
import { useForm } from "vee-validate";

definePageMeta({
	layout: "admin",
});

const { api, errorMessage } = useApi();

const schedules = ref<Schedule[]>([]);
const students = ref<User[]>([]);
const groups = ref<Group[]>([]);
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

const scheduleDialogOpen = ref(false);

const editingSchedule = ref<Schedule | null>(null);

/* ----------------------------------
 * SEARCHABLE SELECTS
 * ---------------------------------- */

const studentOpen = ref(false);
const groupOpen = ref(false);
const locationOpen = ref(false);

const startDateOpen = ref(false);
const endDateOpen = ref(false);

const dateFormatter = new DateFormatter("uz-UZ", {
	year: "numeric",
	month: "long",
	day: "numeric",
});

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
			`/attendance/schedules/?${params.toString()}`,
		);

		schedules.value = response?.results || [];

		total.value = response?.count || 0;
	} catch (e) {
		error.value = errorMessage(e);
	} finally {
		loading.value = false;
	}
}

/* ----------------------------------
 * OPTIONS
 * ---------------------------------- */

async function loadOptions() {
	try {
		const [studentResponse, groupResponse, locationResponse] =
			await Promise.all([
				api<any>("/auth/users/?type=student&limit=1000"),

				api<any>("/auth/groups/?limit=1000"),

				api<any>("/attendance/locations/?limit=1000"),
			]);

		students.value = Array.isArray(studentResponse)
			? studentResponse
			: studentResponse?.results || [];

		groups.value = Array.isArray(groupResponse)
			? groupResponse
			: groupResponse?.results || [];

		locations.value = Array.isArray(locationResponse)
			? locationResponse
			: locationResponse?.results || [];
	} catch (e) {
		error.value = errorMessage(e);
	}
}

onMounted(async () => {
	await Promise.all([load(), loadOptions()]);
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
 * FORM
 * ---------------------------------- */

const scheduleFormSchema = toTypedSchema(
	z
		.object({
			name: z.string().min(1, "Jadval nomini kiriting"),

			start_date: z.string().min(1, "Boshlanish sanasini tanlang"),

			end_date: z.string().min(1, "Tugash sanasini tanlang"),

			user: z.string().optional(),

			group: z.string().optional(),

			location: z.string().min(1, "Joylashuvni tanlang"),

			monday: z.boolean(),

			tuesday: z.boolean(),

			wednesday: z.boolean(),

			thursday: z.boolean(),

			friday: z.boolean(),

			saturday: z.boolean(),
		})
		.superRefine((data, ctx) => {
			if (!data.user && !data.group) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,

					message: "Talaba yoki guruhdan bittasini tanlang",

					path: ["user"],
				});
			}

			if (data.user && data.group) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,

					message:
						"Faqat talaba yoki guruhdan bittasini tanlash mumkin",

					path: ["user"],
				});
			}
		}),
);

const { handleSubmit, resetForm, setFieldValue, values, errors } = useForm({
	validationSchema: scheduleFormSchema,

	initialValues: {
		name: "",
		start_date: "",
		end_date: "",
		user: "",
		group: "",
		location: "",

		monday: false,
		tuesday: false,
		wednesday: false,
		thursday: false,
		friday: false,
		saturday: false,
	},
});

/* ----------------------------------
 * DATE
 * ---------------------------------- */

const startDateValue = computed<DateValue | undefined>(() => {
	if (!values.start_date) {
		return undefined;
	}

	try {
		return parseDate(values.start_date);
	} catch {
		return undefined;
	}
});

const endDateValue = computed<DateValue | undefined>(() => {
	if (!values.end_date) {
		return undefined;
	}

	try {
		return parseDate(values.end_date);
	} catch {
		return undefined;
	}
});

function handleStartDate(value: DateValue | undefined) {
	if (!value) {
		return;
	}

	setFieldValue("start_date", value.toString());

	startDateOpen.value = false;
}

function handleEndDate(value: DateValue | undefined) {
	if (!value) {
		return;
	}

	setFieldValue("end_date", value.toString());

	endDateOpen.value = false;
}

/* ----------------------------------
 * SELECT HELPERS
 * ---------------------------------- */

function getSelectedStudent() {
	return students.value.find(
		(student) => String(student.uuid) === values.user,
	);
}

function getSelectedGroup() {
	return groups.value.find((group) => String(group.uuid) === values.group);
}

function getSelectedLocation() {
	return locations.value.find(
		(location) => String(location.uuid) === values.location,
	);
}

/* ----------------------------------
 * STUDENT / GROUP
 * ---------------------------------- */

function selectStudent(value: string) {
	const nextValue = values.user === value ? "" : value;

	setFieldValue("user", nextValue);

	if (nextValue) {
		setFieldValue("group", "");
	}

	studentOpen.value = false;
}

function selectGroup(value: string) {
	const nextValue = values.group === value ? "" : value;

	setFieldValue("group", nextValue);

	if (nextValue) {
		setFieldValue("user", "");
	}

	groupOpen.value = false;
}

function selectLocation(value: string) {
	setFieldValue("location", value);

	locationOpen.value = false;
}

/* ----------------------------------
 * OPEN CREATE
 * ---------------------------------- */

function openAddDialog() {
	editingSchedule.value = null;

	resetForm({
		values: {
			name: "",
			start_date: "",
			end_date: "",
			user: "",
			group: "",
			location: "",

			monday: false,
			tuesday: false,
			wednesday: false,
			thursday: false,
			friday: false,
			saturday: false,
		},
	});

	scheduleDialogOpen.value = true;
}

/* ----------------------------------
 * OPEN EDIT
 * ---------------------------------- */

function openEditDialog(schedule: Schedule) {
	editingSchedule.value = schedule;

	resetForm({
		values: {
			name: schedule.name || "",

			start_date: schedule.start_date || "",

			end_date: schedule.end_date || "",

			user: schedule.user ? String(schedule.user.uuid) : "",

			group: schedule.group ? String(schedule.group.uuid) : "",

			location: schedule.location ? String(schedule.location.uuid) : "",

			monday: schedule.monday,

			tuesday: schedule.tuesday,

			wednesday: schedule.wednesday,

			thursday: schedule.thursday,

			friday: schedule.friday,

			saturday: schedule.saturday,
		},
	});

	scheduleDialogOpen.value = true;
}

/* ----------------------------------
 * ADD / EDIT
 * ---------------------------------- */

const addSchedule = handleSubmit(async (data) => {
	error.value = "";
	addLoading.value = true;

	try {
		const body = {
			name: data.name,

			start_date: data.start_date,

			end_date: data.end_date,

			user: data.user ? data.user : null,

			group: data.group ? data.group : null,

			location: data.location,

			monday: data.monday,

			tuesday: data.tuesday,

			wednesday: data.wednesday,

			thursday: data.thursday,

			friday: data.friday,

			saturday: data.saturday,
		};

		if (editingSchedule.value) {
			await api(`/attendance/schedules/${editingSchedule.value.uuid}/`, {
				method: "PATCH",

				body,
			});
		} else {
			await api("/attendance/schedules/", {
				method: "POST",

				body,
			});
		}

		scheduleDialogOpen.value = false;

		editingSchedule.value = null;

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

				Jadval qo‘shish
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

								<TableHead> Talaba/Guruh </TableHead>

								<TableHead> Boshlanish </TableHead>

								<TableHead> Tugash </TableHead>

								<TableHead class="text-center"> Du </TableHead>

								<TableHead class="text-center"> Se </TableHead>

								<TableHead class="text-center"> Cho </TableHead>

								<TableHead class="text-center"> Pa </TableHead>

								<TableHead class="text-center"> Ju </TableHead>

								<TableHead class="text-center"> Sha </TableHead>

								<TableHead class="w-20 text-right">
									Amal
								</TableHead>
							</TableRow>
						</TableHeader>

						<TableBody>
							<TableRow
								v-for="(schedule, idx) in schedules"
								:key="schedule.uuid"
							>
								<TableCell>
									{{ idx + 1 }}
								</TableCell>

								<TableCell>
									{{ schedule.name }}
								</TableCell>

								<TableCell>
									{{
										schedule.user
											? schedule.user.full_name
											: schedule.group
												? schedule.group.name
												: "-"
									}}
								</TableCell>

								<TableCell>
									{{ schedule.start_date }}
								</TableCell>

								<TableCell>
									{{ schedule.end_date }}
								</TableCell>

								<TableCell class="text-center">
									<Checkbox
										:model-value="schedule.monday"
										disabled
									/>
								</TableCell>

								<TableCell class="text-center">
									<Checkbox
										:model-value="schedule.tuesday"
										disabled
									/>
								</TableCell>

								<TableCell class="text-center">
									<Checkbox
										:model-value="schedule.wednesday"
										disabled
									/>
								</TableCell>

								<TableCell class="text-center">
									<Checkbox
										:model-value="schedule.thursday"
										disabled
									/>
								</TableCell>

								<TableCell class="text-center">
									<Checkbox
										:model-value="schedule.friday"
										disabled
									/>
								</TableCell>

								<TableCell class="text-center">
									<Checkbox
										:model-value="schedule.saturday"
										disabled
									/>
								</TableCell>

								<TableCell>
									<div class="flex justify-end">
										<Button
											variant="outline"
											size="icon"
											@click="openEditDialog(schedule)"
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
		     ADD / EDIT SCHEDULE
		     ========================= -->

		<Dialog v-model:open="scheduleDialogOpen">
			<DialogContent class="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
				<DialogHeader>
					<DialogTitle>
						{{
							editingSchedule
								? "Dars jadvalini tahrirlash"
								: "Yangi dars jadvali qo‘shish"
						}}
					</DialogTitle>
				</DialogHeader>

				<form class="grid gap-5" @submit.prevent="addSchedule">
					<!-- NAME -->

					<div class="grid gap-2">
						<Label> Nomi </Label>

						<Input
							:model-value="values.name"
							placeholder="Jadval nomi"
							@update:model-value="
								setFieldValue('name', String($event))
							"
						/>

						<p v-if="errors.name" class="text-sm text-destructive">
							{{ errors.name }}
						</p>
					</div>

					<!-- DATES -->

					<div class="grid gap-4 sm:grid-cols-2">
						<!-- START -->

						<div class="grid gap-2">
							<Label> Boshlanish </Label>

							<Popover v-model:open="startDateOpen">
								<PopoverTrigger as-child>
									<Button
										type="button"
										variant="outline"
										class="w-full justify-start font-normal"
									>
										<CalendarIcon class="mr-2 h-4 w-4" />

										<span v-if="startDateValue">
											{{
												dateFormatter.format(
													startDateValue.toDate(
														getLocalTimeZone(),
													),
												)
											}}
										</span>

										<span
											v-else
											class="text-muted-foreground"
										>
											Sanani tanlang
										</span>
									</Button>
								</PopoverTrigger>

								<PopoverContent
									class="w-auto p-0"
									align="start"
								>
									<Calendar
										:model-value="startDateValue"
										initial-focus
										@update:model-value="handleStartDate"
									/>
								</PopoverContent>
							</Popover>

							<p
								v-if="errors.start_date"
								class="text-sm text-destructive"
							>
								{{ errors.start_date }}
							</p>
						</div>

						<!-- END -->

						<div class="grid gap-2">
							<Label> Tugash </Label>

							<Popover v-model:open="endDateOpen">
								<PopoverTrigger as-child>
									<Button
										type="button"
										variant="outline"
										class="w-full justify-start font-normal"
									>
										<CalendarIcon class="mr-2 h-4 w-4" />

										<span v-if="endDateValue">
											{{
												dateFormatter.format(
													endDateValue.toDate(
														getLocalTimeZone(),
													),
												)
											}}
										</span>

										<span
											v-else
											class="text-muted-foreground"
										>
											Sanani tanlang
										</span>
									</Button>
								</PopoverTrigger>

								<PopoverContent
									class="w-auto p-0"
									align="start"
								>
									<Calendar
										:model-value="endDateValue"
										initial-focus
										@update:model-value="handleEndDate"
									/>
								</PopoverContent>
							</Popover>

							<p
								v-if="errors.end_date"
								class="text-sm text-destructive"
							>
								{{ errors.end_date }}
							</p>
						</div>
					</div>

					<!-- =====================
					     STUDENT
					     ===================== -->

					<div class="grid gap-2">
						<Label> Talaba </Label>

						<Popover v-model:open="studentOpen">
							<PopoverTrigger as-child>
								<Button
									type="button"
									variant="outline"
									role="combobox"
									:aria-expanded="studentOpen"
									class="w-full justify-between px-3 font-normal"
								>
									<span v-if="values.user" class="truncate">
										{{
											getSelectedStudent()?.full_name ||
											getSelectedStudent()?.username
										}}
									</span>

									<span v-else class="text-muted-foreground">
										Talabani tanlang
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
										placeholder="Talabani qidirish..."
									/>

									<CommandList>
										<CommandEmpty>
											Talaba topilmadi.
										</CommandEmpty>

										<CommandGroup>
											<CommandItem
												v-for="student in students"
												:key="student.uuid"
												:value="`${student.full_name || ''} ${student.username || ''}`"
												@select="
													selectStudent(
														String(student.uuid),
													)
												"
											>
												<div class="min-w-0">
													<div class="truncate">
														{{
															student.full_name ||
															student.username
														}}
													</div>

													<div
														class="truncate text-xs text-muted-foreground"
													>
														{{ student.username }}
													</div>
												</div>
											</CommandItem>
										</CommandGroup>
									</CommandList>
								</Command>
							</PopoverContent>
						</Popover>
					</div>

					<!-- =====================
					     GROUP
					     ===================== -->

					<div class="grid gap-2">
						<Label> Guruh </Label>

						<Popover v-model:open="groupOpen">
							<PopoverTrigger as-child>
								<Button
									type="button"
									variant="outline"
									role="combobox"
									:aria-expanded="groupOpen"
									class="w-full justify-between px-3 font-normal"
								>
									<span v-if="values.group" class="truncate">
										{{ getSelectedGroup()?.name }}
									</span>

									<span v-else class="text-muted-foreground">
										Guruhni tanlang
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
										placeholder="Guruhni qidirish..."
									/>

									<CommandList>
										<CommandEmpty>
											Guruh topilmadi.
										</CommandEmpty>

										<CommandGroup>
											<CommandItem
												v-for="group in groups"
												:key="group.uuid"
												:value="group.name"
												@select="
													selectGroup(
														String(group.uuid),
													)
												"
											>
												{{ group.name }}
											</CommandItem>
										</CommandGroup>
									</CommandList>
								</Command>
							</PopoverContent>
						</Popover>

						<p v-if="errors.user" class="text-sm text-destructive">
							{{ errors.user }}
						</p>
					</div>

					<!-- =====================
					     LOCATION
					     ===================== -->

					<div class="grid gap-2">
						<Label> Joylashuv </Label>

						<Popover v-model:open="locationOpen">
							<PopoverTrigger as-child>
								<Button
									type="button"
									variant="outline"
									role="combobox"
									:aria-expanded="locationOpen"
									class="w-full justify-between px-3 font-normal"
								>
									<span
										v-if="values.location"
										class="truncate"
									>
										{{ getSelectedLocation()?.name }}
									</span>

									<span v-else class="text-muted-foreground">
										Joylashuvni tanlang
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
										placeholder="Joylashuvni qidirish..."
									/>

									<CommandList>
										<CommandEmpty>
											Joylashuv topilmadi.
										</CommandEmpty>

										<CommandGroup>
											<CommandItem
												v-for="location in locations"
												:key="location.uuid"
												:value="location.name"
												@select="
													selectLocation(
														String(location.uuid),
													)
												"
											>
												{{ location.name }}
											</CommandItem>
										</CommandGroup>
									</CommandList>
								</Command>
							</PopoverContent>
						</Popover>

						<p
							v-if="errors.location"
							class="text-sm text-destructive"
						>
							{{ errors.location }}
						</p>
					</div>

					<!-- =====================
					     WEEKDAYS
					     ===================== -->

					<div class="grid gap-3">
						<Label> Hafta kunlari </Label>

						<div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
							<div
								class="flex items-center gap-2 rounded-lg border p-3"
							>
								<Checkbox
									:model-value="values.monday"
									@update:model-value="
										setFieldValue('monday', Boolean($event))
									"
								/>

								<Label> Dushanba </Label>
							</div>

							<div
								class="flex items-center gap-2 rounded-lg border p-3"
							>
								<Checkbox
									:model-value="values.tuesday"
									@update:model-value="
										setFieldValue(
											'tuesday',
											Boolean($event),
										)
									"
								/>

								<Label> Seshanba </Label>
							</div>

							<div
								class="flex items-center gap-2 rounded-lg border p-3"
							>
								<Checkbox
									:model-value="values.wednesday"
									@update:model-value="
										setFieldValue(
											'wednesday',
											Boolean($event),
										)
									"
								/>

								<Label> Chorshanba </Label>
							</div>

							<div
								class="flex items-center gap-2 rounded-lg border p-3"
							>
								<Checkbox
									:model-value="values.thursday"
									@update:model-value="
										setFieldValue(
											'thursday',
											Boolean($event),
										)
									"
								/>

								<Label> Payshanba </Label>
							</div>

							<div
								class="flex items-center gap-2 rounded-lg border p-3"
							>
								<Checkbox
									:model-value="values.friday"
									@update:model-value="
										setFieldValue('friday', Boolean($event))
									"
								/>

								<Label> Juma </Label>
							</div>

							<div
								class="flex items-center gap-2 rounded-lg border p-3"
							>
								<Checkbox
									:model-value="values.saturday"
									@update:model-value="
										setFieldValue(
											'saturday',
											Boolean($event),
										)
									"
								/>

								<Label> Shanba </Label>
							</div>
						</div>
					</div>

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							@click="scheduleDialogOpen = false"
						>
							Bekor qilish
						</Button>

						<Button type="submit" :disabled="addLoading">
							{{
								addLoading
									? "Saqlanmoqda..."
									: editingSchedule
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
