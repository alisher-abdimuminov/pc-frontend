<script setup lang="ts">
import {
	FaceLandmarker,
	FilesetResolver,
	type NormalizedLandmark,
} from "@mediapipe/tasks-vision";
import {
	CalendarIcon,
	CameraIcon,
	CheckIcon,
	Clock3Icon,
	LockIcon,
	MapPinIcon,
	RefreshCwIcon,
	XIcon,
} from "@lucide/vue";

import type { TodayAttendance, TodayAttendanceStep } from "@/types/api";

definePageMeta({
	layout: "student",
});

const { api, errorMessage } = useApi();
const auth = useAuthStore();

/* ----------------------------------
 * STATE
 * ---------------------------------- */

const attendance = ref<TodayAttendance | null>(null);

const loading = ref(false);
const error = ref("");

const faceDialogOpen = ref(false);

const activeStep = ref<TodayAttendanceStep | null>(null);

const verifying = ref(false);

const verifyError = ref("");

const locationStatus = ref("");

let refreshTimer: ReturnType<typeof setInterval> | null = null;

/* ----------------------------------
 * TODAY
 * ---------------------------------- */

async function loadToday() {
	loading.value = true;
	error.value = "";

	try {
		attendance.value = await api<TodayAttendance>("/attendance/today/");
	} catch (e) {
		error.value = errorMessage(e);
	} finally {
		loading.value = false;
	}
}

/* ----------------------------------
 * STATUS
 * ---------------------------------- */

function statusText(status: TodayAttendanceStep["status"]) {
	if (status === "completed") {
		return "Tasdiqlangan";
	}

	if (status === "available") {
		return "Hozir ochiq";
	}

	if (status === "missed") {
		return "O‘tkazib yuborilgan";
	}

	return "Hali ochilmagan";
}

// mediapipe
const videoRef = ref<HTMLVideoElement | null>(null);

const faceLandmarker = shallowRef<FaceLandmarker | null>(null);

const mediaPipeLoading = ref(false);

const faceDetected = ref(false);

const faceReady = ref(false);

const faceMessage = ref("Yuzingizni oval ichiga joylashtiring.");

const faceProgress = ref(0);

const cameraStream = ref<MediaStream | null>(null);

let animationFrameId: number | null = null;

let lastVideoTime = -1;

let stableStartedAt: number | null = null;

let autoSubmitting = false;

const STABLE_DURATION = 3000;

async function initFaceLandmarker() {
	if (faceLandmarker.value) {
		return;
	}

	mediaPipeLoading.value = true;

	try {
		const vision = await FilesetResolver.forVisionTasks("/mediapipe/wasm");

		faceLandmarker.value = await FaceLandmarker.createFromOptions(vision, {
			baseOptions: {
				modelAssetPath: "/models/face_landmarker.task",
			},

			runningMode: "VIDEO",

			/*
			 * 2 qilamiz:
			 * kadrda ikkinchi yuz
			 * borligini ham bilish uchun.
			 */
			numFaces: 2,

			minFaceDetectionConfidence: 0.7,

			minFacePresenceConfidence: 0.7,

			minTrackingConfidence: 0.7,

			outputFaceBlendshapes: false,

			outputFacialTransformationMatrixes: true,
		});
	} finally {
		mediaPipeLoading.value = false;
	}
}

function rodriguesRotationVectorFromMatrix(rotationMatrix: number[]) {
	const trace = rotationMatrix[0] + rotationMatrix[4] + rotationMatrix[8];

	const cosAngle = Math.max(-1, Math.min(1, (trace - 1) / 2));

	const angle = Math.acos(cosAngle);

	if (Math.abs(angle) < 0.00001) {
		return [0, 0, 0];
	}

	const denominator = 2 * Math.sin(angle);

	if (Math.abs(denominator) < 0.00001) {
		return [0, 0, 0];
	}

	const axis = [
		(rotationMatrix[7] - rotationMatrix[5]) / denominator,

		(rotationMatrix[2] - rotationMatrix[6]) / denominator,

		(rotationMatrix[3] - rotationMatrix[1]) / denominator,
	];

	return axis.map((component) => (component * angle * 180) / Math.PI);
}

