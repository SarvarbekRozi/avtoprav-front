<script setup lang="ts">
const i18n = useI18n()
const auth = useAuthStore()
const route = useRoute()

const isPremium = computed(() => auth.user?.is_premium ?? false)
const isGuest = computed(() => auth.user?.is_guest ?? false)
const dailyLimit = computed(() => auth.user?.daily_tests?.limit ?? 2)
const usedToday = computed(() => auth.user?.daily_tests?.used_today ?? 0)
const dailyGoal = computed(() => auth.user?.daily_goal || 20)

const goalRemaining = computed(() => Math.max(0, dailyGoal.value - usedToday.value))
const goalPercent = computed(() => Math.min(100, Math.round((usedToday.value / Math.max(1, dailyGoal.value)) * 100)))
const showProgress = computed(() =>
  !isPremium.value && auth.user?.daily_tests?.limit !== null && goalRemaining.value > 0)

interface Tariff {
  id: string
  price: string
  perDay: string
  period: { uz: string, kr: string }
}

// Narxlar backenddagi config/payme.php bilan bir xil (2 900 000 / 4 500 000 tiyin).
const monthly: Tariff = { id: '1month', price: '45 000', perDay: '1 500', period: { uz: '1 oy', kr: '1 ой' } }
const biweekly: Tariff = { id: '2weeks', price: '29 000', perDay: '2 071', period: { uz: '2 hafta', kr: '2 ҳафта' } }

// Narx bosilganda to'lov oynasi ochiladi (to'g'ridan-to'g'ri Paymega emas).
const selected = ref<Tariff | null>(null)

/**
 * Ijtimoiy dalil — faqat HAQIQIY raqamlar. Backend to'langan buyurtmalarni va
 * faol o'quvchilarni sanaydi; son ishonarli chegaradan past bo'lsa null
 * qaytaradi va bu blok umuman ko'rinmaydi.
 */
const { data: stats } = await useAsyncData('pricing-stats',
  () => apiFetch<{
    proof: { count: number, window: 'day' | 'week' } | null
    activity: { learners_7d: number, tests_today: number } | null
  }>('/pricing/stats'),
  { default: () => ({ proof: null, activity: null }), server: false })

const socialProof = computed(() => {
  const p = stats.value?.proof
  if (p) {
    return p.window === 'day'
      ? i18n.t({ uz: `So'nggi 24 soatda ${p.count} kishi Premium oldi`, kr: `Сўнгги 24 соатда ${p.count} киши Премиум олди` })
      : i18n.t({ uz: `So'nggi 7 kunda ${p.count} kishi Premium oldi`, kr: `Сўнгги 7 кунда ${p.count} киши Премиум олди` })
  }
  const a = stats.value?.activity
  if (a) {
    return i18n.t({
      uz: `${a.learners_7d} kishi shu hafta imtihonga tayyorlanmoqda`,
      kr: `${a.learners_7d} киши шу ҳафта имтиҳонга тайёрланмоқда`,
    })
  }
  return null
})

// Paymedan qaytish: ?order=<id>
const checking = ref(false)
const paidOk = ref(false)
onMounted(async () => {
  const orderId = route.query.order
  if (!orderId) return
  checking.value = true
  for (let i = 0; i < 12; i++) {
    try {
      const s = await apiFetch<{ is_paid: boolean }>(`/me/orders/${orderId}`)
      if (s.is_paid) { await auth.fetchMe(); paidOk.value = true; break }
    }
    catch { /* qayta urinamiz */ }
    await new Promise(r => setTimeout(r, 1500))
  }
  checking.value = false
})

