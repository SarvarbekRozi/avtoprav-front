<script setup lang="ts">
/**
 * Asosiy CTA: "Imtihon" gradient kartasi + planshet/sekundomer illyustratsiyasi.
 *
 * Tugallanmagan urinish uchun "Davom etish" BU YERDA EMAS — namunaviy dizaynda
 * bunday karta yo'q, shuning uchun u sarlavha ostidagi ixcham chipga ko'chirildi
 * (app/pages/index.vue).
 */
const i18n = useI18n()
</script>

<template>
  <section class="exam-cta relative overflow-hidden rounded-[22px] text-white h-full min-h-[248px]
                  p-5 sm:p-6 lg:p-7 flex flex-col justify-center">
    <div aria-hidden="true"
         class="absolute -top-24 -left-16 w-64 h-64 rounded-full blur-3xl pointer-events-none"
         style="background: radial-gradient(circle, rgba(255,255,255,0.22), transparent 70%);"></div>

    <div class="relative z-10 max-w-[62%] sm:max-w-[56%]">
      <div class="flex flex-wrap items-center gap-x-3 gap-y-2">
        <!-- `text-white` SHART: main.css'dagi `h1,h2,h3,h4 { color: var(--text-1) }`
             to'g'ridan-to'g'ri qoida bo'lgani uchun ota elementdan MEROS bo'lib
             kelayotgan oq rangni bosib ketadi va sarlavha qora chiqadi. -->
        <h2 class="text-white text-[28px] sm:text-[32px] lg:text-[34px] font-bold tracking-tightish leading-none">
          {{ i18n.t({ uz: 'Imtihon', kr: 'Имтиҳон' }) }}
        </h2>
        <span class="inline-flex items-center h-[26px] px-2.5 rounded-full text-[11px] font-semibold whitespace-nowrap"
              style="background: rgba(255,255,255,0.22);">
          {{ i18n.t({ uz: 'Tavsiya etiladi', kr: 'Тавсия этилади' }) }}
        </span>
      </div>

      <p class="text-sm sm:text-[15px] font-semibold text-white/95 mt-3.5">
        {{ i18n.t({
          uz: '20 savol · 25 daqiqa · Real imtihon muhiti',
          kr: '20 савол · 25 дақиқа · Реал имтиҳон муҳити'
        }) }}
      </p>

      <p class="hidden sm:block text-[13.5px] leading-[1.55] text-white/90 mt-2.5">
        {{ i18n.t({
          uz: 'Rasmiy imtihon formatida bilimlaringizni sinab ko\'ring va tayyorgarlik darajangizni baholang.',
          kr: 'Расмий имтиҳон форматида билимларингизни синаб кўринг ва тайёргарлик даражангизни баҳоланг.'
        }) }}
      </p>

      <!-- Mobilda tugma kichikroq: aks holda uning tabiiy kengligi matn
           ustuniga sig'may, illyustratsiya ustiga chiqib ketadi. -->
      <NuxtLink to="/test/start/exam"
        class="cta-btn inline-flex items-center gap-2 sm:gap-2.5 h-12 sm:h-[52px] px-4 sm:px-6 mt-5 sm:mt-6
               rounded-2xl text-[13.5px] sm:text-[15px] font-semibold">
        {{ i18n.t({ uz: 'Imtihonni boshlash', kr: 'Имтиҳонни бошлаш' }) }}
        <AppIcon name="arrow" :size="17" />
      </NuxtLink>
    </div>

    <!-- Illyustratsiya namunadagidek yirik va kartaning o'ng chetiga tayangan.
         Kenglik viewport emas, KARTAGA nisbatan (38%): hero kengligi sidebar va
         grid nisbatiga qarab har bir nuqtada boshqacha bo'ladi, shuning uchun
         qat'iy px qiymatlar 768px va 1280px atrofida matn ustiga chiqib ketardi. -->
    <ExamArt aria-hidden="true"
      class="pointer-events-none select-none absolute right-0 sm:right-1 bottom-0
             w-[118px] sm:w-[38%] sm:max-w-[320px]" />
  </section>
</template>

<style scoped>
.cta-btn {
  background: #ffffff;
  color: #2d3d8b;
  box-shadow: 0 14px 30px -14px rgba(0, 0, 0, 0.6);
  transition: transform .2s, box-shadow .2s;
}
.cta-btn:hover { transform: translateY(-2px); box-shadow: 0 18px 34px -14px rgba(0, 0, 0, 0.65); }
.cta-btn:active { transform: translateY(0); }

@media (prefers-reduced-motion: reduce) {
  .cta-btn, .cta-btn:hover { transition: none; transform: none; }
}
</style>
