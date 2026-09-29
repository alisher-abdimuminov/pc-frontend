import type {
	TelegramBackButton,
	TelegramBottomButton,
	TelegramColorScheme,
	TelegramHapticImpactStyle,
	TelegramHapticNotificationType,
	TelegramLocationCollectOptions,
	TelegramLocationCollection,
	TelegramLocationData,
	TelegramLocationIssue,
	TelegramLocationManager,
	TelegramLocationQuality,
	TelegramLocationSample,
	TelegramPlatform,
	TelegramThemeParams,
	TelegramWebApp,
	TelegramWebAppInitData,
	TelegramWebAppUser,
} from "@/types/telegram";

function sleep(ms: number) {
	return new Promise<void>((resolve) => {
		window.setTimeout(resolve, ms);
	});
}

function toRadians(value: number) {
	return (value * Math.PI) / 180;
}

function distanceMeters(
	a: {
		latitude: number;
		longitude: number;
	},
	b: {
		latitude: number;
		longitude: number;
	},
) {
	const earthRadius = 6371000;

	const lat1 = toRadians(a.latitude);

	const lat2 = toRadians(b.latitude);

	const deltaLat = toRadians(b.latitude - a.latitude);

	const deltaLng = toRadians(b.longitude - a.longitude);

	const value =
		Math.sin(deltaLat / 2) ** 2 +
		Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;

	return 2 * earthRadius * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

/**
 * Bir nechta nuqta ichidan
 * eng markaziy real sample'ni
 * tanlaymiz.
 *
 * Average lat/lng yasamaymiz,
 * mavjud samplelardan bittasini
 * olamiz.
 */
function findMedoid(samples: TelegramLocationSample[]) {
	if (samples.length === 1) {
		return samples[0];
	}

	let best = samples[0];

	let bestScore = Number.POSITIVE_INFINITY;

	for (const candidate of samples) {
		let score = 0;

		for (const sample of samples) {
			score += distanceMeters(candidate, sample);
		}

		if (score < bestScore) {
			bestScore = score;

			best = candidate;
		}
	}

	return best;
}

export function useTelegramWebApp() {
	/* ----------------------------------
	 * TELEGRAM
	 * ---------------------------------- */

	const webApp = shallowRef<TelegramWebApp | null>(null);

	const initialized = ref(false);

	const initializing = ref(false);

	const available = ref(false);

	const error = ref("");

	/* ----------------------------------
	 * PLATFORM
	 * ---------------------------------- */

	const version = ref("");

	const platform = ref<TelegramPlatform>("unknown");

	const colorScheme = ref<TelegramColorScheme>("light");

	const themeParams = ref<TelegramThemeParams>({});

	/* ----------------------------------
	 * INIT DATA
	 * ---------------------------------- */

	const initData = ref("");

	const initDataUnsafe = ref<TelegramWebAppInitData>({});

	const telegramUser = ref<TelegramWebAppUser | null>(null);

	/* ----------------------------------
	 * LOCATION STATE
	 * ---------------------------------- */

	const locationManager = shallowRef<TelegramLocationManager | null>(null);

	const locationManagerReady = ref(false);

	const locationAvailable = ref(false);

	const locationAccessRequested = ref(false);

	const locationAccessGranted = ref(false);

	const locationCollecting = ref(false);

	const locationProgress = ref(0);

	const locationMessage = ref("");

	const lastLocation = ref<TelegramLocationCollection | null>(null);

	/* ----------------------------------
	 * DERIVED
	 * ---------------------------------- */

	const isTelegram = computed(() => available.value && !!webApp.value);

	const isMobile = computed(() => {
		return ["android", "android_x", "ios"].includes(platform.value);
	});

	const isIOS = computed(() => platform.value === "ios");

	const isAndroid = computed(
		() => platform.value === "android" || platform.value === "android_x",
	);

	const mainButton = computed<TelegramBottomButton | null>(
		() => webApp.value?.MainButton ?? null,
	);

	const backButton = computed<TelegramBackButton | null>(
		() => webApp.value?.BackButton ?? null,
	);

	/* ----------------------------------
	 * WAIT TELEGRAM
	 * ---------------------------------- */

	async function waitForTelegram(timeoutMs = 5000) {
		if (!import.meta.client) {
			return null;
		}

		const startedAt = Date.now();

		while (Date.now() - startedAt < timeoutMs) {
			const tg = window.Telegram?.WebApp;

			if (tg) {
				return tg;
			}

			await sleep(100);
		}

		return null;
	}

	/* ----------------------------------
	 * SYNC WEBAPP STATE
	 * ---------------------------------- */

	function syncWebAppState() {
		const tg = webApp.value;

		if (!tg) {
			return;
		}

		version.value = tg.version || "";

		platform.value = tg.platform || "unknown";

		colorScheme.value = tg.colorScheme || "light";

		themeParams.value = tg.themeParams || {};

		initData.value = tg.initData || "";

		initDataUnsafe.value = tg.initDataUnsafe || {};

		telegramUser.value = tg.initDataUnsafe?.user ?? null;
	}

	/* ----------------------------------
	 * INIT
	 * ---------------------------------- */

	async function init() {
		if (initialized.value && webApp.value) {
			return webApp.value;
		}

		if (initializing.value) {
			while (initializing.value) {
				await sleep(50);
			}

			return webApp.value;
		}

		initializing.value = true;

		error.value = "";

		try {
			const tg = await waitForTelegram();

			if (!tg) {
				available.value = false;

				throw new Error("Telegram WebApp mavjud emas.");
			}

			webApp.value = tg;

			available.value = true;

			tg.ready();

			tg.expand();

			syncWebAppState();

			initialized.value = true;

			/*
			 * Theme o'zgarsa reactive
			 * state ham yangilanadi.
			 */

			tg.onEvent("themeChanged", syncWebAppState);

			return tg;
		} catch (e) {
			error.value =
				e instanceof Error
					? e.message
					: "Telegram WebApp " + "initialization xatosi.";

			throw e;
		} finally {
			initializing.value = false;
		}
	}

	/* ----------------------------------
	 * VERSION
	 * ---------------------------------- */

	function isVersionAtLeast(requiredVersion: string) {
		return webApp.value?.isVersionAtLeast(requiredVersion) ?? false;
	}

	/* ----------------------------------
	 * LOCATION MANAGER SYNC
	 * ---------------------------------- */

	function syncLocationManager() {
		const manager = locationManager.value;

		if (!manager) {
			locationManagerReady.value = false;

			locationAvailable.value = false;

			locationAccessRequested.value = false;

			locationAccessGranted.value = false;

			return;
		}

		locationManagerReady.value = manager.isInited;

		locationAvailable.value = manager.isLocationAvailable;

		locationAccessRequested.value = manager.isAccessRequested;

		locationAccessGranted.value = manager.isAccessGranted;
	}

	/* ----------------------------------
	 * LOCATION MANAGER INIT
	 * ---------------------------------- */

	async function initLocationManager(): Promise<TelegramLocationManager> {
		if (!webApp.value) {
			await init();
		}

		const manager = webApp.value?.LocationManager;

		if (!manager) {
			throw new Error("Telegram LocationManager " + "mavjud emas.");
		}

		locationManager.value = manager;

		if (manager.isInited) {
			syncLocationManager();

			return manager;
		}

		await new Promise<void>((resolve) => {
			manager.init(() => {
				resolve();
			});
		});

		syncLocationManager();

		return manager;
	}

	/* ----------------------------------
	 * ONE LOCATION
	 * ---------------------------------- */

	async function getLocation(): Promise<TelegramLocationData> {
		const manager = await initLocationManager();

		if (!manager.isLocationAvailable) {
			throw new Error("Qurilmada location " + "xizmati mavjud emas.");
		}

		const location = await new Promise<TelegramLocationData | null>(
			(resolve) => {
				manager.getLocation((result) => {
					resolve(result);
				});
			},
		);

		syncLocationManager();

		if (!location) {
			throw new Error("Joylashuvga ruxsat " + "berilmagan.");
		}

		return location;
	}

	/* ----------------------------------
	 * MULTIPLE LOCATION SAMPLES
	 * ---------------------------------- */

	async function collectLocation(
		options: TelegramLocationCollectOptions = {},
	): Promise<TelegramLocationCollection> {
		if (locationCollecting.value) {
			throw new Error(
				"Joylashuv tekshiruvi " + "allaqachon davom etmoqda.",
			);
		}

		const sampleCount = Math.max(2, options.sampleCount ?? 5);

		const intervalMs = Math.max(200, options.intervalMs ?? 700);

		const maxAccuracyMeters = options.maxAccuracyMeters ?? 100;

		const minAllowedSpreadMeters = options.minAllowedSpreadMeters ?? 100;

		const spreadAccuracyFactor = options.spreadAccuracyFactor ?? 3;

		locationCollecting.value = true;

		locationProgress.value = 0;

		locationMessage.value = "Joylashuv aniqlanmoqda...";

		const startedAt = Date.now();

		try {
			const samples: TelegramLocationSample[] = [];

			for (let index = 0; index < sampleCount; index++) {
				const location = await getLocation();

				samples.push({
					...location,

					timestamp: Date.now(),
				});

				locationProgress.value = Math.round(
					((index + 1) / sampleCount) * 100,
				);

				locationMessage.value = "Joylashuv " + "tekshirilmoqda...";

				if (index < sampleCount - 1) {
					await sleep(intervalMs);
				}
			}

			/*
			 * Average coordinate emas.
			 *
			 * Samplelar orasidagi
			 * eng markaziy real
			 * pointni olamiz.
			 */
			const representative = findMedoid(samples);

			/* --------------------------
			 * ACCURACY
			 * -------------------------- */

			const accuracies = samples
				.map((sample) => sample.horizontal_accuracy)
				.filter(
					(value): value is number =>
						typeof value === "number" && Number.isFinite(value),
				);

			const averageAccuracy = accuracies.length
				? accuracies.reduce((sum, value) => sum + value, 0) /
					accuracies.length
				: null;

			/* --------------------------
			 * SPREAD
			 * -------------------------- */

			let spreadMeters = 0;

			for (const sample of samples) {
				const distance = distanceMeters(representative, sample);

				spreadMeters = Math.max(spreadMeters, distance);
			}

			/* --------------------------
			 * MAX JUMP
			 * -------------------------- */

			let maxJumpMeters = 0;

			for (let index = 1; index < samples.length; index++) {
				const distance = distanceMeters(
					samples[index - 1],
					samples[index],
				);

				maxJumpMeters = Math.max(maxJumpMeters, distance);
			}

			/* --------------------------
			 * QUALITY
			 * -------------------------- */

			const issues: TelegramLocationIssue[] = [];

			const accuracy = representative.horizontal_accuracy;

			if (accuracy !== null && accuracy > maxAccuracyMeters) {
				issues.push("accuracy_too_low");
			}

			/*
			 * GPS reported accuracy
			 * qanchalik katta bo'lsa,
			 * tabiiy spreadga ko'proq
			 * ruxsat beramiz.
			 */
			const allowedSpread = Math.max(
				minAllowedSpreadMeters,

				(accuracy ?? maxAccuracyMeters) * spreadAccuracyFactor,
			);

			if (spreadMeters > allowedSpread) {
				issues.push("position_unstable");
			}

			let quality: TelegramLocationQuality = "good";

			if (issues.includes("position_unstable")) {
				quality = "unstable";
			} else if (issues.length) {
				quality = "weak";
			}

			const result: TelegramLocationCollection = {
				latitude: representative.latitude,

				longitude: representative.longitude,

				horizontal_accuracy: representative.horizontal_accuracy,

				altitude: representative.altitude,

				speed: representative.speed,

				course: representative.course,

				samples,

				spread_meters: spreadMeters,

				max_jump_meters: maxJumpMeters,

				average_accuracy: averageAccuracy,

				quality,

				suspicious: issues.length > 0,

				issues,

				duration_ms: Date.now() - startedAt,
			};

			lastLocation.value = result;

			if (quality === "good") {
				locationMessage.value = "Joylashuv " + "tasdiqlandi.";
			} else if (quality === "unstable") {
				locationMessage.value = "Joylashuv " + "barqaror emas.";
			} else {
				locationMessage.value = "Joylashuv aniqligi " + "yetarli emas.";
			}

			return result;
		} finally {
			locationCollecting.value = false;
		}
	}

	/* ----------------------------------
	 * LOCATION SETTINGS
	 * ---------------------------------- */

	function openLocationSettings() {
		const manager = locationManager.value ?? webApp.value?.LocationManager;

		if (!manager) {
			return;
		}

		/*
		 * Telegram bo'yicha bu
		 * user click kabi interaction
		 * ichidan chaqirilishi kerak.
		 */
		manager.openSettings();
	}

	/* ----------------------------------
	 * HAPTIC
	 * ---------------------------------- */

	function haptic(style: TelegramHapticImpactStyle = "light") {
		webApp.value?.HapticFeedback?.impactOccurred(style);
	}

	function successHaptic() {
		webApp.value?.HapticFeedback?.notificationOccurred("success");
	}

	function errorHaptic() {
		webApp.value?.HapticFeedback?.notificationOccurred("error");
	}

	function warningHaptic() {
		webApp.value?.HapticFeedback?.notificationOccurred("warning");
	}

	function notificationHaptic(type: TelegramHapticNotificationType) {
		webApp.value?.HapticFeedback?.notificationOccurred(type);
	}

	function selectionHaptic() {
		webApp.value?.HapticFeedback?.selectionChanged();
	}

	/* ----------------------------------
	 * BACK BUTTON
	 * ---------------------------------- */

	function showBackButton(handler: () => void) {
		const button = webApp.value?.BackButton;

		if (!button) {
			return;
		}

		button.offClick(handler);

		button.onClick(handler);

		button.show();
	}

	function hideBackButton(handler?: () => void) {
		const button = webApp.value?.BackButton;

		if (!button) {
			return;
		}

		if (handler) {
			button.offClick(handler);
		}

		button.hide();
	}

	/* ----------------------------------
	 * MAIN BUTTON
	 * ---------------------------------- */

	function showMainButton(text: string, handler: () => void) {
		const button = webApp.value?.MainButton;

		if (!button) {
			return;
		}

		button.setText(text);

		button.offClick(handler);

		button.onClick(handler);

		button.enable();

		button.show();
	}

	function hideMainButton(handler?: () => void) {
		const button = webApp.value?.MainButton;

		if (!button) {
			return;
		}

		if (handler) {
			button.offClick(handler);
		}

		button.hide();

		button.hideProgress();
	}

	function mainButtonLoading(value: boolean) {
		const button = webApp.value?.MainButton;

		if (!button) {
			return;
		}

		if (value) {
			button.disable();

			button.showProgress(true);

			return;
		}

		button.hideProgress();

		button.enable();
	}

	/* ----------------------------------
	 * COLORS
	 * ---------------------------------- */

	function setHeaderColor(color: string) {
		webApp.value?.setHeaderColor(color);
	}

	function setBackgroundColor(color: string) {
		webApp.value?.setBackgroundColor(color);
	}

	/* ----------------------------------
	 * APP
	 * ---------------------------------- */

	function expand() {
		webApp.value?.expand();
	}

	function close() {
		webApp.value?.close();
	}

	/* ----------------------------------
	 * CLEANUP
	 * ---------------------------------- */

	function cleanup() {
		const tg = webApp.value;

		if (!tg) {
			return;
		}

		tg.offEvent("themeChanged", syncWebAppState);
	}

	return {
		/* Telegram */

		webApp,

		available,
		isTelegram,

		initialized,
		initializing,

		error,

		init,
		cleanup,

		/* Platform */

		version,
		platform,

		isMobile,
		isIOS,
		isAndroid,

		isVersionAtLeast,

		/* User / auth */

		initData,
		initDataUnsafe,

		telegramUser,

		/* Theme */

		colorScheme,
		themeParams,

		setHeaderColor,
		setBackgroundColor,

		/* Location */

		locationManager,

		locationManagerReady,
		locationAvailable,

		locationAccessRequested,
		locationAccessGranted,

		locationCollecting,
		locationProgress,
		locationMessage,

		lastLocation,

		initLocationManager,

		getLocation,
		collectLocation,

		openLocationSettings,

		/* Haptic */

		haptic,

		successHaptic,
		errorHaptic,
		warningHaptic,

		notificationHaptic,
		selectionHaptic,

		/* Buttons */

		mainButton,
		backButton,

		showBackButton,
		hideBackButton,

		showMainButton,
		hideMainButton,

		mainButtonLoading,

		/* App */

		expand,
		close,
	};
}
