<script setup lang="ts">
const i18n = useI18n()
const auth = useAuthStore()
const route = useRoute()

const isPremium = computed(() => auth.user?.is_premium ?? false)
const isGuest = computed(() => auth.user?.is_guest ?? false)
const dailyLimit = computed(() => auth.user?.daily_tests?.limit ?? 2)
const usedToday = computed(() => auth.user?.daily_tests?.used_today ?? 0)
const dailyGoal = computed(() => auth.user?.daily_goal || 20)

/** Bugun maqsadga yetish uchun yana nechta test kerak (Premium bilan). */
const goalRemaining = computed(() => Math.max(0, dailyGoal.value - usedToday.value))
const goalPercent = computed(() => Math.min(100, Math.round((usedToday.value / Math.max(1, dailyGoal.value)) * 100)))

/** Progressni faqat cheklovi bor foydalanuvchiga ko'rsatamiz. */
const showProgress = computed(() =>
  !isPremium.value && auth.user?.daily_tests?.limit !== null && goalRemaining.value > 0)

interface Tariff {
  id: string
  price: string
  perDay: string
  period: { uz: string, kr: string }
  best?: boolean
}

// Narxlar backenddagi config/payme.php bilan bir xil (2 900 000 / 4 500 000 tiyin).
const tariffs: Tariff[] = [
  { id: '2weeks', price: '29 000', perDay: '2 071', period: { uz: '2 hafta', kr: '2 ҳафта' } },
  { id: '1month', price: '45 000', perDay: '1 500', period: { uz: '1 oy', kr: '1 ой' }, best: true },
]

// Tarif bosilganda darrov Paymega emas — avval tasdiqlash oynasi chiqadi.
const selected = ref<Tariff | null>(null)
function choose(t: Tariff) { selected.value = t }

/**
 * Ijtimoiy dalil — SOXTA EMAS. Backend haqiqiy to'langan buyurtmalarni
 * sanaydi va son ishonarli chegaradan past bo'lsa null qaytaradi,
 * shunda bu blok umuman ko'rinmaydi.
 */
const { data: stats } = await useAsyncData('pricing-proof',
  () => apiFetch<{ proof: { count: number, window: 'day' | 'week' } | null }>('/pricing/stats'),
  { default: () => ({ proof: null }), server: false })

const proofText = computed(() => {
  const p = stats.value?.proof
  if (!p) return null
  return p.window === 'day'
    ? i18n.t({ uz: `So'nggi 24 soatda ${p.count} kishi Premium oldi`, kr: `Сўнгги 24 соатда ${p.count} киши Премиум олди` })
    : i18n.t({ uz: `So'nggi 7 kunda ${p.count} kishi Premium oldi`, kr: `Сўнгги 7 кунда ${p.count} киши Премиум олди` })
})

// Paymedan qaytish: ?order=<id> → to'lov holatini tekshiramiz
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
    catch { /* qayta urinamiz */ }
    await new Promise(r => setTimeout(r, 1500))
  }
  checking.value = false
})

/** Foyda tilida yozilgan — funksiya nomi emas, natijasi. */
const benefits = computed(() => [
  i18n.t({
    uz: 'Imtihondan o\'tish imkoniyatingizni oshiradigan cheksiz mashq',
    kr: 'Имтиҳондан ўтиш имкониятингизни оширадиган чексиз машқ',
  }),
  i18n.t({
    uz: 'Haqiqiy imtihon sharoitida vaqt bilan mashq qilasiz',
    kr: 'Ҳақиқий имтиҳон шароитида вақт билан машқ қиласиз',
  }),
  i18n.t({
    uz: 'Xato qilgan savollaringiz alohida to\'planadi — ularni yakson qilasiz',
    kr: 'Хато қилган саволларингиз алоҳида тўпланади — уларни яксон қиласиз',
  }),
  i18n.t({
    uz: 'AI siz eng ko\'p xato qilayotgan mavzuni aniqlab, nimadan boshlashni aytadi',
    kr: 'AI сиз энг кўп хато қилаётган мавзуни аниқлаб, нимадан бошлашни айтади',
  }),
  i18n.t({
    uz: 'Reyting va XP to\'liq ochiladi — haftalik sovrinli musobaqada qatnashasiz',
    kr: 'Рейтинг ва XP тўлиқ очилади — ҳафталик совринли мусобақада қатнашасиз',
  }),
])