/** Foyda tilida — funksiya nomi emas, natijasi. */
const benefits = computed(() => [
  { icon: 'bolt', title: i18n.t({ uz: 'Cheksiz mashq', kr: 'Чексиз машқ' }),
    desc: i18n.t({ uz: 'Imtihondan o\'tish imkoniyatingizni oshiradigan cheksiz testlar', kr: 'Имтиҳондан ўтиш имкониятингизни оширадиган чексиз тестлар' }) },
  { icon: 'exam', title: i18n.t({ uz: 'Imtihon rejimi', kr: 'Имтиҳон режими' }),
    desc: i18n.t({ uz: 'Haqiqiy imtihon sharoitida, vaqt bilan mashq qilasiz', kr: 'Ҳақиқий имтиҳон шароитида, вақт билан машқ қиласиз' }) },
  { icon: 'refresh', title: i18n.t({ uz: 'Xatolar ustida ish', kr: 'Хатолар устида иш' }),
    desc: i18n.t({ uz: 'Xato qilgan savollaringiz to\'planadi — ularni yakson qilasiz', kr: 'Хато қилган саволларингиз тўпланади — уларни яксон қиласиз' }) },
  { icon: 'spark', title: i18n.t({ uz: 'AI tahlil', kr: 'AI таҳлил' }),
    desc: i18n.t({ uz: 'Eng ko\'p xato qilayotgan mavzuingizni aniqlab, nimadan boshlashni aytadi', kr: 'Энг кўп хато қилаётган мавзуингизни аниқлаб, нимадан бошлашни айтади' }) },
  { icon: 'trophy', title: i18n.t({ uz: 'Reyting va XP', kr: 'Рейтинг ва XP' }),
    desc: i18n.t({ uz: 'To\'liq ochiladi — haftalik sovrinli musobaqada qatnashasiz', kr: 'Тўлиқ очилади — ҳафталик совринли мусобақада қатнашасиз' }) },
  { icon: 'book', title: i18n.t({ uz: 'Barcha biletlar', kr: 'Барча билетлар' }),
    desc: i18n.t({ uz: 'Rasmiy biletlar va mavzular bo\'yicha cheklovsiz kirish', kr: 'Расмий билетлар ва мавзулар бўйича чекловсиз кириш' }) },
])
</script>

