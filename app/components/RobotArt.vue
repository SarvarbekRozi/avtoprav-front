<script setup lang="ts">
/**
 * Avtoprav robot personaji — 3D renderlar (PNG) + CSS animatsiya.
 *
 * Kayfiyat (`mood`) qaysi pozalar to'plamini ishlatishni belgilaydi:
 *   happy → tinch turish, keyin vaqti-vaqti bilan qo'l silkitadi (AI tavsiya)
 *   sad   → xafa (masalan imtihondan o'ta olmagan natija)
 *   angry → jahli chiqqan (xatolar ko'p bo'lganda)
 *
 * Pozalar "flipbook" kabi almashadi — robot shunchaki suzib turgan rasm emas,
 * HARAKAT qilayotgandek ko'rinadi. Bir kayfiyatning barcha pozalari bir vaqtda
 * DOM'da turadi (faqat `opacity` almashadi), shuning uchun poza o'zgarganda
 * tarmoqdan yuklash kutilmaydi va miltillash bo'lmaydi.
 *
 * DIQQAT: kadrlar `loading="eager"` — `lazy` BO'LMAYDI. Ular opacity:0 bilan
 * turgani uchun brauzer lazy rejimda ularni yuklashni cheksiz kechiktiradi va
 * birinchi imo-ishorada robot g'oyib bo'ladi. Faqat `fetchpriority` pasaytiriladi.
 *
 * "3D" hissini kuchaytiruvchilar: sekin suzish, soyaning nafas olishi,
 * orqa nur pulsatsiyasi va sichqoncha harakatiga qarab yengil parallaks qiyalik.
 * prefers-reduced-motion yoqilgan bo'lsa — statik, hech qanday harakat yo'q.
 */
type Mood = 'happy' | 'sad' | 'angry'

const props = withDefaults(defineProps<{
  mood?: Mood
  /** parallaks qiyalikni kuzatadigan element (standart: eng yaqin <section>) */
  tiltTarget?: 'section' | 'self' | 'none'
}>(), { mood: 'happy', tiltTarget: 'section' })

/**
 * Har bir kayfiyat uchun: [0] — tinch holat, qolganlari — imo-ishora kadrlari.
 * Faqat joriy kayfiyatning rasmlari yuklanadi.
 */
const MOODS: Record<Mood, string[]> = {
  happy: ['happy', 'open', 'wave'],
  sad:   ['sad', 'cry'],
  angry: ['angry'],
}

const frames = computed(() => MOODS[props.mood].map(n => ({ name: n, src: `/robot/${n}.png` })))
const active = ref(0)

const root = ref<HTMLElement | null>(null)
const tiltX = ref(0)
const tiltY = ref(0)
// Rasm topilmasa buzilgan rasm belgisi chiqmasin — komponent jimgina yashirinadi
const missing = ref(false)

let timers: ReturnType<typeof setTimeout>[] = []
let host: HTMLElement | null = null
let reduced = false

const clearTimers = () => { timers.forEach(clearTimeout); timers = [] }

/** Qisqa imo-ishora: 1 → 2 → 1 → tinch holat */
function playGesture() {
  if (reduced || frames.value.length < 2) return
  const seq: [number, number][] = frames.value.length >= 3
    ? [[1, 0], [2, 200], [1, 600], [0, 820]]
    : [[1, 0], [0, 900]]
  seq.forEach(([i, delay]) => timers.push(setTimeout(() => { active.value = i }, delay)))
}

/** 8–13 soniyada bir marta; oraliq tasodifiy — mexanik ko'rinmasin */
function scheduleGesture() {
  timers.push(setTimeout(() => { playGesture(); scheduleGesture() }, 8000 + Math.random() * 5000))
}

