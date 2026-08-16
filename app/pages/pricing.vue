<script setup lang="ts">
const i18n = useI18n()
const auth = useAuthStore()
const route = useRoute()

const isPremium = computed(() => auth.user?.is_premium ?? false)
const isGuest = computed(() => auth.user?.is_guest ?? false)
// `dailyLimit` OLIB TASHLANDI: kunlik urinishlar cheklovi yo'q, cheklov
// kontentda (5 bilet, 1 mavzu; imtihon cheksiz).

interface Tariff {
  id: string
  price: string
  perDay: string
  period: { uz: string, kr: string }
}

// Narxlar backenddagi config/payme.php bilan bir xil (2 900 000 / 4 500 000 tiyin).
const monthly: Tariff = { id: '1month', price: '45 000', perDay: '1 500', period: { uz: '1 oy', kr: '1 ой' } }
const biweekly: Tariff = { id: '2weeks', price: '29 000', perDay: '2 071', period: { uz: '2 hafta', kr: '2 ҳафта' } }
const tariffs = [monthly, biweekly]

/**
 * Ikki qadam: radio bilan tarif TANLANADI, keyin CTA to'lov oynasini ochadi.
 * Ilgari tarifning o'zi tugma edi — bosish bilanoq oyna chiqardi, shuning uchun
 * ikkinchi tarifni "ko'rib qo'yish" imkonsiz edi.
 */
const chosen = ref<Tariff>(monthly)
const sheetFor = ref<Tariff | null>(null)

function openSheet() {
  sheetFor.value = chosen.value
}

/**
 * Ijtimoiy dalil — faqat HAQIQIY raqamlar. Backend to'langan buyurtmalarni va
 * faol o'quvchilarni sanaydi; son ishonarli chegaradan past bo'lsa null
 * qaytaradi va bu blok umuman ko'rinmaydi. Maketda "45 000+ foydalanuvchi"
 * yozilgan, lekin qo'lda yozilgan son to'lov sahifasida yolg'on va'da bo'ladi.
 */
// `lazy: true` va `await` YO'Q — `setup` ichidagi `await` navigatsiyani bloklaydi
const { data: stats } = useAsyncData('pricing-stats',
  () => apiFetch<{
    proof: { count: number, window: 'day' | 'week' } | null
    activity: { learners_7d: number, tests_today: number } | null
  }>('/pricing/stats'),
  { default: () => ({ proof: null, activity: null }), server: false, lazy: true })

/** Pilldagi qalin ko'k son — matndan alohida, chunki u alohida stillanadi. */
const socialProof = computed<{ count: string, text: string } | null>(() => {
  const p = stats.value?.proof
  if (p) {
    return {
      count: String(p.count),
      text: p.window === 'day'
        ? i18n.t({ uz: 'kishi bugun Premium oldi', kr: 'киши бугун Премиум олди' })
        : i18n.t({ uz: 'kishi shu hafta Premium oldi', kr: 'киши шу ҳафта Премиум олди' }),
    }
  }
  const a = stats.value?.activity
  if (a) {
    return {
      count: String(a.learners_7d),
      text: i18n.t({ uz: 'kishi shu hafta imtihonga tayyorlanmoqda', kr: 'киши шу ҳафта имтиҳонга тайёрланмоқда' }),
    }
  }
  return null
})

/**
 * Taqqoslash jadvali. `free: null` → ✕ belgisi, `free: true` → ✓ belgisi.
 *
 * Jadval YANGI freemium modelini aks ettiradi: kunlik urinishlar cheklovi
 * yo'q, cheklov KONTENTDA. Sonlar backenddagi `config/premium.php` bilan
 * mos bo'lishi kerak (`free.tickets`, `free.topics`).
 */
const FREE_TICKETS = 5
const FREE_TOPICS = 1
const ALL_TICKETS = 63

