<script setup lang="ts">
import {
	CameraIcon,
	CheckCircle2Icon,
	CircleAlertIcon,
	LocateFixedIcon,
	MapPinIcon,
	RefreshCwIcon,
	SettingsIcon,
	SmartphoneIcon,
	XCircleIcon,
} from "@lucide/vue";

/* ----------------------------------
 * TYPES
 * ---------------------------------- */

interface TelegramLocationData {
	latitude: number;
	longitude: number;

	altitude: number | null;

	course: number | null;
	speed: number | null;

	horizontal_accuracy: number | null;
	vertical_accuracy: number | null;

	course_accuracy: number | null;
	speed_accuracy: number | null;
}

interface BrowserLocationData {
	latitude: number;
	longitude: number;
	accuracy: number;

	altitude: number | null;
	altitudeAccuracy: number | null;
}

/* ----------------------------------
 * TELEGRAM
 * ---------------------------------- */

const telegram = shallowRef<any>(null);

const telegramChecking = ref(true);

const telegramError = ref("");

const telegramInfo = reactive({
	available: false,
	version: "",
	platform: "",
	version8: false,

	initDataAvailable: false,

	userId: null as number | null,
	userName: "",
});

/* ----------------------------------
 * LOCATION MANAGER
 * ---------------------------------- */

const locationManagerInfo = reactive({
	available: false,
	isInited: false,
	isLocationAvailable: false,
	isAccessRequested: false,
	isAccessGranted: false,
});

const telegramLocation = ref<TelegramLocationData | null>(null);

const telegramLocationLoading = ref(false);

const telegramLocationError = ref("");

/* ----------------------------------
 * BROWSER LOCATION
 * ---------------------------------- */

const browserLocation = ref<BrowserLocationData | null>(null);

const browserLocationLoading = ref(false);

const browserLocationError = ref("");

/* ----------------------------------
 * CAMERA
 * ---------------------------------- */

const videoRef = ref<HTMLVideoElement | null>(null);

const cameraStream = ref<MediaStream | null>(null);

const cameraLoading = ref(false);

const cameraWorking = ref(false);

const cameraError = ref("");

/* ----------------------------------
 * TELEGRAM INITIALIZE
 * ---------------------------------- */

async function waitForTelegram(timeout = 5000) {
	const startedAt = Date.now();

	while (Date.now() - startedAt < timeout) {
		const tg = (window as any).Telegram?.WebApp;

		if (tg) {
			return tg;
		}

		await new Promise((resolve) => setTimeout(resolve, 100));
	}

	return null;
}

async function initTelegram() {
	telegramChecking.value = true;

	telegramError.value = "";

	try {
		const tg = await waitForTelegram();

		if (!tg) {
			telegramInfo.available = false;

			telegramError.value =
				"Telegram WebApp aniqlanmadi. Sahifani Telegram Mini App ichidan oching.";

			return;
		}

		telegram.value = tg;

		telegramInfo.available = true;

		telegramInfo.version = tg.version || "";

		telegramInfo.platform = tg.platform || "";

		telegramInfo.version8 =
			typeof tg.isVersionAtLeast === "function"
				? tg.isVersionAtLeast("8.0")
				: false;

		telegramInfo.initDataAvailable = Boolean(tg.initData);

		const user = tg.initDataUnsafe?.user;

		if (user) {
			telegramInfo.userId = user.id ?? null;

			telegramInfo.userName = [user.first_name, user.last_name]
				.filter(Boolean)
				.join(" ");
		}

		tg.ready?.();
		tg.expand?.();

		await initLocationManager();
	} catch (e) {
		telegramError.value =
			e instanceof Error ? e.message : "Telegram initialization xatosi.";
	} finally {
		telegramChecking.value = false;
	}
}

/* ----------------------------------
 * LOCATION MANAGER INIT
 * ---------------------------------- */

