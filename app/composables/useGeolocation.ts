export interface GeoResult {
  latitude: number
  longitude: number
  accuracy: number | null
}

function fromTelegram(): Promise<GeoResult> | null {
  const tg = window.Telegram?.WebApp
  const lm = tg?.LocationManager
  if (!tg?.initData || !lm)
    return null
  return new Promise((resolve, reject) => {
    const get = () => {
      if (!lm.isLocationAvailable)
        return reject(new Error('Qurilmada lokatsiya mavjud emas'))
      lm.getLocation((data) => {
        if (!data) {
          if (lm.isAccessRequested && !lm.isAccessGranted)
            lm.openSettings()
          return reject(new Error('Lokatsiyaga ruxsat berilmadi'))
        }
        // aniqligi noma'lum bo'lsa backend qabul qilmaydi - brauzer geolokatsiyasiga o'tamiz
        if (data.horizontal_accuracy == null)
          return reject(new Error('Aniqlik noma\'lum'))
        resolve({ latitude: data.latitude, longitude: data.longitude, accuracy: data.horizontal_accuracy })
      })
    }
    lm.isInited ? get() : lm.init(get)
  })
}

function fromBrowser(): Promise<GeoResult> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation)
      return reject(new Error('Brauzer lokatsiyani qo\'llab-quvvatlamaydi'))
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, accuracy: pos.coords.accuracy }),
      (err) => {
        const messages: Record<number, string> = {
          1: 'Lokatsiyaga ruxsat berilmadi. Sozlamalardan ruxsat bering',
          2: 'Lokatsiyani aniqlab bo\'lmadi',
          3: 'Lokatsiyani aniqlash vaqti tugadi',
        }
        reject(new Error(messages[err.code] ?? err.message))
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 },
    )
  })
}

/** brauzer/Telegram javob bermasa (masalan ruxsat oynasi javobsiz qolsa) shundan keyin xato */
const HARD_TIMEOUT_MS = 30_000

/** Telegram Mini App ichida bo'lsa Telegram LocationManager, aks holda brauzer geolocation */
export function getCurrentLocation(): Promise<GeoResult> {
  const request = fromTelegram()?.catch(() => fromBrowser()) ?? fromBrowser()
  // getCurrentPosition'ning o'z timeout'i ruxsat so'ralayotgan vaqtni hisoblamaydi - shuning uchun umumiy chegara
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error('Joylashuvni aniqlab bo\'lmadi. Lokatsiyaga ruxsat berilganini tekshiring')),
      HARD_TIMEOUT_MS,
    )
    request.then(resolve, reject).finally(() => clearTimeout(timer))
  })
}
