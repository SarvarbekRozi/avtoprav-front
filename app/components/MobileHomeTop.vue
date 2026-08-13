<script setup lang="ts">
/**
 * Bosh sahifaning MOBIL yuqori bloki (< md). AI tavsiyagacha bo'lgan qism
 * maketga 1:1 mos: sarlavha qatori → ixcham tayyorgarlik → imtihon banneri →
 * XP musobaqasi banneri.
 *
 * Nega ish stoli komponentlarini qayta ishlatmadik: mobil maketda kartalar
 * shunchaki qайta terilmaydi — MAZMUNI boshqa. Tayyorgarlikda doira, urinishlar
 * va "keyingi maqsad" yo'q (o'rniga aniqlik), imtihon kartasida illyustratsiya
 * va tugma yo'q, XP kartasida 5 bosqichli zinapoya yo'q. Bitta komponentni
 * ikki xil mazmunga moslashtirish `hidden`/`md:hidden` shoxlari bilan uni
 * o'qishga imkonsiz qilardi.
 */
const props = defineProps<{
  readiness: number
  accuracy: number
  points: number
  /** imtihongacha qolgan kun; null bo'lsa "Sanani belgilash" havolasi chiqadi */
  examDaysLeft: number | null
}>()

const i18n = useI18n()

const MONTH_LATN = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentyabr', 'oktyabr', 'noyabr', 'dekabr']
const MONTH_CYRL = ['январ', 'феврал', 'март', 'апрел', 'май', 'июн', 'июл', 'август', 'сентябр', 'октябр', 'ноябр', 'декабр']

// Sana faqat klientda: SSR serverning vaqt mintaqasida boshqa kun chiqib
// hidratsiya nomuvofiqligi beradi (DashboardHeader'dagi bilan bir xil sabab).
const now = ref<Date | null>(null)
onMounted(() => { now.value = new Date() })

const dateLabel = computed(() => {
  const d = now.value
  if (!d) return ''
  const months = i18n.locale.value === 'uz_cyrl' ? MONTH_CYRL : MONTH_LATN
  // Maketda hafta kuni YO'Q — 375px da "Bugun, 13-avgust, payshanba" XP chipi
  // bilan bir qatorga sig'masdi.
  return `${i18n.t({ uz: 'Bugun', kr: 'Бугун' })}, ${d.getDate()}-${months[d.getMonth()]}`
})

const greeting = computed(() => {
  const h = now.value?.getHours() ?? 12
  if (h < 12) return i18n.t({ uz: 'Xayrli tong', kr: 'Хайрли тонг' })
  if (h < 18) return i18n.t({ uz: 'Xayrli kun', kr: 'Хайрли кун' })
  return i18n.t({ uz: 'Xayrli oqshom', kr: 'Хайрли оқшом' })
})

const pct = computed(() => Math.max(0, Math.min(100, props.readiness)))

/** Imtihon sanasi qo'yilgan bo'lsa qolgan kun, aks holda qo'yishga taklif */
const examLabel = computed(() => {
  const d = props.examDaysLeft
  if (d === null) return i18n.t({ uz: 'Sanani belgilash', kr: 'Санани белгилаш' })
  if (d <= 0) return i18n.t({ uz: 'Imtihon bugun', kr: 'Имтиҳон бугун' })
  return i18n.t({ uz: `Imtihonga ${d} kun`, kr: `Имтиҳонга ${d} кун` })
})
</script>

