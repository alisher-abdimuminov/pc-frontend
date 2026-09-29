<script setup lang="ts">
import {
	SearchIcon,
	CalendarIcon,
	XIcon,
	EyeIcon,
	UserRoundIcon,
	MapPinIcon,
	Clock3Icon,
	CircleCheckIcon,
	CircleXIcon,
	ShieldCheckIcon,
} from "@lucide/vue";

import {
	getLocalTimeZone,
	today,
	type DateValue,
} from "@internationalized/date";

import type { AttendanceAttempt } from "@/types/api";

definePageMeta({
	layout: "admin",
});

const { api, errorMessage } = useApi();

/* ----------------------------------
 * STATE
 * ---------------------------------- */

const attempts = ref<AttendanceAttempt[]>([]);

const selectedAttempt = ref<AttendanceAttempt | null>(null);

const detailDialogOpen = ref(false);

const error = ref("");
const search = ref("");
const loading = ref(false);

const currentPage = ref(1);
const total = ref(0);
const pageSize = 50;

const statusFilter = ref("all");

const stepFilter = ref("all");

const date = ref<DateValue>(today(getLocalTimeZone())) as Ref<DateValue>;

const dateOpen = ref(false);

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

		if (statusFilter.value !== "all") {
			params.set("status", statusFilter.value);
		}

		if (stepFilter.value !== "all") {
			params.set("step", stepFilter.value);
		}

		if (date.value) {
			params.set("date", date.value.toString());
		}

		const response = await api<any>(
			`/attendance/attempts/?${params.toString()}`,
		);

		attempts.value = response?.results || [];

		total.value = response?.count || 0;
	} catch (e) {
		error.value = errorMessage(e);
	} finally {
		loading.value = false;
	}
}

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
 * FILTERS
 * ---------------------------------- */

watch([statusFilter, stepFilter], async () => {
	currentPage.value = 1;

	await load();
});

watch(date, async () => {
	currentPage.value = 1;
	dateOpen.value = false;

	await load();
});

async function clearDate() {
	currentPage.value = 1;

	await load();
}

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
 * DETAIL
 * ---------------------------------- */

function openDetail(attempt: AttendanceAttempt) {
	selectedAttempt.value = attempt;

	detailDialogOpen.value = true;
}

/* ----------------------------------
 * GPS
 * ---------------------------------- */

function gpsText(attempt: AttendanceAttempt | null) {
	if (!attempt?.latitude || !attempt?.longitude) {
		return "-";
	}

	return `${attempt.latitude}, ${attempt.longitude}`;
}

/* ----------------------------------
 * MOUNT
 * ---------------------------------- */

onMounted(load);
</script>

