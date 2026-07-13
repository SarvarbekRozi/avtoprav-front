<script setup lang="ts">
const i18n = useI18n()
const auth = useAuthStore()
const route = useRoute()

const isPremium = computed(() => auth.user?.is_premium ?? false)
const isGuest = computed(() => auth.user?.is_guest ?? false)
const dailyLimit = computed(() => auth.user?.daily_tests?.limit ?? 2)

const loading = ref<string | null>(null)
const error = ref('')

interface Tariff { id: string, price: string, period: { uz: string, kr: string }, note?: { uz: string, kr: string } }
const tariffs: Tariff[] = [
  { id: '2weeks', price: '29 000', period: { uz: '2 hafta', kr: '2 ҳафта' } },
  { id: '1month', price: '45 000', period: { uz: '1 oy', kr: '1 ой' }, note: { uz: 'Eng qulay', kr: 'Энг қулай' } },
]

async function buy(tariff: string) {
  if (!auth.user || auth.user.is_guest) {
    await navigateTo('/register?redirect=/pricing')
    return
  }
  loading.value = tariff
  error.value = ''
  try {
    const res = await apiFetch<{ pay_url: string }>('/me/subscribe', { method: 'POST', body: { tariff } })
    window.location.href = res.pay_url
  }
  catch (e: any) {
    error.value = e?.data?.message || i18n.t({ uz: 'Xatolik yuz berdi, qayta urining.', kr: 'Хатолик юз берди, қайта уриниг.' })
    loading.value = null
  }
}

// Return from Payme: ?order=<id> → poll status until paid
const checking = ref(false)
const paidOk = ref(false)
onMounted(async () => {
  const orderId = route.query.order
  if (!orderId) return
  checking.value = true
  for (let i = 0; i < 12; i++) {
    try {
      const s = await apiFetch<{ is_paid: boolean }>(`/me/orders/${orderId}`)
      if (s.is_paid) {
        await auth.fetchMe()
        paidOk.value = true
        break
      }
    }
    catch { /* ignore, retry */ }
    await new Promise(r => setTimeout(r, 1500))
  }
  checking.value = false
})

const freeFeatures = computed(() => [
  i18n.t({ uz: `Har kuni ${dailyLimit.value} ta test`, kr: `Ҳар куни ${dailyLimit.value} та тест` }),
  i18n.t({ uz: 'Barcha rejimlar: imtihon, bilet, mavzu, marafon…', kr: 'Барча режимлар: имтиҳон, билет, мавзу, марафон…' }),
  i18n.t({ uz: 'AI izohlar va shaxsiy tavsiyalar', kr: 'AI изоҳлар ва шахсий тавсиялар' }),
  i18n.t({ uz: 'Statistika, streak, XP va reyting', kr: 'Статистика, streak, XP ва рейтинг' }),
])