const freeHas = computed(() => [
  i18n.t({ uz: `Har kuni ${dailyLimit.value} ta test`, kr: `Ҳар куни ${dailyLimit.value} та тест` }),
  i18n.t({ uz: 'Asosiy mavzular va biletlar', kr: 'Асосий мавзулар ва билетлар' }),
  i18n.t({ uz: 'Reyting va statistika', kr: 'Рейтинг ва статистика' }),
])

const freeLacks = computed(() => [
  i18n.t({ uz: 'Kunlik limit mavjud', kr: 'Кунлик лимит мавжуд' }),
  i18n.t({ uz: 'Cheksiz mashq yo\'q', kr: 'Чексиз машқ йўқ' }),
])
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
    <!-- Sarlavha: "hammasi bepul" emas, natijaga yo'naltirilgan -->
    <div class="text-center mb-8">
      <h1 class="text-2xl sm:text-4xl font-semibold tracking-tightest text-ink-900">
        🚗 {{ i18n.t({ uz: 'Imtihonga ishonch bilan tayyorlaning', kr: 'Имтиҳонга ишонч билан тайёрланинг' }) }}
      </h1>
      <p class="mt-3 max-w-xl mx-auto" style="color: var(--text-3)">
        {{ i18n.t({
          uz: 'Bepul rejimni sinab ko\'ring yoki Premium orqali cheksiz mashq qiling.',
          kr: 'Бепул режимни синаб кўринг ёки Премиум орқали чексиз машқ қилинг.'
        }) }}
      </p>
    </div>

    <!-- To'lov natijasi -->
    <div v-if="paidOk" class="max-w-3xl mx-auto mb-6 px-4 py-3.5 rounded-xl flex items-center gap-3"
         style="background: #d1fae5; border: 1px solid #6ee7b7; color: #065f46;">
      <AppIcon name="check" :size="18" />
      <div class="text-sm font-medium">
        {{ i18n.t({ uz: 'To\'lov muvaffaqiyatli — Premium faollashtirildi! 🎉', kr: 'Тўлов муваффақиятли — Премиум фаоллаштирилди! 🎉' }) }}
      </div>
    </div>
    <div v-else-if="checking" class="max-w-3xl mx-auto mb-6 px-4 py-3.5 rounded-xl text-sm text-center"
         style="background: var(--surface-inset); color: var(--text-3);">
      {{ i18n.t({ uz: 'To\'lov holati tekshirilmoqda…', kr: 'Тўлов ҳолати текширилмоқда…' }) }}
    </div>

    <!-- Bugungi progress: odam cheklovni KO'RADI -->
    <div v-if="showProgress" class="max-w-3xl mx-auto mb-6 card p-4 sm:p-5">
      <div class="flex items-baseline justify-between gap-3">
        <span class="text-sm font-medium text-ink-900">
          {{ i18n.t({ uz: 'Bugun siz', kr: 'Бугун сиз' }) }}
        </span>
        <span class="text-sm tabular-nums" style="color: var(--text-3)">
          {{ usedToday }} / {{ dailyGoal }} {{ i18n.t({ uz: 'test', kr: 'тест' }) }}
        </span>
      </div>
      <div class="mt-2.5 h-2 rounded-full overflow-hidden" style="background: var(--surface-inset)">
        <div class="h-full rounded-full transition-all"
             :style="{ width: goalPercent + '%', background: 'linear-gradient(90deg, #f5b820, #fcd34d)' }" />
      </div>
      <p class="mt-2.5 text-sm" style="color: var(--text-3)">
        {{ i18n.t({
          uz: `Premium bilan bugun yana ${goalRemaining} ta test ishlashingiz mumkin.`,
          kr: `Премиум билан бугун яна ${goalRemaining} та тест ишлашингиз мумкин.`
        }) }}
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-5 items-start">
      <!-- BEPUL — ataylab xiraroq -->
      <div class="lg:col-span-2 card p-5 sm:p-6 free-card">
        <div class="text-xs font-semibold uppercase tracking-[0.12em]" style="color: var(--text-4)">
          🆓 {{ i18n.t({ uz: 'Bepul', kr: 'Бепул' }) }}
        </div>
        <div class="mt-3 flex items-baseline gap-1.5">
          <span class="text-3xl font-semibold tabular-nums tracking-tightest text-ink-900">0</span>
          <span class="text-sm" style="color: var(--text-3)">{{ i18n.t({ uz: 'so\'m', kr: 'сўм' }) }}</span>
        </div>

        <ul class="mt-5 space-y-2.5 text-sm">
          <li v-for="f in freeHas" :key="f" class="flex items-start gap-2.5">
            <span class="tick-yes"><AppIcon name="check" :size="10" /></span>
            <span style="color: var(--text-2)">{{ f }}</span>
          </li>
          <li v-for="f in freeLacks" :key="f" class="flex items-start gap-2.5">
            <span class="tick-no">
              <svg viewBox="0 0 20 20" fill="none" class="w-2.5 h-2.5">
                <path d="M6 6l8 8M14 6l-8 8" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" />
              </svg>
            </span>
            <span style="color: var(--text-4)">{{ f }}</span>
          </li>
        </ul>

        <NuxtLink to="/" class="btn-outline w-full mt-6 justify-center">
          {{ i18n.t({ uz: 'Bepul davom etish', kr: 'Бепул давом этиш' }) }}
        </NuxtLink>
      </div>

      <!-- PREMIUM — kattaroq, asosiy -->
      <div class="lg:col-span-3 premium-card">
        <div class="premium-flag">
          🔥 {{ i18n.t({ uz: 'Eng ko\'p tanlanadi', kr: 'Энг кўп танланади' }) }}
        </div>

        <div class="mt-1 text-2xl font-semibold tracking-tightish text-white">Premium</div>
        <p class="mt-1 text-sm" style="color: rgba(255,255,255,0.6)">
          {{ i18n.t({
            uz: 'Yo\'l harakati imtihoniga jiddiy tayyorlanuvchilar uchun',
            kr: 'Йўл ҳаракати имтиҳонига жиддий тайёрланувчилар учун'
          }) }}
        </p>

        <!-- Haqiqiy sotuvlar yetarli bo'lsagina chiqadi -->
        <div v-if="proofText" class="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-2xs"
             style="background: rgba(245,184,32,0.16); color: #fcd34d;">
          🔥 {{ proofText }}
        </div>

        <div v-if="isPremium"
             class="w-full mt-5 h-12 inline-flex items-center justify-center gap-2 px-4 rounded-xl font-medium"
             style="background: rgba(110,231,183,0.15); color: #6ee7b7;">
          <AppIcon name="check" :size="16" />
          {{ i18n.t({ uz: 'Sizda Premium faol', kr: 'Сизда Премиум фаол' }) }}
        </div>

        <template v-else>
          <div class="mt-5 space-y-3">
            <button v-for="t in tariffs" :key="t.id" type="button" class="tariff" :class="t.best && 'tariff-best'"
                    @click="choose(t)">
              <span v-if="t.best" class="tariff-badge">
                ⭐ {{ i18n.t({ uz: 'Tavsiya etamiz', kr: 'Тавсия этамиз' }) }}
              </span>

              <span class="flex items-center justify-between gap-3">
                <span class="text-left">
                  <span class="block text-sm font-semibold" :style="{ color: t.best ? '#3d2c00' : 'var(--text-1)' }">
                    {{ i18n.t(t.period) }}
                  </span>
                  <span class="block text-2xs tabular-nums mt-0.5"
                        :style="{ color: t.best ? 'rgba(61,44,0,0.7)' : 'var(--text-3)' }">
                    {{ t.price }} {{ i18n.t({ uz: 'so\'m', kr: 'сўм' }) }}
                    · ≈ {{ t.perDay }} {{ i18n.t({ uz: 'so\'m/kun', kr: 'сўм/кун' }) }}
                  </span>
                </span>
                <span class="tariff-cta" :class="t.best ? 'tariff-cta-best' : 'tariff-cta-plain'">
                  🚀 {{ i18n.t({ uz: 'Boshlash', kr: 'Бошлаш' }) }}
                </span>
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

          <!-- Ishonch bloki: "har oy pul yechiladimi?" qo'rquvini yo'qotadi -->
          <div class="mt-4 px-4 py-3 rounded-xl" style="background: rgba(255,255,255,0.07)">
            <div class="flex items-center gap-2 text-sm font-medium" style="color: rgba(255,255,255,0.92)">
              <AppIcon name="lock" :size="14" />
              {{ i18n.t({ uz: 'Payme orqali xavfsiz to\'lov', kr: 'Payme орқали хавфсиз тўлов' }) }}
            </div>
            <ul class="mt-2 space-y-1 text-2xs" style="color: rgba(255,255,255,0.6)">
              <li>✓ {{ i18n.t({ uz: 'Bir martalik to\'lov', kr: 'Бир марталик тўлов' }) }}</li>
              <li>✓ {{ i18n.t({ uz: 'Avtomatik yechim yo\'q', kr: 'Автоматик ечим йўқ' }) }}</li>
              <li>✓ {{ i18n.t({ uz: 'Yashirin to\'lovlar yo\'q', kr: 'Яширин тўловлар йўқ' }) }}</li>
            </ul>
          </div>
        </template>

        <div class="mt-5 pt-5" style="border-top: 1px solid rgba(255,255,255,0.12)">
          <div class="text-sm font-medium mb-3" style="color: rgba(255,255,255,0.92)">
            {{ i18n.t({ uz: 'Premium bilan siz:', kr: 'Премиум билан сиз:' }) }}
          </div>
          <ul class="space-y-2.5 text-sm">
            <li v-for="b in benefits" :key="b" class="flex items-start gap-2.5">
              <span class="tick-dark"><AppIcon name="check" :size="10" /></span>
              <span style="color: rgba(255,255,255,0.88)">{{ b }}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <p class="text-center text-2xs mt-8" style="color: var(--text-4)">
      {{ i18n.t({
        uz: 'Bepul tarif doim bepul qoladi.',
        kr: 'Бепул тариф доим бепул қолади.'
      }) }}
    </p>

    <PremiumOfferModal :open="selected !== null" :tariff="selected" @close="selected = null" />
  </div>