function rotationMatrixFromFaceMatrix(data: number[]) {
	if (data.length < 16) {
		return null;
	}

	return [
		data[0],
		data[1],
		data[2],

		data[4],
		data[5],
		data[6],

		data[8],
		data[9],
		data[10],
	];
}

function getFaceBounds(landmarks: NormalizedLandmark[]) {
	let minX = 1;
	let minY = 1;
	let maxX = 0;
	let maxY = 0;

	for (const point of landmarks) {
		minX = Math.min(minX, point.x);

		minY = Math.min(minY, point.y);

		maxX = Math.max(maxX, point.x);

		maxY = Math.max(maxY, point.y);
	}

	return {
		minX,
		minY,
		maxX,
		maxY,

		width: maxX - minX,

		height: maxY - minY,

		centerX: (minX + maxX) / 2,

		centerY: (minY + maxY) / 2,
	};
}

function validateFaceFrame(
	landmarks: NormalizedLandmark[],
	matrixData: number[] | undefined,
) {
	const bounds = getFaceBounds(landmarks);

	/*
	 * Yuz kamera markazida bo'lishi.
	 *
	 * Normalized:
	 * x = 0..1
	 * y = 0..1
	 */

	const centeredX = Math.abs(bounds.centerX - 0.5) <= 0.11;

	const centeredY = Math.abs(bounds.centerY - 0.48) <= 0.13;

	if (!centeredX || !centeredY) {
		return {
			valid: false,
			message: "Yuzingizni oval markaziga joylashtiring.",
		};
	}

	/*
	 * Juda uzoq yoki juda yaqin
	 * bo'lmasligi.
	 */

	if (bounds.width < 0.24 || bounds.height < 0.32) {
		return {
			valid: false,
			message: "Kameraga biroz yaqinroq keling.",
		};
	}

	if (bounds.width > 0.68 || bounds.height > 0.82) {
		return {
			valid: false,
			message: "Kameradan biroz uzoqlashing.",
		};
	}

	if (!matrixData || matrixData.length < 16) {
		return {
			valid: false,
			message: "Yuz holati aniqlanmoqda...",
		};
	}

	const rotationMatrix = rotationMatrixFromFaceMatrix(matrixData);

	if (!rotationMatrix) {
		return {
			valid: false,
			message: "Yuz holati aniqlanmadi.",
		};
	}

	const rotation = rodriguesRotationVectorFromMatrix(rotationMatrix);

	const pitch = Math.abs(rotation[0] || 0);

	const yaw = Math.abs(rotation[1] || 0);

	const roll = Math.abs(rotation[2] || 0);

	/*
	 * Boshni oldinga qarab
	 * tutish kerak.
	 */

	if (yaw > 15) {
		return {
			valid: false,
			message: "Boshingizni kameraga to‘g‘ri qarating.",
		};
	}

	if (pitch > 15) {
		return {
			valid: false,
			message: "Boshingizni tepaga yoki pastga egmang.",
		};
	}

	if (roll > 12) {
		return {
			valid: false,
			message: "Boshingizni tik tuting.",
		};
	}

	return {
		valid: true,
		message: "Yuz aniqlandi. Harakatlanmang.",
	};
}

/* ----------------------------------
 * CAMERA
 * ---------------------------------- */

async function startCamera() {
	await initFaceLandmarker();

	const stream = await navigator.mediaDevices.getUserMedia({
		video: {
			facingMode: "user",

			width: {
				ideal: 720,
			},

			height: {
				ideal: 720,
			},
		},

		audio: false,
	});

	cameraStream.value = stream;

	await nextTick();

	if (!videoRef.value) {
		return;
	}

	videoRef.value.srcObject = stream;

	await videoRef.value.play();

	startFaceTracking();
}