function updateLocationManagerInfo() {
	const manager = telegram.value?.LocationManager;

	if (!manager) {
		locationManagerInfo.available = false;

		return;
	}

	locationManagerInfo.available = true;

	locationManagerInfo.isInited = Boolean(manager.isInited);

	locationManagerInfo.isLocationAvailable = Boolean(
		manager.isLocationAvailable,
	);

	locationManagerInfo.isAccessRequested = Boolean(manager.isAccessRequested);

	locationManagerInfo.isAccessGranted = Boolean(manager.isAccessGranted);
}

function initLocationManager(): Promise<void> {
	return new Promise((resolve) => {
		const manager = telegram.value?.LocationManager;

		if (!manager) {
			locationManagerInfo.available = false;

			resolve();

			return;
		}

		locationManagerInfo.available = true;

		if (manager.isInited) {
			updateLocationManagerInfo();

			resolve();

			return;
		}

		manager.init(() => {
			updateLocationManagerInfo();

			resolve();
		});
	});
}

/* ----------------------------------
 * TELEGRAM LOCATION
 * ---------------------------------- */

async function getTelegramLocation() {
	telegramLocationError.value = "";

	telegramLocationLoading.value = true;

	try {
		const manager = telegram.value?.LocationManager;

		if (!manager) {
			throw new Error("LocationManager mavjud emas.");
		}

		if (!manager.isInited) {
			await initLocationManager();
		}

		const location = await new Promise<TelegramLocationData | null>(
			(resolve) => {
				manager.getLocation((result: TelegramLocationData | null) => {
					resolve(result);
				});
			},
		);

		updateLocationManagerInfo();

		if (!location) {
			throw new Error(
				"Telegram location qaytarmadi. Ruxsat berilmagan yoki location mavjud emas.",
			);
		}

		telegramLocation.value = location;
	} catch (e) {
		telegramLocationError.value =
			e instanceof Error
				? e.message
				: "Telegram location olishda xatolik.";
	} finally {
		telegramLocationLoading.value = false;
	}
}

/* ----------------------------------
 * TELEGRAM SETTINGS
 * ---------------------------------- */

function openTelegramLocationSettings() {
	const manager = telegram.value?.LocationManager;

	if (!manager) {
		return;
	}

	manager.openSettings?.();
}

/* ----------------------------------
 * BROWSER LOCATION
 * ---------------------------------- */

async function getBrowserLocation() {
	browserLocationError.value = "";

	browserLocationLoading.value = true;

	try {
		if (!navigator.geolocation) {
			throw new Error("Browser Geolocation API mavjud emas.");
		}

		const position = await new Promise<GeolocationPosition>(
			(resolve, reject) => {
				navigator.geolocation.getCurrentPosition(resolve, reject, {
					enableHighAccuracy: true,

					maximumAge: 0,

					timeout: 15000,
				});
			},
		);

		browserLocation.value = {
			latitude: position.coords.latitude,

			longitude: position.coords.longitude,

			accuracy: position.coords.accuracy,

			altitude: position.coords.altitude,

			altitudeAccuracy: position.coords.altitudeAccuracy,
		};
	} catch (e) {
		if (e instanceof GeolocationPositionError) {
			browserLocationError.value = `Browser location xatosi: ${e.message}`;

			return;
		}

		browserLocationError.value =
			e instanceof Error
				? e.message
				: "Browser location olishda xatolik.";
	} finally {
		browserLocationLoading.value = false;
	}
}

/* ----------------------------------
 * DISTANCE
 * ---------------------------------- */

function toRadians(value: number) {
	return (value * Math.PI) / 180;
}

function distanceBetween(
	lat1: number,
	lng1: number,
	lat2: number,
	lng2: number,
) {
	const earthRadius = 6371000;

	const dLat = toRadians(lat2 - lat1);

	const dLng = toRadians(lng2 - lng1);

	const a =
		Math.sin(dLat / 2) ** 2 +
		Math.cos(toRadians(lat1)) *
			Math.cos(toRadians(lat2)) *
			Math.sin(dLng / 2) ** 2;

	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

	return earthRadius * c;
}