// Parallaks: maksimum ~7°, bundan ko'pi "o'yinchoq" bo'lib ketadi
function onMove(e: PointerEvent) {
  if (reduced || !host) return
  const r = host.getBoundingClientRect()
  tiltY.value = ((e.clientX - r.left) / r.width - 0.5) * 14
  tiltX.value = -((e.clientY - r.top) / r.height - 0.5) * 10
}
function onLeave() {
  tiltX.value = 0; tiltY.value = 0
  if (!reduced) { clearTimers(); active.value = 0; scheduleGesture() }
}
function onEnter() {
  if (!reduced && frames.value.length > 1) { clearTimers(); active.value = 1; scheduleGesture() }
}

onMounted(() => {
  reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduced) return

  timers.push(setTimeout(playGesture, 900))   // kirishda bir marta salomlashadi
  scheduleGesture()

  if (props.tiltTarget === 'none') return
  host = props.tiltTarget === 'self' ? root.value : (root.value?.closest('section') ?? root.value)
  host?.addEventListener('pointermove', onMove)
  host?.addEventListener('pointerleave', onLeave)
  host?.addEventListener('pointerenter', onEnter)
})

onBeforeUnmount(() => {
  clearTimers()
  host?.removeEventListener('pointermove', onMove)
  host?.removeEventListener('pointerleave', onLeave)
  host?.removeEventListener('pointerenter', onEnter)
})
</script>

<template>
  <div v-show="!missing" ref="root" class="rb" aria-hidden="true">
    <span class="rb-halo"></span>
    <span class="rb-shadow"></span>

    <div class="rb-stage" :style="{ transform: `rotateX(${tiltX}deg) rotateY(${tiltY}deg)` }">
      <div class="rb-float">
        <img v-for="(f, i) in frames" :key="f.name" :src="f.src" alt=""
             class="rb-img" :class="{ 'is-on': active === i }"
             width="380" height="380" decoding="async" loading="eager"
             :fetchpriority="i === 0 ? 'high' : 'low'"
             @error="i === 0 && (missing = true)" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.rb {
  position: relative;
  aspect-ratio: 1 / 1;
  perspective: 700px;
  isolation: isolate;
}

.rb-stage {
  position: absolute;
  inset: 0;
  transform-style: preserve-3d;
  transition: transform .45s cubic-bezier(.22, 1, .36, 1);
  will-change: transform;
}

.rb-float {
  position: absolute;
  inset: 0;
  animation: rb-float 5.5s ease-in-out infinite;
}

.rb-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  opacity: 0;
  transition: opacity .09s linear;
  /* Soya rasmda emas, CSS'da — shuning uchun dark rejimda ham to'g'ri turadi */
  filter: drop-shadow(0 10px 14px rgba(30, 42, 82, 0.26));
}
.rb-img.is-on { opacity: 1; }

.rb-halo {
  position: absolute;
  inset: 2% 2% 8%;
  border-radius: 9999px;
  background: radial-gradient(circle at 50% 45%,
              rgba(124, 140, 248, 0.38) 0%,
              rgba(139, 92, 246, 0.14) 58%,
              transparent 72%);
  animation: rb-halo 7s ease-in-out infinite;
  z-index: -1;
}

.rb-shadow {
  position: absolute;
  left: 24%;
  right: 24%;
  bottom: 2%;
  height: 6%;
  border-radius: 9999px;
  background: radial-gradient(ellipse at center, rgba(30, 42, 82, 0.28), transparent 70%);
  animation: rb-shadow 5.5s ease-in-out infinite;
  z-index: -1;
}

@keyframes rb-float {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-5px); }
}
@keyframes rb-shadow {
  0%, 100% { transform: scaleX(1);    opacity: 1; }
  50%      { transform: scaleX(0.88); opacity: 0.65; }
}
@keyframes rb-halo {
  0%, 100% { opacity: 0.85; transform: scale(1); }
  50%      { opacity: 1;    transform: scale(1.05); }
}

@media (prefers-reduced-motion: reduce) {
  .rb-float, .rb-shadow, .rb-halo { animation: none; }
  .rb-stage, .rb-img { transition: none; }
}
</style>
