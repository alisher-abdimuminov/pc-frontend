<script setup lang="ts">
import { CalendarIcon, CheckIcon, XIcon } from "@lucide/vue";

import { parseDate, type DateValue } from "@internationalized/date";

import type { Group } from "@/types/api";

definePageMeta({
	layout: "admin",
});

const { api, errorMessage } = useApi();

/* ----------------------------------
 * TYPES
 * ---------------------------------- */

interface MonitoringDay {
	date: string;
	step_1: boolean;
	step_2: boolean;
	step_3: boolean;
}

interface MonitoringStudent {
	uuid: string;
	full_name: string;
	days: MonitoringDay[];
}

interface MonitoringResponse {
	group_uuid: string;
	group_name: string;

	start_date: string;
	end_date: string;

	dates: string[];

	students: MonitoringStudent[];
}

/* ----------------------------------
 * STATE
 * ---------------------------------- */

const groups = ref<Group[]>([]);

const monitoring = ref<MonitoringResponse | null>(null);

const selectedGroup = ref("none");

const loadingGroups = ref(false);

const loading = ref(false);

const error = ref("");

const calendarOpen = ref(false);

/* ----------------------------------
 * CURRENT WEEK
 * ---------------------------------- */

function toLocalDateString(date: Date) {
	const year = date.getFullYear();

	const month = String(date.getMonth() + 1).padStart(2, "0");

	const day = String(date.getDate()).padStart(2, "0");

	return `${year}-${month}-${day}`;
}

const today = new Date();

today.setHours(0, 0, 0, 0);

const oneWeekAgo = new Date(today);

oneWeekAgo.setDate(today.getDate() - 6);

const minDate = parseDate(toLocalDateString(oneWeekAgo));

const maxDate = parseDate(toLocalDateString(today));

const dateRange = ref<{
	start: DateValue | undefined;

	end: DateValue | undefined;
}>({
	start: minDate,
	end: maxDate,
});

/* ----------------------------------
 * LOAD GROUPS
 * ---------------------------------- */

async function loadGroups() {
	loadingGroups.value = true;

	error.value = "";

	try {
		const response = await api<any>("/auth/groups/?limit=1000");

		groups.value = Array.isArray(response)
			? response
			: response?.results || [];
	} catch (e) {
		error.value = errorMessage(e);
	} finally {
		loadingGroups.value = false;
	}
}

/* ----------------------------------
 * LOAD MONITORING
 * ---------------------------------- */

async function loadMonitoring() {
	if (selectedGroup.value === "none") {
		monitoring.value = null;

		return;
	}

	if (!dateRange.value.start || !dateRange.value.end) {
		return;
	}

	loading.value = true;

	error.value = "";

	try {
		const params = new URLSearchParams();

		params.set("group", selectedGroup.value);

		params.set("start_date", dateRange.value.start.toString());

		params.set("end_date", dateRange.value.end.toString());

		monitoring.value = await api<MonitoringResponse>(
			`/attendance/monitoring/?${params.toString()}`,
		);
	} catch (e) {
		error.value = errorMessage(e);

		monitoring.value = null;
	} finally {
		loading.value = false;
	}
}

/* ----------------------------------
 * GROUP CHANGE
 * ---------------------------------- */

watch(selectedGroup, async () => {
	monitoring.value = null;

	await loadMonitoring();
});

/* ----------------------------------
 * RANGE CHANGE
 * ---------------------------------- */

watch(
	dateRange,
	async (value) => {
		if (!value.start || !value.end) {
			return;
		}

		calendarOpen.value = false;

		if (selectedGroup.value !== "none") {
			await loadMonitoring();
		}
	},
	{
		deep: true,
	},
);

/* ----------------------------------
 * STEP
 * ---------------------------------- */

function stepSuccess(day: MonitoringDay, step: 1 | 2 | 3) {
	if (step === 1) {
		return day.step_1;
	}

	if (step === 2) {
		return day.step_2;
	}

	return day.step_3;
}

/* ----------------------------------
 * MOUNT
 * ---------------------------------- */

onMounted(async () => {
	await loadGroups();
});
</script>

