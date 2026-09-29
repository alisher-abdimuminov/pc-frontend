export type TelegramColorScheme = "light" | "dark";

export type TelegramPlatform =
	| "android"
	| "android_x"
	| "ios"
	| "macos"
	| "tdesktop"
	| "weba"
	| "webk"
	| "web"
	| "unknown"
	| string;

export type TelegramHapticImpactStyle =
	"light" | "medium" | "heavy" | "rigid" | "soft";

export type TelegramHapticNotificationType = "error" | "success" | "warning";

/* ----------------------------------
 * USER
 * ---------------------------------- */

export interface TelegramWebAppUser {
	id: number;

	is_bot?: boolean;

	first_name: string;
	last_name?: string;
	username?: string;

	language_code?: string;

	is_premium?: boolean;

	added_to_attachment_menu?: boolean;

	allows_write_to_pm?: boolean;

	photo_url?: string;
}

/* ----------------------------------
 * CHAT
 * ---------------------------------- */

export type TelegramChatType = "group" | "supergroup" | "channel";

export interface TelegramWebAppChat {
	id: number;

	type: TelegramChatType;

	title: string;

	username?: string;

	photo_url?: string;
}

/* ----------------------------------
 * INIT DATA
 * ---------------------------------- */

export interface TelegramWebAppInitData {
	query_id?: string;

	user?: TelegramWebAppUser;

	receiver?: TelegramWebAppUser;

	chat?: TelegramWebAppChat;

	chat_type?: string;

	chat_instance?: string;

	start_param?: string;

	can_send_after?: number;

	auth_date?: number;

	hash?: string;

	signature?: string;

	chat_join_request_query_id?: string;
}

/* ----------------------------------
 * THEME
 * ---------------------------------- */

export interface TelegramThemeParams {
	bg_color?: string;

	text_color?: string;

	hint_color?: string;

	link_color?: string;

	button_color?: string;

	button_text_color?: string;

	secondary_bg_color?: string;

	header_bg_color?: string;

	accent_text_color?: string;

	section_bg_color?: string;

	section_header_text_color?: string;

	subtitle_text_color?: string;

	destructive_text_color?: string;

	bottom_bar_bg_color?: string;
}

/* ----------------------------------
 * SAFE AREA
 * ---------------------------------- */

export interface TelegramSafeAreaInset {
	top: number;
	bottom: number;
	left: number;
	right: number;
}

export interface TelegramContentSafeAreaInset {
	top: number;
	bottom: number;
	left: number;
	right: number;
}

/* ----------------------------------
 * LOCATION
 * ---------------------------------- */

export interface TelegramLocationData {
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

export interface TelegramLocationManager {
	isInited: boolean;

	isLocationAvailable: boolean;

	isAccessRequested: boolean;

	isAccessGranted: boolean;

	init(callback?: () => void): TelegramLocationManager;

	getLocation(
		callback: (location: TelegramLocationData | null) => void,
	): TelegramLocationManager;

	openSettings(): TelegramLocationManager;
}

/* ----------------------------------
 * LOCATION SAMPLING
 * ---------------------------------- */

export interface TelegramLocationSample extends TelegramLocationData {
	timestamp: number;
}

export type TelegramLocationQuality = "good" | "weak" | "unstable";

export type TelegramLocationIssue =
	| "accuracy_too_low"
	| "position_unstable"
	| "location_unavailable"
	| "permission_denied";

export interface TelegramLocationCollectOptions {
	/**
	 * Necha marta getLocation()
	 * chaqiriladi.
	 *
	 * Default: 5
	 */
	sampleCount?: number;

	/**
	 * Samplelar orasidagi vaqt.
	 *
	 * Default: 700ms
	 */
	intervalMs?: number;

	/**
	 * Bundan yuqori accuracy
	 * weak hisoblanadi.
	 *
	 * Default: 100m
	 */
	maxAccuracyMeters?: number;

	/**
	 * Spread uchun absolyut
	 * minimum limit.
	 *
	 * Default: 100m
	 */
	minAllowedSpreadMeters?: number;

	/**
	 * Accuracy * factor.
	 *
	 * Default: 3
	 */
	spreadAccuracyFactor?: number;
}

export interface TelegramLocationCollection {
	/**
	 * Backendga yuboriladigan
	 * representative nuqta.
	 */
	latitude: number;
	longitude: number;

	horizontal_accuracy: number | null;

