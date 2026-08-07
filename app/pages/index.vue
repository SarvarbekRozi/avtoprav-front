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

const dailyTests = computed(() => auth.user?.daily_tests ?? null)
const freeTestsLeft = computed(() => {
  const d = dailyTests.value
  if (!d || d.limit === null) return 0
  return Math.max(0, d.limit - d.used_today)
})

/** Rejimlar — har biri mavjud marshrutga olib boradi, "soxta" tugma yo'q */
const tiles = computed<{ icon: string, tone: Tone, title: string, sub: string, to: string, badge?: number | null }[]>(() => [
  {
    icon: 'star', tone: 'violet', to: '/test/start/daily',
    title: i18n.t({ uz: 'Kunlik', kr: 'Кунлик' }),
    sub: i18n.t({ uz: 'Kunlik savollar to\'plami', kr: 'Кунлик саволлар тўплами' }),
  },
  {
    icon: 'bolt', tone: 'amber', to: '/test/start/blitz',
    title: i18n.t({ uz: 'Blits', kr: 'Блиц' }),
    sub: i18n.t({ uz: '60 soniyada eng ko\'p to\'g\'ri javob', kr: '60 сонияда энг кўп тўғри жавоб' }),
  },
  {
    icon: 'ticket', tone: 'sky', to: '/tickets',
    title: i18n.t({ uz: 'Biletlar', kr: 'Билетлар' }),
    sub: i18n.t({ uz: 'Rasmiy biletlar bo\'yicha mashq', kr: 'Расмий билетлар бўйича машқ' }),
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
  },
  {
    icon: 'refresh', tone: 'rose', to: '/test/start/mistakes',
    title: i18n.t({ uz: 'Xatolarim', kr: 'Хатоларим' }),
    sub: i18n.t({ uz: 'Xato qilingan savollar', kr: 'Хато қилинган саволлар' }),
    badge: mistakesPending.value || null,
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
  <div v-if="auth.user" class="mx-auto w-full max-w-[1360px] px-4 sm:px-6 lg:px-8 pb-16 md:pb-12">
    <OnboardingModal />

    <!-- ── 1-qator: salomlashuv + tayyorgarlik ── -->
    <div class="grid grid-cols-1 xl:grid-cols-12 gap-4 sm:gap-5 pt-5 sm:pt-8">
      <!-- pl-14: mobil hamburger; pr-12: mobil bildirishnoma tugmasi -->
      <div class="xl:col-span-5 min-w-0 pl-14 pr-12 md:pl-0 md:pr-0 flex flex-col justify-center">
        <DashboardHeader :exam-days-left="examDaysLeft" />

        <div v-if="(dailyTests && dailyTests.limit !== null) || isGuest"
             class="mt-4 flex flex-wrap items-center gap-2">
          <template v-if="dailyTests && dailyTests.limit !== null">
            <span v-if="freeTestsLeft > 0"
                  class="inline-flex items-center gap-2 h-8 px-3 rounded-full text-xs font-medium"
                  style="background: var(--primary-soft); color: var(--primary);">
              <span class="flex gap-1" aria-hidden="true">
                <span v-for="n in dailyTests.limit" :key="n" class="w-1.5 h-1.5 rounded-full"
                      :style="{ background: n <= freeTestsLeft ? 'var(--primary)' : 'var(--border-1)' }"></span>
              </span>
              {{ i18n.t({ uz: `Bugun ${freeTestsLeft} ta bepul test`, kr: `Бугун ${freeTestsLeft} та бепул тест` }) }}
            </span>
            <NuxtLink v-else to="/pricing"
                      class="inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-medium text-amber-700"
                      style="background: rgba(251,191,36,0.16);">
              <AppIcon name="spark" :size="12" />
              {{ i18n.t({ uz: 'Limit tugadi — Premium: cheksiz', kr: 'Лимит тугади — Премиум: чексиз' }) }}
            </NuxtLink>
          </template>
          <NuxtLink v-if="isGuest" to="/register"
                    class="text-xs underline underline-offset-4" style="color: var(--text-3);">
            {{ i18n.t({ uz: 'Natijani saqlash uchun ro\'yxatdan o\'ting', kr: 'Натижани сақлаш учун рўйхатдан ўтинг' }) }}
          </NuxtLink>
        </div>
      </div>

      <div class="xl:col-span-7 min-w-0">
        <PreparationCard
          :readiness="readiness" :attempts="attempts" :coverage="coverage"
          :seen="seen" :bank-total="bankTotal" :points="points" />
      </div>
    </div>

    <!-- ── 2-qator: imtihon CTA + haftalik XP ── -->
    <div class="grid grid-cols-1 xl:grid-cols-12 gap-4 sm:gap-5 mt-4 sm:mt-5">
      <div class="xl:col-span-7 min-w-0">
        <ExamCTA :current="current" />
      </div>
      <div class="xl:col-span-5 min-w-0">
        <WeeklyXPChallenge :week-xp="weekXp" :streak-current="streakCurrent" />
      </div>
    </div>

    <!-- ── 3-qator: rejimlar ── -->
    <nav class="grid grid-cols-2 sm:grid-cols-4 2xl:grid-cols-8 gap-2.5 sm:gap-3 mt-4 sm:mt-5"
         :aria-label="i18n.t({ uz: 'Mashq rejimlari', kr: 'Машқ режимлари' })">
      <QuickActionCard v-for="t in tiles" :key="t.to"
        :icon="t.icon" :tone="t.tone" :title="t.title" :subtitle="t.sub" :to="t.to" :badge="t.badge" />
    </nav>

    <!-- ── 4-qator: AI tavsiya + mavzular + faollik ── -->
    <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-12 gap-4 sm:gap-5 mt-4 sm:mt-5">
      <div class="xl:col-span-4 min-w-0">
        <AIRecommendationCard />
      </div>
      <div class="xl:col-span-4 min-w-0">
        <TopicStrengthCard />
      </div>
      <div class="lg:col-span-2 xl:col-span-4 min-w-0">
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
      <a href="https://t.me/avtoprav_admin" target="_blank" rel="noopener"
         class="inline-flex items-center gap-1 text-2xs opacity-70 hover:opacity-100 transition-opacity"
         style="color: var(--text-4);">
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
