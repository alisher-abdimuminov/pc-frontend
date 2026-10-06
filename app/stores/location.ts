import { defineStore } from 'pinia'
import { ApiError } from '~/composables/useApi'
import type { GeoResult } from '~/composables/useGeolocation'
import type { LocationCheckResult } from '~/types'

/** token muddati tugashiga shuncha qolganda joylashuv avtomatik yangilanadi */
const REFRESH_BEFORE_MS = 60_000
/** hududdan tashqarida / xato bo'lsa qayta tekshirish oralig'i */
const RETRY_MS = 60_000
const TICK_MS = 10_000

let timer: ReturnType<typeof setInterval> | null = null
let onVisible: (() => void) | null = null

/**
 * Talabaning joylashuvi: ilovaga kirishi bilan avtomatik olinadi va backendda tekshiriladi,
 * keyin fon rejimida yangilanib turadi. ok bo'lsa `token` check-in uchun kerak (backend 5 daqiqa qabul qiladi).
 */
export const useLocationStore = defineStore('location', {
  state: () => ({
    geo: null as GeoResult | null,
    result: null as LocationCheckResult | null,
    checkedAt: 0,
    loading: false,
    error: '',
    /** bugun amaliyot kuni emas - tekshirish shart emas */
    noPractice: false,
    now: Date.now(),
  }),
  getters: {
    expiresAt: s => (s.result?.ok && s.result.expires_in ? s.checkedAt + s.result.expires_in * 1000 : 0),
    /** joylashuv tasdiqlangan va token hali yaroqli - FaceID faol bo'ladi */
    isOk(): boolean {
      return this.expiresAt - this.now > 15_000
    },
    status(): 'loading' | 'ok' | 'fail' | 'idle' {
      if (this.isOk)
        return 'ok'
      if (this.loading)
        return 'loading'
      if (this.result || this.error)
        return 'fail'
      return 'idle'
    },
  },
  actions: {
    async check(): Promise<LocationCheckResult | null> {
      if (this.loading)
        return this.result
      const api = useApi()
      this.loading = true
      this.error = ''
      try {
        this.geo = await getCurrentLocation()
        this.result = await api.post<LocationCheckResult>('/api/attendance/location/', {
          latitude: this.geo.latitude,
          longitude: this.geo.longitude,
          accuracy: Math.round(this.geo.accuracy ?? 9999),
        })
        this.noPractice = false
        return this.result
      }
      catch (e: any) {
        this.result = null
        if (e instanceof ApiError && e.status === 400) {
          this.noPractice = true
        }
        else {
          this.error = e.message
        }
        return null
      }
      finally {
        this.checkedAt = Date.now()
        this.now = Date.now()
        this.loading = false
      }
    },

    /** ilovaga kirganda bir marta chaqiriladi: darhol tekshiradi va fon rejimida yangilab turadi */
    startAuto() {
      if (timer)
        return
      this.check()
      timer = setInterval(() => {
        this.now = Date.now()
        if (document.hidden || this.loading || this.noPractice)
          return
        const due = this.result?.ok
          ? this.expiresAt - this.now < REFRESH_BEFORE_MS
          : this.now - this.checkedAt > RETRY_MS
        if (due)
          this.check()
      }, TICK_MS)
      onVisible = () => {
        this.now = Date.now()
        if (!document.hidden && !this.isOk && !this.noPractice)
          this.check()
      }
      document.addEventListener('visibilitychange', onVisible)
    },

    stopAuto() {
      if (timer)
        clearInterval(timer)
      if (onVisible)
        document.removeEventListener('visibilitychange', onVisible)
      timer = null
      onVisible = null
    },

    reset() {
      this.stopAuto()
      this.$reset()
    },
  },
})