const premiumFeatures = computed(() => [
  i18n.t({ uz: 'Cheksiz testlar — kunlik cheklovsiz', kr: 'Чексиз тестлар — кунлик чекловсиз' }),
  i18n.t({ uz: 'Bepul tarifdagi hamma narsa', kr: 'Бепул тарифдаги ҳамма нарса' }),
  i18n.t({ uz: 'Istalgan payt, istalgancha mashq', kr: 'Исталган пайт, исталганча машқ' }),
  i18n.t({ uz: 'Loyiha rivojini qo\'llab-quvvatlaysiz', kr: 'Лойиҳа ривожини қўллаб-қувватлайсиз' }),
])
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 py-12">
    <div class="text-center mb-10">
      <div class="eyebrow">{{ i18n.t({ uz: 'Tariflar', kr: 'Тарифлар' }) }}</div>
      <h1 class="text-3xl sm:text-4xl font-semibold tracking-tightest text-ink-900 mt-2">
        {{ i18n.t({ uz: 'Sodda va halol', kr: 'Содда ва ҳалол' }) }}
      </h1>
      <p class="mt-3 max-w-xl mx-auto text-ink-500">
        {{ i18n.t({
          uz: `Hammasi bepul — har kuni ${dailyLimit} ta test. Ko'proq mashq qilmoqchimisiz? Premium bilan cheksiz.`,
          kr: `Ҳаммаси бепул — ҳар куни ${dailyLimit} та тест. Кўпроқ машқ қилмоқчимисиз? Премиум билан чексиз.`
        }) }}
      </p>
    </div>

    <!-- Payment result banner -->
    <div v-if="paidOk" class="max-w-3xl mx-auto mb-6 px-4 py-3.5 rounded-xl flex items-center gap-3"
         style="background: #d1fae5; border: 1px solid #6ee7b7; color: #065f46;">
      <AppIcon name="check" :size="18" />
      <div class="text-sm font-medium">{{ i18n.t({ uz: 'To\'lov muvaffaqiyatli — Premium faollashtirildi! 🎉', kr: 'Тўлов муваффақиятли — Премиум фаоллаштирилди! 🎉' }) }}</div>
    </div>
    <div v-else-if="checking" class="max-w-3xl mx-auto mb-6 px-4 py-3.5 rounded-xl text-sm text-center" style="background: var(--surface-inset); color: var(--text-3);">
      {{ i18n.t({ uz: 'To\'lov holati tekshirilmoqda…', kr: 'Тўлов ҳолати текширилмоқда…' }) }}
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
      <!-- Free -->
      <div class="card p-6">
        <div class="text-xs font-semibold uppercase tracking-[0.12em]" style="color: #5f6470">
          {{ i18n.t({ uz: 'Hozir foydalanayotganingiz', kr: 'Ҳозир фойдаланаётганингиз' }) }}
        </div>
        <div class="mt-1 text-xl font-semibold tracking-tightish text-ink-900">
          {{ i18n.t({ uz: 'Bepul', kr: 'Бепул' }) }}
        </div>
        <div class="mt-5 flex items-baseline gap-1.5">
          <span class="text-3xl sm:text-4xl font-semibold tabular-nums tracking-tightest text-ink-900">0</span>
          <span class="text-sm text-ink-500">{{ i18n.t({ uz: 'so\'m', kr: 'сўм' }) }}</span>
        </div>
        <ul class="mt-6 space-y-2.5 text-sm">
          <li v-for="f in freeFeatures" :key="f" class="flex items-start gap-2.5">
            <span class="w-4 h-4 rounded-full grid place-items-center flex-shrink-0 mt-0.5" style="background: #d1fae5; color: #047857">
              <AppIcon name="check" :size="10" />
            </span>
            <span style="color: #2f3340">{{ f }}</span>
          </li>
        </ul>
      </div>

      <!-- Premium -->
      <div class="relative rounded-2xl p-6"
           style="background: #0e1016; color: #fff; border: 1px solid #0e1016; box-shadow: 0 16px 48px -16px rgba(15,23,42,0.35);">
        <div class="absolute -top-3 left-1/2 -translate-x-1/2 badge" style="background: #fef3c7; color: #92400e;">
          <AppIcon name="spark" :size="10" /> {{ i18n.t({ uz: 'Cheksiz mashq', kr: 'Чексиз машқ' }) }}
        </div>

        <div class="text-xs font-semibold uppercase tracking-[0.12em]" style="color: rgba(255,255,255,0.55)">
          {{ i18n.t({ uz: 'Jiddiy tayyorgarlik uchun', kr: 'Жиддий тайёргарлик учун' }) }}
        </div>
        <div class="mt-1 text-xl font-semibold tracking-tightish text-white">Premium</div>

        <div v-if="isPremium"
             class="btn-lg w-full mt-5 inline-flex items-center justify-center gap-2 px-4 rounded-xl font-medium text-base"
             style="background: rgba(110,231,183,0.15); color: #6ee7b7;">
          <AppIcon name="check" :size="16" />
          {{ i18n.t({ uz: 'Sizda Premium faol', kr: 'Сизда Премиум фаол' }) }}
        </div>

        <template v-else>
          <!-- Tariff choices -->
          <div class="mt-5 space-y-2.5">
            <button v-for="t in tariffs" :key="t.id" @click="buy(t.id)" :disabled="loading !== null"
              class="w-full flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl transition-all disabled:opacity-60"
              style="background: #fff; color: #0e1016;">
              <span class="flex items-center gap-2 font-medium">
                {{ i18n.t(t.period) }}
                <span v-if="t.note" class="text-2xs px-1.5 py-0.5 rounded-full" style="background: #fef3c7; color: #92400e;">{{ i18n.t(t.note) }}</span>
              </span>
              <span class="flex items-baseline gap-1">
                <span v-if="loading === t.id" class="text-sm">…</span>
                <template v-else>
                  <span class="text-lg font-bold tabular-nums">{{ t.price }}</span>
                  <span class="text-2xs" style="color: #5f6470">{{ i18n.t({ uz: 'so\'m', kr: 'сўм' }) }}</span>
                </template>
              </span>
            </button>
          </div>

          <div v-if="isGuest" class="mt-3 px-3.5 py-2.5 rounded-lg text-xs leading-relaxed"
               style="background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.75);">
            {{ i18n.t({
              uz: 'Premium olish uchun avval ro\'yxatdan o\'tasiz — progressingiz to\'liq saqlanib qoladi.',
              kr: 'Премиум олиш учун аввал рўйхатдан ўтасиз — прогрессингиз тўлиқ сақланиб қолади.'
            }) }}
          </div>
          <div v-if="error" class="mt-3 px-3.5 py-2.5 rounded-lg text-xs" style="background: rgba(244,63,94,0.15); color: #fca5a5;">{{ error }}</div>
          <div class="mt-3 flex items-center gap-2 text-2xs" style="color: rgba(255,255,255,0.5);">
            <AppIcon name="lock" :size="12" /> {{ i18n.t({ uz: 'Payme orqali xavfsiz to\'lov', kr: 'Payme орқали хавфсиз тўлов' }) }}
          </div>
        </template>

        <ul class="mt-6 space-y-2.5 text-sm">
          <li v-for="f in premiumFeatures" :key="f" class="flex items-start gap-2.5">
            <span class="w-4 h-4 rounded-full grid place-items-center flex-shrink-0 mt-0.5" style="background: rgba(255,255,255,0.12); color: #6ee7b7">
              <AppIcon name="check" :size="10" />
            </span>
            <span class="text-white">{{ f }}</span>
          </li>
        </ul>
      </div>
    </div>

    <p class="text-center text-2xs text-ink-500 mt-8">
      {{ i18n.t({
        uz: 'Yashirin to\'lovlar yo\'q. Bepul tarif doim bepul qoladi.',
        kr: 'Яширин тўловлар йўқ. Бепул тариф доим бепул қолади.'
      }) }}
    </p>
  </div>
</template>
