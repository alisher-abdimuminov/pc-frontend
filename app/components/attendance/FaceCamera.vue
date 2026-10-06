<script setup lang="ts">
import type { Detection, FaceDetector } from '@mediapipe/tasks-vision'
import { LoaderCircleIcon } from '@lucide/vue'

/**
 * Old kamera + mediapipe yuz aniqlash.
 * Yuz ekrandagi oval ichida to'liq turishi shart: bitta yuz, yetarli ishonch, yetarli katta, markazda,
 * yuz chegaralari va barcha nuqtalari (ko'z, burun, og'iz, quloq) oval ichida.
 * Shu holat HOLD_MS davomida HAR BIR kadrda uzluksiz saqlansa - rasm avtomatik olinadi.
 * Bitta yomon kadr ham hisobni bekor qiladi: oval qizil, ogohlantirish, progress orqaga qaytadi.
 * Asosiy tekshiruv baribir backendda (deepface).
 */
const emit = defineEmits<{ capture: [blob: Blob] }>()

const HOLD_MS = 3000
/** HOLD_MS ichida kamida shuncha kadr tahlil qilingan bo'lishi kerak (sekin qurilma / to'xtagan video) */
const MIN_FRAMES = 20
const MIN_SCORE = 0.8

// SVG viewBox (konteyner 3:4) va undagi oval
const VB = { w: 100, h: 133 }
const OVAL = { cx: 50, cy: 62, rx: 34, ry: 46 }

const video = ref<HTMLVideoElement>()
const status = ref<'loading' | 'ready' | 'captured' | 'error'>('loading')
const error = ref('')
const hint = ref('Kamera yuklanmoqda...')
/** search - yuz hali ko'rinmagan, bad - talab buzilgan (qizil), good - hisob ketmoqda */
const tone = ref<'search' | 'bad' | 'good'>('search')
const progress = ref(0)
/** progress orqaga qaytayotgan animatsiya */
const draining = ref(false)

let stream: MediaStream | null = null
let detector: FaceDetector | null = null
let frame = 0
let okSince = 0
let okFrames = 0
let lastVideoTime = -1
let faceSeen = false
let drainTimer: ReturnType<typeof setTimeout> | null = null
let stopped = false

async function createDetector() {
  const { FaceDetector, FilesetResolver } = await import('@mediapipe/tasks-vision')
  const fileset = await FilesetResolver.forVisionTasks('/mediapipe')
  const options = (delegate: 'GPU' | 'CPU') => ({
    baseOptions: { modelAssetPath: '/mediapipe/blaze_face_short_range.tflite', delegate },
    runningMode: 'VIDEO' as const,
    // past ishonchli yuzlarni ham ko'ramiz (ikkinchi yuzni aniqlash uchun), qarorni o'zimiz qilamiz
    minDetectionConfidence: 0.5,
  })
  try {
    return await FaceDetector.createFromOptions(fileset, options('GPU'))
  }
  catch {
    return await FaceDetector.createFromOptions(fileset, options('CPU'))
  }
}

/**
 * Video pikselini ekrandagi (oynadagi) SVG koordinataga o'tkazadi:
 * object-cover kesilishi va oynadagi akslantirish (-scale-x-100) hisobga olinadi.
 */
function toView(v: HTMLVideoElement, vx: number, vy: number): [number, number] {
  const cw = v.clientWidth
  const ch = v.clientHeight
  const scale = Math.max(cw / v.videoWidth, ch / v.videoHeight)
  const x = vx * scale - (v.videoWidth * scale - cw) / 2
  const y = vy * scale - (v.videoHeight * scale - ch) / 2
  return [((cw - x) / cw) * VB.w, (y / ch) * VB.h]
}

/** nuqta oval ichida (1 - chegarada) */
function ovalValue([x, y]: [number, number]): number {
  return ((x - OVAL.cx) / OVAL.rx) ** 2 + ((y - OVAL.cy) / OVAL.ry) ** 2
}

const score = (d: Detection) => d.categories[0]?.score ?? 0