<template>
  <div class="pricing-wrap">
    <!-- Yumshoq ko'k porlash — Apple/Stripe uslubidagi fon -->
    <div class="glow glow-a" aria-hidden="true" />
    <div class="glow glow-b" aria-hidden="true" />

    <div class="relative max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <!-- Sarlavha -->
      <div class="text-center">
        <div v-if="socialProof" class="proof-pill">
          <span class="proof-dot" /> {{ socialProof }}
        </div>

        <h1 class="mt-4 text-[1.75rem] sm:text-5xl font-semibold tracking-tightest text-ink-900 leading-[1.1]">
          {{ i18n.t({ uz: 'Imtihonga ishonch bilan', kr: 'Имтиҳонга ишонч билан' }) }}<br class="hidden sm:block">
          {{ i18n.t({ uz: 'tayyorlaning', kr: 'тайёрланинг' }) }}
        </h1>
        <p class="mt-4 max-w-lg mx-auto text-[15px] sm:text-base" style="color: var(--text-3)">
          {{ i18n.t({
            uz: 'Bepul rejimni sinab ko\'ring yoki Premium bilan cheklovlarsiz mashq qiling.',
            kr: 'Бепул режимни синаб кўринг ёки Премиум билан чекловларсиз машқ қилинг.'
          }) }}
        </p>
      </div>

      <!-- To'lov natijasi -->
      <div v-if="paidOk" class="max-w-md mx-auto mt-8 px-4 py-3.5 rounded-xl flex items-center gap-3"
           style="background: #d1fae5; border: 1px solid #6ee7b7; color: #065f46;">
        <AppIcon name="check" :size="18" />
        <div class="text-sm font-medium">
          {{ i18n.t({ uz: 'To\'lov muvaffaqiyatli — Premium faollashtirildi! 🎉', kr: 'Тўлов муваффақиятли — Премиум фаоллаштирилди! 🎉' }) }}
        </div>
      </div>
      <div v-else-if="checking" class="max-w-md mx-auto mt-8 px-4 py-3.5 rounded-xl text-sm text-center"
           style="background: var(--surface-inset); color: var(--text-3);">
        {{ i18n.t({ uz: 'To\'lov holati tekshirilmoqda…', kr: 'Тўлов ҳолати текширилмоқда…' }) }}
      </div>

      <!-- Bugungi cheklov ko'rinib tursin -->
      <div v-if="showProgress" class="max-w-md mx-auto mt-8 progress-box">
        <div class="flex items-baseline justify-between gap-3">
          <span class="text-sm font-medium text-ink-900">{{ i18n.t({ uz: 'Bugun siz', kr: 'Бугун сиз' }) }}</span>
          <span class="text-sm tabular-nums" style="color: var(--text-3)">
            {{ usedToday }} / {{ dailyGoal }} {{ i18n.t({ uz: 'test', kr: 'тест' }) }}
          </span>
        </div>
        <div class="mt-2.5 h-1.5 rounded-full overflow-hidden" style="background: var(--surface-inset)">
          <div class="h-full rounded-full" :style="{ width: goalPercent + '%', background: 'linear-gradient(90deg,#f5b820,#fcd34d)' }" />
        </div>
        <p class="mt-2.5 text-2xs" style="color: var(--text-3)">
          {{ i18n.t({
            uz: `Premium bilan bugun yana ${goalRemaining} ta test ishlashingiz mumkin.`,
            kr: `Премиум билан бугун яна ${goalRemaining} та тест ишлашингиз мумкин.`
          }) }}
        </p>
      </div>

      <!-- ASOSIY: Premium karta markazda -->
      <div class="mt-10 sm:mt-12 flex justify-center">
        <div class="hero-card">
          <div class="hero-badge">
            <AppIcon name="star" :size="11" /> {{ i18n.t({ uz: 'Eng mashhur', kr: 'Энг машҳур' }) }}
          </div>

          <div class="text-center">
            <div class="text-xs font-semibold uppercase tracking-[0.16em]" style="color: rgba(255,255,255,0.5)">
              Premium
            </div>

            <template v-if="isPremium">
              <div class="mt-6 mb-2 inline-flex items-center gap-2 px-4 h-12 rounded-xl font-medium"
                   style="background: rgba(110,231,183,0.15); color: #6ee7b7;">
                <AppIcon name="check" :size="16" />
                {{ i18n.t({ uz: 'Sizda Premium faol', kr: 'Сизда Премиум фаол' }) }}
              </div>
            </template>

            <template v-else>
              <!-- 1 oylik — asosiy urg'u -->
              <div class="mt-4 flex items-end justify-center gap-1.5">
                <span class="text-[3.25rem] sm:text-6xl font-semibold tabular-nums tracking-tightest leading-none text-white">
                  45 000
                </span>
                <span class="text-base pb-1.5" style="color: rgba(255,255,255,0.6)">
                  {{ i18n.t({ uz: 'so\'m', kr: 'сўм' }) }}
                </span>
              </div>
              <div class="mt-2 text-sm" style="color: rgba(255,255,255,0.62)">
                {{ i18n.t({ uz: '1 oy · atigi 1 500 so\'m kuniga', kr: '1 ой · атиги 1 500 сўм кунига' }) }}
              </div>

              <button type="button" class="hero-cta" @click="selected = monthly">
                {{ i18n.t({ uz: 'Premiumni boshlash', kr: 'Премиумни бошлаш' }) }}
                <svg viewBox="0 0 20 20" fill="none" class="w-[18px] h-[18px]">
                  <path d="M4 10h11M10.5 5.5L15 10l-4.5 4.5" stroke="currentColor" stroke-width="2"
                        stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </button>

              <!-- 2 haftalik — ikkinchi darajali -->
              <button type="button" class="hero-alt" @click="selected = biweekly">
                {{ i18n.t({ uz: 'yoki 2 hafta — 29 000 so\'m', kr: 'ёки 2 ҳафта — 29 000 сўм' }) }}
              </button>

              <div v-if="isGuest" class="mt-4 px-3.5 py-2.5 rounded-lg text-2xs leading-relaxed text-left"
                   style="background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.7);">
                {{ i18n.t({
                  uz: 'Premium olish uchun avval ro\'yxatdan o\'tasiz — progressingiz to\'liq saqlanib qoladi.',
                  kr: 'Премиум олиш учун аввал рўйхатдан ўтасиз — прогрессингиз тўлиқ сақланиб қолади.'
                }) }}
              </div>

              <div class="mt-5 pt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-2xs"
                   style="border-top: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.55)">
                <span>🔒 {{ i18n.t({ uz: 'Payme orqali', kr: 'Payme орқали' }) }}</span>
                <span>✓ {{ i18n.t({ uz: 'Bir martalik to\'lov', kr: 'Бир марталик тўлов' }) }}</span>
                <span>✓ {{ i18n.t({ uz: 'Avtomatik yechim yo\'q', kr: 'Автоматик ечим йўқ' }) }}</span>
              </div>
            </template>
          </div>
        </div>
      </div>

      <!-- Bepul — kichik, ikkinchi darajali -->
      <div class="mt-5 max-w-lg mx-auto free-row">
        <div class="min-w-0">
          <div class="text-sm font-medium text-ink-900">
            {{ i18n.t({ uz: 'Bepul davom etish', kr: 'Бепул давом этиш' }) }}
          </div>
          <div class="text-2xs mt-0.5" style="color: var(--text-4)">
            {{ i18n.t({
              uz: `Kuniga ${dailyLimit} ta test · kunlik limit mavjud`,
              kr: `Кунига ${dailyLimit} та тест · кунлик лимит мавжуд`
            }) }}
          </div>
        </div>
        <NuxtLink to="/" class="free-link">0 {{ i18n.t({ uz: 'so\'m', kr: 'сўм' }) }}</NuxtLink>
      </div>

      <!-- Afzalliklar — ikonkalar bilan -->
      <div class="mt-14">
        <h2 class="text-center text-lg sm:text-xl font-semibold tracking-tightish text-ink-900">
          {{ i18n.t({ uz: 'Premium bilan siz nima olasiz', kr: 'Премиум билан сиз нима оласиз' }) }}
        </h2>
        <div class="mt-7 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div v-for="b in benefits" :key="b.title" class="benefit">
            <span class="benefit-icon"><AppIcon :name="b.icon" :size="17" /></span>
            <div class="min-w-0">
              <div class="text-sm font-semibold text-ink-900">{{ b.title }}</div>
              <p class="mt-1 text-2xs leading-relaxed" style="color: var(--text-3)">{{ b.desc }}</p>
            </div>
          </div>
        </div>
      </div>

      <p class="text-center text-2xs mt-10" style="color: var(--text-4)">
        {{ i18n.t({ uz: 'Bepul tarif doim bepul qoladi.', kr: 'Бепул тариф доим бепул қолади.' }) }}
      </p>
    </div>

    <PaymentSheet :open="selected !== null" :tariff="selected" @close="selected = null" />
  </div>
