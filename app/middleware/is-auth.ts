export default defineNuxtRouteMiddleware((from, to) => {
    const { user } = useAuth();

    if (!user.value) {
        return navigateTo({ name: "auth-login", query: { next: to.path } });
    }
});