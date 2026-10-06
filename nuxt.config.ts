import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2026-10-01',
  ssr: false,
  devtools: { enabled: false },
  modules: ['shadcn-nuxt', '@pinia/nuxt'],
  css: ['~/assets/css/main.css'],
  vite: {
    plugins: [tailwindcss()],
  },
  shadcn: {
    prefix: '',
    componentDir: './app/components/ui',
  },
  runtimeConfig: {
    public: {
      apiBase: 'http://127.0.0.1:8000',
    },
  },
  app: {
    head: {
      title: 'PC - Amaliyot nazorati',
      htmlAttrs: { lang: 'uz' },
      meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' }],
      script: [{ src: 'https://telegram.org/js/telegram-web-app.js' }],
    },
  },
})
