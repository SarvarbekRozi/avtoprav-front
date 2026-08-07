<script setup lang="ts">
/**
 * "Imtihonga tayyorgarlik" paneli.
 *
 * Barcha raqamlar GET /me/stats dan keladi (totals.*) + XP `auth.user.points` dan.
 * Hech biri qattiq yozilmagan.
 *
 * readiness_percent = mastered / (bank_total * 0.90) — ya'ni "imtihondan o'tish
 * ehtimoli" EMAS, balki bazani qanchalik o'zlashtirganingiz. Sarlavha shunga mos.
 */
const props = defineProps<{
  readiness: number
  attempts: number
  coverage: number
  seen: number
  bankTotal: number
  points: number
}>()

const i18n = useI18n()
const theme = useTheme()

const SIZE = 104
const THICK = 10
const RADIUS = (SIZE - THICK) / 2 - 1
const CIRC = 2 * Math.PI * RADIUS

const pct = computed(() => Math.max(0, Math.min(100, props.readiness)))
const dash = computed(() => (pct.value / 100) * CIRC)
const trackColor = computed(() => theme.isDark.value ? 'rgba(255,255,255,0.09)' : '#e8ecf8')

// Qamrov: son va maxraj backendda turli filtrlardan kelgani uchun 100 dan
// oshib ketishi mumkin — ko'rsatishda qisamiz.
const coveragePct = computed(() => Math.max(0, Math.min(100, props.coverage)))

// Keyingi maqsad: qamrov bo'yicha eng yaqin yaxlit bosqich — "endi nima qilay?"
// degan savolga javob. Chegaralar mahalliy, lekin holat haqiqiy `coverage` dan.
// DIQQAT: bu QAMROV (ko'rilgan savollar), o'zlashtirish emas — matn shunga mos.
const COVERAGE_STEPS = [10, 25, 50, 75, 100]
const nextGoal = computed(() => {
  const next = COVERAGE_STEPS.find(m => coveragePct.value < m)
  return next === undefined
    ? i18n.t({ uz: 'Butun baza ko\'rib chiqildi', kr: 'Бутун база кўриб чиқилди' })
    : i18n.t({ uz: `${next}% qamrovga yetish`, kr: `${next}% қамровга етиш` })
})

const metrics = computed(() => [
  {
    key: 'attempts',
    value: props.attempts.toLocaleString(),
    label: i18n.t({ uz: 'Urinishlar', kr: 'Уринишлар' }),
  },
  {
    key: 'coverage',
    value: `${coveragePct.value}%`,
    label: i18n.t({ uz: 'Qamrov', kr: 'Қамров' }),
  },
  {
    key: 'seen',
    // Bank hajmi ajratgichsiz — /me/stats sahifasidagi "0 / 1260 savol" bilan bir xil ko'rinsin
    value: String(props.seen),
    suffix: `/ ${props.bankTotal}`,
    label: i18n.t({ uz: 'Savollar', kr: 'Саволлар' }),
  },
])
</script>