const rows = computed(() => [
  {
    icon: 'exam', tone: 'primary',
    title: i18n.t({ uz: 'Imtihon rejimi', kr: 'Имтиҳон режими' }),
    desc: i18n.t({
      uz: 'Real imtihon muhiti — bepul tarifda ham cheksiz',
      kr: 'Реал имтиҳон муҳити — бепул тарифда ҳам чексиз',
    }),
    // Bepul tarifda ham CHEKSIZ — mahsulotning asosiy qiymati.
    free: true,
  },
  {
    icon: 'ticket', tone: 'primary',
    title: i18n.t({ uz: 'Rasmiy biletlar', kr: 'Расмий билетлар' }),
    desc: i18n.t({
      uz: `Har biri 20 savol — jami ${ALL_TICKETS} ta bilet`,
      kr: `Ҳар бири 20 савол — жами ${ALL_TICKETS} та билет`,
    }),
    free: i18n.t({ uz: `${FREE_TICKETS} ta`, kr: `${FREE_TICKETS} та` }),
    premiumText: i18n.t({ uz: `${ALL_TICKETS} ta`, kr: `${ALL_TICKETS} та` }),
  },
  {
    icon: 'book', tone: 'ok',
    title: i18n.t({ uz: 'Mavzular bo\'yicha mashq', kr: 'Мавзулар бўйича машқ' }),
    desc: i18n.t({
      uz: 'Yo\'l belgilari, tezlik, javobgarlik va boshqalar',
      kr: 'Йўл белгилари, тезлик, жавобгарлик ва бошқалар',
    }),
    free: i18n.t({ uz: `${FREE_TOPICS} ta`, kr: `${FREE_TOPICS} та` }),
    premiumText: i18n.t({ uz: 'Barchasi', kr: 'Барчаси' }),
  },
  {
    icon: 'bolt', tone: 'warn',
    title: i18n.t({ uz: 'Kunlik, Blits va Tasodifiy', kr: 'Кунлик, Блиц ва Тасодифий' }),
    desc: i18n.t({
      uz: 'Tez mashq rejimlari va kunlik challenge',
      kr: 'Тез машқ режимлари ва кунлик челлендж',
    }),
    free: null,
  },
  {
    icon: 'target', tone: 'danger',
    title: i18n.t({ uz: 'Xatolar ustida ishlash', kr: 'Хатолар устида ишлаш' }),
    desc: i18n.t({ uz: 'Xato qilgan savollaringizni qayta yechish', kr: 'Хато қилган саволларингизни қайта ечиш' }),
    free: null,
  },
  {
    icon: 'ai', tone: 'violet',
    title: i18n.t({ uz: 'AI tushuntirish va tavsiyalar', kr: 'AI тушунтириш ва тавсиялар' }),
    desc: i18n.t({ uz: 'Har savolga izoh va zaif mavzular tahlili', kr: 'Ҳар саволга изоҳ ва заиф мавзулар таҳлили' }),
    free: null,
  },
  {
    icon: 'ban', tone: 'danger',
    title: i18n.t({ uz: 'Reklamasiz tajriba', kr: 'Рекламасиз тажриба' }),
    desc: i18n.t({ uz: 'E\'tiboringizni hech narsa chalg\'itmaydi', kr: 'Эътиборингизни ҳеч нарса чалғитмайди' }),
    free: null,
  },
])

/**
 * Qabul qilinadigan to'lov usullari. Maketda Apple Pay bor edi, lekin Payme
 * orqali u ishlamaydi — ko'rsatish yolg'on va'da bo'lardi, o'rniga Payme
 * logotipi turadi. Usul qo'shish/olib tashlash faqat shu massivда.
 */
const brands = [
  { name: 'Visa', kind: 'visa' as const },
  { name: 'Humo', kind: 'humo' as const },
  { name: 'Uzcard', kind: 'uzcard' as const },
  { name: 'Payme', img: '/payment/payme.png' },
]

/** Kafolat muddati — bitta joyda, matnlarda takrorlanmasin. */
const GUARANTEE_DAYS = 7

/** premium_until — ISO sana. `toLocaleDateString` o'zbek tilini hamma yerda
    to'g'ri bermaydi, shuning uchun qo'lda kun.oy.yil. */
