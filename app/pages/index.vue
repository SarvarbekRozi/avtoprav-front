<script setup lang="ts">
import type { Tone } from '~/composables/useTone'

definePageMeta({ middleware: 'auth' })

const auth = useAuthStore()
const i18n = useI18n()

/**
 * Dashboard uchun so'rovlar byudjeti — 3 ta:
 *   home-stats    → /me/stats
 *   home-week-xp  → /leaderboard?period=week   (haftalik XP challenge uchun)
 *   topic-stats   → /me/topic-stats            (AIRecommendationCard + TopicStrengthCard
 *                                               ichida, BIR XIL kalit bilan — Nuxt dedupe qiladi)
 * Seriya bu yerda SO'RALMAYDI: `auth.user.streak_current` allaqachon /me javobida
 * keladi, sidebar esa o'zining `sidebar-streak` so'rovini qiladi — takrorlash
 * ortiqcha so'rov bo'lardi.
 *
 * `server: false` — SSR'da token yo'q, server tomonda so'rash 401 beradi va
 * splash/kontent tarmoqlari server bilan klientda farq qilib hidratsiya buziladi.
 *
 * `watch: [() => auth.user?.id]` SHART: `auth.user` hidratsiyadan KEYIN to'ladi
 * (mehmon → haqiqiy hisob, Telegram Mini App kirishi). Usiz bu so'rovlar token
 * yo'q paytida bir marta null qaytaradi va boshqa hech qachon qayta ishlamaydi.
 *
 * `default: () => null` — usiz ref boshida `undefined` bo'lib, prop tekshiruvi
 * ("Expected Object | Null, got Undefined") ogohlantirish beradi.
 */
const { data: stats } = await useAsyncData('home-stats', async () => {
  if (!auth.token) return null
  try { return await apiFetch<any>('/me/stats') } catch { return null }
}, { server: false, default: () => null, watch: [() => auth.user?.id] })

const { data: weekBoard } = await useAsyncData('home-week-xp', async () => {
  if (!auth.token) return null
  try { return await apiFetch<any>('/leaderboard?period=week&limit=5') } catch { return null }
}, { server: false, default: () => null, watch: [() => auth.user?.id] })

const totals = computed(() => stats.value?.totals ?? null)
const readiness = computed(() => totals.value?.readiness_percent ?? 0)
const coverage = computed(() => totals.value?.coverage_percent ?? 0)
// Mobil tayyorgarlik kartasi uchun (maketda doira o'rniga aniqlik ko'rsatiladi).
// Backend bir kasrli qaytaradi — kartada butun songa yaxlitlanadi.
const accuracy = computed(() => Math.round(totals.value?.accuracy_percent ?? 0))
const attempts = computed(() => totals.value?.attempts ?? 0)
const seen = computed(() => totals.value?.distinct_seen ?? 0)
const bankTotal = computed(() => totals.value?.bank_total ?? 0)
const mistakesPending = computed(() => totals.value?.mistakes_pending ?? 0)

const current = computed(() =>
  (stats.value?.current_attempt ?? null) as { id: number, mode: string, answered: number, total: number } | null)

// XP: `auth.user.points` test o'ynash paytida jonli o'zgaradi — store'dan
// reaktiv o'qiymiz, nusxa olmaymiz.
const points = computed(() => auth.user?.points ?? 0)
const streakCurrent = computed(() => auth.user?.streak_current ?? 0)
// null = hali yuklanmadi (0 XP bilan adashtirmaslik uchun ataylab null qoladi)
const weekXp = computed<number | null>(() => {
  const p = weekBoard.value?.me?.points
  return typeof p === 'number' ? p : null
})

const examDaysLeft = computed(() => auth.user?.exam_days_left ?? null)
const isGuest = computed(() => auth.user?.is_guest ?? false)

// Kunlik urinishlar cheklovi OLIB TASHLANDI (endi cheklov kontentda: 5 bilet,
// 1 mavzu ochiq, imtihon cheksiz). Premium holati qulf belgilarini boshqaradi.
const isPremium = computed(() => auth.user?.is_premium ?? false)