<template>
	<div class="grid gap-5 p-5">
		<!-- =========================
		     FILTERS
		     ========================= -->

		<div class="grid gap-3 lg:grid-cols-[1fr_200px_170px_240px]">
			<InputGroup>
				<InputGroupInput
					v-model="search"
					placeholder="Talaba, username, xatolik..."
				/>

				<InputGroupAddon align="inline-start">
					<SearchIcon />
				</InputGroupAddon>
			</InputGroup>

			<Select v-model="statusFilter">
				<SelectTrigger class="w-full">
					<SelectValue />
				</SelectTrigger>

				<SelectContent>
					<SelectItem value="all"> Barcha holatlar </SelectItem>

					<SelectItem value="success"> Muvaffaqiyatli </SelectItem>

					<SelectItem value="failed"> Xato </SelectItem>
				</SelectContent>
			</Select>

			<Select v-model="stepFilter">
				<SelectTrigger class="w-full">
					<SelectValue />
				</SelectTrigger>

				<SelectContent>
					<SelectItem value="all"> Barcha qadamlar </SelectItem>

					<SelectItem value="1"> 1-qadam </SelectItem>

					<SelectItem value="2"> 2-qadam </SelectItem>

					<SelectItem value="3"> 3-qadam </SelectItem>
				</SelectContent>
			</Select>

			<div class="flex gap-2">
				<Popover v-model:open="dateOpen">
					<PopoverTrigger as-child>
						<Button
							type="button"
							variant="outline"
							class="flex-1 justify-start font-normal"
						>
							<CalendarIcon class="mr-2 h-4 w-4" />

							<span v-if="date">
								{{ date }}
							</span>

							<span v-else class="text-muted-foreground">
								Sana
							</span>
						</Button>
					</PopoverTrigger>

					<PopoverContent class="w-auto p-0" align="end">
						<Calendar v-model="date" initial-focus />
					</PopoverContent>
				</Popover>

				<Button
					v-if="date"
					type="button"
					variant="outline"
					size="icon"
					@click="clearDate"
				>
					<XIcon class="h-4 w-4" />
				</Button>
			</div>
		</div>

		<div
			v-if="error"
			class="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
		>
			{{ error }}
		</div>

		<!-- =========================
		     TABLE
		     ========================= -->

		<Card class="overflow-hidden">
			<CardContent class="p-0">
				<div class="w-full overflow-x-auto">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead> Talaba </TableHead>

								<TableHead> Qadam </TableHead>

								<TableHead> Holat </TableHead>

								<TableHead> Joylashuv </TableHead>

								<TableHead> Vaqt </TableHead>

								<TableHead />
							</TableRow>
						</TableHeader>

						<TableBody>
							<TableRow v-if="loading">
								<TableCell
									colspan="6"
									class="h-32 text-center text-muted-foreground"
								>
									Yuklanmoqda...
								</TableCell>
							</TableRow>

							<TableRow v-else-if="attempts.length === 0">
								<TableCell
									colspan="6"
									class="h-32 text-center text-muted-foreground"
								>
									Urinishlar topilmadi
								</TableCell>
							</TableRow>

							<TableRow
								v-for="attempt in attempts"
								v-else
								:key="attempt.uuid"
								class="h-27.5"
							>
								<!-- STUDENT -->

								<TableCell>
									<div class="flex items-center gap-4">
										<div
											class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-muted"
										>
											<UserRoundIcon
												class="h-5 w-5 text-muted-foreground"
											/>
										</div>

										<div class="min-w-0">
											<div class="truncate font-medium">
												{{
													attempt.student_name || "-"
												}}
											</div>

											<div
												class="mt-1 text-sm text-muted-foreground"
											>
												{{
													attempt.student_username ||
													"-"
												}}
											</div>
										</div>
									</div>
								</TableCell>

								<!-- STEP -->

								<TableCell>
									<Badge>
										{{ attempt.step_number }}
									</Badge>
								</TableCell>

								<!-- STATUS -->

								<TableCell>
									<div class="grid gap-2">
										<div
											v-if="attempt.success"
											class="flex items-center gap-2 font-medium text-emerald-600"
										>
											<CircleCheckIcon class="h-5 w-5" />

											Muvaffaqiyatli
										</div>

										<div
											v-else
											class="flex items-center gap-2 font-medium text-red-500"
										>
											<CircleXIcon class="h-5 w-5" />

											Xato
										</div>

										<div
											v-if="
												!attempt.success &&
												attempt.error_code
											"
										>
											<Badge
												variant="destructive"
												class="rounded-full"
											>
												{{ attempt.error_code }}
											</Badge>
										</div>
									</div>
								</TableCell>

								<!-- LOCATION -->

								<TableCell>
									<div class="flex items-start gap-3">
										<MapPinIcon
											class="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground"
										/>

										<span>
											{{ attempt.location_name || "-" }}
										</span>
									</div>
								</TableCell>

								<!-- TIME -->

								<TableCell>
									<div
										class="flex items-center gap-3 whitespace-nowrap"
									>
										<Clock3Icon
											class="h-5 w-5 text-muted-foreground"
										/>

										{{ attempt.attempted_at }}
									</div>
								</TableCell>

								<!-- VIEW -->

								<TableCell>
									<Button
										type="button"
										variant="ghost"
										size="icon"
										@click="openDetail(attempt)"
									>
										<EyeIcon class="h-5 w-5" />
									</Button>
								</TableCell>
							</TableRow>
						</TableBody>
					</Table>
				</div>
			</CardContent>

			<CardFooter
				v-if="total > pageSize"
				class="justify-between border-t py-4"
			>
				<div class="text-sm text-muted-foreground">
					Jami
					{{ total }}
					ta urinish
				</div>

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
		     AUDIT DETAIL
		     ========================= -->

		<Dialog v-model:open="detailDialogOpen">
			<DialogContent class="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
				<DialogHeader>
					<DialogTitle class="text-xl"> Urinish </DialogTitle>

					<DialogDescription>
						Urinishning to‘liq texnik ma’lumotlari.
					</DialogDescription>
				</DialogHeader>

				<template v-if="selectedAttempt">
					<div class="grid gap-6">
						<!-- STUDENT HEADER -->

						<div
							class="flex items-center justify-between gap-4 rounded-2xl border p-5"
						>
							<div>
								<div class="font-semibold">
									{{ selectedAttempt.student_name || "-" }}
								</div>

								<div class="mt-1 text-muted-foreground">
									{{
										selectedAttempt.student_username || "-"
									}}
								</div>
							</div>

							<div
								v-if="selectedAttempt.success"
								class="flex items-center gap-2 text-emerald-600"
							>
								<ShieldCheckIcon class="h-6 w-6" />

								<span class="font-medium">
									Muvaffaqiyatli
								</span>
							</div>

							<div
								v-else
								class="flex items-center gap-2 text-red-500"
							>
								<CircleXIcon class="h-6 w-6" />

								<span class="font-medium"> Xato </span>
							</div>
						</div>

						<!-- IMAGE -->

						<div v-if="selectedAttempt.image" class="grid gap-2">
							<Label class="font-semibold">
								Tasdiqlash rasmi
							</Label>

							<img
								:src="selectedAttempt.image"
								alt="Attendance verification"
								class="mt-2 max-h-87.5 w-full rounded-xl border object-contain"
							/>
						</div>

						<!-- MAIN INFO -->

						<div class="grid gap-4 sm:grid-cols-2">
							<div class="rounded-2xl border p-4">
								<div class="text-sm text-muted-foreground">
									Qadam
								</div>

								<div class="mt-2 font-medium">
									{{ selectedAttempt.step_number }}
								</div>
							</div>

							<div class="rounded-2xl border p-4">
								<div class="text-sm text-muted-foreground">
									Vaqt
								</div>

								<div class="mt-2 font-medium">
									{{ selectedAttempt.attempted_at }}
								</div>
							</div>

							<div class="rounded-2xl border p-4">
								<div class="text-sm text-muted-foreground">
									IP address
								</div>

								<div class="mt-2 break-all font-medium">
									{{ selectedAttempt.ip_address || "-" }}
								</div>
							</div>

							<div class="rounded-2xl border p-4">
								<div class="text-sm text-muted-foreground">
									GPS
								</div>

								<div class="mt-2 break-all font-medium">
									{{ gpsText(selectedAttempt) }}
								</div>
							</div>
						</div>

						<!-- CHECKS -->

						<div class="grid gap-4 sm:grid-cols-3">
							<div class="rounded-2xl border p-4">
								<div class="text-sm text-muted-foreground">
									FaceID
								</div>

								<div
									class="mt-3 flex items-center gap-2"
									:class="
										selectedAttempt.face_verified
											? 'text-emerald-600'
											: 'text-red-500'
									"
								>
									<CircleCheckIcon
										v-if="selectedAttempt.face_verified"
										class="h-5 w-5"
									/>

									<CircleXIcon v-else class="h-5 w-5" />

									{{
										selectedAttempt.face_verified
											? "Tasdiqlandi"
											: "Tasdiqlanmadi"
									}}
								</div>
							</div>

							<div class="rounded-2xl border p-4">
								<div class="text-sm text-muted-foreground">
									Joylashuv
								</div>

								<div
									class="mt-3 flex items-center gap-2"
									:class="
										selectedAttempt.location_verified
											? 'text-emerald-600'
											: 'text-red-500'
									"
								>
									<CircleCheckIcon
										v-if="selectedAttempt.location_verified"
										class="h-5 w-5"
									/>

									<CircleXIcon v-else class="h-5 w-5" />

									{{
										selectedAttempt.location_verified
											? "Tasdiqlandi"
											: "Tasdiqlanmadi"
									}}
								</div>
							</div>

							<div class="rounded-2xl border p-4">
								<div class="text-sm text-muted-foreground">
									Liveness
								</div>

								<div
									class="mt-3 flex items-center gap-2"
									:class="
										selectedAttempt.liveness_verified
											? 'text-emerald-600'
											: 'text-red-500'
									"
								>
									<CircleCheckIcon
										v-if="selectedAttempt.liveness_verified"
										class="h-5 w-5"
									/>

									<CircleXIcon v-else class="h-5 w-5" />

									{{
										selectedAttempt.liveness_verified
											? "Tasdiqlandi"
											: "Tasdiqlanmadi"
									}}
								</div>
							</div>
						</div>

						<!-- ERROR -->

						<div
							v-if="!selectedAttempt.success"
							class="rounded-2xl border border-destructive/30 bg-destructive/5 p-4"
						>
							<div class="flex items-center gap-2">
								<Badge
									v-if="selectedAttempt.error_code"
									variant="destructive"
								>
									{{ selectedAttempt.error_code }}
								</Badge>
							</div>

							<p
								v-if="selectedAttempt.error_message"
								class="mt-3 text-sm text-muted-foreground"
							>
								{{ selectedAttempt.error_message }}
							</p>
						</div>

						<!-- TECHNICAL -->

						<div class="grid gap-4 sm:grid-cols-2">
							<div class="rounded-2xl border p-4">
								<div class="text-sm text-muted-foreground">
									Face distance
								</div>

								<div class="mt-2 font-medium">
									{{ selectedAttempt.face_distance ?? "-" }}
								</div>
							</div>

							<div class="rounded-2xl border p-4">
								<div class="text-sm text-muted-foreground">
									Face threshold
								</div>

								<div class="mt-2 font-medium">
									{{ selectedAttempt.face_threshold ?? "-" }}
								</div>
							</div>
						</div>

						<div class="rounded-2xl border p-4">
							<div class="text-sm text-muted-foreground">
								User Agent
							</div>

							<div class="mt-2 break-all text-sm">
								{{ selectedAttempt.user_agent || "-" }}
							</div>
						</div>
					</div>
				</template>
			</DialogContent>
		</Dialog>
	</div>
</template>
