export default function useTheme() {
    const themeCookie = useCookie<"dark" | "light">("theme", {
        sameSite: "lax",
        default: () => "dark"
    });

    const theme = computed({
        get() {
            return themeCookie.value;
        },
        set(value) {
            themeCookie.value = value;
            if (import.meta.client) {
                document.documentElement.classList = value;
            }
        }
    });

    watch(theme, () => {
        theme.value = theme.value;
    });

    return {
        theme,
    };
}