/** Kadrdagi yuz talabga javob bermasa sababini qaytaradi, mos bo'lsa bo'sh satr */
function problem(v: HTMLVideoElement): string {
  const faces = detector!.detectForVideo(v, performance.now()).detections
  if (faces.length === 0)
    return faceSeen ? 'Yuz ramkadan chiqib ketdi' : ''
  faceSeen = true
  if (faces.length > 1)
    return 'Kadrda faqat bitta yuz bo\'lishi kerak'

  const face = faces[0]!
  if (score(face) < MIN_SCORE)
    return 'Yuz aniq ko\'rinmayapti. Yorug\'roq joyga o\'ting'

  const box = face.boundingBox!
  const left = toView(v, box.originX, box.originY + box.height / 2)
  const right = toView(v, box.originX + box.width, box.originY + box.height / 2)
  const top = toView(v, box.originX + box.width / 2, box.originY)
  const bottom = toView(v, box.originX + box.width / 2, box.originY + box.height)
  const center = toView(v, box.originX + box.width / 2, box.originY + box.height / 2)
  const width = Math.abs(left[0] - right[0])

  if (width < OVAL.rx * 2 * 0.5)
    return 'Yaqinroq keling'
  if (Math.abs(center[0] - OVAL.cx) > OVAL.rx * 0.3 || Math.abs(center[1] - OVAL.cy) > OVAL.ry * 0.3)
    return 'Yuzingizni oval markaziga keltiring'

  const keypoints = face.keypoints.map(k => toView(v, k.x * v.videoWidth, k.y * v.videoHeight))
  if ([left, right, top, bottom, ...keypoints].some(p => ovalValue(p) > 1))
    return width > OVAL.rx * 2 * 0.9 ? 'Biroz uzoqroq turing' : 'Yuzingizni oval ichiga to\'liq joylang'
  return ''
}

function resetProgress(message: string) {
  if (progress.value > 0) {
    // hisob ketayotgan edi - orqaga animatsiya + ogohlantirish
    draining.value = true
    if (drainTimer)
      clearTimeout(drainTimer)
    drainTimer = setTimeout(() => (draining.value = false), 450)
    window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('warning')
  }
  okSince = 0
  okFrames = 0
  progress.value = 0
  tone.value = message ? 'bad' : 'search'
  hint.value = message || 'Yuzingizni oval ichiga joylang'
}

function analyse() {
  if (stopped || status.value !== 'ready' || !video.value || !detector)
    return
  const v = video.value
  // faqat yangi kadr tahlil qilinadi; video to'xtab qolsa hisob ketmaydi
  if (v.readyState >= 2 && v.currentTime !== lastVideoTime) {
    lastVideoTime = v.currentTime
    const message = problem(v)
    const now = performance.now()

    if (message || !faceSeen) {
      resetProgress(message)
    }
    else {
      okSince ||= now
      okFrames++
      draining.value = false
      tone.value = 'good'
      progress.value = Math.min(1, (now - okSince) / HOLD_MS)
      const left = Math.ceil((HOLD_MS - (now - okSince)) / 1000)
      hint.value = left > 0 ? `Qimirlamang... ${left}` : 'Rasmga olinmoqda'
      if (progress.value >= 1 && okFrames >= MIN_FRAMES)
        return capture()
    }
  }
  frame = requestAnimationFrame(analyse)
}

async function start() {
  status.value = 'loading'
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 960 } },
      audio: false,
    })
    video.value!.srcObject = stream
    await video.value!.play()
    detector = await createDetector()
    status.value = 'ready'
    resetProgress('')
    analyse()
  }
  catch (e: any) {
    status.value = 'error'
    error.value = e?.name === 'NotAllowedError'
      ? 'Kameraga ruxsat berilmadi. Brauzer sozlamalaridan ruxsat bering'
      : 'Kamerani ishga tushirib bo\'lmadi'
  }
}

function stop() {
  stopped = true
  cancelAnimationFrame(frame)
  if (drainTimer)
    clearTimeout(drainTimer)
  stream?.getTracks().forEach(t => t.stop())
  detector?.close()
}

