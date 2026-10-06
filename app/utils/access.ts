import type { Permission } from '~/types'

/**
 * Xodimlar bo'limidagi sahifalar va ularni ochadigan permission.
 * 'admin' - faqat admin roli. Ro'yxatda yo'q /staff sahifasi (bosh sahifa) - barcha xodimlar uchun.
 */
export const STAFF_ROUTES: { prefix: string, access: Permission | 'admin' }[] = [
  { prefix: '/staff/groups', access: 'users.view_group' },
  { prefix: '/staff/students', access: 'attendance.view_attendance' },
  { prefix: '/staff/attempts', access: 'attendance.view_attendanceattempt' },
  { prefix: '/staff/assignments', access: 'assignments.view_assignment' },
  { prefix: '/staff/schedules', access: 'attendance.view_schedule' },
  { prefix: '/staff/audit', access: 'users.view_auditlog' },
  { prefix: '/admin/locations', access: 'attendance.view_location' },
  { prefix: '/admin/staff', access: 'admin' },
]

export function routeAccess(path: string) {
  return STAFF_ROUTES.find(r => path === r.prefix || path.startsWith(`${r.prefix}/`))?.access
}
