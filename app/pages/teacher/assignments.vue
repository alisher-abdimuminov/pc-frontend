<script setup lang="ts">
import {
	SearchIcon,
	PlusIcon,
	PencilIcon,
	EyeIcon,
	ChevronDownIcon,
	CalendarIcon,
	FileIcon,
} from "@lucide/vue";

import {
	DateFormatter,
	getLocalTimeZone,
	parseDate,
	type DateValue,
} from "@internationalized/date";

import type { Assignment, Group, Submission } from "@/types/api";

definePageMeta({
	layout: "teacher",
});

const { api, errorMessage } = useApi();

/* ----------------------------------
 * ASSIGNMENTS
 * ---------------------------------- */

const assignments = ref<Assignment[]>([]);

const groups = ref<Group[]>([]);

const loading = ref(false);

const error = ref("");

const search = ref("");

const currentPage = ref(1);

const total = ref(0);

const pageSize = 50;

/* ----------------------------------
 * ASSIGNMENT DIALOG
 * ---------------------------------- */

const assignmentDialogOpen = ref(false);

const saveLoading = ref(false);

const editingAssignment = ref<Assignment | null>(null);

const title = ref("");

const description = ref("");

const assignmentFile = ref<File | null>(null);

const selectedGroups = ref<string[]>([]);

const groupPopoverOpen = ref(false);

const deadlineDate = ref<DateValue | undefined>(undefined);

const deadlineTime = ref("");

const deadlineCalendarOpen = ref(false);

/* ----------------------------------
 * SUBMISSIONS
 * ---------------------------------- */

const submissionsDialogOpen = ref(false);

const selectedAssignment = ref<Assignment | null>(null);

const submissions = ref<Submission[]>([]);

const submissionsLoading = ref(false);

const submissionSearch = ref("");

const submissionPage = ref(1);

const submissionTotal = ref(0);

/* ----------------------------------
 * GRADE
 * ---------------------------------- */

const gradeDialogOpen = ref(false);

const gradingSubmission = ref<Submission | null>(null);

const grade = ref("");

const feedback = ref("");

const gradeLoading = ref(false);

/* ----------------------------------
 * LOAD ASSIGNMENTS
 * ---------------------------------- */

async function loadAssignments() {
	loading.value = true;
	error.value = "";

	try {
		const params = new URLSearchParams();

		params.set("page", String(currentPage.value));

		if (search.value.trim()) {
			params.set("search", search.value.trim());
		}

		const response = await api<any>(`/assignments/?${params.toString()}`);

		assignments.value = response?.results || [];

		total.value = response?.count || 0;
	} catch (e) {
		error.value = errorMessage(e);
	} finally {
		loading.value = false;
	}
}

/* ----------------------------------
 * LOAD GROUPS
 * ---------------------------------- */

async function loadGroups() {
	try {
		const response = await api<any>("/auth/groups/?limit=1000");

		groups.value = Array.isArray(response)
			? response
			: response?.results || [];
	} catch (e) {
		error.value = errorMessage(e);
	}
}

onMounted(async () => {
	await Promise.all([loadAssignments(), loadGroups()]);
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

		await loadAssignments();
	}, 400);
});

/* ----------------------------------
 * PAGE
 * ---------------------------------- */

async function changePage(page: number) {
	if (page === currentPage.value) {
		return;
	}

	currentPage.value = page;

	await loadAssignments();
}

/* ----------------------------------
 * GROUPS
 * ---------------------------------- */

function toggleGroup(uuid: string) {
	if (selectedGroups.value.includes(uuid)) {
		selectedGroups.value = selectedGroups.value.filter(
			(item) => item !== uuid,
		);

		return;
	}

	selectedGroups.value.push(uuid);
}

function isGroupSelected(uuid: string) {
	return selectedGroups.value.includes(uuid);
}

/* ----------------------------------
 * OPEN ADD
 * ---------------------------------- */