const locationDifference = computed(() => {
	if (!telegramLocation.value || !browserLocation.value) {
		return null;
	}

	return distanceBetween(
		telegramLocation.value.latitude,

		telegramLocation.value.longitude,

		browserLocation.value.latitude,

		browserLocation.value.longitude,
	);
});

/* ----------------------------------
 * CAMERA
 * ---------------------------------- */

async function testCamera() {
	cameraError.value = "";
	cameraLoading.value = true;

	stopCamera();

	try {
		if (!navigator.mediaDevices?.getUserMedia) {
			throw new Error("getUserMedia mavjud emas.");
		}

		cameraStream.value = await navigator.mediaDevices.getUserMedia({
			video: {
				facingMode: "user",
			},

			audio: false,
		});

		await nextTick();

		if (!videoRef.value) {
			throw new Error("Video element topilmadi.");
		}

		videoRef.value.srcObject = cameraStream.value;

		await videoRef.value.play();

		cameraWorking.value = true;
	} catch (e) {
		cameraWorking.value = false;

		cameraError.value =
			e instanceof Error ? e.message : "Kamera ochilmadi.";
	} finally {
		cameraLoading.value = false;
	}
}

function stopCamera() {
	if (cameraStream.value) {
		for (const track of cameraStream.value.getTracks()) {
			track.stop();
		}
	}

	cameraStream.value = null;

	cameraWorking.value = false;

	if (videoRef.value) {
		videoRef.value.srcObject = null;
	}
}

/* ----------------------------------
 * INIT
 * ---------------------------------- */

onMounted(async () => {
	await initTelegram();
});

onBeforeUnmount(() => {
	stopCamera();
});
</script>

