<script setup lang="ts">
/** Dashboard sarlavhasi: sana, salomlashuv (haqiqiy foydalanuvchi ismi), izoh. */
const props = withDefaults(defineProps<{
  /** imtihongacha qolgan kun; null bo'lsa umumiy motivatsion matn chiqadi */
  examDaysLeft?: number | null
}>(), { examDaysLeft: null })

const auth = useAuthStore()
const i18n = useI18n()

const MONTH_LATN = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentyabr', 'oktyabr', 'noyabr', 'dekabr']
const MONTH_CYRL = ['январ', 'феврал', 'март', 'апрел', 'май', 'июн', 'июл', 'август', 'сентябр', 'октябр', 'ноябр', 'декабр']
const DOW_LATN = ['yakshanba', 'dushanba', 'seshanba', 'chorshanba', 'payshanba', 'juma', 'shanba']
const DOW_CYRL = ['якшанба', 'душанба', 'сешанба', 'чоршанба', 'пайшанба', 'жума', 'шанба']

// Sana faqat klientda hisoblansin — SSR serverning vaqt mintaqasida boshqacha
// chiqib, hidratsiya nomuvofiqligiga olib keladi.
const now = ref<Date | null>(null)
onMounted(() => { now.value = new Date() })

const dateLabel = computed(() => {
  const d = now.value
  if (!d) return ''
  const cyrl = i18n.locale.value === 'uz_cyrl'
  const month = (cyrl ? MONTH_CYRL : MONTH_LATN)[d.getMonth()]
  const dow = (cyrl ? DOW_CYRL : DOW_LATN)[d.getDay()]
  return `${i18n.t({ uz: 'Bugun', kr: 'Бугун' })}, ${d.getDate()}-${month}, ${dow}`
})

const greeting = computed(() => {
  const h = now.value?.getHours() ?? 12
  if (h < 12) return i18n.t({ uz: 'Xayrli tong', kr: 'Хайрли тонг' })
  if (h < 18) return i18n.t({ uz: 'Xayrli kun', kr: 'Хайрли кун' })
  return i18n.t({ uz: 'Xayrli oqshom', kr: 'Хайрли оқшом' })
})

const firstName = computed(() => {
  if (!auth.user || auth.user.is_guest) return ''
  const src = auth.user.full_name || auth.user.login || ''
  return src.split(/\s+/).filter(Boolean)[0] || ''
})

const subtitle = computed(() => {
  const d = props.examDaysLeft
  if (d !== null && d > 0) {
    return i18n.t({
      uz: `Imtihongacha ${d} kun qoldi — bugungi mashqni o'tkazib yubormang!`,
      kr: `Имтиҳонгача ${d} кун қолди — бугунги машқни ўтказиб юборманг!`,
    })
  }
  if (d === 0) {
    return i18n.t({
      uz: 'Imtihon bugun! Oxirgi marta takrorlab oling.',
      kr: 'Имтиҳон бугун! Охирги марта такрорлаб олинг.',
    })
  }
  return i18n.t({
    uz: 'Maqsadingizga yaqinlashmoqda sizni ajoyib kun kutmoqda!',
    kr: 'Мақсадингизга яқинлашмоқда сизни ажойиб кун кутмоқда!',
  })
})
</script>

<template>
  <div class="min-w-0">
    <!-- Bo'sh bo'lsa ham balandlik saqlansin — mount'dan keyin sahifa sakramaydi -->
    <div class="text-[13px] font-medium h-[18px]" style="color: var(--text-4);">{{ dateLabel }}</div>

    <h1 class="mt-1.5 font-bold tracking-tightish leading-[1.12] text-[26px] sm:text-[32px] lg:text-[34px]"
        style="color: var(--text-1);">
      {{ greeting }}<template v-if="firstName">, {{ firstName }}</template>
      <span class="wave inline-block ml-1.5" aria-hidden="true">👋</span>
    </h1>

    <p class="mt-2 text-sm leading-relaxed max-w-[42ch]" style="color: var(--text-3);">
      {{ subtitle }}
    </p>
  </div>
</template>

<style scoped>
.wave {
  transform-origin: 70% 80%;
  animation: wave 3.4s ease-in-out infinite;
}
@keyframes wave {
  0%, 60%, 100% { transform: rotate(0deg); }
  65%  { transform: rotate(14deg); }
  72%  { transform: rotate(-8deg); }
  79%  { transform: rotate(12deg); }
  86%  { transform: rotate(-4deg); }
}
@media (prefers-reduced-motion: reduce) { .wave { animation: none; } }
</style>