function startFaceTracking() {
	stopFaceTracking();

	faceDetected.value = false;
	faceReady.value = false;
	faceProgress.value = 0;

	faceMessage.value = "Yuzingizni oval ichiga joylashtiring.";

	stableStartedAt = null;
	lastVideoTime = -1;

	const detect = async () => {
		const video = videoRef.value;

		const landmarker = faceLandmarker.value;

		if (!video || !landmarker || faceDialogOpen.value === false) {
			return;
		}

		if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
			animationFrameId = requestAnimationFrame(detect);

			return;
		}

		if (video.currentTime === lastVideoTime) {
			animationFrameId = requestAnimationFrame(detect);

			return;
		}

		lastVideoTime = video.currentTime;

		try {
			const result = landmarker.detectForVideo(video, performance.now());

			const faces = result.faceLandmarks;

			/*
			 * Hech qanday yuz yo'q.
			 */

			if (faces.length === 0) {
				resetStableFace("Yuz aniqlanmadi.");

				animationFrameId = requestAnimationFrame(detect);

				return;
			}

			/*
			 * Aynan bitta yuz.
			 */

			if (faces.length !== 1) {
				resetStableFace("Kadrda faqat bitta yuz bo‘lishi kerak.");

				animationFrameId = requestAnimationFrame(detect);

				return;
			}

			faceDetected.value = true;

			const matrix = result.facialTransformationMatrixes?.[0];

			const validation = validateFaceFrame(faces[0], matrix?.data);

			if (!validation.valid) {
				resetStableFace(validation.message);

				animationFrameId = requestAnimationFrame(detect);

				return;
			}

			faceMessage.value = validation.message;

			const now = performance.now();

			if (stableStartedAt === null) {
				stableStartedAt = now;
			}

			const elapsed = now - stableStartedAt;

			faceProgress.value = Math.min(
				100,
				(elapsed / STABLE_DURATION) * 100,
			);

			if (elapsed >= STABLE_DURATION) {
				faceReady.value = true;

				faceProgress.value = 100;

				faceMessage.value = "Yuz tasdiqlandi.";

				if (!autoSubmitting) {
					autoSubmitting = true;

					stopFaceTracking();

					await submitVerifiedFace();
				}

				return;
			}
		} catch {
			resetStableFace("Yuzni aniqlashda xatolik.");
		}

		animationFrameId = requestAnimationFrame(detect);
	};

	animationFrameId = requestAnimationFrame(detect);
}

function resetStableFace(message: string) {
	stableStartedAt = null;

	faceReady.value = false;
	faceProgress.value = 0;

	faceMessage.value = message;
}

function stopFaceTracking() {
	if (animationFrameId !== null) {
		cancelAnimationFrame(animationFrameId);

		animationFrameId = null;
	}

	stableStartedAt = null;
}

function stopCamera() {
	stopFaceTracking();

	if (cameraStream.value) {
		for (const track of cameraStream.value.getTracks()) {
			track.stop();
		}
	}

	cameraStream.value = null;

	if (videoRef.value) {
		videoRef.value.srcObject = null;
	}

	faceDetected.value = false;
	faceReady.value = false;
	faceProgress.value = 0;

	stableStartedAt = null;

	autoSubmitting = false;
}

async function submitVerifiedFace() {
	if (!activeStep.value || !videoRef.value) {
		autoSubmitting = false;

		return;
	}

	verifying.value = true;
	verifyError.value = "";

	try {
		/*
		 * MediaPipe yuzni valid deb
		 * topgandan keyin frame'ni
		 * darhol olamiz.
		 */
		const image = await captureImage();

		locationStatus.value = "Joylashuv aniqlanmoqda...";

		/*
		 * Har bir STEP uchun
		 * browser location yangidan.
		 */
		const position = await getCurrentLocation();

		locationStatus.value = "Joylashuv olindi.";

		const formData = new FormData();

		formData.append("face_image", image, `attendance-${Date.now()}.jpg`);

		formData.append("latitude", String(position.latitude));

		formData.append("longitude", String(position.longitude));

		await api("/attendance/check/", {
			method: "POST",
			body: formData,
		});

		faceDialogOpen.value = false;

		await loadToday();
	} catch (e) {
		verifyError.value = errorMessage(e);

		/*
		 * Backend reject qilsa
		 * yana MediaPipe scan
		 * boshlashi mumkin.
		 */
		autoSubmitting = false;

		await loadToday();

		if (faceDialogOpen.value) {
			startFaceTracking();
		}
	} finally {
		verifying.value = false;
	}
}