</template>

<style scoped>
.pricing-wrap { position: relative; overflow: hidden; }

/* Yumshoq ko'k porlash — fon chuqurlik beradi, lekin matnga xalaqit qilmaydi */
.glow {
  position: absolute;
  border-radius: 9999px;
  filter: blur(90px);
  pointer-events: none;
  z-index: 0;
}
.glow-a {
  top: -14rem; left: 50%; transform: translateX(-50%);
  width: 44rem; height: 30rem;
  background: radial-gradient(closest-side, rgba(63, 88, 148, 0.30), transparent);
}
.glow-b {
  top: 18rem; right: -12rem;
  width: 30rem; height: 26rem;
  background: radial-gradient(closest-side, rgba(99, 102, 241, 0.18), transparent);
}
@media (max-width: 640px) { .glow-a { width: 26rem; height: 20rem; top: -9rem; } .glow-b { display: none; } }

.proof-pill {
  display: inline-flex; align-items: center; gap: 0.5rem;
  padding: 0.35rem 0.85rem;
  border-radius: 9999px;
  font-size: 0.75rem; font-weight: 500;
  color: var(--text-2);
  background: var(--surface);
  border: 1px solid var(--border-soft);
  box-shadow: 0 2px 10px -4px rgba(15, 23, 42, 0.12);
}
.proof-dot {
  width: 0.4rem; height: 0.4rem; border-radius: 9999px;
  background: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.18);
}

