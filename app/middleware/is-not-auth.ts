export default defineNuxtRouteMiddleware((to, from) => {
    const { user } = useAuth();

    if (user.value) {
        if (to.query.next) {
            return navigateTo(to.query.next.toString());
        } else {
            return navigateTo({ name: "index" });
        }
    }
});