<template>
	<div class="grid gap-5 p-5">
		<div>
			<h1 class="text-2xl font-semibold">Telegram Mini App test</h1>

			<p class="mt-1 text-sm text-muted-foreground">
				Telegram, location va kamera imkoniyatlarini tekshirish
			</p>
		</div>

		<!-- TELEGRAM -->

		<Card>
			<CardHeader>
				<CardTitle class="flex items-center gap-2">
					<SmartphoneIcon class="h-5 w-5" />

					Telegram
				</CardTitle>
			</CardHeader>

			<CardContent class="grid gap-4">
				<div
					v-if="telegramChecking"
					class="text-sm text-muted-foreground"
				>
					Tekshirilmoqda...
				</div>

				<template v-else>
					<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
						<div class="rounded-xl border p-4">
							<div class="text-xs text-muted-foreground">
								Telegram WebApp
							</div>

							<div class="mt-2">
								<Badge v-if="telegramInfo.available">
									<CheckCircle2Icon
										class="mr-1 h-3.5 w-3.5"
									/>

									Mavjud
								</Badge>

								<Badge v-else variant="destructive">
									<XCircleIcon class="mr-1 h-3.5 w-3.5" />

									Yo‘q
								</Badge>
							</div>
						</div>

						<div class="rounded-xl border p-4">
							<div class="text-xs text-muted-foreground">
								Platform
							</div>

							<div class="mt-2 font-medium">
								{{ telegramInfo.platform || "—" }}
							</div>
						</div>

						<div class="rounded-xl border p-4">
							<div class="text-xs text-muted-foreground">
								WebApp version
							</div>

							<div class="mt-2 font-medium">
								{{ telegramInfo.version || "—" }}
							</div>
						</div>

						<div class="rounded-xl border p-4">
							<div class="text-xs text-muted-foreground">
								Bot API 8.0+
							</div>

							<div class="mt-2">
								<Badge
									:variant="
										telegramInfo.version8
											? 'default'
											: 'destructive'
									"
								>
									{{ telegramInfo.version8 ? "Ha" : "Yo‘q" }}
								</Badge>
							</div>
						</div>
					</div>

					<div class="grid gap-3 sm:grid-cols-2">
						<div class="rounded-xl border p-4">
							<div class="text-xs text-muted-foreground">
								Telegram user
							</div>

							<div class="mt-2 font-medium">
								{{ telegramInfo.userName || "—" }}
							</div>

							<div class="mt-1 text-xs text-muted-foreground">
								ID:
								{{ telegramInfo.userId ?? "—" }}
							</div>
						</div>

						<div class="rounded-xl border p-4">
							<div class="text-xs text-muted-foreground">
								initData
							</div>

							<div class="mt-2">
								<Badge
									:variant="
										telegramInfo.initDataAvailable
											? 'default'
											: 'destructive'
									"
								>
									{{
										telegramInfo.initDataAvailable
											? "Mavjud"
											: "Yo‘q"
									}}
								</Badge>
							</div>
						</div>
					</div>

					<div
						v-if="telegramError"
						class="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
					>
						{{ telegramError }}
					</div>
				</template>
			</CardContent>
		</Card>

		<!-- LOCATION MANAGER -->

		<Card>
			<CardHeader>
				<CardTitle class="flex items-center gap-2">
					<LocateFixedIcon class="h-5 w-5" />

					Telegram LocationManager
				</CardTitle>
			</CardHeader>

			<CardContent class="grid gap-4">
				<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
					<div class="rounded-xl border p-3">
						<div class="text-xs text-muted-foreground">API</div>

						<div class="mt-1 font-medium">
							{{
								locationManagerInfo.available
									? "Mavjud"
									: "Yo‘q"
							}}
						</div>
					</div>

					<div class="rounded-xl border p-3">
						<div class="text-xs text-muted-foreground">
							Initialized
						</div>

						<div class="mt-1 font-medium">
							{{ locationManagerInfo.isInited ? "Ha" : "Yo‘q" }}
						</div>
					</div>

					<div class="rounded-xl border p-3">
						<div class="text-xs text-muted-foreground">
							Location available
						</div>

						<div class="mt-1 font-medium">
							{{
								locationManagerInfo.isLocationAvailable
									? "Ha"
									: "Yo‘q"
							}}
						</div>
					</div>

					<div class="rounded-xl border p-3">
						<div class="text-xs text-muted-foreground">
							Permission so‘ralgan
						</div>

						<div class="mt-1 font-medium">
							{{
								locationManagerInfo.isAccessRequested
									? "Ha"
									: "Yo‘q"
							}}
						</div>
					</div>

					<div class="rounded-xl border p-3">
						<div class="text-xs text-muted-foreground">
							Permission
						</div>

						<div class="mt-1 font-medium">
							{{
								locationManagerInfo.isAccessGranted
									? "Berilgan"
									: "Berilmagan"
							}}
						</div>
					</div>
				</div>

				<div class="flex flex-wrap gap-2">
					<Button
						:disabled="
							!locationManagerInfo.available ||
							telegramLocationLoading
						"
						@click="getTelegramLocation"
					>
						<RefreshCwIcon
							v-if="telegramLocationLoading"
							class="mr-2 h-4 w-4 animate-spin"
						/>

						<MapPinIcon v-else class="mr-2 h-4 w-4" />

						Telegram location olish
					</Button>

					<Button
						variant="outline"
						:disabled="!locationManagerInfo.available"
						@click="openTelegramLocationSettings"
					>
						<SettingsIcon class="mr-2 h-4 w-4" />

						Location settings
					</Button>
				</div>

				<div
					v-if="telegramLocation"
					class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
				>
					<div class="rounded-xl border p-4">
						<div class="text-xs text-muted-foreground">
							Latitude
						</div>

						<div class="mt-2 break-all font-mono text-sm">
							{{ telegramLocation.latitude }}
						</div>
					</div>

					<div class="rounded-xl border p-4">
						<div class="text-xs text-muted-foreground">
							Longitude
						</div>

						<div class="mt-2 break-all font-mono text-sm">
							{{ telegramLocation.longitude }}
						</div>
					</div>

					<div class="rounded-xl border p-4">
						<div class="text-xs text-muted-foreground">
							Horizontal accuracy
						</div>

						<div class="mt-2 text-lg font-semibold">
							<template
								v-if="
									telegramLocation.horizontal_accuracy !==
									null
								"
							>
								{{
									telegramLocation.horizontal_accuracy.toFixed(
										1,
									)
								}}
								m
							</template>

							<span v-else> — </span>
						</div>
					</div>

					<div class="rounded-xl border p-4">
						<div class="text-xs text-muted-foreground">
							Altitude
						</div>

						<div class="mt-2 font-medium">
							{{ telegramLocation.altitude ?? "—" }}
						</div>
					</div>
				</div>

				<div
					v-if="telegramLocationError"
					class="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
				>
					{{ telegramLocationError }}
				</div>
			</CardContent>
		</Card>

		<!-- BROWSER GEOLOCATION -->

		<Card>
			<CardHeader>
				<CardTitle> Browser Geolocation </CardTitle>
			</CardHeader>

			<CardContent class="grid gap-4">
				<Button
					variant="outline"
					class="w-fit"
					:disabled="browserLocationLoading"
					@click="getBrowserLocation"
				>
					<RefreshCwIcon
						v-if="browserLocationLoading"
						class="mr-2 h-4 w-4 animate-spin"
					/>

					<MapPinIcon v-else class="mr-2 h-4 w-4" />

					Browser location olish
				</Button>

				<div v-if="browserLocation" class="grid gap-3 sm:grid-cols-3">
					<div class="rounded-xl border p-4">
						<div class="text-xs text-muted-foreground">
							Latitude
						</div>

						<div class="mt-2 font-mono text-sm">
							{{ browserLocation.latitude }}
						</div>
					</div>

					<div class="rounded-xl border p-4">
						<div class="text-xs text-muted-foreground">
							Longitude
						</div>

						<div class="mt-2 font-mono text-sm">
							{{ browserLocation.longitude }}
						</div>
					</div>

					<div class="rounded-xl border p-4">
						<div class="text-xs text-muted-foreground">
							Accuracy
						</div>

						<div class="mt-2 text-lg font-semibold">
							{{ browserLocation.accuracy.toFixed(1) }}
							m
						</div>
					</div>
				</div>

				<div
					v-if="browserLocationError"
					class="text-sm text-destructive"
				>
					{{ browserLocationError }}
				</div>
			</CardContent>
		</Card>

		<!-- COMPARISON -->

		<Card v-if="locationDifference !== null">
			<CardContent class="py-5">
				<div class="flex items-start gap-3">
					<CircleAlertIcon class="mt-0.5 h-5 w-5" />

					<div>
						<div class="font-medium">
							Telegram va browser orasidagi farq
						</div>

						<div class="mt-1 text-2xl font-semibold">
							{{ locationDifference.toFixed(1) }}
							metr
						</div>
					</div>
				</div>
			</CardContent>
		</Card>

		<!-- CAMERA -->

		<Card>
			<CardHeader>
				<CardTitle class="flex items-center gap-2">
					<CameraIcon class="h-5 w-5" />

					Kamera testi
				</CardTitle>
			</CardHeader>

			<CardContent class="grid gap-4">
				<div class="flex gap-2">
					<Button :disabled="cameraLoading" @click="testCamera">
						<CameraIcon class="mr-2 h-4 w-4" />

						Kamerani ochish
					</Button>

					<Button
						v-if="cameraWorking"
						variant="outline"
						@click="stopCamera"
					>
						Yopish
					</Button>
				</div>

				<div
					v-if="cameraWorking"
					class="mx-auto aspect-[3/4] w-full max-w-sm overflow-hidden rounded-2xl bg-black"
				>
					<video
						ref="videoRef"
						autoplay
						playsinline
						muted
						class="h-full w-full scale-x-[-1] object-cover"
					/>
				</div>

				<div
					v-if="cameraWorking"
					class="flex items-center gap-2 text-sm"
				>
					<CheckCircle2Icon class="h-4 w-4" />

					Kamera Telegram WebView ichida ishladi.
				</div>

				<div
					v-if="cameraError"
					class="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
				>
					{{ cameraError }}
				</div>
			</CardContent>
		</Card>
	</div>
</template>