function captureImage(): Promise<Blob> {
	return new Promise((resolve, reject) => {
		const video = videoRef.value;

		if (!video || !video.videoWidth || !video.videoHeight) {
			reject(new Error("Kamera tasviri tayyor emas."));

			return;
		}

		const canvas = document.createElement("canvas");

		canvas.width = video.videoWidth;

		canvas.height = video.videoHeight;

		const ctx = canvas.getContext("2d");

		if (!ctx) {
			reject(new Error("Rasm olinmadi."));

			return;
		}

		/*
		 * Front kamera preview
		 * mirrored bo'lsa ham
		 * backendga original frame.
		 */
		ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

		canvas.toBlob(
			(blob) => {
				if (!blob) {
					reject(new Error("Rasm olinmadi."));

					return;
				}

				resolve(blob);
			},
			"image/jpeg",
			0.92,
		);
	});
}
/* ----------------------------------
 * OPEN FACE
 * ---------------------------------- */

function openFace(step: TodayAttendanceStep) {
	if (step.status !== "available") {
		return;
	}

	activeStep.value = step;

	verifyError.value = "";

	locationStatus.value = "";

	faceDialogOpen.value = true;
}

watch(faceDialogOpen, async (open) => {
	if (open) {
		autoSubmitting = false;

		faceProgress.value = 0;

		faceReady.value = false;

		faceMessage.value = "Yuzingizni oval ichiga joylashtiring.";

		try {
			await startCamera();
		} catch (e) {
			verifyError.value = errorMessage(e);
		}
	} else {
		stopCamera();

		activeStep.value = null;
	}
});
/* ----------------------------------
 * LOCATION
 * ---------------------------------- */

function getCurrentLocation(): Promise<{
	latitude: number;
	longitude: number;
}> {
	return new Promise((resolve, reject) => {
		if (!navigator.geolocation) {
			reject(new Error("Browser locationni qo‘llab-quvvatlamaydi."));

			return;
		}

		navigator.geolocation.getCurrentPosition(
			(position) => {
				resolve({
					latitude: position.coords.latitude,

					longitude: position.coords.longitude,
				});
			},

			() => {
				reject(new Error("Joylashuvni olishga ruxsat berilmadi."));
			},

			{
				enableHighAccuracy: true,

				timeout: 15000,

				maximumAge: 0,
			},
		);
	});
}

/* ----------------------------------
 * VERIFY
 * ---------------------------------- */

async function verifyAttendance() {
	if (!activeStep.value) {
		return;
	}

	verifying.value = true;

	verifyError.value = "";

	locationStatus.value = "Joylashuv aniqlanmoqda...";

	try {
		/*
		 * Har bir qadamda location
		 * YANGIDAN olinadi.
		 */
		const position = await getCurrentLocation();

		locationStatus.value = "Joylashuv olindi.";

		const image = await captureImage();

		const formData = new FormData();

		formData.append("face_image", image, `attendance-${Date.now()}.jpg`);

		formData.append("latitude", String(position.latitude));

		formData.append("longitude", String(position.longitude));

		await api("/attendance/check/", {
			method: "POST",
			body: formData,
		});

		faceDialogOpen.value = false;

		await loadToday();
	} catch (e) {
		verifyError.value = errorMessage(e);

		/*
		 * Masalan request 12:59 da
		 * boshlanib, backendga
		 * 13:00 da yetib borsa status
		 * o'zgargan bo'lishi mumkin.
		 */
		await loadToday();
	} finally {
		verifying.value = false;
	}
}

/* ----------------------------------
 * LIFECYCLE
 * ---------------------------------- */

onMounted(async () => {
	await loadToday();

	refreshTimer = setInterval(async () => {
		if (!faceDialogOpen.value) {
			await loadToday();
		}
	}, 60_000);
});

