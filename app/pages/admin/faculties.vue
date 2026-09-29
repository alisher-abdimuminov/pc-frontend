<script setup lang="ts">
import { SearchIcon } from "@lucide/vue";

import type { Faculty } from "@/types/api";

definePageMeta({
	layout: "admin",
});

const { api, errorMessage } = useApi();

const faculties = ref<Faculty[]>([]);
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

		const response = await api<any>(
			`/auth/faculties/?${params.toString()}`,
		);

		faculties.value = response?.results || [];

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
								<TableHead>Nomi</TableHead>
								<TableHead>Talabalar soni</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							<TableRow v-for="(faculty, idx) in faculties">
								<TableCell>{{ idx + 1 }}</TableCell>
								<TableCell>
									{{ faculty.name }}
								</TableCell>

								<TableCell>{{
									faculty.student_count
								}}</TableCell>
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
