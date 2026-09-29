<script setup lang="ts">
import { toTypedSchema } from "@vee-validate/zod";
import { GraduationCapIcon, Loader2Icon, UsersRoundIcon } from "@lucide/vue";
import z from "zod";
import { useForm, Field as VeeField } from "vee-validate";

const auth = useAuthStore();
const { api, errorMessage } = useApi();
const runtimeConfig = useRuntimeConfig();

const loading = ref<"student" | "teacher" | "">("");
const localLoading = ref(false);
const error = ref("");

if (auth.access && auth.user) await navigateTo(`/${auth.user.role}`);

const hemisTeacherLogin = () => {
	useCookie("hemis_type").value = "teacher";
	navigateTo(
		`${runtimeConfig.public.hemisTeacherURL}?client_id=${runtimeConfig.public.hemisClientID}&redirect_uri=${runtimeConfig.public.hemisRedirectUri}&response_type=code`,
		{
			external: true,
		},
	);
};

const hemisStudentLogin = () => {
	useCookie("hemis_type").value = "student";
	navigateTo(
		`${runtimeConfig.public.hemisStudentURL}?client_id=${runtimeConfig.public.hemisClientID}&redirect_uri=${runtimeConfig.public.hemisRedirectUri}&response_type=code`,
		{
			external: true,
		},
	);
};

const adminFormSchema = toTypedSchema(
	z.object({
		username: z.string(),
		password: z.string(),
	}),
);

const { handleSubmit } = useForm({
	validationSchema: adminFormSchema,
});

const onSubmit = handleSubmit(async (data) => {
	error.value = "";
	localLoading.value = true;

	try {
		const d = await api<any>("/auth/login/", {
			method: "POST",
			body: data,
		});

		auth.setSession(d);
		await navigateTo(`/${d.user.role}`);
	} catch (e) {
		error.value = errorMessage(e);
	} finally {
		localLoading.value = false;
	}
});
</script>

<template>
	<div
		class="mx-auto flex min-h-[calc(100vh-2rem)] max-w-5xl items-center justify-center"
	>
		<div
			class="grid w-full overflow-hidden rounded-3xl shadow-2xl lg:grid-cols-2"
		>
			<section
				class="hidden p-10 bg-accent/40 lg:flex lg:flex-col lg:justify-between"
			>
				<div>
					<img src="/images/logo.png" class="size-12" alt="" />
					<h1 class="mt-8 text-4xl font-bold leading-tight">
						Amaliyot davomatini aniq nazorat qiling.
					</h1>
					<p class="mt-4">
						HEMIS, geolokatsiya va yuzni tasdiqlash bilan yagona
						platforma.
					</p>
				</div>
				<div class="text-sm">Talaba • O‘qituvchi • Administrator</div>
			</section>
			<section class="p-6 sm:p-10">
				<h2 class="text-2xl font-bold">Tizimga kirish</h2>
				<p class="mt-1 text-sm">
					Talaba va o‘qituvchi HEMIS orqali kiradi.
				</p>

				<Alert v-if="error" variant="destructive" class="mt-5">
					<AlertTitle>Xatolik</AlertTitle>
					<AlertDescription>{{ error }}</AlertDescription>
				</Alert>

				<div class="mt-7 space-y-3">
					<Button
						class="w-full gap-2"
						size="lg"
						:disabled="!!loading"
						@click="hemisStudentLogin"
					>
						<Loader2Icon
							v-if="loading === 'student'"
							class="h-4 w-4 animate-spin"
						/>
						<GraduationCapIcon v-else class="h-5 w-5" />
						Talaba sifatida HEMIS orqali kirish
					</Button>
					<Button
						class="w-full gap-2"
						variant="outline"
						size="lg"
						:disabled="!!loading"
						@click="hemisTeacherLogin"
					>
						<Loader2Icon
							v-if="loading === 'teacher'"
							class="h-4 w-4 animate-spin"
						/>
						<UsersRoundIcon v-else class="h-5 w-5" />
						O‘qituvchi sifatida HEMIS orqali kirish
					</Button>
				</div>

				<div class="my-7 flex items-center gap-3 text-xs">
					<span class="h-px flex-1 border" />
					Admin uchun
					<span class="h-px flex-1 border" />
				</div>
				<form class="space-y-4" @submit.prevent="onSubmit">
					<FieldGroup>
						<VeeField
							v-slot="{ componentField, errors }"
							name="username"
						>
							<Field :data-invalid="!!errors.length">
								<FieldLabel for="username">
									Foydalanuvchi nomi
								</FieldLabel>

								<Input
									id="username"
									v-bind="componentField"
									autocomplete="off"
									:aria-invalid="!!errors.length"
								/>
								<FieldError
									v-if="errors.length"
									:errors="errors"
								/>
							</Field>
						</VeeField>
						<VeeField
							v-slot="{ componentField, errors }"
							name="password"
						>
							<Field :data-invalid="!!errors.length">
								<FieldLabel for="password">
									Kalit so'z
								</FieldLabel>

								<Input
									id="password"
									type="password"
									v-bind="componentField"
									autocomplete="off"
									:aria-invalid="!!errors.length"
								/>
								<FieldError
									v-if="errors.length"
									:errors="errors"
								/>
							</Field>
						</VeeField>

						<Field>
							<Button>Kirish</Button>
						</Field>
					</FieldGroup>
				</form>
			</section>
		</div>
	</div>
</template>