onBeforeUnmount(() => {
	stopCamera();

	faceLandmarker.value?.close();

	faceLandmarker.value = null;
});
</script>

<template>
	<div class="grid gap-6 p-5">
		<!-- GREETING -->

		<div>
			<h1 class="text-2xl font-semibold tracking-tight">
				Salom, {{ auth.user?.full_name }}
			</h1>

			<p class="mt-1 text-sm text-muted-foreground">
				Bugungi amaliyot davomatingiz
			</p>
		</div>

		<!-- ERROR -->

		<div
			v-if="error"
			class="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
		>
			{{ error }}
		</div>

		<!-- LOADING -->

		<Card v-if="loading && !attendance">
			<CardContent class="flex min-h-48 items-center justify-center">
				<div class="flex items-center gap-2 text-muted-foreground">
					<RefreshCwIcon class="h-4 w-4 animate-spin" />

					Yuklanmoqda...
				</div>
			</CardContent>
		</Card>

		<!-- NO SCHEDULE -->

		<Card v-else-if="attendance && !attendance.has_schedule">
			<CardContent
				class="flex min-h-52 flex-col items-center justify-center gap-3 text-center"
			>
				<div
					class="flex h-12 w-12 items-center justify-center rounded-full bg-muted"
				>
					<CalendarIcon class="h-5 w-5 text-muted-foreground" />
				</div>

				<div>
					<div class="font-medium">Bugun amaliyot yo‘q</div>

					<p class="mt-1 text-sm text-muted-foreground">
						Siz yoki guruhingiz uchun bugunga jadval belgilanmagan.
					</p>
				</div>
			</CardContent>
		</Card>

		<!-- SCHEDULE -->

		<template v-else-if="attendance?.has_schedule">
			<!-- INFO -->

			<div class="grid gap-3 md:grid-cols-3">
				<Card>
					<CardContent class="flex items-center gap-3 p-4">
						<Clock3Icon class="h-5 w-5 text-muted-foreground" />

						<div>
							<div class="text-xs text-muted-foreground">
								Smena
							</div>

							<div class="font-medium">
								{{ attendance.shift_name }}
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent class="flex items-center gap-3 p-4">
						<MapPinIcon class="h-5 w-5 text-muted-foreground" />

						<div class="min-w-0">
							<div class="text-xs text-muted-foreground">
								Amaliyot joyi
							</div>

							<div class="truncate font-medium">
								{{ attendance.location?.name || "-" }}
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent class="flex items-center gap-3 p-4">
						<CalendarIcon class="h-5 w-5 text-muted-foreground" />

						<div class="min-w-0">
							<div class="text-xs text-muted-foreground">
								Jadval
							</div>

							<div class="truncate font-medium">
								{{ attendance.schedule_name || "-" }}
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			<!-- STEPS -->

			<div class="grid gap-4">
				<Card
					v-for="step in attendance.steps"
					:key="step.step"
					:class="[
						step.status === 'available' ? 'border-primary/50' : '',

						step.status === 'completed'
							? 'border-emerald-500/30'
							: '',

						step.status === 'missed' ? 'opacity-70' : '',
					]"
				>
					<CardContent
						class="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
					>
						<div class="flex items-center gap-4">
							<!-- ICON -->

							<div
								v-if="step.status === 'completed'"
								class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600"
							>
								<CheckIcon class="h-5 w-5" />
							</div>

							<div
								v-else-if="step.status === 'missed'"
								class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive"
							>
								<XIcon class="h-5 w-5" />
							</div>

							<div
								v-else-if="step.status === 'locked'"
								class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"
							>
								<LockIcon class="h-5 w-5" />
							</div>

							<div
								v-else
								class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
							>
								<CameraIcon class="h-5 w-5" />
							</div>

							<!-- TEXT -->

							<div>
								<div class="text-base font-semibold">
									Qadam -
									{{ step.step }}
								</div>

								<div
									class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground"
								>
									<span>
										{{ step.start }}
										—
										{{ step.end }}
									</span>

									<span> • </span>

									<span>
										{{ statusText(step.status) }}
									</span>
								</div>
							</div>
						</div>

						<!-- ACTION -->

						<Button
							v-if="step.status === 'available'"
							@click="openFace(step)"
						>
							<CameraIcon class="mr-2 h-4 w-4" />

							Tasdiqlash
						</Button>

						<Badge
							v-else-if="step.status === 'completed'"
							variant="secondary"
							class="w-fit"
						>
							<CheckIcon class="mr-1 h-3.5 w-3.5" />

							Tasdiqlangan
						</Badge>

						<Badge
							v-else-if="step.status === 'missed'"
							variant="destructive"
							class="w-fit"
						>
							O‘tkazib yuborilgan
						</Badge>

						<Button v-else disabled variant="outline">
							<LockIcon class="mr-2 h-4 w-4" />

							Yopiq
						</Button>
					</CardContent>
				</Card>
			</div>
		</template>

		<!-- FACE DIALOG -->

		<Dialog v-model:open="faceDialogOpen">
			<DialogContent class="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>
						Qadam
						{{ activeStep?.step }}
						ni tasdiqlash
					</DialogTitle>

					<DialogDescription>
						Yuzingizni kameraga qarating. Tasdiqlash vaqtida joriy
						joylashuvingiz ham tekshiriladi.
					</DialogDescription>
				</DialogHeader>

				<div class="grid gap-4">
					<!-- CAMERA -->

					<div
						class="relative mx-auto aspect-3/4 w-full max-w-sm overflow-hidden rounded-3xl bg-black"
					>
						<video
							ref="videoRef"
							autoplay
							playsinline
							muted
							class="h-full w-full scale-x-[-1] object-cover"
						/>

						<div
							class="pointer-events-none absolute inset-0 flex items-center justify-center"
						>
							<svg class="h-[78%] w-[72%]" viewBox="0 0 200 260">
								<ellipse
									cx="100"
									cy="130"
									rx="78"
									ry="112"
									fill="none"
									stroke="rgba(255,255,255,.25)"
									stroke-width="5"
								/>

								<ellipse
									cx="100"
									cy="130"
									rx="78"
									ry="112"
									fill="none"
									stroke="currentColor"
									stroke-width="5"
									stroke-linecap="round"
									pathLength="100"
									:stroke-dasharray="100"
									:stroke-dashoffset="100 - faceProgress"
									class="text-white transition-[stroke-dashoffset] duration-100"
									transform="rotate(-90 100 130)"
								/>
							</svg>
						</div>

						<div
							v-if="mediaPipeLoading"
							class="absolute inset-0 flex items-center justify-center bg-black/60 text-sm text-white"
						>
							Yuz tekshiruvi tayyorlanmoqda...
						</div>
					</div>

					<div class="mt-4 text-center">
						<p class="font-medium">
							{{ faceMessage }}
						</p>

						<p
							v-if="faceProgress > 0 && faceProgress < 100"
							class="mt-1 text-sm text-muted-foreground"
						>
							{{
								Math.ceil(
									(STABLE_DURATION *
										(1 - faceProgress / 100)) /
										1000,
								)
							}}
							soniya harakatlanmang
						</p>

						<p
							v-if="verifying"
							class="mt-2 text-sm text-muted-foreground"
						>
							FaceID va joylashuv tekshirilmoqda...
						</p>

						<p
							v-if="verifyError"
							class="mt-3 text-sm text-destructive"
						>
							{{ verifyError }}
						</p>
					</div>

					<!-- LOCATION STATUS -->

					<div
						v-if="locationStatus"
						class="flex items-center gap-2 rounded-xl border p-3 text-sm"
					>
						<MapPinIcon class="h-4 w-4 shrink-0" />

						{{ locationStatus }}
					</div>

					<!-- VERIFY ERROR -->

					<div
						v-if="verifyError"
						class="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
					>
						{{ verifyError }}
					</div>
				</div>
			</DialogContent>
		</Dialog>
	</div>
</template>