/**
 * Rejimlar — har biri mavjud marshrutga olib boradi, "soxta" tugma yo'q.
 *
 * `locked` — bepul tarifda yopiq rejimlar. Backend ham shu ro'yxatni
 * majburlaydi (`config/premium.php` → `free.modes`); bu yerdagi belgi faqat
 * ko'rinish uchun, ya'ni foydalanuvchi bosgandan keyin xato olmasin.
 * Bepul: imtihon, biletlar (5 ta), mavzular (1 ta).
 */
const tiles = computed<{ icon: string, tone: Tone, title: string, sub: string, to: string, badge?: number | null, tag?: string | null, locked?: boolean }[]>(() => [
  {
    icon: 'star', tone: 'violet', to: '/test/start/daily',
    title: i18n.t({ uz: 'Kunlik', kr: 'Кунлик' }),
    sub: i18n.t({ uz: 'Kunlik savollar', kr: 'Кунлик саволлар' }),
    locked: !isPremium.value,
  },
  {
    icon: 'bolt', tone: 'amber', to: '/test/start/blitz',
    title: i18n.t({ uz: 'Blits', kr: 'Блиц' }),
    sub: i18n.t({ uz: '60 soniyada eng ko\'p to\'g\'ri javob', kr: '60 сонияда энг кўп тўғри жавоб' }),
    tag: '60s',
    locked: !isPremium.value,
  },
  {
    icon: 'ticket', tone: 'sky', to: '/tickets',
    title: i18n.t({ uz: 'Biletlar', kr: 'Билетлар' }),
    sub: i18n.t({ uz: 'Rasmiy 63 ta bilet bo\'yicha mashq', kr: 'Расмий 63 та билет бўйича машқ' }),
  },
  {
    icon: 'book', tone: 'emerald', to: '/topics',
    title: i18n.t({ uz: 'Mavzular', kr: 'Мавзулар' }),
    sub: i18n.t({ uz: 'Mavzular bo\'yicha mashq qiling', kr: 'Мавзулар бўйича машқ қилинг' }),
  },
  {
    icon: 'shuffle', tone: 'ink', to: '/test/start/random',
    title: i18n.t({ uz: 'Tasodifiy', kr: 'Тасодифий' }),
    sub: i18n.t({ uz: 'Tasodifiy 20 savol', kr: 'Тасодифий 20 савол' }),
    locked: !isPremium.value,
  },
  {
    icon: 'refresh', tone: 'rose', to: '/test/start/mistakes',
    title: i18n.t({ uz: 'Xatolarim', kr: 'Хатоларим' }),
    sub: i18n.t({ uz: 'Xato qilingan savollar', kr: 'Хато қилинган саволлар' }),
    badge: mistakesPending.value || null,
    locked: !isPremium.value,
  },
  {
    icon: 'bookmark', tone: 'sky', to: '/me/bookmarks',
    title: i18n.t({ uz: 'Saqlangan', kr: 'Сақланган' }),
    sub: i18n.t({ uz: 'Saqlab qo\'yilgan savollar', kr: 'Сақлаб қўйилган саволлар' }),
  },
  {
    icon: 'stat', tone: 'brand', to: '/me/stats',
    title: i18n.t({ uz: 'Statistika', kr: 'Статистика' }),
    sub: i18n.t({ uz: 'Yutuqlaringiz va progress', kr: 'Ютуқларингиз ва прогресс' }),
  },
])
</script>