function openAddDialog() {
	editingAssignment.value = null;

	title.value = "";
	description.value = "";

	assignmentFile.value = null;

	selectedGroups.value = [];

	deadlineDate.value = undefined;

	deadlineTime.value = "";

	assignmentDialogOpen.value = true;
}

/* ----------------------------------
 * OPEN EDIT
 * ---------------------------------- */

function openEditDialog(assignment: Assignment) {
	editingAssignment.value = assignment;

	title.value = assignment.title;

	description.value = assignment.description;

	selectedGroups.value = [...assignment.groups];

	assignmentFile.value = null;

	const d = new Date(assignment.deadline);

	const year = d.getFullYear();

	const month = String(d.getMonth() + 1).padStart(2, "0");

	const day = String(d.getDate()).padStart(2, "0");

	const hour = String(d.getHours()).padStart(2, "0");

	const minute = String(d.getMinutes()).padStart(2, "0");

	deadlineDate.value = parseDate(`${year}-${month}-${day}`);

	deadlineTime.value = `${hour}:${minute}`;

	assignmentDialogOpen.value = true;
}

/* ----------------------------------
 * FILE
 * ---------------------------------- */

function handleAssignmentFile(event: Event) {
	const input = event.target as HTMLInputElement;

	assignmentFile.value = input.files?.[0] || null;
}

/* ----------------------------------
 * SAVE ASSIGNMENT
 * ---------------------------------- */

async function saveAssignment() {
	error.value = "";

	if (!title.value.trim()) {
		error.value = "Topshiriq nomini kiriting.";

		return;
	}

	if (selectedGroups.value.length === 0) {
		error.value = "Kamida bitta guruhni tanlang.";

		return;
	}

	if (!deadlineDate.value || !deadlineTime.value) {
		error.value = "Deadline sanasi va vaqtini kiriting.";

		return;
	}

	saveLoading.value = true;

	try {
		const formData = new FormData();

		formData.append("title", title.value.trim());

		formData.append("description", description.value);

		formData.append(
			"deadline",
			`${deadlineDate.value.toString()}T${deadlineTime.value}:00`,
		);

		for (const groupUuid of selectedGroups.value) {
			formData.append("groups", groupUuid);
		}

		if (assignmentFile.value) {
			formData.append("file", assignmentFile.value);
		}

		if (editingAssignment.value) {
			await api(`/assignments/${editingAssignment.value.uuid}/`, {
				method: "PATCH",
				body: formData,
			});
		} else {
			await api("/assignments/", {
				method: "POST",
				body: formData,
			});
		}

		assignmentDialogOpen.value = false;

		editingAssignment.value = null;

		await loadAssignments();
	} catch (e) {
		error.value = errorMessage(e);
	} finally {
		saveLoading.value = false;
	}
}

/* ----------------------------------
 * SUBMISSIONS
 * ---------------------------------- */

async function openSubmissions(assignment: Assignment) {
	selectedAssignment.value = assignment;

	submissionSearch.value = "";

	submissionPage.value = 1;

	submissionsDialogOpen.value = true;

	await loadSubmissions();
}

async function loadSubmissions() {
	if (!selectedAssignment.value) {
		return;
	}

	submissionsLoading.value = true;

	try {
		const params = new URLSearchParams();

		params.set("assignment", selectedAssignment.value.uuid);

		params.set("page", String(submissionPage.value));

		if (submissionSearch.value.trim()) {
			params.set("search", submissionSearch.value.trim());
		}

		const response = await api<any>(
			`/assignments/submissions/?${params.toString()}`,
		);

		submissions.value = response?.results || [];

		submissionTotal.value = response?.count || 0;
	} catch (e) {
		error.value = errorMessage(e);
	} finally {
		submissionsLoading.value = false;
	}
}

/* ----------------------------------
 * SUBMISSION SEARCH
 * ---------------------------------- */

let submissionTimer: ReturnType<typeof setTimeout> | null = null;