</template>

<style scoped>
/* Bepul karta ataylab pastroq urg'uda — ko'z Premiumga tushsin */
.free-card { opacity: 0.82; }
.free-card:hover { opacity: 1; transition: opacity .2s; }

.tick-yes, .tick-no, .tick-dark {
  width: 1rem; height: 1rem; border-radius: 9999px;
  display: grid; place-items: center; flex-shrink: 0; margin-top: 0.125rem;
}
/* Yashil belgilar saytning qolgan qismidagi kabi — ikkala mavzuda ham
   o'qiladi. DIQQAT: bu loyihada scoped CSS'dagi :global(.dark) qoidalari
   qurishda tushib qoladi, shuning uchun mavzuga bog'liq override yozilmaydi. */
.tick-yes { background: #d1fae5; color: #047857; }
.tick-no  { background: var(--surface-inset); color: var(--text-4); }
.tick-dark { background: rgba(255,255,255,0.14); color: #6ee7b7; }

.premium-card {
  position: relative;
  border-radius: 1.25rem;
  padding: 2rem 1.5rem 1.5rem;
  background: #0e1016;
  border: 1px solid #0e1016;
  box-shadow: 0 24px 64px -20px rgba(15, 23, 42, 0.45);
}
@media (min-width: 640px) { .premium-card { padding: 2.25rem 1.75rem 1.75rem; } }

.premium-flag {
  position: absolute;
  top: -0.75rem; left: 1.5rem;
  padding: 0.25rem 0.7rem;
  border-radius: 9999px;
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: #3d2c00;
  background: linear-gradient(180deg, #fcd34d, #f5b820);
  box-shadow: 0 4px 12px -4px rgba(245, 184, 32, 0.6);
}

.tariff {
  position: relative;
  display: block;
  width: 100%;
  padding: 0.9rem 1rem;
  border-radius: 0.875rem;
  background: #fff;
  border: 1px solid transparent;
  transition: transform .15s, box-shadow .15s, filter .15s;
}
.tariff:hover { transform: translateY(-1px); }
.tariff:active { transform: translateY(0); }

/* Tavsiya etilgan tarif — sariq, ko'zga tashlanadigan */
.tariff-best {
  margin-top: 0.9rem;
  background: linear-gradient(180deg, #fde68a, #fcd34d);
  box-shadow: 0 10px 24px -10px rgba(245, 184, 32, 0.75);
}
.tariff-best:hover { filter: brightness(1.03); }

.tariff-badge {
  position: absolute;
  top: -0.6rem; right: 0.9rem;
  padding: 0.15rem 0.55rem;
  border-radius: 9999px;
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  color: #fff;
  background: #0e1016;
}

.tariff-cta {
  flex-shrink: 0;
  padding: 0.5rem 0.85rem;
  border-radius: 0.625rem;
  font-size: 0.8rem;
  font-weight: 600;
  white-space: nowrap;
}
.tariff-cta-best  { background: #0e1016; color: #fcd34d; }
.tariff-cta-plain { background: var(--surface-inset); color: var(--text-1); }
</style>
