import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
	compatibilityDate: "2025-07-15",
	telemetry: false,
	devtools: { enabled: true },
	css: ["~/assets/css/tailwind.css"],

	devServer: {
		host: "127.0.0.1",
		port: 3000,
	},

	vite: {
		plugins: [tailwindcss()],
	},

	modules: ["shadcn-nuxt", "@pinia/nuxt"],

	shadcn: {
		prefix: "",
		componentDir: "~/components/ui",
	},

	app: {
		head: {
			script: [
				{
					src: "https://telegram.org/js/telegram-web-app.js?62",
				},
			],
		},
	},

	router: {
		options: {
			// Use history mode so Telegram's #tgWebAppData is preserved as a URL hash
			hashMode: false,
		},
	},

	runtimeConfig: {
		public: {
			// apiBase: "https://api.practicum.samdpi.uz/api",
			apiBase: "http://127.0.0.1:8000/api",
			hemisTeacherURL: "https://hemis.uzfi.uz/oauth/authorize",
			hemisStudentURL: "https://student.uzfi.uz/oauth/authorize",
			hemisClientID: "9",
			// hemisRedirectUri: "https://practicum.samdpi.uz/auth/callback/",
			hemisRedirectUri: "http://127.0.0.1:3000/auth/callback/",
		},
	},
});
