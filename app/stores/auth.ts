import { defineStore } from 'pinia'
import type { LoginResponse, Permission, Role, User } from '~/types'

const STORAGE_KEY = 'pc-auth'

interface Stored {
  access: string | null
  refresh: string | null
  user: User | null
}

function load(): Stored {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw)
      return JSON.parse(raw)
  }
  catch {}
  return { access: null, refresh: null, user: null }
}

export const useAuthStore = defineStore('auth', {
  state: (): Stored => load(),
  getters: {
    isLoggedIn: s => !!s.access && !!s.user,
    role: (s): Role | null => s.user?.role ?? null,
    isStudent: s => s.user?.role === 'student',
    isTeacher: s => s.user?.role === 'teacher',
    isAdmin: s => s.user?.role === 'admin',
    isStaff: s => !!s.user && s.user.role !== 'student',
    /** backend bilan bir xil qoida: admin - hammasi, qolganlar - me.permissions ro'yxati */
    can: s => (perm: Permission) => s.user?.role === 'admin' || !!s.user?.permissions?.includes(perm),
  },
  actions: {
    persist() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ access: this.access, refresh: this.refresh, user: this.user }))
      }
      catch {}
    },
    setSession(data: LoginResponse) {
      this.access = data.access
      this.refresh = data.refresh
      this.user = data.user
      this.persist()
    },
    setAccess(access: string) {
      this.access = access
      this.persist()
    },
    setUser(user: User) {
      this.user = user
      this.persist()
    },
    logout() {
      // serverda LOGOUT audit yozuvi (javobni kutmaymiz)
      if (this.access) {
        const base = useRuntimeConfig().public.apiBase as string
        fetch(`${base}/api/auth/logout/`, { method: 'POST', headers: { Authorization: `Bearer ${this.access}` }, keepalive: true }).catch(() => {})
      }
      this.access = null
      this.refresh = null
      this.user = null
      try {
        localStorage.removeItem(STORAGE_KEY)
      }
      catch {}
    },
  },
})

export function homeFor(role: Role | null): string {
  if (!role)
    return '/login'
  if (role === 'student')
    return '/student'
  return '/staff'
}