<template>
  <div class="md:hidden">
    <!-- ── Sarlavha qatori ──
         `pl-14` / `pr-12` — hamburger va bildirishnoma tugmasi `fixed` holda
         shu gutter'lar ustida turadi (DashboardSidebar va default.vue). -->
    <div class="pt-4 pl-14 pr-12 flex items-center gap-3">
      <div class="min-w-0 flex-1">
        <div class="mh-date">{{ dateLabel }}</div>
        <!-- Ismsiz: 375px da hamburger + ism + XP chipi + qo'ng'iroq bir qatorga
             sig'masdi, maketda ham faqat salomlashuv turadi. -->
        <h1 class="mt-1 text-[26px] font-bold tracking-tightish leading-none"
            style="color: var(--text-1);">{{ greeting }}</h1>
      </div>

      <NuxtLink to="/me/stats" class="mh-xp"
        :aria-label="i18n.t({ uz: 'XP balingiz — statistikaga o\'tish', kr: 'XP балингиз — статистикага ўтиш' })">
        <AppIcon name="trophy" :size="15" class="text-amber-500" />
        <span class="tabular-nums">{{ points.toLocaleString() }}</span>
      </NuxtLink>
    </div>

    <!-- ── Tayyorgarlik (ixcham) ── -->
    <section class="mh-card mt-4">
      <div class="flex items-center justify-between gap-3">
        <h2 class="text-[16px] font-medium" style="color: var(--text-2);">
          {{ i18n.t({ uz: 'Tayyorgarlik', kr: 'Тайёргарлик' }) }}
        </h2>
        <NuxtLink to="/me/profile" class="mh-date-link">
          {{ examLabel }}
          <AppIcon name="settings" :size="15" />
        </NuxtLink>
      </div>

      <div class="mt-2 flex items-end justify-between gap-3">
        <div class="text-[40px] font-bold leading-none tabular-nums tracking-tight" style="color: var(--text-1);">
          {{ pct }}%
        </div>
        <div class="text-[14px] pb-1" style="color: var(--text-4);">
          {{ i18n.t({ uz: 'Aniqlik', kr: 'Аниқлик' }) }}: {{ accuracy }}%
        </div>
      </div>

      <!-- 0% da to'ldirish CHIQMAYDI: `Math.max(pct, 1.5)` bilan yumaloq uchli
           ko'k nuqta qolib, hech qanday progress bo'lmasa ham "bir oz bor"
           degan taassurot berardi. -->
      <div class="track mt-3.5" :aria-hidden="true">
        <i v-if="pct > 0" :style="{ width: `${Math.max(pct, 2)}%` }"></i>
      </div>
    </section>

    <!-- ── Imtihon ── -->
    <NuxtLink to="/test/start/exam" class="mh-exam mt-3.5">
      <div class="min-w-0 flex-1">
        <div class="text-white text-[24px] font-bold leading-none tracking-tightish">
          {{ i18n.t({ uz: 'Imtihon', kr: 'Имтиҳон' }) }}
        </div>
        <div class="mt-1.5 text-[14px] text-white/85">
          {{ i18n.t({
            uz: '20 savol · 25 daqiqa · real imtihon',
            kr: '20 савол · 25 дақиқа · реал имтиҳон'
          }) }}
        </div>
      </div>
      <span class="mh-exam-ic" aria-hidden="true">
        <AppIcon name="exam" :size="24" />
      </span>
    </NuxtLink>

    <!-- ── Haftalik XP musobaqasi ── -->
    <NuxtLink to="/me/stats" class="mh-xpc mt-3">
      <span class="mh-xpc-ic" aria-hidden="true">
        <AppIcon name="trophy" :size="24" />
      </span>
      <span class="min-w-0 flex-1">
        <span class="block text-[16px] font-bold leading-tight" style="color: var(--text-1);">
          {{ i18n.t({ uz: 'Haftalik XP musobaqasi', kr: 'Ҳафталик XP мусобақаси' }) }}
        </span>
        <span class="block mt-1 text-[13.5px] leading-[1.4]" style="color: var(--text-3);">
          {{ i18n.t({
            uz: 'XP yig\'ing va yetakchilar ro\'yxatida yuqoriga chiqing',
            kr: 'XP йиғинг ва етакчилар рўйхатида юқорига чиқинг'
          }) }}
        </span>
      </span>
      <AppIcon name="chev-r" :size="18" class="shrink-0" style="color: var(--text-4);" />
    </NuxtLink>
  </div>
</template>

<style scoped>
.mh-date {
  font-size: 11.5px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-4);
}

.mh-xp {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  height: 2.5rem;
  padding: 0 0.875rem;
  border-radius: 9999px;
  background: var(--surface);
  border: 1px solid var(--border-soft);
  box-shadow: var(--shadow-card);
  font-size: 15px;
  font-weight: 600;
  color: var(--text-1);
}

.mh-card {
  padding: 1.125rem 1.25rem 1.25rem;
  border-radius: 18px;
  background: var(--surface);
  border: 1px solid var(--border-soft);
  box-shadow: var(--shadow-card);
}

/* Bosish zonasi 36px: matn o'zi ~20px, pseudo-element joy egallamaydi */
.mh-date-link {
  position: relative;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 14px;
  color: var(--text-4);
}
.mh-date-link::after { content: ''; position: absolute; inset: -8px 0; }

.mh-exam {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  padding: 1.125rem 1.25rem;
  border-radius: 18px;
  /* Ish stolidagi `.exam-cta` bilan bir xil gradient — brend bir joyda ikki
     xil ko'rinmasin. */
  background: linear-gradient(103deg, #4c5bb8 0%, #6c4fd8 48%, #8b3fe8 100%);
  box-shadow: 0 12px 26px -14px rgba(108, 79, 216, 0.7);
}
.mh-exam-ic {
  flex-shrink: 0;
  display: grid;
  place-items: center;
  width: 3.25rem;
  height: 3.25rem;
  border-radius: 9999px;
  background: #ffffff;
  color: #5b4bd0;
}

.mh-xpc {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  padding: 1rem 1.125rem;
  border-radius: 18px;
  background: var(--warn-soft);
  border: 1px solid var(--warn);
}
/* Ochiq mavzuda `--warn` (#f59e0b) to'la ramka sifatida juda quyuq — 40%
   shaffoflik maketdagi yumshoq chegarani beradi. Qorong'ida `--warn-soft`
   allaqachon shaffof, ramka ham shunga mos ochiladi. */
.mh-xpc { border-color: color-mix(in srgb, var(--warn) 40%, transparent); }
.mh-xpc-ic {
  flex-shrink: 0;
  display: grid;
  place-items: center;
  width: 3.25rem;
  height: 3.25rem;
  border-radius: 9999px;
  background: linear-gradient(140deg, #f7a416, #ef8a06);
  color: #ffffff;
  box-shadow: 0 6px 14px -6px rgba(239, 138, 6, 0.7);
}
</style>
