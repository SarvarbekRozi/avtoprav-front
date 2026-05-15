<script setup lang="ts">
const i18n = useI18n()
const billing = ref<'monthly' | 'yearly'>('monthly')

const plans = computed(() => [
  {
    id: 'free',
    name: i18n.t({ uz: 'Bepul', kr: 'Бепул' }),
    sub:  i18n.t({ uz: 'Sinab ko\'rish uchun', kr: 'Синаб кўриш учун' }),
    price: '0',
    monthly: '0',
    yearly: '0',
    period: i18n.t({ uz: 'so\'m / oy', kr: 'сўм / ой' }),
    cta:   i18n.t({ uz: 'Davom etish', kr: 'Давом этиш' }),
    features: [
      [i18n.t({ uz: 'Kuniga 10 ta savol',          kr: 'Кунига 10 та савол' }),         true],
      [i18n.t({ uz: 'Asosiy mavzular',              kr: 'Асосий мавзулар' }),             true],
      [i18n.t({ uz: 'Asosiy statistika',            kr: 'Асосий статистика' }),           true],
      [i18n.t({ uz: 'Reklamasiz',                   kr: 'Рекламасиз' }),                  true],
      [i18n.t({ uz: '100 ta rasmiy bilet',         kr: '100 та расмий билет' }),        false],
      [i18n.t({ uz: 'AI yordamchi',                kr: 'AI ёрдамчи' }),                  false],
      [i18n.t({ uz: 'Xatolar ustida ish',          kr: 'Хатолар устида иш' }),           false],
      [i18n.t({ uz: 'Imtihon kuni hisoblagichi',   kr: 'Имтиҳон куни ҳисоблагичи' }),    false],
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    sub:  i18n.t({ uz: 'Eng mashhur', kr: 'Энг машҳур' }),
    monthly: '29 000',
    yearly: '249 000',
    period: i18n.t({ uz: 'so\'m / oy', kr: 'сўм / ой' }),
    yearlyPeriod: i18n.t({ uz: 'so\'m / yil', kr: 'сўм / йил' }),
    cta:   i18n.t({ uz: 'Premium olish', kr: 'Премиум олиш' }),
    highlight: true,
    features: [
      [i18n.t({ uz: 'Cheksiz testlar',              kr: 'Чексиз тестлар' }),                true],
      [i18n.t({ uz: 'Hamma mavzular va biletlar',  kr: 'Ҳамма мавзулар ва билетлар' }),  true],
      [i18n.t({ uz: 'AI tahlil va izohlar',         kr: 'AI таҳлил ва изоҳлар' }),         true],
      [i18n.t({ uz: 'Xatolar ustida avtomatik mashq', kr: 'Хатолар устида автоматик машқ' }), true],
      [i18n.t({ uz: 'Kengaytirilgan statistika',    kr: 'Кенгайтирилган статистика' }),   true],
      [i18n.t({ uz: 'Imtihon kuni hisoblagichi',    kr: 'Имтиҳон куни ҳисоблагичи' }),    true],
      [i18n.t({ uz: 'Offline rejim',                kr: 'Оффлайн режим' }),                true],
      [i18n.t({ uz: 'Birinchi 7 kun bepul',          kr: 'Биринчи 7 кун бепул' }),         true],
    ],
  },
  {
    id: 'yearly',
    name: i18n.t({ uz: 'Yillik Pro', kr: 'Йиллик Pro' }),
    sub:  i18n.t({ uz: 'Eng tejamkor', kr: 'Энг тежамкор' }),
    monthly: '249 000',
    yearly: '249 000',
    period: i18n.t({ uz: 'so\'m / yil', kr: 'сўм / йил' }),
    cta:   i18n.t({ uz: 'Yillik olish', kr: 'Йиллик олиш' }),
    features: [
      [i18n.t({ uz: 'Premium\'ning hammasi',         kr: 'Премиумнинг ҳаммаси' }),         true],
      [i18n.t({ uz: '29% chegirma · 4 oy bepul',     kr: '29% чегирма · 4 ой бепул' }),    true],
      [i18n.t({ uz: 'Do\'st taklif qilish bonusi',   kr: 'Дўст таклиф қилиш бонуси' }),    true],
      [i18n.t({ uz: 'Maxsus AI rejimi · Beta',       kr: 'Махсус AI режими · Бета' }),    true],
      [i18n.t({ uz: 'Birinchi navbatdagi qo\'llab',  kr: 'Биринчи навбатдаги қўллаб' }),   true],
      [i18n.t({ uz: 'Sertifikat · PDF',              kr: 'Сертификат · PDF' }),            true],
      [i18n.t({ uz: 'Foydalanish tarixi eksporti',   kr: 'Фойдаланиш тарихи экспорти' }), true],
      [i18n.t({ uz: 'Imtihon kuni nazorat panel',    kr: 'Имтиҳон куни назорат панел' }),  true],
    ],
  },
])

function priceFor(p: any) {
  if (p.id === 'free') return '0'
  if (p.id === 'yearly') return p.yearly
  return billing.value === 'yearly' ? p.yearly : p.monthly
}
function periodFor(p: any) {
  if (p.id === 'free') return p.period
  if (p.id === 'yearly') return p.period
  return billing.value === 'yearly' ? p.yearlyPeriod : p.period
}
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 sm:px-6 py-12">
    <div class="text-center mb-10">
      <div class="eyebrow">{{ i18n.t({ uz: 'Tariflar', kr: 'Тарифлар' }) }}</div>
      <h1 class="text-3xl sm:text-4xl font-semibold tracking-tightest text-ink-900 mt-2">
        {{ i18n.t({ uz: 'Sodda va halol narxlash', kr: 'Содда ва ҳалол нархлаш' }) }}
      </h1>
      <p class="mt-3 max-w-xl mx-auto text-ink-500">
        {{ i18n.t({
          uz: 'Bepul rejimda boshlang, kerak bo\'lsa istalgan vaqtda Premium\'ga o\'ting. Yashirin to\'lov yo\'q.',
          kr: 'Бепул режимда бошланг, керак бўлса исталган вақтда Премиумга ўтинг. Яширин тўлов йўқ.'
        }) }}
      </p>

      <!-- Billing toggle -->
      <div class="inline-flex items-center gap-1 p-1 rounded-lg mt-5 text-sm font-medium bg-ink-100">
        <button @click="billing = 'monthly'"
          class="px-3.5 h-8 inline-flex items-center rounded-md transition-all"
          :class="billing === 'monthly' ? 'bg-white text-ink-900 shadow-soft' : 'text-ink-500 hover:text-ink-900'">
          {{ i18n.t({ uz: 'Oylik', kr: 'Ойлик' }) }}
        </button>
        <button @click="billing = 'yearly'"
          class="px-3.5 h-8 inline-flex items-center rounded-md gap-2 transition-all"
          :class="billing === 'yearly' ? 'bg-white text-ink-900 shadow-soft' : 'text-ink-500 hover:text-ink-900'">
          {{ i18n.t({ uz: 'Yillik', kr: 'Йиллик' }) }}
          <span class="badge-success" style="height: 18px; font-size: 9px;">−29%</span>
        </button>
      </div>
    </div>

    <!-- Plans -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div v-for="p in plans" :key="p.id"
           class="relative rounded-2xl p-6"
           :class="!p.highlight ? 'card' : ''"
           :style="p.highlight
             ? 'background: #0e1016; color: #fff; border: 1px solid #0e1016; box-shadow: 0 16px 48px -16px rgba(15,23,42,0.35);'
             : ''">

        <div v-if="p.highlight"
             class="absolute -top-3 left-1/2 -translate-x-1/2 badge"
             style="background: #fef3c7; color: #92400e;">
          <AppIcon name="spark" :size="10" /> {{ p.sub }}
        </div>

        <div class="text-xs font-semibold uppercase tracking-[0.12em]"
             :style="p.highlight ? 'color: rgba(255,255,255,0.55)' : 'color: #5f6470'">
          {{ p.sub }}
        </div>
        <div class="mt-1 text-xl font-semibold tracking-tightish"
             :class="p.highlight ? 'text-white' : 'text-ink-900'">{{ p.name }}</div>

        <div class="mt-5 flex items-baseline gap-1.5">
          <span class="text-3xl sm:text-4xl font-semibold tabular-nums tracking-tightest"
                :class="p.highlight ? 'text-white' : 'text-ink-900'">{{ priceFor(p) }}</span>
          <span class="text-sm" :class="p.highlight ? 'text-white/55' : 'text-ink-500'">{{ periodFor(p) }}</span>
        </div>

        <button class="btn-lg w-full mt-5 inline-flex items-center justify-center gap-2 px-4 rounded-xl font-medium text-base"
                :class="p.highlight ? '' : 'btn-outline'"
                :style="p.highlight ? 'background: #fff; color: #0e1016;' : ''">
          {{ p.cta }}
        </button>

        <ul class="mt-6 space-y-2.5 text-sm">
          <li v-for="([f, ok]) in p.features" :key="f as string" class="flex items-start gap-2.5">
            <span class="w-4 h-4 rounded-full grid place-items-center flex-shrink-0 mt-0.5"
                  :class="ok ? '' : 'opacity-50'"
                  :style="ok
                    ? (p.highlight ? 'background: rgba(255,255,255,0.12); color: #6ee7b7' : 'background: #d1fae5; color: #047857')
                    : (p.highlight ? 'background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.4)' : 'background: #eeeef1; color: #b6b8c0')">
              <AppIcon :name="ok ? 'check' : 'x'" :size="10" />
            </span>
            <span :class="ok ? '' : 'line-through opacity-50'"
                  :style="p.highlight ? 'color: #fff' : 'color: #2f3340'">{{ f }}</span>
          </li>
        </ul>
      </div>
    </div>

    <!-- Payment methods + promo -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
      <div class="card p-5">
        <div class="text-sm font-semibold mb-3 text-ink-900">{{ i18n.t({ uz: 'To\'lov usullari', kr: "Тўлов усуллари" }) }}</div>
        <div class="flex flex-wrap gap-2">
          <span v-for="p in ['Click','Payme','Uzum','Humo','Uzcard']" :key="p"
                class="inline-flex items-center gap-2 px-3 h-9 rounded-lg border border-ink-200 bg-white text-sm font-medium text-ink-700">
            <AppIcon name="card" :size="14" class="text-ink-400" />
            {{ p }}
          </span>
        </div>
        <div class="text-2xs mt-3 text-ink-500 flex items-center gap-1">
          <AppIcon name="lock" :size="10" />
          {{ i18n.t({ uz: 'Barcha to\'lovlar SSL bilan shifrlangan.', kr: 'Барча тўловлар SSL билан шифрланган.' }) }}
        </div>
      </div>

      <div class="card p-5 flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div class="flex-1">
          <div class="text-sm font-semibold mb-1 text-ink-900">{{ i18n.t({ uz: 'Promokod', kr: 'Промокод' }) }}</div>
          <div class="text-2xs text-ink-500">{{ i18n.t({ uz: 'Do\'stingiz kodi bilan 30% chegirma oling', kr: "Дўстингиз коди билан 30% чегирма олинг" }) }}</div>
        </div>
        <div class="flex gap-2 w-full sm:w-auto">
          <input class="input flex-1 sm:w-44" placeholder="UZ-DRIVE-26" />
          <button class="btn-outline">{{ i18n.t({ uz: 'Qo\'llash', kr: 'Қўллаш' }) }}</button>
        </div>
      </div>
    </div>
  </div>
</template>