<template>
  <section class="card p-5 sm:p-6 h-full flex flex-col justify-center">
    <!-- Sarlavha + XP -->
    <div class="flex items-start justify-between gap-3">
      <h2 class="text-[17px] font-semibold leading-tight" style="color: var(--text-1);">
        {{ i18n.t({ uz: 'Imtihonga tayyorgarlik', kr: 'Имтиҳонга тайёргарлик' }) }}
      </h2>

      <NuxtLink to="/me/stats"
        class="xp-pill group inline-flex items-center gap-1.5 h-9 pl-3 pr-2 rounded-full text-[13.5px] font-semibold tabular-nums shrink-0"
        :aria-label="i18n.t({ uz: 'XP balingiz — statistikaga o\'tish', kr: 'XP балингиз — статистикага ўтиш' })">
        <AppIcon name="trophy" :size="14" class="text-amber-500" />
        {{ points.toLocaleString() }} XP
        <AppIcon name="chev-r" :size="14" class="transition-transform group-hover:translate-x-0.5"
                 style="color: var(--text-4);" />
      </NuxtLink>
    </div>

    <!-- Doira + ko'rsatkichlar -->
    <div class="mt-5 flex items-center gap-5 sm:gap-6 lg:gap-7">
      <div class="relative shrink-0" :style="{ width: `${SIZE}px`, height: `${SIZE}px` }">
        <svg :width="SIZE" :height="SIZE" :viewBox="`0 0 ${SIZE} ${SIZE}`" role="img"
             :aria-label="i18n.t({ uz: `Tayyorgarlik ${pct} foiz`, kr: `Тайёргарлик ${pct} фоиз` })">
          <circle :cx="SIZE / 2" :cy="SIZE / 2" :r="RADIUS" fill="none"
                  :stroke="trackColor" :stroke-width="THICK" />
          <circle :cx="SIZE / 2" :cy="SIZE / 2" :r="RADIUS" fill="none"
                  stroke="var(--primary)" :stroke-width="THICK" stroke-linecap="round"
                  :stroke-dasharray="`${dash} ${CIRC}`"
                  :transform="`rotate(-90 ${SIZE / 2} ${SIZE / 2})`"
                  class="ring-value" />
        </svg>
        <div class="absolute inset-0 grid place-items-center">
          <span class="text-[22px] font-bold tabular-nums tracking-tight" style="color: var(--text-1);">
            {{ pct }}%
          </span>
        </div>
      </div>

      <!-- Oxirgi ustun ("Keyingi maqsad") matnli, shuning uchun kengroq ulush oladi —
           aks holda 1280px atrofida u 3–4 qatorga bo'linib ketadi. -->
      <!-- items-center: kataklar cho'zilmasin, raqamlar doira bilan bir sathda tursin
           (ajratuvchi chiziqlar ham matn balandligicha qoladi — namunadagidek). -->
      <!-- Oddiy grid, <dl> emas: ro'yxatning oxirgi katagi havola bo'lgani uchun
           <dl> kontent modeli buzilardi (<dl> ichida faqat dt/dd/div bo'lishi mumkin). -->
      <div class="flex-1 min-w-0 grid grid-cols-2 gap-y-4 items-center
                  lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,2fr)]">
        <div v-for="(m, i) in metrics" :key="m.key"
             class="min-w-0 lg:px-3 xl:px-4 2xl:px-5" :class="i > 0 ? 'lg:vsep' : ''">
          <div class="text-[22px] font-bold tabular-nums leading-none truncate" style="color: var(--text-1);">
            {{ m.value }}<span v-if="m.suffix" class="text-xs font-medium ml-1" style="color: var(--text-4);">{{ m.suffix }}</span>
          </div>
          <div class="text-xs mt-2 truncate" style="color: var(--text-4);">{{ m.label }}</div>
        </div>

        <NuxtLink to="/me/stats"
          class="group min-w-0 lg:px-3 xl:px-4 2xl:px-5 lg:vsep flex items-center gap-1.5">
          <span class="min-w-0">
            <span class="block text-xs" style="color: var(--text-4);">
              {{ i18n.t({ uz: 'Keyingi maqsad', kr: 'Кейинги мақсад' }) }}
            </span>
            <!-- line-clamp-2: tor ekranlarda 3-qatorga bo'linib kartani cho'zmasin -->
            <span class="block text-[13.5px] font-semibold leading-tight mt-1.5 line-clamp-2" style="color: var(--text-2);">
              {{ nextGoal }}
            </span>
          </span>
          <AppIcon name="chev-r" :size="16"
                   class="ml-auto shrink-0 transition-transform group-hover:translate-x-0.5"
                   style="color: var(--text-4);" />
        </NuxtLink>
      </div>
    </div>

    <div class="track mt-5" :aria-hidden="true">
      <i :style="{ width: `${Math.max(pct, 1.5)}%` }"></i>
    </div>
  </section>
</template>

<style scoped>
.xp-pill {
  background: var(--surface-inset);
  color: var(--text-1);
  transition: filter .15s;
}
.xp-pill:hover { filter: brightness(0.97); }

.ring-value {
  transition: stroke-dasharray .8s cubic-bezier(.34, 1.1, .64, 1);
}
@media (prefers-reduced-motion: reduce) {
  .ring-value { transition: none; }
}
</style>
