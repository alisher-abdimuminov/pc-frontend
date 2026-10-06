export const WEEKDAYS = [
  { key: 'monday', label: 'Dushanba', short: 'Du' },
  { key: 'tuesday', label: 'Seshanba', short: 'Se' },
  { key: 'wednesday', label: 'Chorshanba', short: 'Ch' },
  { key: 'thursday', label: 'Payshanba', short: 'Pa' },
  { key: 'friday', label: 'Juma', short: 'Ju' },
  { key: 'saturday', label: 'Shanba', short: 'Sh' },
] as const

const MONTHS = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr']

export function formatDate(value: string | Date | null | undefined): string {
  if (!value)
    return '—'
  const d = typeof value === 'string' ? new Date(value.length === 10 ? `${value}T00:00:00` : value) : value
  return `${d.getDate()}-${MONTHS[d.getMonth()]}, ${d.getFullYear()}`
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value)
    return '—'
  const d = new Date(value)
  return `${formatDate(d)} ${formatTime(d)}`
}

export function formatTime(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export function weekdaysLabel(days: number[]): string {
  return days.map(i => WEEKDAYS[i]?.label).filter(Boolean).join(', ')
}

export function isoDate(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function toLocalInput(value: string | null | undefined): string {
  if (!value)
    return ''
  const d = new Date(value)
  return `${isoDate(d)}T${formatTime(d)}`
}

export const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  little: 'Little',
  dean: 'Dekan',
  teacher: "O'qituvchi",
  student: 'Talaba',
}

// --- kalendar: Intl'ning o'zbek ma'lumotlari ko'p brauzerlarda yo'q ("M10", "Mon") - o'zimiz beramiz ---
const MONTHS_TITLE = MONTHS.map(m => m[0]!.toUpperCase() + m.slice(1))
/** Yakshanbadan boshlab (Date.getDay() tartibi) */
const WEEKDAYS_SHORT = ['Ya', 'Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh']

/** reka kalendar sarlavhasi: { month: 1..12, year } */
export function calendarMonthTitle(date: { month: number, year: number }): string {
  return `${MONTHS_TITLE[date.month - 1]} ${date.year}`
}

export function calendarRangeTitle(months: { month: number, year: number }[]): string {
  if (!months.length)
    return ''
  const first = months[0]!
  const last = months[months.length - 1]!
  if (first.month === last.month && first.year === last.year)
    return calendarMonthTitle(first)
  if (first.year === last.year)
    return `${MONTHS_TITLE[first.month - 1]} – ${MONTHS_TITLE[last.month - 1]} ${last.year}`
  return `${calendarMonthTitle(first)} – ${calendarMonthTitle(last)}`
}

/** hafta kuni ustuni: weekStartsOn (0 - yakshanba) + ustun indeksi */
export function calendarWeekday(index: number, weekStartsOn = 0): string {
  return WEEKDAYS_SHORT[(weekStartsOn + index) % 7]!
}
