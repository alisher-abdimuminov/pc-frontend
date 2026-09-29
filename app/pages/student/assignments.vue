<script setup lang="ts">
import { FileIcon, UploadIcon, RefreshCwIcon } from "@lucide/vue";

import type { StudentAssignment } from "@/types/api";

definePageMeta({
	layout: "student",
});

const { api, errorMessage } = useApi();

const assignments = ref<StudentAssignment[]>([]);

const loading = ref(false);
const submitting = ref(false);
const error = ref("");

const currentPage = ref(1);
const total = ref(0);
const pageSize = 50;

/* ----------------------------------
 * SUBMISSION DIALOG
 * ---------------------------------- */

const submissionDialogOpen = ref(false);

const selectedAssignment = ref<StudentAssignment | null>(null);

const selectedFile = ref<File | null>(null);

/* ----------------------------------
 * LOAD
 * ---------------------------------- */

async function load() {
	loading.value = true;
	error.value = "";

	try {
		const params = new URLSearchParams();

		params.set("page", String(currentPage.value));

		const response = await api<any>(
			`/assignments/student/?${params.toString()}`,
		);

		assignments.value = response?.results || [];

		total.value = response?.count || 0;
	} catch (e) {
		error.value = errorMessage(e);
	} finally {
		loading.value = false;
	}
}

onMounted(load);

/* ----------------------------------
 * DATE
 * ---------------------------------- */

function formatDate(value: string) {
	return new Date(value).toLocaleString("uz-UZ", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
	});
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
 * OPEN SUBMISSION
 * ---------------------------------- */

function openSubmission(assignment: StudentAssignment) {
	if (!assignment.available) {
		return;
	}

	selectedAssignment.value = assignment;

	selectedFile.value = null;

	submissionDialogOpen.value = true;
}

/* ----------------------------------
 * FILE
 * ---------------------------------- */

function handleFile(event: Event) {
	const input = event.target as HTMLInputElement;

	selectedFile.value = input.files?.[0] || null;
}

/* ----------------------------------
 * SUBMIT
 * ---------------------------------- */

async function submitFile() {
	if (!selectedAssignment.value || !selectedFile.value) {
		return;
	}

	submitting.value = true;
	error.value = "";

	try {
		const formData = new FormData();

		formData.append("file", selectedFile.value);

		if (selectedAssignment.value.submission) {
			await api(
				`/assignments/student-submissions/${selectedAssignment.value.submission.uuid}/`,
				{
					method: "PATCH",
					body: formData,
				},
			);
		} else {
			formData.append("assignment", selectedAssignment.value.uuid);

			await api("/assignments/student-submissions/", {
				method: "POST",
				body: formData,
			});
		}

		submissionDialogOpen.value = false;

		selectedAssignment.value = null;

		selectedFile.value = null;

		await load();
	} catch (e) {
		error.value = errorMessage(e);
	} finally {
		submitting.value = false;
	}
}
</script>

<template>
	<div class="grid gap-5 p-5">
		<div
			v-if="error"
			class="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
		>
			{{ error }}
		</div>

		<Card>
			<CardContent class="p-0">
				<div class="w-full overflow-x-auto">
					<Table class="min-w-250">
						<TableHeader>
							<TableRow>
								<TableHead> Topshiriq </TableHead>

								<TableHead> O‘qituvchi </TableHead>

								<TableHead> Deadline </TableHead>

								<TableHead> Topshiriq fayli </TableHead>

								<TableHead> Mening faylim </TableHead>

								<TableHead> Baho </TableHead>

								<TableHead class="text-right"> Amal </TableHead>
							</TableRow>
						</TableHeader>

						<TableBody>
							<TableRow v-if="loading">
								<TableCell
									colspan="7"
									class="h-32 text-center text-muted-foreground"
								>
									Yuklanmoqda...
								</TableCell>
							</TableRow>

							<TableRow v-else-if="assignments.length === 0">
								<TableCell
									colspan="7"
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
								<!-- ASSIGNMENT -->

								<TableCell>
									<div class="max-w-[320px]">
										<div class="font-medium">
											{{ assignment.title }}
										</div>

										<div
											v-if="assignment.description"
											class="mt-1 text-sm text-muted-foreground"
										>
											{{ assignment.description }}
										</div>
									</div>
								</TableCell>

								<!-- TEACHER -->

								<TableCell>
									{{ assignment.teacher_name || "-" }}
								</TableCell>

								<!-- DEADLINE -->

								<TableCell class="whitespace-nowrap">
									{{ formatDate(assignment.deadline) }}
								</TableCell>

								<!-- ASSIGNMENT FILE -->

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

									<span v-else class="text-muted-foreground">
										-
									</span>
								</TableCell>

								<!-- STUDENT FILE -->

								<TableCell>
									<NuxtLink
										v-if="assignment.submission"
										:to="assignment.submission.file"
										external
										target="_blank"
									>
										<Button variant="outline" size="sm">
											<FileIcon class="mr-2 h-4 w-4" />

											Ochish
										</Button>
									</NuxtLink>

									<span v-else class="text-muted-foreground">
										Yuborilmagan
									</span>
								</TableCell>

								<!-- GRADE -->

								<TableCell>
									<div
										v-if="assignment.submission?.graded_at"
										class="grid gap-1"
									>
										<Badge class="w-fit">
											{{ assignment.submission.grade }}
										</Badge>

										<span
											v-if="
												assignment.submission.feedback
											"
											class="max-w-50 text-xs text-muted-foreground"
										>
											{{ assignment.submission.feedback }}
										</span>
									</div>

									<span
										v-else-if="assignment.submission"
										class="text-sm text-muted-foreground"
									>
										Baholanmagan
									</span>

									<span v-else class="text-muted-foreground">
										-
									</span>
								</TableCell>

								<!-- ACTION -->

								<TableCell>
									<div class="flex justify-end">
										<Button
											v-if="assignment.available"
											size="sm"
											@click="openSubmission(assignment)"
										>
											<RefreshCwIcon
												v-if="assignment.submission"
												class="mr-2 h-4 w-4"
											/>

											<UploadIcon
												v-else
												class="mr-2 h-4 w-4"
											/>

											{{
												assignment.submission
													? "Almashtirish"
													: "Fayl yuborish"
											}}
										</Button>

										<Badge
											v-else-if="
												assignment.submission?.graded_at
											"
											variant="secondary"
										>
											Baholangan
										</Badge>

										<Badge v-else variant="outline">
											Muddati tugagan
										</Badge>
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

		<!-- FILE SUBMISSION DIALOG -->

		<Dialog v-model:open="submissionDialogOpen">
			<DialogContent class="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>
						{{
							selectedAssignment?.submission
								? "Faylni almashtirish"
								: "Topshiriq yuborish"
						}}
					</DialogTitle>

					<DialogDescription>
						{{ selectedAssignment?.title }}
					</DialogDescription>
				</DialogHeader>

				<div class="grid gap-2">
					<Label> Fayl </Label>

					<Input type="file" @change="handleFile" />
				</div>

				<DialogFooter>
					<Button
						type="button"
						variant="outline"
						@click="submissionDialogOpen = false"
					>
						Bekor qilish
					</Button>

					<Button
						type="button"
						:disabled="submitting || !selectedFile"
						@click="submitFile"
					>
						{{ submitting ? "Yuborilmoqda..." : "Yuborish" }}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	</div>
</template>