const premiumUntil = computed(() => {
  const raw = auth.user?.premium_until
  if (!raw) return null
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return null
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()}`
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
</script>

<template>
  <!-- Konteyner dashboard bilan AYNAN bir xil: sidebar'dan keyingi joyni
       to'ldiradi, chetlari bir chizig'da turadi. -->
  <div class="pricing mx-auto w-full max-w-[1800px] px-4 sm:px-6 lg:px-8 xl:px-10 pt-6 lg:pt-8 pb-16 md:pb-12">
    <!-- ── TEPA: sarlavha (chapda, markazlashgan) + joriy rejim (o'ngda) ── -->
    <div class="top">
      <div class="hero">
        <div v-if="socialProof" class="proof">
          <span class="proof-faces" aria-hidden="true">
            <span v-for="n in 4" :key="n" class="proof-face" :class="`proof-face-${n}`">
              <AppIcon name="user" :size="12" />
            </span>
          </span>
          <span class="proof-text">
            <strong class="proof-count">{{ socialProof.count }}</strong> {{ socialProof.text }}
          </span>
        </div>

        <h1 class="hero-title">
          {{ i18n.t({ uz: 'Imtihonga ishonch bilan', kr: 'Имтиҳонга ишонч билан' }) }}<br>
          <span class="hero-accent">{{ i18n.t({ uz: 'tayyorlaning', kr: 'тайёрланинг' }) }}</span>
        </h1>

        <p class="hero-sub">
          {{ i18n.t({
            uz: 'Premium bilan hech qanday cheklovsiz o\'rganing, xatolaringiz ustida ishlang va imtihonda eng yaxshi natijaga erishing.',
            kr: 'Премиум билан ҳеч қандай чекловсиз ўрганинг, хатоларингиз устида ишланг ва имтиҳонда энг яхши натижага эришинг.'
          }) }}
        </p>
      </div>

      <!-- Joriy rejim -->
      <aside class="status">
        <div class="status-label">{{ i18n.t({ uz: 'Joriy rejim', kr: 'Жорий режим' }) }}</div>
        <div class="status-plan">
          {{ isPremium
            ? 'Premium'
            : i18n.t({ uz: 'Bepul rejim', kr: 'Бепул режим' }) }}
        </div>

        <template v-if="isPremium">
          <p class="status-note">
            {{ premiumUntil
              ? i18n.t({ uz: `${premiumUntil} gacha faol.`, kr: `${premiumUntil} гача фаол.` })
              : i18n.t({ uz: 'Barcha imkoniyatlar ochilgan.', kr: 'Барча имкониятлар очилган.' }) }}
          </p>
          <div class="status-ok">
            <AppIcon name="check" :size="15" />
            {{ i18n.t({ uz: 'Faol', kr: 'Фаол' }) }}
          </div>
        </template>

        <template v-else>
          <p class="status-note">
            {{ i18n.t({ uz: 'Premium imkoniyatlar ochilmagan.', kr: 'Премиум имкониятлар очилмаган.' }) }}
          </p>
          <button type="button" class="status-btn" @click="openSheet">
            <AppIcon name="crown" :size="15" />
            {{ i18n.t({ uz: 'Premium ga o\'tish', kr: 'Премиумга ўтиш' }) }}
          </button>
        </template>
      </aside>
    </div>

    <!-- To'lov natijasi -->
    <div v-if="paidOk" class="notice notice-ok">
      <AppIcon name="check" :size="18" class="shrink-0" />
      <span>{{ i18n.t({ uz: 'To\'lov muvaffaqiyatli — Premium faollashtirildi! 🎉', kr: 'Тўлов муваффақиятли — Премиум фаоллаштирилди! 🎉' }) }}</span>
    </div>
    <div v-else-if="checking" class="notice notice-wait">
      {{ i18n.t({ uz: 'To\'lov holati tekshirilmoqda…', kr: 'Тўлов ҳолати текширилмоқда…' }) }}
    </div>

    <!-- ── ASOSIY: taqqoslash + tariflar ── -->
    <div class="cols">
      <!-- Taqqoslash jadvali -->
      <section class="card compare">
        <table class="cmp">
          <thead>
            <tr>
              <th scope="col" class="cmp-th-feature">
                {{ i18n.t({ uz: 'Nima uchun Premium?', kr: 'Нима учун Премиум?' }) }}
              </th>
              <th scope="col" class="cmp-th-free">
                {{ i18n.t({ uz: 'Bepul', kr: 'Бепул' }) }}
              </th>
              <th scope="col" class="cmp-th-prem">Premium</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in rows" :key="r.title">
              <!-- Flex ICHKI `span`da: `<th>` ning o'zига `display: flex` bersak,
                   u jadval katakchasi bo'lishdan to'xtaydi va ustun kengliklari
                   buziladi. -->
              <th scope="row" class="cmp-feature">
                <span class="cmp-row">
                  <span class="tile" :class="`tile-${r.tone}`">
                    <AppIcon :name="r.icon" :size="17" />
                  </span>
                  <span class="cmp-text">
                    <span class="cmp-title">{{ r.title }}</span>
                    <span class="cmp-desc">{{ r.desc }}</span>
                  </span>
                </span>
              </th>

              <td class="cmp-free">
                <!-- `free === true` → ✓ (imtihon bepul tarifda ham cheksiz),
                     matn → cheklangan miqdor, `null` → ✕ -->
                <template v-if="r.free === true">
                  <AppIcon name="check-circle" :size="20" class="cmp-yes" aria-hidden="true" />
                  <span class="sr-only">{{ i18n.t({ uz: 'bor', kr: 'бор' }) }}</span>
                </template>
                <span v-else-if="r.free" class="cmp-limit">{{ r.free }}</span>
                <template v-else>
                  <AppIcon name="x" :size="17" class="cmp-no" aria-hidden="true" />
                  <span class="sr-only">{{ i18n.t({ uz: 'yo\'q', kr: 'йўқ' }) }}</span>
                </template>
              </td>

              <td class="cmp-prem">
                <!-- Ba'zi qatorlarda Premium tomonda ham SON turadi
                     ("63 ta", "Barchasi") — ✓ dan aniqroq -->
                <span v-if="r.premiumText" class="cmp-limit cmp-limit-prem">{{ r.premiumText }}</span>
                <template v-else>
                  <AppIcon name="check-circle" :size="20" class="cmp-yes" aria-hidden="true" />
                  <span class="sr-only">{{ i18n.t({ uz: 'bor', kr: 'бор' }) }}</span>
                </template>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <!-- Tariflar -->
      <section class="card plans">
        <div class="plans-head">
          <AppIcon name="star" :size="15" />
          {{ i18n.t({ uz: 'Eng ma\'qul tanlov', kr: 'Энг маъқул танлов' }) }}
        </div>

        <div class="plans-body">
          <!-- Premium allaqachon faol: tarif tanlash ma'nosiz -->
          <div v-if="isPremium" class="plans-active">
            <span class="plans-active-icon"><AppIcon name="check" :size="24" /></span>
            <div class="plans-active-title">
              {{ i18n.t({ uz: 'Sizda Premium faol', kr: 'Сизда Премиум фаол' }) }}
            </div>
            <p class="plans-active-note">
              {{ premiumUntil
                ? i18n.t({ uz: `Obuna ${premiumUntil} gacha ishlaydi. Cheklovlarsiz mashq qilishingiz mumkin.`, kr: `Обуна ${premiumUntil} гача ишлайди. Чекловларсиз машқ қилишингиз мумкин.` })
                : i18n.t({ uz: 'Cheklovlarsiz mashq qilishingiz mumkin.', kr: 'Чекловларсиз машқ қилишингиз мумкин.' }) }}
            </p>
            <NuxtLink to="/" class="plans-active-link">
              {{ i18n.t({ uz: 'Mashqni davom ettirish', kr: 'Машқни давом эттириш' }) }}
              <AppIcon name="arrow" :size="15" />
            </NuxtLink>
          </div>

          <template v-else>
            <fieldset class="plan-group">
              <legend class="sr-only">{{ i18n.t({ uz: 'Tarifni tanlang', kr: 'Тарифни танланг' }) }}</legend>

              <label v-for="t in tariffs" :key="t.id" class="plan" :class="chosen.id === t.id && 'plan-on'">
                <input
                  type="radio"
                  name="tariff"
                  class="plan-radio"
                  :value="t.id"
                  :checked="chosen.id === t.id"
                  @change="chosen = t"
                >
                <span class="plan-main">
                  <span class="plan-top">
                    <span class="plan-name">{{ i18n.t(t.period) }}</span>
                    <span v-if="t.id === monthly.id" class="plan-badge">
                      {{ i18n.t({ uz: 'Eng qulay', kr: 'Энг қулай' }) }}
                    </span>
                  </span>
                  <span class="plan-desc">{{ i18n.t({ uz: 'To\'liq Premium tajriba', kr: 'Тўлиқ Премиум тажриба' }) }}</span>
                </span>
                <span class="plan-side">
                  <span class="plan-price">
                    {{ t.price }}<span class="plan-cur">{{ i18n.t({ uz: 'so\'m', kr: 'сўм' }) }}</span>
                  </span>
                  <span class="plan-perday">
                    ≈ {{ t.perDay }} {{ i18n.t({ uz: 'so\'m / kun', kr: 'сўм / кун' }) }}
                  </span>
                </span>
              </label>
            </fieldset>

            <button type="button" class="cta" @click="openSheet">
              <AppIcon name="crown" :size="18" />
              {{ i18n.t({ uz: 'Premium ga o\'tish', kr: 'Премиумга ўтиш' }) }}
            </button>

            <p class="cta-note">
              <AppIcon name="shield" :size="15" class="shrink-0" />
              {{ i18n.t({
                uz: `${GUARANTEE_DAYS} kunlik kafolat — yoqmasa, pulingiz qaytariladi`,
                kr: `${GUARANTEE_DAYS} кунлик кафолат — ёқмаса, пулингиз қайтарилади`
              }) }}
            </p>

            <p v-if="isGuest" class="guest-note">
              {{ i18n.t({
                uz: 'Premium olish uchun avval ro\'yxatdan o\'tasiz — progressingiz to\'liq saqlanib qoladi.',
                kr: 'Премиум олиш учун аввал рўйхатдан ўтасиз — прогрессингиз тўлиқ сақланиб қолади.'
              }) }}
            </p>
          </template>
        </div>
      </section>
    </div>

    <!-- ── PASTKI: ishonch bloki ── -->
    <section class="card trust">
      <div class="trust-col">
        <span class="trust-icon"><AppIcon name="shield" :size="19" /></span>
        <div class="min-w-0">
          <div class="trust-title">{{ i18n.t({ uz: 'Xavfsiz to\'lov', kr: 'Хавфсиз тўлов' }) }}</div>
          <p class="trust-desc">
            {{ i18n.t({ uz: 'Ma\'lumotlaringiz 256-bit SSL bilan himoyalangan', kr: 'Маълумотларингиз 256-bit SSL билан ҳимояланган' }) }}
          </p>
        </div>
      </div>

      <div class="trust-col">
        <span class="trust-icon"><AppIcon name="card" :size="19" /></span>
        <div class="min-w-0">
          <div class="trust-title">{{ i18n.t({ uz: 'Qulay to\'lov usullari', kr: 'Қулай тўлов усуллари' }) }}</div>
          <ul class="brands">
            <li v-for="b in brands" :key="b.name" class="brand">
              <img v-if="b.img" :src="b.img" :alt="b.name">
              <span v-else class="bm" :class="`bm-${b.kind}`">{{ b.name.toUpperCase() }}</span>
            </li>
          </ul>
        </div>
      </div>

      <div class="trust-col">
        <span class="trust-icon"><AppIcon name="refresh" :size="19" /></span>
        <div class="min-w-0">
          <div class="trust-title">
            {{ i18n.t({ uz: `${GUARANTEE_DAYS} kunlik kafolat`, kr: `${GUARANTEE_DAYS} кунлик кафолат` }) }}
          </div>
          <p class="trust-desc">
            {{ i18n.t({
              uz: `Agar yoqmasa, ${GUARANTEE_DAYS} kun ichida pulingizni to'liq qaytaramiz`,
              kr: `Агар ёқмаса, ${GUARANTEE_DAYS} кун ичида пулингизни тўлиқ қайтарамиз`
            }) }}
          </p>
        </div>
      </div>
    </section>

    <PaymentSheet :open="sheetFor !== null" :tariff="sheetFor" @close="sheetFor = null" />
  </div>
