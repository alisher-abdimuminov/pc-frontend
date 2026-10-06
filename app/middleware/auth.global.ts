import { homeFor, useAuthStore } from '~/stores/auth'

const PUBLIC = new Set(['/login'])

export default defineNuxtRouteMiddleware((to) => {
  const auth = useAuthStore()

  if (PUBLIC.has(to.path))
    return auth.isLoggedIn ? navigateTo(homeFor(auth.role)) : undefined

  if (!auth.isLoggedIn)
    return navigateTo('/login')

  if (to.path === '/')
    return navigateTo(homeFor(auth.role))

  // rol bo'yicha bo'limlar
  if (to.path.startsWith('/student') && !auth.isStudent)
    return navigateTo(homeFor(auth.role))
  if ((to.path.startsWith('/staff') || to.path.startsWith('/admin')) && !auth.isStaff)
    return navigateTo(homeFor(auth.role))

  // xodimlar bo'limi - permission bo'yicha (little faqat berilgan bo'limlarni ko'radi)
  const access = routeAccess(to.path)
  if (access && !(access === 'admin' ? auth.isAdmin : auth.can(access)))
    return navigateTo('/staff')
})
