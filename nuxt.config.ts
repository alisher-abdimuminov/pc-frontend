import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import tailwindcss from '@tailwindcss/vite';


const isDev = process.env.NODE_ENV !== 'production';
const customEnvFile = `.env.${isDev ? 'dev' : 'production'}`;

if (fs.existsSync(customEnvFile)) {
	console.log(`Overriding environment variables with: ${customEnvFile}`);
	dotenv.config({ path: customEnvFile, override: true });
}


export default defineNuxtConfig({
	compatibilityDate: '2025-07-15',
	devtools: { enabled: false },
	css: ["~/assets/css/tailwind.css"],

	vite: {
		plugins: [tailwindcss()],
	},

	modules: ['shadcn-nuxt'],

	shadcn: {
		prefix: "",
		componentDir: "@/components/ui",
	},

	runtimeConfig: {
		public: {
			api: process.env.API,
			base: process.env.BASE,
			hemisTeacherURL: process.env.HEMIS_TEACHER_URL,
			hemisStudentURL: process.env.HEMIS_STUDENT_URL,
			hemisClientID: process.env.HEMIS_CLIENT_ID,
			hemisClientSecret: process.env.HEMIS_CLIENT_SECRET,
			hemisRedirectUri: process.env.HEMIS_REDIRECT_URI,
		}
	}
});