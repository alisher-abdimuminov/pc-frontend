<script setup lang="ts">
import type { Group, User } from "@/types/api";

definePageMeta({
	layout: "teacher",
});

const { api, errorMessage } = useApi();

const groups = ref<Group[]>([]);

const students = ref<User[]>([]);

const selectedGroup = ref("none");

const loadingGroups = ref(false);

const loadingStudents = ref(false);

const error = ref("");

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
 * LOAD STUDENTS
 * ---------------------------------- */

async function loadStudents() {
	if (selectedGroup.value === "none") {
		students.value = [];

		return;
	}

	loadingStudents.value = true;

	error.value = "";

	try {
		const params = new URLSearchParams();

		params.set("group", selectedGroup.value);

		params.set("limit", "1000");

		const response = await api<any>(`/auth/students/?${params.toString()}`);

		students.value = Array.isArray(response)
			? response
			: response?.results || [];
	} catch (e) {
		error.value = errorMessage(e);

		students.value = [];
	} finally {
		loadingStudents.value = false;
	}
}

/* ----------------------------------
 * GROUP CHANGE
 * ---------------------------------- */

watch(selectedGroup, async () => {
	await loadStudents();
});

onMounted(async () => {
	await loadGroups();
});
</script>

<template>
	<div class="grid gap-5 p-5">
		<!-- GROUP SELECT -->

		<Select v-model="selectedGroup" :disabled="loadingGroups">
			<SelectTrigger class="w-full">
				<SelectValue placeholder="Guruhni tanlang" />
			</SelectTrigger>

			<SelectContent>
				<SelectGroup>
					<SelectItem value="none"> Guruhni tanlang </SelectItem>

					<SelectItem
						v-for="group in groups"
						:key="group.uuid"
						:value="group.uuid"
					>
						{{ group.name }}
					</SelectItem>
				</SelectGroup>
			</SelectContent>
		</Select>

		<!-- ERROR -->

		<div
			v-if="error"
			class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
		>
			{{ error }}
		</div>

		<!-- STUDENTS -->

		<Card v-if="selectedGroup !== 'none'">
			<CardContent class="w-full p-0">
				<div class="w-full overflow-x-auto">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead> Talaba </TableHead>

								<TableHead> Telefon </TableHead>

								<TableHead> Viloyat </TableHead>

								<TableHead> GPA </TableHead>
							</TableRow>
						</TableHeader>

						<TableBody>
							<TableRow v-if="loadingStudents">
								<TableCell
									colspan="4"
									class="h-24 text-center text-muted-foreground"
								>
									Yuklanmoqda...
								</TableCell>
							</TableRow>

							<TableRow v-else-if="students.length === 0">
								<TableCell
									colspan="4"
									class="h-24 text-center text-muted-foreground"
								>
									Talabalar topilmadi
								</TableCell>
							</TableRow>

							<TableRow
								v-for="student in students"
								v-else
								:key="student.uuid"
							>
								<TableCell class="font-medium">
									{{ student.full_name || student.username }}
								</TableCell>

								<TableCell>
									{{ student.phone || "-" }}
								</TableCell>

								<TableCell>
									{{ student.province || "-" }}
								</TableCell>

								<TableCell>
									{{ student.gpa ?? "-" }}
								</TableCell>
							</TableRow>
						</TableBody>
					</Table>
				</div>
			</CardContent>
		</Card>
	</div>
</template>