watch(submissionSearch, () => {
	if (submissionTimer) {
		clearTimeout(submissionTimer);
	}

	submissionTimer = setTimeout(async () => {
		submissionPage.value = 1;

		await loadSubmissions();
	}, 400);
});

/* ----------------------------------
 * GRADE
 * ---------------------------------- */

function openGradeDialog(submission: Submission) {
	if (submission.graded_at) {
		return;
	}

	gradingSubmission.value = submission;

	grade.value = "";
	feedback.value = "";

	gradeDialogOpen.value = true;
}

async function saveGrade() {
	if (!gradingSubmission.value) {
		return;
	}

	if (grade.value === "") {
		error.value = "Bahoni kiriting.";

		return;
	}

	gradeLoading.value = true;

	error.value = "";

	try {
		await api(
			`/assignments/submissions/${gradingSubmission.value.uuid}/grade/`,
			{
				method: "POST",

				body: {
					grade: Number(grade.value),

					feedback: feedback.value,
				},
			},
		);

		gradeDialogOpen.value = false;

		gradingSubmission.value = null;

		await loadSubmissions();
	} catch (e) {
		error.value = errorMessage(e);
	} finally {
		gradeLoading.value = false;
	}
}
</script>

<template>
	<div class="grid gap-5 p-5">
		<!-- HEADER -->

		<div class="flex items-center gap-3">
			<InputGroup class="flex-1">
				<InputGroupInput
					v-model="search"
					placeholder="Topshiriqlarni qidirish..."
				/>

				<InputGroupAddon align="inline-start">
					<SearchIcon />
				</InputGroupAddon>
			</InputGroup>

			<Button @click="openAddDialog">
				<PlusIcon class="mr-2 h-4 w-4" />

				Topshiriq qo‘shish
			</Button>
		</div>

		<div
			v-if="error"
			class="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
		>
			{{ error }}
		</div>

		<!-- ASSIGNMENTS -->

		<Card>
			<CardContent class="p-0">
				<div class="overflow-x-auto">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead> Topshiriq </TableHead>

								<TableHead> Guruhlar </TableHead>

								<TableHead> Deadline </TableHead>

								<TableHead> Fayl </TableHead>

								<TableHead class="text-right"> Amal </TableHead>
							</TableRow>
						</TableHeader>

						<TableBody>
							<TableRow v-if="loading">
								<TableCell colspan="5" class="h-32 text-center">
									Yuklanmoqda...
								</TableCell>
							</TableRow>

							<TableRow v-else-if="assignments.length === 0">
								<TableCell
									colspan="5"
									class="h-32 text-center text-muted-foreground"
								>
									Topshiriqlar topilmadi
								</TableCell>
							</TableRow>

							<TableRow
								v-for="assignment in assignments"
								v-else
								:key="assignment.uuid"
							>
								<TableCell>
									<div class="font-medium">
										{{ assignment.title }}
									</div>

									<div
										class="mt-1 max-w-87.5 truncate text-sm text-muted-foreground"
									>
										{{ assignment.description || "-" }}
									</div>
								</TableCell>

								<TableCell>
									<div class="flex flex-wrap gap-1">
										<Badge
											v-for="group in assignment.groups_detail"
											:key="group.uuid"
											variant="secondary"
										>
											{{ group.name }}
										</Badge>
									</div>
								</TableCell>

								<TableCell>
									{{ assignment.deadline }}
								</TableCell>

								<TableCell>
									<NuxtLink
										v-if="assignment.file"
										:to="assignment.file"
										external
										target="_blank"
									>
										<Button variant="outline" size="sm">
											<FileIcon class="mr-2 h-4 w-4" />

											Ochish
										</Button>
									</NuxtLink>

									<span v-else> - </span>
								</TableCell>

								<TableCell>
									<div class="flex justify-end gap-2">
										<Button
											variant="outline"
											size="sm"
											@click="openSubmissions(assignment)"
										>
											<EyeIcon class="mr-2 h-4 w-4" />

											Yuborilganlar
										</Button>

										<Button
											variant="outline"
											size="icon"
											@click="openEditDialog(assignment)"
										>
											<PencilIcon class="h-4 w-4" />
										</Button>
									</div>
								</TableCell>
							</TableRow>
						</TableBody>
					</Table>
				</div>
			</CardContent>

			<CardFooter v-if="total > pageSize">
				<Pagination
					:page="currentPage"
					:total="total"
					:items-per-page="pageSize"
					@update:page="changePage"
				>
					<PaginationContent v-slot="{ items }">
						<PaginationPrevious />

						<template v-for="(item, index) in items" :key="index">
							<PaginationItem
								v-if="item.type === 'page'"
								:value="item.value"
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
		     ASSIGNMENT ADD / EDIT
		     ========================= -->

		<Dialog v-model:open="assignmentDialogOpen">
			<DialogContent class="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
				<DialogHeader>
					<DialogTitle>
						{{
							editingAssignment
								? "Topshiriqni tahrirlash"
								: "Yangi topshiriq"
						}}
					</DialogTitle>
				</DialogHeader>

				<div class="grid gap-5">
					<div class="grid gap-2">
						<Label> Nomi </Label>

						<Input v-model="title" />
					</div>

					<div class="grid gap-2">
						<Label> Tavsif </Label>

						<Textarea v-model="description" rows="5" />
					</div>

					<!-- GROUPS -->

					<div class="grid gap-2">
						<Label> Guruhlar </Label>

						<Popover v-model:open="groupPopoverOpen">
							<PopoverTrigger as-child>
								<Button
									variant="outline"
									class="w-full justify-between font-normal"
								>
									<span v-if="selectedGroups.length">
										{{ selectedGroups.length }}
										ta guruh tanlandi
									</span>

									<span v-else class="text-muted-foreground">
										Guruhlarni tanlang
									</span>

									<ChevronDownIcon class="h-4 w-4" />
								</Button>
							</PopoverTrigger>

							<PopoverContent
								class="w-full min-w-(--reka-popper-anchor-width) p-0"
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
													toggleGroup(group.uuid)
												"
											>
												<div
													class="flex w-full items-center justify-between"
												>
													{{ group.name }}

													<span
														v-if="
															isGroupSelected(
																group.uuid,
															)
														"
													>
														✓
													</span>
												</div>
											</CommandItem>
										</CommandGroup>
									</CommandList>
								</Command>
							</PopoverContent>
						</Popover>
					</div>

					<!-- DEADLINE -->

					<div class="grid gap-4 sm:grid-cols-2">
						<div class="grid gap-2">
							<Label> Deadline sanasi </Label>

							<Popover v-model:open="deadlineCalendarOpen">
								<PopoverTrigger as-child>
									<Button
										variant="outline"
										class="justify-start font-normal"
									>
										<CalendarIcon class="mr-2 h-4 w-4" />

										<span v-if="deadlineDate">
											{{
												deadlineDate.toDate(
													getLocalTimeZone(),
												)
											}}
										</span>

										<span v-else> Sanani tanlang </span>
									</Button>
								</PopoverTrigger>

								<PopoverContent class="w-auto p-0">
									<Calendar
										v-model="deadlineDate"
										@update:model-value="
											deadlineCalendarOpen = false
										"
									/>
								</PopoverContent>
							</Popover>
						</div>

						<div class="grid gap-2">
							<Label> Vaqt </Label>

							<Input v-model="deadlineTime" type="time" />
						</div>
					</div>

					<div class="grid gap-2">
						<Label> Fayl </Label>

						<Input type="file" @change="handleAssignmentFile" />
					</div>
				</div>

				<DialogFooter>
					<Button
						variant="outline"
						@click="assignmentDialogOpen = false"
					>
						Bekor qilish
					</Button>

					<Button :disabled="saveLoading" @click="saveAssignment">
						{{ saveLoading ? "Saqlanmoqda..." : "Saqlash" }}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>

		<!-- =========================
		     SUBMISSIONS
		     ========================= -->

		<Dialog v-model:open="submissionsDialogOpen">
			<DialogContent class="max-h-[90vh] overflow-y-auto sm:max-w-5xl">
				<DialogHeader>
					<DialogTitle>
						{{ selectedAssignment?.title }}
					</DialogTitle>

					<DialogDescription>
						Talabalar yuborgan topshiriqlar
					</DialogDescription>
				</DialogHeader>

				<InputGroup>
					<InputGroupInput
						v-model="submissionSearch"
						placeholder="Talabani qidirish..."
					/>

					<InputGroupAddon align="inline-start">
						<SearchIcon />
					</InputGroupAddon>
				</InputGroup>

				<div class="overflow-x-auto rounded-xl border">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead> Talaba </TableHead>

								<TableHead> Yuborilgan </TableHead>

								<TableHead> Fayl </TableHead>

								<TableHead> Baho </TableHead>

								<TableHead class="text-right"> Amal </TableHead>
							</TableRow>
						</TableHeader>

						<TableBody>
							<TableRow v-if="submissionsLoading">
								<TableCell colspan="5" class="h-24 text-center">
									Yuklanmoqda...
								</TableCell>
							</TableRow>

							<TableRow v-else-if="submissions.length === 0">
								<TableCell
									colspan="5"
									class="h-24 text-center text-muted-foreground"
								>
									Hali topshiriq yuborilmagan.
								</TableCell>
							</TableRow>

							<TableRow
								v-for="submission in submissions"
								v-else
								:key="submission.uuid"
							>
								<TableCell>
									<div class="font-medium">
										{{ submission.student_name }}
									</div>

									<div class="text-xs text-muted-foreground">
										{{ submission.student_username }}
									</div>
								</TableCell>

								<TableCell>
									{{ submission.submitted_at }}
								</TableCell>

								<TableCell>
									<NuxtLink
										:to="submission.file"
										external
										target="_blank"
									>
										<Button variant="outline" size="sm">
											<FileIcon class="mr-2 h-4 w-4" />

											Ochish
										</Button>
									</NuxtLink>
								</TableCell>

								<TableCell>
									<Badge v-if="submission.graded_at">
										{{ submission.grade }}
									</Badge>

									<span v-else class="text-muted-foreground">
										Baholanmagan
									</span>
								</TableCell>

								<TableCell>
									<div class="flex justify-end">
										<Button
											v-if="!submission.graded_at"
											size="sm"
											@click="openGradeDialog(submission)"
										>
											Baholash
										</Button>

										<span
											v-else
											class="text-sm text-muted-foreground"
										>
											Baholangan
										</span>
									</div>
								</TableCell>
							</TableRow>
						</TableBody>
					</Table>
				</div>
			</DialogContent>
		</Dialog>

		<!-- =========================
		     GRADE
		     ========================= -->

		<Dialog v-model:open="gradeDialogOpen">
			<DialogContent class="sm:max-w-md">
				<DialogHeader>
					<DialogTitle> Topshiriqni baholash </DialogTitle>

					<DialogDescription>
						{{ gradingSubmission?.student_name }}
					</DialogDescription>
				</DialogHeader>

				<div class="grid gap-4">
					<div class="grid gap-2">
						<Label> Baho </Label>

						<Input v-model="grade" type="number" step="0.01" />
					</div>

					<div class="grid gap-2">
						<Label> Izoh </Label>

						<Textarea v-model="feedback" rows="4" />
					</div>
				</div>

				<DialogFooter>
					<Button variant="outline" @click="gradeDialogOpen = false">
						Bekor qilish
					</Button>

					<Button :disabled="gradeLoading" @click="saveGrade">
						{{ gradeLoading ? "Saqlanmoqda..." : "Baholash" }}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	</div>
</template>