</template>

<style scoped>
/* Binafsha — dizayn tizimida yo'q, faqat shu sahifaning birinchi qatoriga
   kerak. `-soft` fon, o'zi esa shu fon ustidagi ikonka rangi (kontrast 3:1). */
.pricing {
  --violet:      #7c3aed;
  --violet-soft: #f3e8ff;
}
.dark .pricing {
  --violet:      #c4b5fd;
  --violet-soft: rgba(139, 92, 246, 0.20);
}

/* ── Tepa qator ───────────────────────────────────────────────────────────
   Sarlavha "Joriy rejim" kartasidan CHAPDA qolgan joyning o'rtasida turadi —
   maketdagidek. Shuning uchun oddiy grid emas, flex: karta qat'iy kenglikda,
   sarlavha qolgan joyni oladi va matni markazlashadi. */
.top { display: flex; flex-direction: column; gap: 1.25rem; }
.hero { min-width: 0; text-align: center; }

@media (min-width: 1280px) {
  .top { flex-direction: row; align-items: flex-start; gap: 4rem; }
  .hero { flex: 1 1 0%; }
  .status { flex: 0 0 24rem; }
}

.proof {
  display: inline-flex; align-items: center; gap: 0.6rem;
  padding: 0.35rem 1rem 0.35rem 0.55rem;
  border-radius: 9999px;
  background: var(--surface);
  border: 1px solid var(--border-soft);
  box-shadow: var(--shadow-card);
}
.proof-faces { display: inline-flex; }
.proof-face {
  width: 1.6rem; height: 1.6rem; border-radius: 9999px;
  display: grid; place-items: center;
  color: #fff;
  border: 2px solid var(--surface);
  margin-right: -0.5rem;
}
.proof-face:last-child { margin-right: 0; }
.proof-face-1 { background: #4f6ef0; }
.proof-face-2 { background: #6366f1; }
.proof-face-3 { background: #8b5cf6; }
.proof-face-4 { background: #a78bfa; }
.proof-text { font-size: 0.8125rem; color: var(--text-3); }
.proof-count { font-weight: 700; color: var(--ok-ink); }

.hero-title {
  margin-top: 1.25rem;
  /* 375px ekranda 2rem da "Imtihonga ishonch bilan" qatorga sig'masdi va
     sarlavha uch qatorga cho'zilib ketardi. 400px dan boshlab 2rem qaytadi. */
  font-size: 1.75rem;
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -0.03em;
  color: var(--text-1);
}
@media (min-width: 400px)  { .hero-title { font-size: 2rem; } }
@media (min-width: 640px)  { .hero-title { font-size: 2.75rem; } }
@media (min-width: 1024px) { .hero-title { font-size: 3.25rem; } }

/* Gradient matn: `color: transparent` bilan birga `background-clip` — Safari
   uchun `-webkit-` prefiksi ham shart. */
.hero-accent {
  background: var(--grad-progress);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
}
/* Majburiy ranglar rejimida gradient butunlay yo'qoladi va matn ko'rinmay
   qoladi — u yerda oddiy tizim rangiga qaytamiz. */
@media (forced-colors: active) {
  .hero-accent { -webkit-text-fill-color: currentColor; color: CanvasText; background: none; }
}

.hero-sub {
  margin: 1rem auto 0;
  max-width: 36rem;
  font-size: 0.9375rem;
  line-height: 1.65;
  color: var(--text-3);
}
@media (min-width: 640px) { .hero-sub { font-size: 1rem; } }

/* ── Joriy rejim ── */
.status {
  padding: 1.15rem 1.3rem 1.3rem;
  border-radius: 1rem;
  background: var(--surface);
  border: 1px solid var(--border-soft);
  box-shadow: var(--shadow-card);
}
.status-label { font-size: 0.8125rem; color: var(--text-3); }
.status-plan {
  margin-top: 0.15rem;
  font-size: 1.1875rem; font-weight: 700; letter-spacing: -0.02em;
  color: var(--text-1);
}
.status-note { margin-top: 0.5rem; font-size: 0.8125rem; line-height: 1.5; color: var(--text-3); }

.status-btn {
  width: 100%; margin-top: 1rem;
  height: 2.625rem;
  display: inline-flex; align-items: center; justify-content: center; gap: 0.45rem;
  border-radius: 0.625rem;
  font-size: 0.875rem; font-weight: 600;
  color: var(--primary-ink);
  background: var(--primary-soft);
  transition: filter .15s, transform .15s;
}
.status-btn:hover { filter: brightness(0.97); }
.status-btn:active { transform: scale(0.99); }
.dark .status-btn:hover { filter: brightness(1.2); }

.status-ok {
  width: 100%; margin-top: 1rem;
  height: 2.625rem;
  display: inline-flex; align-items: center; justify-content: center; gap: 0.45rem;
  border-radius: 0.625rem;
  font-size: 0.875rem; font-weight: 600;
  color: var(--ok-ink);
  background: color-mix(in srgb, var(--ok) 14%, transparent);
}

/* ── Xabar bloklari ── */
.notice {
  display: flex; align-items: center; gap: 0.65rem;
  margin-top: 1.25rem;
  padding: 0.85rem 1.1rem;
  border-radius: 0.875rem;
  font-size: 0.875rem; font-weight: 500;
}
.notice-ok { background: color-mix(in srgb, var(--ok) 14%, transparent); color: var(--ok-ink); }
.notice-wait { background: var(--surface-inset); color: var(--text-3); justify-content: center; }

/* ── Ikki ustun ─────────────────────────────────────────────────────────
   55/45 — maketdagi nisbat (724 : 589). `minmax(0, …)` SHART: usiz ichkaridagi
   jadval ustunni cho'zib yuboradi. */
.cols {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 1.5rem;
  margin-top: 1.75rem;
}
@media (min-width: 1024px) {
  .cols { grid-template-columns: minmax(0, 1.23fr) minmax(0, 1fr); gap: 1.75rem; }
}

.card {
  background: var(--surface);
  border: 1px solid var(--border-soft);
  border-radius: 1.25rem;
  box-shadow: var(--shadow-card);
}

/* ── Taqqoslash jadvali ── */
.compare { padding: 1.35rem 1.5rem 0.85rem; }
.cmp { width: 100%; border-collapse: collapse; }

.cmp-th-feature, .cmp-th-free, .cmp-th-prem {
  padding-bottom: 0.85rem;
  border-bottom: 1px solid var(--divider);
  font-size: 0.8125rem; font-weight: 600;
  white-space: nowrap;
}
.cmp-th-feature {
  text-align: left;
  font-size: 0.9375rem; font-weight: 700; letter-spacing: -0.01em;
  color: var(--text-1);
}
.cmp-th-free { color: var(--text-3); }
/* `--primary` oq fonda 3.87:1 beradi (AA 4.5:1 dan past) — matn uchun `-ink`. */
.cmp-th-prem { color: var(--primary-ink); }

.cmp-th-free, .cmp-free { width: 7.5rem; text-align: center; border-left: 1px solid var(--divider); }
.cmp-th-prem, .cmp-prem { width: 6rem; text-align: center; }

.cmp-feature {
  padding: 0.7rem 1rem 0.7rem 0;
  text-align: left; font-weight: 400;
}
.cmp-row { display: flex; align-items: center; gap: 0.75rem; }
.cmp-free, .cmp-prem { vertical-align: middle; }

.tile {
  width: 2.125rem; height: 2.125rem; border-radius: 0.625rem;
  display: grid; place-items: center; flex-shrink: 0;
}
.tile-violet  { background: var(--violet-soft);  color: var(--violet); }
.tile-primary { background: var(--primary-soft); color: var(--primary-ink); }
.tile-warn    { background: var(--warn-soft);    color: var(--warn-ink); }
.tile-ok      { background: color-mix(in srgb, var(--ok) 15%, transparent); color: var(--ok-ink); }
.tile-danger  { background: var(--danger-soft);  color: var(--danger-ink); }

.cmp-text { display: block; min-width: 0; }
.cmp-title { display: block; font-size: 0.84375rem; font-weight: 600; color: var(--text-1); }
.cmp-desc  { display: block; margin-top: 0.1rem; font-size: 0.75rem; line-height: 1.35; color: var(--text-3); }

.cmp-limit { font-size: 0.78125rem; color: var(--text-3); }
/* Ma'no tashuvchi ikonka — WCAG 1.4.11 bo'yicha kamida 3:1. `--text-muted`
   (#b6b8c0) oq fonda 2.06:1 berardi, shuning uchun `--text-4`. */
.cmp-no  { display: inline-block; color: var(--text-4); }
/* `--ok` oq fonda 2.3:1 — ikonka uchun ham kam; `-strong` 3.6:1 beradi. */
.cmp-yes { display: inline-block; color: var(--ok-strong); }

/* ── Tariflar kartasi ── */
.plans { overflow: hidden; display: flex; flex-direction: column; }

/* "Eng ma'qul tanlov" — bu YORLIQ, harakat emas. Ilgari u ham `--grad-hero`
   gradientida edi va katta tugma bilan birga kartaning yarmini gradientga
   aylantirib qo'yardi. Endi jim, MONOXROM tasma: sahifada faqat BITTA
   to'yingan element qoladi — asosiy tugma, ya'ni ko'z avval unga tushadi. */
.plans-head {
  display: flex; align-items: center; justify-content: center; gap: 0.45rem;
  height: 2.75rem;
  font-size: 0.8125rem; font-weight: 700; letter-spacing: 0.02em;
  color: var(--primary-ink);
  background: var(--primary-soft);
  border-bottom: 1px solid var(--primary-ring);
}
.plans-body { padding: 1.25rem; display: flex; flex-direction: column; flex: 1 1 auto; }

/* `flex: 1` + markazlash: chap karta (6 qatorli jadval) balandroq bo'lgani
   uchun grid ikkinchi kartani ham cho'zadi. Ortiqcha joyni ANIQ egasi bo'lmasa,
   u kartaning pastida bo'sh tasma bo'lib qolardi — endi tariflar orasida
   taqsimlanadi va karta to'liq to'ladi. */
.plan-group {
  display: flex; flex-direction: column; justify-content: center;
  flex: 1 1 auto;
  gap: 0.75rem; border: 0; padding: 0; margin: 0;
}

.plan {
  display: flex; align-items: center; gap: 0.9rem;
  padding: 1rem 1.15rem;
  border-radius: 0.875rem;
  border: 1.5px solid var(--border-soft);
  background: var(--surface);
  cursor: pointer;
  transition: border-color .15s, background .15s;
}
.plan:hover { border-color: var(--primary); }
.plan-on { border-color: var(--primary); background: var(--primary-soft); }

/* Nativ radio — klaviatura va ekran o'quvchi uchun ishlaydi, faqat ko'rinishi
   almashtirilgan. `appearance: none` bo'lsa ham `:focus-visible` ishlaydi. */
.plan-radio {
  appearance: none; -webkit-appearance: none;
  width: 1.25rem; height: 1.25rem; flex-shrink: 0;
  border-radius: 9999px;
  border: 2px solid var(--border-1);
  background: var(--surface);
  transition: border-color .15s, box-shadow .15s;
}
.plan-radio:checked {
  border-color: var(--primary);
  /* Ichki nuqta — `box-shadow: inset` bilan, qo'shimcha element kerak emas. */
  box-shadow: inset 0 0 0 0.25rem var(--surface), inset 0 0 0 1rem var(--primary);
}
.plan-radio:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }

.plan-main { flex: 1 1 auto; min-width: 0; }
.plan-top { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
.plan-name { font-size: 1.375rem; font-weight: 800; letter-spacing: -0.02em; color: var(--text-1); }
.plan-badge {
  padding: 0.15rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.625rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em;
  color: var(--primary-ink);
  background: var(--primary-soft);
}
/* Tanlangan tarifda fon ham `--primary-soft` — nishon ko'rinmay qolmasin. */
.plan-on .plan-badge { background: var(--surface); }
.plan-desc { display: block; margin-top: 0.15rem; font-size: 0.8125rem; color: var(--text-3); }

.plan-side { flex-shrink: 0; text-align: right; }
.plan-price {
  display: block;
  font-size: 1.5rem; font-weight: 800; letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
  color: var(--text-1);
}
.plan-cur { margin-left: 0.25rem; font-size: 0.8125rem; font-weight: 500; color: var(--text-3); }
.plan-perday { display: block; margin-top: 0.1rem; font-size: 0.75rem; color: var(--text-3); }

/* QAT'IY brend ko'ki, gradient EMAS. Ko'k→binafsha gradient ikkita elementda
   takrorlanib arzon ko'rinardi; bir tekis to'q ko'k ishonchliroq o'qiladi va
   oq matn ostida 5.72:1 beradi (gradient uchastkalarida 4.36:1 gacha
   tushardi — AA 4.5:1 dan past). */
.cta {
  width: 100%; margin-top: 1.15rem;
  height: 3.5rem;
  display: inline-flex; align-items: center; justify-content: center; gap: 0.55rem;
  border-radius: 0.875rem;
  font-size: 1.0625rem; font-weight: 700;
  color: #fff;
  background: var(--primary-strong);
  box-shadow: 0 10px 22px -12px rgba(63, 90, 216, 0.55);
  transition: background .15s, transform .15s, box-shadow .15s;
}
.cta:hover { background: var(--primary); transform: translateY(-1px); box-shadow: 0 14px 26px -12px rgba(63, 90, 216, 0.6); }
.cta:active { transform: translateY(0); }
.cta:focus-visible { outline: 2px solid var(--primary); outline-offset: 3px; }

.cta-note {
  display: flex; align-items: center; justify-content: center; gap: 0.4rem;
  margin-top: 0.85rem;
  font-size: 0.8125rem; line-height: 1.4;
  color: var(--text-3);
}

.guest-note {
  margin-top: 0.85rem;
  padding: 0.7rem 0.85rem;
  border-radius: 0.625rem;
  font-size: 0.75rem; line-height: 1.5;
  background: var(--surface-inset);
  color: var(--text-3);
}

/* Premium faol holati */
.plans-active { text-align: center; padding: 0.75rem 0.5rem 1rem; margin: auto 0; }
.plans-active-icon {
  width: 3.25rem; height: 3.25rem; margin: 0 auto;
  display: grid; place-items: center; border-radius: 9999px;
  background: color-mix(in srgb, var(--ok) 15%, transparent);
  color: var(--ok-ink);
}
.plans-active-title { margin-top: 1rem; font-size: 1.125rem; font-weight: 700; color: var(--text-1); }
.plans-active-note { margin-top: 0.5rem; font-size: 0.875rem; line-height: 1.55; color: var(--text-3); }
.plans-active-link {
  display: inline-flex; align-items: center; gap: 0.4rem;
  margin-top: 1.25rem;
  padding: 0.7rem 1.15rem;
  border-radius: 0.75rem;
  font-size: 0.875rem; font-weight: 600;
  color: var(--primary-ink); background: var(--primary-soft);
}

/* ── Ishonch bloki ── */
.trust {
  margin-top: 1.5rem;
  padding: 1.35rem 1.5rem;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 1.35rem;
}
@media (min-width: 900px) {
  .trust { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0; }
  /* Ajratkich — ustunlar orasida, chetlarda emas. */
  .trust-col + .trust-col { border-left: 1px solid var(--divider); padding-left: 2rem; }
  .trust-col:not(:last-child) { padding-right: 2rem; }
}

.trust-col { display: flex; align-items: flex-start; gap: 0.85rem; min-width: 0; }
.trust-icon {
  width: 2.5rem; height: 2.5rem; border-radius: 0.75rem;
  display: grid; place-items: center; flex-shrink: 0;
  background: var(--primary-soft); color: var(--primary-ink);
}
.trust-title { font-size: 0.9375rem; font-weight: 700; letter-spacing: -0.01em; color: var(--text-1); }
.trust-desc { margin-top: 0.25rem; font-size: 0.8125rem; line-height: 1.5; color: var(--text-3); }

/* To'lov usullari — logotiplar DOIM oq "chip" ustida: ba'zilari qorong'i
   brend rangida bo'lib, to'q fonda ko'rinmay qolardi. */
.brands { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.6rem; }
.brand {
  height: 2.125rem; padding: 0 0.7rem;
  display: inline-flex; align-items: center; justify-content: center;
  border-radius: 0.5rem;
  background: #fff;
  border: 1px solid var(--border-1);
}
.brand img { max-height: 1.15rem; max-width: 3.5rem; object-fit: contain; display: block; }

/* Brend yozuvlari — o'z ranglarida, sun'iy chizilgan logotip emas. */
.bm { font-weight: 800; line-height: 1; white-space: nowrap; }
.bm-visa   { font-size: 0.9375rem; font-style: italic; font-weight: 900; letter-spacing: 0.01em; color: #1a1f71; }
.bm-humo   { font-size: 0.8125rem; letter-spacing: 0.07em; color: #0f7dc2; }
.bm-uzcard { font-size: 0.75rem;   letter-spacing: 0.05em; color: #164a9e; }

/* ── Mobil ── */
@media (max-width: 640px) {
  .compare { padding: 1.15rem 1rem 0.65rem; }
  .cmp-th-free, .cmp-free { width: 5.25rem; }
  .cmp-th-prem, .cmp-prem { width: 3.5rem; }
  .cmp-feature { gap: 0.6rem; padding-right: 0.5rem; }
  .cmp-limit { font-size: 0.6875rem; }
  .plan { padding: 0.85rem 0.9rem; gap: 0.7rem; }
  .plan-name { font-size: 1.125rem; }
  .plan-price { font-size: 1.1875rem; }
}
</style>
