module.exports = {
  apps: [
    {
      name: "pc",
      port: "3004",
      exec_mode: "fork",
      script: "bun run .output/server/index.mjs",
      env: {
        NUXT_PUBLIC_API_BASE: "https://api.pc.samdpi.uz/",
        NUXT_PUBLIC_HEMIS_TEACHER_URL:
          "https://hemis.samdpi.uz/oauth/authorize",
        NUXT_PUBLIC_HEMIS_STUDENT_URL:
          "https://student.samdpi.uz/oauth/authorize",
        NUXT_PUBLIC_HEMIS_CLIENT_ID: "9",
        NUXT_PUBLIC_HEMIS_REDIRECT_CALLBACK:
          "https://practicum.samdpi.uz/auth/callback/",
      },
    },
  ],
};