<template>
	<div class="grid gap-5 p-5">
		<!-- =========================
		     FILTERS
		     ========================= -->

		<div class="grid gap-4 md:grid-cols-2">
			<!-- GROUP -->

			<div class="grid gap-2">
				<Label> Guruh </Label>

				<Select v-model="selectedGroup" :disabled="loadingGroups">
					<SelectTrigger class="w-full">
						<SelectValue placeholder="Guruhni tanlang" />
					</SelectTrigger>

					<SelectContent>
						<SelectItem value="none"> Guruhni tanlang </SelectItem>

						<SelectItem
							v-for="group in groups"
							:key="group.uuid"
							:value="group.uuid"
						>
							{{ group.name }}
						</SelectItem>
					</SelectContent>
				</Select>
			</div>

			<!-- DATE RANGE -->

			<div class="grid gap-2">
				<Label> Sana oralig‘i </Label>

				<Popover v-model:open="calendarOpen">
					<PopoverTrigger as-child>
						<Button
							type="button"
							variant="outline"
							class="w-full justify-start font-normal"
						>
							<CalendarIcon class="mr-2 h-4 w-4" />

							<template v-if="dateRange.start && dateRange.end">
								{{ dateRange.start }}

								<span class="mx-2 text-muted-foreground">
									—
								</span>

								{{ dateRange.end }}
							</template>

							<span v-else class="text-muted-foreground">
								Sana oralig‘ini tanlang
							</span>
						</Button>
					</PopoverTrigger>

					<PopoverContent class="w-auto p-0" align="start">
						<RangeCalendar
							v-model="dateRange"
							initial-focus
							:number-of-months="2"
						/>
					</PopoverContent>
				</Popover>
			</div>
		</div>

		<!-- =========================
		     ERROR
		     ========================= -->

		<div
			v-if="error"
			class="rounded-lg border border-red-600 bg-red-600/10 p-3 text-sm text-red-600"
		>
			{{ error }}
		</div>

		<!-- =========================
		     NO GROUP
		     ========================= -->

		<Card v-if="selectedGroup === 'none'">
			<CardContent class="flex min-h-40 items-center justify-center">
				<p class="text-sm text-muted-foreground">
					Davomatni ko‘rish uchun guruhni tanlang.
				</p>
			</CardContent>
		</Card>

		<!-- =========================
		     MONITORING
		     ========================= -->

		<Card v-else>
			<CardHeader v-if="monitoring">
				<CardTitle>
					{{ monitoring.group_name }}
				</CardTitle>

				<CardDescription>
					{{ monitoring.start_date }}
					—
					{{ monitoring.end_date }}
				</CardDescription>
			</CardHeader>

			<CardContent class="p-0">
				<!-- LOADING -->

				<div
					v-if="loading"
					class="flex min-h-48 items-center justify-center"
				>
					<p class="text-sm text-muted-foreground">Yuklanmoqda...</p>
				</div>

				<!-- EMPTY -->

				<div
					v-else-if="monitoring && monitoring.students.length === 0"
					class="flex min-h-48 items-center justify-center"
				>
					<p class="text-sm text-muted-foreground">
						Bu guruhda talabalar topilmadi.
					</p>
				</div>

				<!-- TABLE -->

				<div v-else-if="monitoring" class="w-full overflow-x-auto">
					<Table class="min-w-max">
						<TableHeader>
							<TableRow>
								<TableHead class="sticky left-0 z-20 bg-card">
									Talaba
								</TableHead>

								<TableHead
									v-for="date in monitoring.dates"
									:key="date"
									class="text-center"
								>
									<div class="grid gap-1 py-1">
										<span>
											{{ new Date(date).getDate() }}
											{{
												new Date(
													date,
												).toLocaleDateString("en-US", {
													month: "long",
												})
											}}
										</span>

										<span
											class="text-xs font-normal capitalize text-muted-foreground"
										>
											{{
												new Date(
													date,
												).toLocaleDateString("en-US", {
													weekday: "long",
												})
											}}
										</span>
									</div>
								</TableHead>
							</TableRow>
						</TableHeader>

						<TableBody>
							<TableRow
								v-for="student in monitoring.students"
								:key="student.uuid"
							>
								<TableCell
									class="sticky left-0 z-10 bg-card font-medium truncate"
								>
									{{ student.full_name }}
								</TableCell>

								<TableCell
									v-for="day in student.days"
									:key="day.date"
								>
									<div
										class="flex items-center justify-center gap-2"
									>
										<!-- STEP 1 -->

										<div
											class="flex h-7 w-7 items-center justify-center rounded-md border"
											:class="
												stepSuccess(day, 1)
													? 'border-green-600 bg-green-600/10 text-green-600'
													: 'border-red-600 bg-red-600/10 text-red-600'
											"
											title="1-qadam"
										>
											<CheckIcon
												v-if="stepSuccess(day, 1)"
												class="h-4 w-4"
											/>

											<XIcon v-else class="h-4 w-4" />
										</div>

										<!-- STEP 2 -->

										<div
											class="flex h-7 w-7 items-center justify-center rounded-md border"
											:class="
												stepSuccess(day, 2)
													? 'border-green-600 bg-green-600/10 text-green-600'
													: 'border-red-600 bg-red-600/10 text-red-600'
											"
											title="2-qadam"
										>
											<CheckIcon
												v-if="stepSuccess(day, 2)"
												class="h-4 w-4"
											/>

											<XIcon v-else class="h-4 w-4" />
										</div>

										<!-- STEP 3 -->

										<div
											class="flex h-7 w-7 items-center justify-center rounded-md border"
											:class="
												stepSuccess(day, 3)
													? 'border-green-600 bg-green-600/10 text-green-600'
													: 'border-red-600 bg-red-600/10 text-red-600'
											"
											title="3-qadam"
										>
											<CheckIcon
												v-if="stepSuccess(day, 3)"
												class="h-4 w-4"
											/>

											<XIcon v-else class="h-4 w-4" />
										</div>
									</div>
								</TableCell>
							</TableRow>
						</TableBody>
					</Table>
				</div>
			</CardContent>
		</Card>
	</div>
</template>
