<script setup lang="ts">
/**
 * "Sizga tavsiya" — AI tanlagan eng zaif mavzu.
 *
 * Ma'lumot: GET /me/topic-stats → recommendation { topic_id, mastery, message }.
 * `message` serverda tayyorlanadi va til bo'yicha allaqachon hal qilingan —
 * uni qayta tarjima qilmaymiz.
 *
 * So'rov `useTopicStats()` orqali — TopicStrengthCard bilan bitta kalitni va
 * bitta handler havolasini bo'lishadi, shuning uchun so'rov faqat bir marta ketadi.
 *
 * Robot — `avtoprav-robot-v6.webm` (VP9 + alfa kanal, 320x320, 20 kadr/s). Animatsiya
 * FAYLNING O'ZIDA: qo'l silkitish, bosh burilishi, ko'z yumib-ochish, ko'krak
 * chirog'i pulsi. Shuning uchun CSS'da robotga HECH QANDAY harakat berilmaydi —
 * na `translate`, na `float`, na `bounce`. Ilgari bu yerda qo'lda chizilgan
 * SVG turgan edi.
 */
const i18n = useI18n()
const { data } = await useTopicStats()

const videoEl = ref<HTMLVideoElement | null>(null)

/**
 * WCAG 2.2.2: 5 soniyadan uzun, o'zi boshlanadigan takrorlanuvchi animatsiya
 * to'xtatilishi kerak. Foydalanuvchi tizimida "harakatni kamaytirish"
 * yoqilgan bo'lsa videoni birinchi kadrda to'xtatamiz — qolganlar uchun
 * hech narsa o'zgarmaydi. CSS bilan videoni to'xtatib bo'lmaydi, shuning
 * uchun JS. `autoplay` atributi shablonda QOLADI: JS ishlamasa ham robot
 * jonli bo'lib turadi.
 */
