import type { TelegramGlobal } from "./telegram";

declare global {
	interface Window {
		Telegram?: TelegramGlobal;
	}
}

export {};