.progress-box {
  padding: 1rem 1.15rem;
  border-radius: 1rem;
  background: var(--surface);
  border: 1px solid var(--border-soft);
}

/* Markaziy Premium karta — sahifadagi eng katta element */
.hero-card {
  position: relative;
  width: 100%; max-width: 30rem;
  padding: 2.5rem 1.5rem 1.75rem;
  border-radius: 1.75rem;
  background: linear-gradient(165deg, #161b26 0%, #0b0e15 55%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow:
    0 32px 80px -24px rgba(11, 14, 21, 0.55),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
}
@media (min-width: 640px) { .hero-card { padding: 3rem 2.5rem 2rem; } }

.hero-badge {
  position: absolute; top: -0.85rem; left: 50%; transform: translateX(-50%);
  display: inline-flex; align-items: center; gap: 0.3rem;
  padding: 0.32rem 0.85rem;
  border-radius: 9999px;
  font-size: 0.7rem; font-weight: 700; letter-spacing: 0.02em;
  white-space: nowrap;
  color: #3d2c00;
  background: linear-gradient(180deg, #fde68a, #f0b429);
  box-shadow: 0 6px 18px -6px rgba(240, 180, 41, 0.7);
}

/* Katta sariq CTA */
.hero-cta {
  width: 100%;
  height: 3.5rem;
  margin-top: 1.75rem;
  display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem;
  border-radius: 1rem;
  font-size: 1.0625rem; font-weight: 600;
  color: #3d2c00;
  background: linear-gradient(180deg, #fcd34d, #f0b429);
  box-shadow: 0 14px 32px -12px rgba(240, 180, 41, 0.85);
  transition: filter .15s, transform .15s, box-shadow .15s;
}
.hero-cta:hover { filter: brightness(1.05); transform: translateY(-2px); box-shadow: 0 18px 38px -12px rgba(240, 180, 41, 0.95); }
.hero-cta:active { transform: translateY(0); }

.hero-alt {
  width: 100%;
  margin-top: 0.75rem;
  padding: 0.5rem;
  font-size: 0.8125rem;
  color: rgba(255, 255, 255, 0.6);
  border-radius: 0.625rem;
  transition: color .15s, background .15s;
}
.hero-alt:hover { color: #fff; background: rgba(255, 255, 255, 0.06); }

.free-row {
  display: flex; align-items: center; justify-content: space-between; gap: 1rem;
  padding: 0.9rem 1.15rem;
  border-radius: 1rem;
  background: var(--surface);
  border: 1px solid var(--border-soft);
}
.free-link {
  flex-shrink: 0;
  padding: 0.45rem 0.9rem;
  border-radius: 0.625rem;
  font-size: 0.8125rem; font-weight: 600;
  color: var(--text-2);
  background: var(--surface-inset);
  transition: background .15s;
}
.free-link:hover { background: var(--surface-hover); }

.benefit {
  display: flex; align-items: flex-start; gap: 0.75rem;
  padding: 1rem 1.1rem;
  border-radius: 1rem;
  background: var(--surface);
  border: 1px solid var(--border-soft);
  transition: border-color .18s, transform .18s;
}
.benefit:hover { border-color: var(--accent); transform: translateY(-2px); }
.benefit-icon {
  width: 2.15rem; height: 2.15rem; border-radius: 0.7rem;
  display: grid; place-items: center; flex-shrink: 0;
  background: var(--accent-soft);
  color: var(--accent);
}
</style>