	altitude: number | null;

	speed: number | null;

	course: number | null;

	/**
	 * Barcha olingan samplelar.
	 */
	samples: TelegramLocationSample[];

	/**
	 * Representative pointdan
	 * eng uzoq sample.
	 */
	spread_meters: number;

	/**
	 * Ketma-ket samplelar orasidagi
	 * eng katta sakrash.
	 */
	max_jump_meters: number;

	/**
	 * Accuracy qiymatlarining
	 * o'rtachasi.
	 */
	average_accuracy: number | null;

	quality: TelegramLocationQuality;

	suspicious: boolean;

	issues: TelegramLocationIssue[];

	duration_ms: number;
}

/* ----------------------------------
 * HAPTIC
 * ---------------------------------- */

export interface TelegramHapticFeedback {
	impactOccurred(style: TelegramHapticImpactStyle): TelegramHapticFeedback;

	notificationOccurred(
		type: TelegramHapticNotificationType,
	): TelegramHapticFeedback;

	selectionChanged(): TelegramHapticFeedback;
}

/* ----------------------------------
 * BACK BUTTON
 * ---------------------------------- */

export interface TelegramBackButton {
	isVisible: boolean;

	onClick(callback: () => void): TelegramBackButton;

	offClick(callback: () => void): TelegramBackButton;

	show(): TelegramBackButton;

	hide(): TelegramBackButton;
}

/* ----------------------------------
 * BOTTOM BUTTON
 * ---------------------------------- */

export interface TelegramBottomButtonParams {
	text?: string;

	color?: string;

	text_color?: string;

	is_active?: boolean;

	is_visible?: boolean;

	has_shine_effect?: boolean;

	position?: "left" | "right" | "top" | "bottom";
}

export interface TelegramBottomButton {
	text: string;

	color: string;

	textColor: string;

	isVisible: boolean;

	isActive: boolean;

	isProgressVisible: boolean;

	setText(text: string): TelegramBottomButton;

	onClick(callback: () => void): TelegramBottomButton;

	offClick(callback: () => void): TelegramBottomButton;

	show(): TelegramBottomButton;

	hide(): TelegramBottomButton;

	enable(): TelegramBottomButton;

	disable(): TelegramBottomButton;

	showProgress(leaveActive?: boolean): TelegramBottomButton;

	hideProgress(): TelegramBottomButton;

	setParams(params: TelegramBottomButtonParams): TelegramBottomButton;
}

/* ----------------------------------
 * EVENT
 * ---------------------------------- */

export type TelegramWebAppEvent =
	| "themeChanged"
	| "viewportChanged"
	| "safeAreaChanged"
	| "contentSafeAreaChanged"
	| "backButtonClicked"
	| "mainButtonClicked"
	| "secondaryButtonClicked"
	| "settingsButtonClicked"
	| "locationManagerUpdated"
	| "locationRequested"
	| "activated"
	| "deactivated";

export type TelegramEventHandler = (data?: unknown) => void;

/* ----------------------------------
 * WEB APP
 * ---------------------------------- */

export interface TelegramWebApp {
	initData: string;

	initDataUnsafe: TelegramWebAppInitData;

	version: string;

	platform: TelegramPlatform;

	colorScheme: TelegramColorScheme;

	themeParams: TelegramThemeParams;

	isActive?: boolean;

	isExpanded: boolean;

	viewportHeight: number;

	viewportStableHeight: number;

	safeAreaInset?: TelegramSafeAreaInset;

	contentSafeAreaInset?: TelegramContentSafeAreaInset;

	LocationManager?: TelegramLocationManager;

	HapticFeedback: TelegramHapticFeedback;

	BackButton: TelegramBackButton;

	MainButton: TelegramBottomButton;

	SecondaryButton?: TelegramBottomButton;

	ready(): void;

	expand(): void;

	close(): void;

	isVersionAtLeast(version: string): boolean;

	setHeaderColor(color: string): void;

	setBackgroundColor(color: string): void;

	onEvent(
		eventType: TelegramWebAppEvent,
		handler: TelegramEventHandler,
	): void;

	offEvent(
		eventType: TelegramWebAppEvent,
		handler: TelegramEventHandler,
	): void;
}

/* ----------------------------------
 * WINDOW TELEGRAM
 * ---------------------------------- */

export interface TelegramGlobal {
	WebApp: TelegramWebApp;
}
