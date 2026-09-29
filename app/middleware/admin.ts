export default defineNuxtRouteMiddleware(() => {
	const a = useAuthStore();
	if (a.user && a.user.role !== "admin") return navigateTo(`/${a.user.role}`);
});
