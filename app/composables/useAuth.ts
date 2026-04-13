import type { IUser } from "~/types";

export default function useAuth() {
    const userCookie = useCookie<IUser | null>("user", {
        default: () => null
    });

    const user = computed(() => {
        return userCookie.value;
    });

    const setUser = (userData: IUser | null) => {
        userCookie.value = userData;
    };

    const logout = () => {
        userCookie.value = null;
        return navigateTo({ name: 'auth-login' });
    };

    return {
        user,
        logout,
        setUser,
    };
}