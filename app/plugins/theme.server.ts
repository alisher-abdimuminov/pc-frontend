export default defineNuxtPlugin((nuxtApp) => {
    const { theme } = useTheme();
    useHead({
        htmlAttrs: {
            class: theme.value,
        }
    });
});