<script setup lang="ts">
/**
 * Asosiy CTA: "Imtihon" gradient kartasi + planshet/sekundomer illyustratsiyasi.
 * Tugallanmagan urinish bo'lsa, ustida "Davom etish" tasmasi chiqadi
 * (ma'lumot: /me/stats → current_attempt).
 */
const props = defineProps<{
  current: { id: number, mode: string, answered: number, total: number } | null
}>()

const i18n = useI18n()

const MODE_LABELS: Record<string, { uz: string, kr: string }> = {
  exam:     { uz: 'Imtihon',    kr: 'Имтиҳон' },
  topic:    { uz: 'Mavzu',      kr: 'Мавзу' },
  ticket:   { uz: 'Bilet',      kr: 'Билет' },
  random:   { uz: 'Tasodifiy',  kr: 'Тасодифий' },
  mistakes: { uz: 'Xatolar',    kr: 'Хатолар' },
  marathon: { uz: 'Marafon',    kr: 'Марафон' },
  memorize: { uz: 'Yodlash',    kr: 'Ёдлаш' },
  daily:    { uz: 'Kunlik',     kr: 'Кунлик' },
  blitz:    { uz: 'Blits',      kr: 'Блиц' },
}

const currentLabel = computed(() => {
  const m = props.current?.mode
  return m ? (MODE_LABELS[m] ? i18n.t(MODE_LABELS[m]!) : m) : ''
})

const currentPct = computed(() => {
  const c = props.current
  if (!c || !c.total) return 0
  return Math.min(100, Math.round((c.answered / c.total) * 100))
})
</script>

<template>
  <div class="flex flex-col gap-3 h-full">
    <!-- Tugallanmagan urinish -->
    <NuxtLink v-if="current" :to="`/test/play/${current.id}`"
      class="resume group flex items-center gap-3 rounded-2xl px-4 py-3 text-white">
      <span class="w-9 h-9 rounded-full grid place-items-center shrink-0"
            style="background: #fff; color: var(--ok-surface);">
        <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor"><path d="M6 4l11 6-11 6z" /></svg>
      </span>
      <span class="min-w-0 flex-1">
        <span class="block text-sm font-bold leading-tight">
          {{ i18n.t({ uz: 'Davom etish', kr: 'Давом этиш' }) }}
        </span>
        <span class="block text-2xs text-white/90 mt-0.5 truncate tabular-nums">
          {{ currentLabel }} · {{ current.answered }}/{{ current.total }} ({{ currentPct }}%)
        </span>
      </span>
      <AppIcon name="chev-r" :size="18" class="shrink-0 transition-transform group-hover:translate-x-0.5" />
    </NuxtLink>

    <!-- Imtihon hero -->
    <section class="exam-cta relative overflow-hidden rounded-2xl text-white flex-1 p-5 sm:p-6">
      <div aria-hidden="true"
           class="absolute -top-20 -left-12 w-56 h-56 rounded-full blur-3xl pointer-events-none"
           style="background: radial-gradient(circle, rgba(255,255,255,0.22), transparent 70%);"></div>

      <div class="relative z-10 max-w-[57%] sm:max-w-[55%] lg:max-w-[52%]">
        <div class="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
          <h2 class="text-[26px] sm:text-[30px] font-bold tracking-tightish leading-none">
            {{ i18n.t({ uz: 'Imtihon', kr: 'Имтиҳон' }) }}
          </h2>
          <span class="inline-flex items-center h-[26px] px-2.5 rounded-full text-[11px] font-semibold whitespace-nowrap"
                style="background: rgba(255,255,255,0.22);">
            {{ i18n.t({ uz: 'Tavsiya etiladi', kr: 'Тавсия этилади' }) }}
          </span>
        </div>

        <p class="text-[13px] sm:text-sm font-semibold text-white/95 mt-3">
          {{ i18n.t({
            uz: '20 savol · 25 daqiqa · Real imtihon muhiti',
            kr: '20 савол · 25 дақиқа · Реал имтиҳон муҳити'
          }) }}
        </p>

        <!-- /75 emas /90: yangi (ochroq) hero gradienti ustida /75 ~3.1:1 berardi -->
        <p class="hidden sm:block text-[13px] leading-relaxed text-white/90 mt-2">
          {{ i18n.t({
            uz: 'Rasmiy imtihon formatida bilimlaringizni sinab ko\'ring va tayyorgarlik darajangizni baholang.',
            kr: 'Расмий имтиҳон форматида билимларингизни синаб кўринг ва тайёргарлик даражангизни баҳоланг.'
          }) }}
        </p>

        <NuxtLink to="/test/start/exam" class="cta-btn inline-flex items-center gap-2 h-11 px-5 mt-5 rounded-xl text-sm font-semibold">
          {{ i18n.t({ uz: 'Imtihonni boshlash', kr: 'Имтиҳонни бошлаш' }) }}
          <AppIcon name="arrow" :size="16" />
        </NuxtLink>
      </div>

      <!-- Illyustratsiya kengligi har bir nuqtada matn maydoni bilan
           to'qnashmaydigan qilib tanlangan. Eng tor holat — 768–1023px:
           sidebar allaqachon ko'rinadi, lekin karta hali 12-ustunli
           gridga o'tmagan, ya'ni hero eng ingichka bo'ladi. -->
      <ExamArt aria-hidden="true"
        class="pointer-events-none select-none absolute right-0 sm:right-2 lg:right-4 bottom-0
               w-[140px] sm:w-[170px] lg:w-[210px] xl:w-[215px] 2xl:w-[250px]" />
    </section>
  </div>
</template>

<style scoped>
/* Fon uchun --ok-surface* ishlatiladi (ikkala mavzuda ham to'q yashil).
   --ok / --ok-strong esa MATN tokenlari — dark rejimda ochib ketadi va
   ustidagi oq yozuv ko'rinmay qolardi. */
.resume {
  background: linear-gradient(118deg, var(--ok-surface), var(--ok-surface-2));
  box-shadow: 0 14px 32px -18px rgba(16, 185, 129, 0.85);
  transition: transform .2s, box-shadow .2s;
}
.resume:hover { transform: translateY(-2px); }
.resume:active { transform: scale(0.99); }

.cta-btn {
  background: #ffffff;
  color: #2d3d8b;
  box-shadow: 0 12px 26px -14px rgba(0, 0, 0, 0.6);
  transition: transform .2s, box-shadow .2s;
}
.cta-btn:hover { transform: translateY(-2px); box-shadow: 0 16px 30px -14px rgba(0, 0, 0, 0.65); }
.cta-btn:active { transform: translateY(0); }

@media (prefers-reduced-motion: reduce) {
  .resume, .resume:hover, .cta-btn, .cta-btn:hover { transition: none; transform: none; }
}
</style>
