export type Role = 'admin' | 'little' | 'dean' | 'teacher' | 'student'

export interface Ref {
  uuid: string
  name: string
}

export type Permission =
  | 'users.view_group'
  | 'users.change_group'
  | 'attendance.view_attendance'
  | 'attendance.view_attendanceattempt'
  | 'users.view_user'
  | 'users.change_user'
  | 'attendance.view_schedule'
  | 'attendance.add_schedule'
  | 'attendance.change_schedule'
  | 'attendance.delete_schedule'
  | 'attendance.view_location'
  | 'attendance.add_location'
  | 'attendance.change_location'
  | 'attendance.delete_location'
  | 'assignments.view_assignment'
  | 'users.view_auditlog'

export interface User {
  uuid: string
  username: string
  role: Role
  full_name: string | null
  short_name: string | null
  first_name: string | null
  second_name: string | null
  third_name: string | null
  image: string | null
  phone: string | null
  gender: string | null
  group: Ref | null
  faculty: Ref | null
  level: string
  semester: string
  permissions: Permission[]
}

export interface LoginResponse {
  access: string
  refresh: string
  user: User
}

export interface Paginated<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface Location {
  uuid: string
  name: string
  point_1: string
  point_2: string
  point_3: string
  point_4: string
  location: string | null
  polygon: [number, number][]
  is_active: boolean
  created_at: string
}

export type Weekday = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday'

export interface Schedule {
  uuid: string
  name: string
  start_date: string
  end_date: string
  group: Ref | null
  user: { uuid: string, full_name: string | null } | null
  location: Pick<Location, 'uuid' | 'name' | 'location' | 'polygon'>
  monday: boolean
  tuesday: boolean
  wednesday: boolean
  thursday: boolean
  friday: boolean
  saturday: boolean
  weekdays: number[]
  is_active: boolean
  created_at: string
}

export type StepStatus = 'passed' | 'available' | 'missed' | 'upcoming'

export interface StepState {
  step: number
  start: string
  end: string
  status: StepStatus
}

export interface DayState {
  date: string
  now: string
  schedule: Schedule | null
  shift: number | null
  shift_locked: boolean
  current_step: number | null
  can_attempt: boolean
  message: string
  steps: StepState[]
}

export interface Attempt {
  uuid: string
  step: number
  image: string
  latitude: string | null
  longitude: string | null
  face_verified: boolean
  location_verified: boolean
  liveness_verified: boolean
  success: boolean
  error_code: string
  error_message: string
  face_distance: number | null
  face_threshold: number | null
  ip_address: string | null
  attempted_at: string
}

export interface Attendance {
  uuid: string
  date: string
  shift: number
  location: string | null
  passed_steps: number[]
  created_at: string
}

export interface AttendanceDetail extends Attendance {
  steps: { uuid: string, step: number, success: boolean, attempts?: Attempt[] }[]
}

export interface CheckInResponse {
  attempt: Attempt
  state: DayState
}

export interface GroupItem {
  uuid: string
  name: string
  faculty: string | null
  teacher: string | null
  teacher_uuid: string | null
  students_count: number
  schedules: Schedule[]
}

export interface GroupStudentRow {
  uuid: string
  full_name: string
  username: string
  image: string | null
  is_active: boolean
  attendance_uuid: string | null
  shift: number | null
  passed_steps: number[]
  /** har qadam holati; amaliyot kuni bo'lmasa null */
  steps: StepStatus[] | null
}

export interface GroupDay {
  group: Ref & { teacher: { uuid: string, full_name: string } | null }
  date: string
  is_practice_day: boolean
  students: GroupStudentRow[]
}

export interface GroupReport {
  group: Ref
  from: string
  to: string
  days: string[]
  students: { uuid: string, full_name: string, days: Record<string, { shift: number, passed: number }> }[]
}

export interface StudentAttendances {
  student: { uuid: string, full_name: string, username: string, group: string | null, image: string | null, is_active: boolean }
  /** false bo'lsa steps ichida attempts yo'q - faqat "keldi/kelmadi" */
  can_view_attempts: boolean
  attendances: AttendanceDetail[]
}

export interface StudentShort {
  uuid: string
  username: string
  full_name: string | null
  group: string | null
}

export interface Submission {
  uuid: string
  student: { uuid: string, full_name: string, group: string | null }
  file: string
  submitted_at: string
  grade: number | null
  feedback: string
  graded_at: string | null
  graded_by: string | null
}

export interface Assignment {
  uuid: string
  teacher: string
  title: string
  description: string
  file: string | null
  deadline: string
  groups: Ref[]
  is_expired: boolean
  submissions_count: number | null
  my_submission: Submission | null
  created_at: string
  updated_at: string
}

export interface SubmissionRow {
  student: { uuid: string, full_name: string, group: string | null }
  submission: Submission | null
}

export interface LocationCheckResult {
  ok: boolean
  error_code: string
  message: string
  distance: number
  location: Ref
  token: string | null
  expires_in: number | null
}

export interface AttemptListItem extends Attempt {
  student: { uuid: string, full_name: string, username: string, image: string | null, is_active: boolean }
  group: string | null
  location_name: string | null
  shift: number
  date: string
}

export interface DashboardDay {
  date: string
  expected: number
  came: number
  full: number
}

export interface Dashboard {
  date: string
  totals: { students: number, groups: number, locations: number, schedules: number }
  today: { expected: number, came: number, full: number }
  /** faqat urinishlarni ko'rish ruxsati bo'lsa (admin / little) */
  attempts_today: {
    total: number
    success: number
    failed: number
    by_error: { code: string, label: string, count: number }[]
  } | null
  /** topshiriqlar (o'qituvchi - o'zi yaratganlari) */
  assignments: { active: number, submitted: number, ungraded: number } | null
  trend: DashboardDay[]
  groups: { uuid: string, name: string, expected: number, came: number, full: number }[]
  recent_failures: AttemptListItem[]
}

export interface Teacher {
  uuid: string
  username: string
  full_name: string
  groups_count: number
}

export interface StatusHistoryItem {
  is_active: boolean
  reason: string
  by: string | null
  at: string
}

export interface PermissionDef {
  code: Permission
  section: string
  label: string
}

export interface StaffUser {
  uuid: string
  username: string
  full_name: string
  is_active: boolean
  permissions: Permission[]
  last_login: string | null
  created_at: string
}

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT'

export interface AuditLogItem {
  uuid: string
  created_at: string
  action: AuditAction
  action_display: string
  user: { uuid: string, full_name: string, username: string, role: Role } | null
  model: { value: string, label: string } | null
  object_id: string | null
  object_repr: string
  changes: Record<string, any>
  ip_address: string | null
  user_agent: string
  path: string
  method: string
}