onMounted(() => {
  const v = videoEl.value
  if (!v || !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
  v.pause()
  v.currentTime = 0
})

// "Keyinroq eslatish" — tavsiyani BUGUNGA yashiradi (localStorage). Ertaga
// yana chiqadi: tavsiya eslatma, jarima emas.
const SNOOZE_KEY = 'ai-rec-snooze'
const snoozed = ref(false)
onMounted(() => {
  try { snoozed.value = localStorage.getItem(SNOOZE_KEY) === new Date().toDateString() }
  catch { /* private rejim — shunchaki ko'rsataveramiz */ }
})
function snooze() {
  try { localStorage.setItem(SNOOZE_KEY, new Date().toDateString()) }
  catch { /* saqlanmasa ham UI yashirinadi */ }
  snoozed.value = true
}

const rec = computed(() => snoozed.value ? null : (data.value?.recommendation ?? null))

const message = computed(() => rec.value?.message ?? i18n.t({
  uz: 'Bir nechta test yeching — AI sizga eng mos mavzuni o\'zi tanlab beradi.',
  kr: 'Бир нечта тест ечинг — AI сизга энг мос мавзуни ўзи танлаб беради.',
}))

const primary = computed(() => rec.value
  ? {
      to: `/test/start/topic?topic_id=${rec.value.topic_id}`,
      label: i18n.t({ uz: 'Mavzuni o\'rganish', kr: 'Мавзуни ўрганиш' }),
    }
  : {
      to: '/test/start/daily',
      label: i18n.t({ uz: 'Kunlik testni boshlash', kr: 'Кунлик тестни бошлаш' }),
    })
</script>

<template>
  <section class="ai-recommend relative overflow-hidden rounded-[22px] p-5 h-full flex flex-col">
    <div aria-hidden="true"
         class="ai-glow absolute -top-24 -right-16 w-56 h-56 rounded-full blur-3xl pointer-events-none"
         style="background: radial-gradient(circle, rgba(139,92,246,0.34), transparent 70%);"></div>

    <div class="relative flex items-start gap-3 sm:gap-4">
      <!-- Robot. Dekorativ: `aria-hidden` + `pointer-events: none` — ekran
           o'quvchi uchun ma'no tashimaydi, bosilmaydi ham. -->
      <div class="robot-slot shrink-0" aria-hidden="true">
        <video
          ref="videoEl"
          class="robot-video"
          autoplay
          muted
          loop
          playsinline
          preload="auto"
          disablepictureinpicture
          tabindex="-1"
          poster="/assets/avtoprav-robot-v6-poster.png"
        >
          <source src="/assets/avtoprav-robot-v6.webm" type="video/webm">
        </video>
      </div>

      <div class="min-w-0 flex-1">
        <!-- Maketdagidek: oddiy registr, binafsha chip -->
        <span class="ai-badge inline-flex items-center gap-1.5 px-2.5 h-[24px] rounded-lg text-[11px] font-semibold text-white">
          <AppIcon name="spark" :size="11" />
          {{ i18n.t({ uz: 'AI tavsiya', kr: 'AI тавсия' }) }}
        </span>

        <h2 class="text-[17px] font-bold leading-snug mt-2" style="color: var(--text-1);">
          {{ i18n.t({ uz: 'Siz uchun tavsiya qilingan', kr: 'Сиз учун тавсия қилинган' }) }}
          <span aria-hidden="true">✨</span>
        </h2>

        <!-- line-clamp-3: tavsiya matni uzun bo'lsa ham karta yonidagilardan
             baland bo'lib ketmasin (qatorlar bir sathda tursin) -->
        <p class="text-[13.5px] leading-[1.55] mt-1.5 line-clamp-3" style="color: var(--text-2);">
          {{ message }}
        </p>
      </div>
    </div>

    <div class="relative mt-auto pt-4 flex flex-wrap items-center gap-2.5">
      <NuxtLink :to="primary.to"
        class="ai-cta inline-flex items-center gap-2 h-10 px-5 rounded-xl text-[13.5px] font-semibold text-white">
        {{ primary.label }}
        <AppIcon name="arrow" :size="15" />
      </NuxtLink>
      <!-- Tavsiya bor payt maketdagidek "Keyinroq eslatish" (bugunga yashiradi);
           tavsiya yo'q payt bu tugma ma'nosiz — o'rniga mavzular havolasi. -->
      <button v-if="rec" type="button" @click="snooze"
        class="ai-alt inline-flex items-center h-10 px-4 rounded-xl text-[13.5px] font-medium">
        {{ i18n.t({ uz: 'Keyinroq eslatish', kr: 'Кейинроқ эслатиш' }) }}
      </button>
      <NuxtLink v-else to="/topics"
        class="ai-alt inline-flex items-center h-10 px-4 rounded-xl text-[13.5px] font-medium">
        {{ i18n.t({ uz: 'Barcha mavzular', kr: 'Барча мавзулар' }) }}
      </NuxtLink>
    </div>
  </section>
</template>

<style scoped>
/* Maketdagidek yaxlit binafsha chip (teal aralashmasi olib tashlandi).
   Oq matn #7c3aed ustida 5.9:1 — AA dan yuqori. */
.ai-badge {
  background: linear-gradient(90deg, #8b5cf6, #7c3aed);
  box-shadow: 0 2px 6px rgba(139, 92, 246, 0.35);
}
.ai-cta {
  background: linear-gradient(135deg, #8b5cf6, #6366f1);
  box-shadow: 0 8px 20px -8px rgba(139, 92, 246, 0.7);
  transition: transform .2s, box-shadow .2s;
}
.ai-cta:hover { transform: translateY(-2px); box-shadow: 0 12px 24px -8px rgba(139, 92, 246, 0.75); }

.ai-alt {
  background: var(--surface);
  border: 1px solid var(--border-1);
  color: var(--text-2);
  transition: background .15s;
}
.ai-alt:hover { background: var(--surface-inset); }

/* Robot maydoni. KVADRAT: video 512x512 (1:1), portret qutida `contain`
   bilan chetlarida bo'sh joy qolardi. `aspect-ratio` balandlikni o'zi
   hisoblaydi — nisbat hech qachon buzilmaydi va layout siljimaydi (CLS yo'q).
   O'lchamlar berilgan diapazonlar bo'yicha: mobil 128px (115–140), planshet
   165px (150–175), desktop 195px (180–210). Desktopda bu o'lcham dashboard
   to'ri AI kartaga 1.5fr bergani uchun sig'adi (~536px): robotdan keyin
   tavsiya matniga ~285px qoladi. */
.robot-slot {
  width: 128px;
  aspect-ratio: 1 / 1;
}
@media (min-width: 640px)  { .robot-slot { width: 165px; } }
@media (min-width: 1024px) { .robot-slot { width: 195px; } }

/* Robotga HARAKAT ANIMATSIYASI BERILMAYDI — u faylning ichida.
   `object-fit: contain` nisbatni saqlaydi, fon shaffof qoladi (VP9 alfa). */
.robot-video {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: transparent;
  pointer-events: none;
  user-select: none;
  -webkit-user-select: none;
}

.ai-glow { animation: ai-pulse 4s ease-in-out infinite; }
@keyframes ai-pulse {
  0%, 100% { opacity: 0.6; transform: scale(1); }
  50%      { opacity: 1;   transform: scale(1.14); }
}
@media (prefers-reduced-motion: reduce) {
  .ai-glow { animation: none; }
  .ai-cta, .ai-cta:hover { transition: none; transform: none; }
}
</style>