function capture() {
  const v = video.value
  if (!v || status.value === 'captured')
    return
  // oxirgi nazorat: aynan olinayotgan kadr ham talabga javob berishi shart
  const message = problem(v)
  if (message) {
    resetProgress(message)
    frame = requestAnimationFrame(analyse)
    return
  }
  const canvas = document.createElement('canvas')
  canvas.width = v.videoWidth
  canvas.height = v.videoHeight
  canvas.getContext('2d')!.drawImage(v, 0, 0)
  status.value = 'captured'
  window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('medium')
  canvas.toBlob((blob) => {
    stop()
    if (blob)
      emit('capture', blob)
  }, 'image/jpeg', 0.92)
}

onMounted(start)
onBeforeUnmount(stop)

const OVAL_STROKE = {
  search: 'stroke-white/70',
  bad: 'stroke-rose-500',
  good: 'stroke-lime-400/40',
}
const HINT = {
  search: 'bg-black/50 text-white',
  bad: 'bg-rose-500 text-white',
  good: 'bg-lime-400 text-lime-950',
}
</script>

<template>
  <div class="space-y-3">
    <div class="relative mx-auto aspect-[3/4] w-full max-w-sm overflow-hidden rounded-[2rem] bg-black">
      <video ref="video" class="size-full -scale-x-100 object-cover" playsinline muted />

      <!-- oval ramka + 3 soniyalik progress -->
      <svg :viewBox="`0 0 ${VB.w} ${VB.h}`" class="pointer-events-none absolute inset-0 size-full">
        <defs>
          <mask id="face-hole">
            <rect :width="VB.w" :height="VB.h" fill="white" />
            <ellipse :cx="OVAL.cx" :cy="OVAL.cy" :rx="OVAL.rx" :ry="OVAL.ry" fill="black" />
          </mask>
        </defs>
        <rect
          :width="VB.w" :height="VB.h" mask="url(#face-hole)"
          class="transition-colors duration-300"
          :class="tone === 'bad' ? 'fill-rose-950' : 'fill-black'"
          fill-opacity="0.5"
        />
        <ellipse
          :cx="OVAL.cx" :cy="OVAL.cy" :rx="OVAL.rx" :ry="OVAL.ry"
          fill="none"
          class="transition-[stroke] duration-200"
          :class="OVAL_STROKE[tone]"
          :stroke-width="tone === 'bad' ? 2.2 : 1.2"
        />
        <!-- progress: oval bilan bir xil shakl, eng tepadan soat yo'nalishida to'ladi
             (rotate() ishlatilmaydi - cho'zinchoq ovalni aylantirsa yotib qoladi) -->
        <path
          v-if="progress > 0 || draining"
          :d="`M ${OVAL.cx} ${OVAL.cy - OVAL.ry} A ${OVAL.rx} ${OVAL.ry} 0 1 1 ${OVAL.cx} ${OVAL.cy + OVAL.ry} A ${OVAL.rx} ${OVAL.ry} 0 1 1 ${OVAL.cx} ${OVAL.cy - OVAL.ry}`"
          fill="none" stroke-width="2.4" stroke-linecap="round"
          pathLength="100"
          stroke-dasharray="100"
          :style="{ strokeDashoffset: 100 - progress * 100 }"
          :class="draining ? 'stroke-rose-500 transition-[stroke-dashoffset] duration-[400ms] ease-out' : 'stroke-lime-400'"
        />
      </svg>

      <div v-if="status === 'loading'" class="absolute inset-0 grid place-items-center text-white">
        <LoaderCircleIcon class="size-8 animate-spin" />
      </div>
      <div v-if="status === 'error'" class="absolute inset-0 grid place-items-center bg-black/70 p-6 text-center text-sm text-white">
        {{ error }}
      </div>
      <div v-if="status === 'captured'" class="absolute inset-0 bg-white/70" />
      <div v-if="status === 'ready'" class="absolute inset-x-0 bottom-0 p-4 text-center">
        <span class="inline-block rounded-full px-4 py-1.5 text-sm font-medium backdrop-blur transition-colors" :class="HINT[tone]">
          {{ hint }}
        </span>
      </div>
    </div>
    <p class="text-center text-xs text-muted-foreground">
      Yuzingizni oval ichiga to'liq joylang — 3 soniya qimirlamasangiz rasm avtomatik olinadi
    </p>
  </div>
</template>