<template>
  <!-- Kontent sidebar'dan keyin bo'sh joyni TO'LDIRADI (namunadagidek), tor
       max-width bilan markazga siqilmaydi. 1800px — faqat juda keng ekranlarda
       satr uzunligi haddan oshmasligi uchun. -->
  <div v-if="auth.user" class="mx-auto w-full max-w-[1800px] px-4 sm:px-6 lg:px-8 xl:px-10 pb-16 md:pb-12">
    <OnboardingModal />

    <!-- ══ MOBIL (< md) ══
         Maketda AI tavsiyagacha bo'lgan qism butunlay boshqa tartibda: sarlavha
         qatori (XP chipi bilan), ixcham tayyorgarlik, imtihon banneri va XP
         musobaqasi banneri. Kartalar mazmuni ham boshqa, faqat qayta terilishi
         emas — shuning uchun alohida komponent, `md:` shoxlari emas. -->
    <MobileHomeTop
      :readiness="readiness" :accuracy="accuracy" :points="points"
      :exam-days-left="examDaysLeft" />

    <!-- ══ ISH STOLI (≥ md) ══ -->
    <div class="hidden md:block">
      <!-- ── 1-qator: salomlashuv + tayyorgarlik ──
           Nisbat namunadan olingan: chap ustun ~38%, tayyorgarlik kartasi ~62%. -->
      <div class="grid grid-cols-1 gap-4 sm:gap-6 pt-5 sm:pt-8
                  xl:grid-cols-[minmax(0,38fr)_minmax(0,62fr)]">
        <div class="min-w-0 flex flex-col justify-center">
          <DashboardHeader :exam-days-left="examDaysLeft" />
          <HomeChips class="mt-4" :is-guest="isGuest" :current="current" :show-premium-hint="!isPremium" />
        </div>

        <div class="min-w-0">
          <PreparationCard
            :readiness="readiness" :attempts="attempts" :coverage="coverage"
            :seen="seen" :bank-total="bankTotal" :points="points" />
        </div>
      </div>

    </div>

    <!-- ── Imtihon CTA + haftalik XP challenge — IKKALA tartibda ham shu yerda.
         Namunada bu ikki karta deyarli TENG kenglikda (≈49/51), 7/5 emas.
         Mobilda grid bir ustunga tushadi, kartalar o'zlari ixchamlashadi.

         DOM tartibi ikkala tartibga ham to'g'ri keladi, shuning uchun `order`
         hiylalari kerak emas:
           mobil:  MobileHomeTop → bu qator → HomeChips → rejimlar
           web:    yuqoridagi blok → bu qator → rejimlar -->
    <div class="grid grid-cols-1 gap-4 sm:gap-6 mt-4 sm:mt-6
                xl:grid-cols-[minmax(0,49fr)_minmax(0,51fr)]">
      <div class="min-w-0">
        <ExamCTA />
      </div>
      <div class="min-w-0">
        <WeeklyXPChallenge :week-xp="weekXp" :streak-current="streakCurrent" />
      </div>
    </div>

    <!-- Mobilda chiplar maketdagidek kartalardan KEYIN turadi (ish stolida esa
         yuqoridagi blok ichida, salomlashuv ostida) -->
    <HomeChips class="md:hidden mt-4" :is-guest="isGuest" :current="current" :show-premium-hint="!isPremium" />

    <!-- ── Rejimlar — ikkala tartibda ham shu yerda (QuickActionCard o'zi
         mobil/ish stoli ko'rinishini boshqaradi) ── -->
    <nav class="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3 sm:gap-3.5 mt-4 sm:mt-6"
         :aria-label="i18n.t({ uz: 'Mashq rejimlari', kr: 'Машқ режимлари' })">
      <QuickActionCard v-for="t in tiles" :key="t.to"
        :icon="t.icon" :tone="t.tone" :title="t.title" :subtitle="t.sub" :to="t.to"
        :badge="t.badge" :tag="t.tag" :locked="t.locked" />
    </nav>

    <!-- ── 4-qator: AI tavsiya + mavzular + faollik ──
         AI karta 1.5fr, qolganlari 1fr. Teng uchdan bir bo'lganda (412px)
         robot va tavsiya matni bir qatorga sig'masdi: robotdan keyin matnga
         174px qolib, `line-clamp-3` uni so'z o'rtasidan kesardi. Endi AI
         kartada ~536px, matnga ~285px. Qo'shni ikki kartada esa 5 tadan
         element chiqadi — balandliklar shu bilan tenglashadi. -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mt-4 sm:mt-6
                xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)]">
      <div class="min-w-0">
        <AIRecommendationCard />
      </div>
      <div class="min-w-0">
        <TopicStrengthCard />
      </div>
      <div class="lg:col-span-2 xl:col-span-1 min-w-0">
        <RecentActivityCard :recent="stats?.recent" />
      </div>
    </div>

    <!-- Telegram kanal -->
    <a href="https://t.me/avtoprav_uz" target="_blank" rel="noopener"
       class="card mt-4 sm:mt-5 p-4 sm:p-5 flex items-center gap-3.5 group transition-colors">
      <span class="w-11 h-11 rounded-xl grid place-items-center flex-shrink-0 text-white" style="background: #229ED9;">
        <AppIcon name="send" :size="20" />
      </span>
      <span class="min-w-0 flex-1">
        <span class="block text-sm font-semibold" style="color: var(--text-1);">
          {{ i18n.t({ uz: 'Telegram kanalimiz', kr: 'Telegram каналимиз' }) }} · @avtoprav_uz
        </span>
        <span class="block text-xs mt-0.5" style="color: var(--text-3);">
          {{ i18n.t({ uz: 'Yangiliklar, sovg\'alar va e\'lonlardan xabardor bo\'ling', kr: 'Янгиликлар, совғалар ва эълонлардан хабардор бўлинг' }) }}
        </span>
      </span>
      <span class="hidden sm:inline-flex items-center gap-1.5 px-3.5 h-9 rounded-lg text-sm font-medium text-white flex-shrink-0 transition-opacity group-hover:opacity-90"
            style="background: #229ED9;">
        {{ i18n.t({ uz: 'Obuna bo\'lish', kr: 'Обуна бўлиш' }) }}
      </span>
      <AppIcon name="chev-r" :size="16" class="sm:hidden flex-shrink-0" style="color: var(--text-4);" />
    </a>

    <!-- Taklif va murojaat -->
    <div class="mt-6 mb-1 text-center">
      <!-- Ilgari `text-2xs` + `opacity-70` + `--text-4` edi: bosish zonasi 16px
           (barmoq uchun juda kichik) va kontrast ~2.4:1 gacha tushib o'qilmasdi.
           Endi 12px matn, to'liq kontrast va 36px balandlikdagi bosish zonasi. -->
      <a href="https://t.me/avtoprav_admin" target="_blank" rel="noopener"
         class="inline-flex items-center gap-1 text-xs px-2 py-2.5 rounded-lg hover:underline"
         style="color: var(--text-3);">
        {{ i18n.t({ uz: 'Taklif va murojaatlar uchun', kr: 'Таклиф ва мурожаатлар учун' }) }} — @avtoprav_admin
      </a>
    </div>
  </div>

  <div v-else class="min-h-[70vh] grid place-items-center px-6">
    <!-- First visit / SSR: brendli splash. Crawler (Googlebot) shu matnni o'qiydi,
         shuning uchun bu yerda "Avtoprav" + tavsif haqiqiy, indekslanadigan kontent.
         Izoh div ICHIDA — ildizda tursa hidratsiya nomuvofiqligi chiqadi. -->
    <div class="text-center max-w-md">
      <img src="/logo-mark.svg" alt="Avtoprav logotipi" width="64" height="64" class="w-16 h-16 mx-auto mb-4" />
      <h1 class="text-2xl font-bold tracking-tight" style="color: var(--text-1);">Avtoprav</h1>
      <p class="mt-2 text-sm leading-relaxed" style="color: var(--text-3);">
        {{ i18n.t({
          uz: 'O\'zbekiston yo\'l harakati qoidalari (YHQ) bo\'yicha onlayn testlar, imtihon rejimi, biletlar va AI tushuntirish. Haydovchilik guvohnomasi (prava) imtihoniga bepul tayyorlaning.',
          kr: 'Ўзбекистон йўл ҳаракати қоидалари (ЙҲҚ) бўйича онлайн тестлар, имтиҳон режими, билетлар ва AI тушунтириш. Ҳайдовчилик гувоҳномаси (права) имтиҳонига бепул тайёрланинг.'
        }) }}
      </p>
      <div class="mt-6 inline-flex items-center gap-2 text-sm" style="color: var(--text-4);">
        <svg class="w-4 h-4 animate-spin" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="7.5" stroke="currentColor" stroke-width="2" stroke-opacity="0.25"/>
          <path d="M17.5 10A7.5 7.5 0 0 0 10 2.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        {{ i18n.t({ uz: 'Yuklanmoqda...', kr: 'Юкланмоқда...' }) }}
      </div>
    </div>
  </div>
</template>
