<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const auth = useAuthStore()
const i18n = useI18n()

const { data: stats } = await useAsyncData('home-stats', async () => {
  if (!auth.token) return null
  try { return await apiFetch<any>('/me/stats') } catch { return null }
}, { server: false })

const MONTH_LATN = ['yanvar','fevral','mart','aprel','may','iyun','iyul','avgust','sentyabr','oktyabr','noyabr','dekabr']
const MONTH_CYRL = ['январ','феврал','март','апрел','май','июн','июл','август','сентябр','октябр','ноябр','декабр']

const todayLabel = computed(() => {
  const d = new Date()
  const month = i18n.locale.value === 'uz_cyrl' ? MONTH_CYRL[d.getMonth()] : MONTH_LATN[d.getMonth()]
  return `${i18n.t({ uz: 'Bugun', kr: 'Бугун' })}, ${d.getDate()}-${month}`
})

const firstName = computed(() => {
  if (!auth.user || auth.user.is_guest) return ''
  const src = auth.user.full_name || auth.user.login || ''
  return src.split(/\s+/).filter(Boolean)[0] || ''
})

const isGuest = computed(() => auth.user?.is_guest ?? false)

const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 12) return i18n.t({ uz: 'Xayrli tong', kr: 'Хайрли тонг' })
  if (h < 18) return i18n.t({ uz: 'Xayrli kun',  kr: 'Хайрли кун' })
  return i18n.t({ uz: 'Xayrli oqshom', kr: 'Хайрли оқшом' })
})

const examDaysLeft = computed(() => auth.user?.exam_days_left ?? null)

const current = computed(() => stats.value?.current_attempt as { id: number, mode: string, answered: number, total: number } | null)

const dailyTests = computed(() => auth.user?.daily_tests ?? null)
const freeTestsLeft = computed(() => {
  const d = dailyTests.value
  if (!d || d.limit === null) return 0
  return Math.max(0, d.limit - d.used_today)
})

const points = computed(() => auth.user?.points ?? 0)
const streakCurrent = computed(() => auth.user?.streak_current ?? 0)
const readiness = computed(() => stats.value?.totals?.readiness_percent ?? 0)
const accuracy = computed(() => stats.value?.totals?.accuracy_percent ?? 0)
const mistakesPending = computed(() => stats.value?.totals?.mistakes_pending ?? 0)

// Compact tile grid — every mode one tap away (mobile-first dashboard)
const tiles = computed(() => [
  { icon: 'star',    tone: 'violet',  title: i18n.t({ uz: 'Kunlik',     kr: 'Кунлик' }),     to: '/test/start/daily',    tag: i18n.t({ uz: 'Yangi', kr: 'Янги' }) },
  { icon: 'bolt',    tone: 'amber',   title: i18n.t({ uz: 'Blits',      kr: 'Блиц' }),       to: '/test/start/blitz',    tag: '60s' },
  { icon: 'ticket',  tone: 'sky',     title: i18n.t({ uz: 'Biletlar',   kr: 'Билетлар' }),   to: '/tickets' },
  { icon: 'book',    tone: 'emerald', title: i18n.t({ uz: 'Mavzular',   kr: 'Мавзулар' }),   to: '/topics' },
  { icon: 'shuffle', tone: 'ink',     title: i18n.t({ uz: 'Tasodifiy',  kr: 'Тасодифий' }),  to: '/test/start/random' },
  { icon: 'refresh', tone: 'rose',    title: i18n.t({ uz: 'Xatolarim',  kr: 'Хатоларим' }),  to: '/test/start/mistakes', badge: mistakesPending.value || null },
  { icon: 'bookmark', tone: 'sky',    title: i18n.t({ uz: 'Saqlangan',  kr: 'Сақланган' }),  to: '/me/bookmarks' },
  { icon: 'stat',    tone: 'brand',   title: i18n.t({ uz: 'Statistika', kr: 'Статистика' }), to: '/me/stats' },
])

const modeLabels: Record<string, { uz: string, kr: string }> = {
  exam:     { uz: 'Imtihon',     kr: 'Имтиҳон' },
  topic:    { uz: 'Mavzu',       kr: 'Мавзу' },
  ticket:   { uz: 'Bilet',       kr: 'Билет' },
  random:   { uz: 'Tasodifiy',   kr: 'Тасодифий' },
  mistakes: { uz: 'Xatolar',     kr: 'Хатолар' },
  marathon: { uz: 'Marafon',     kr: 'Марафон' },
  memorize: { uz: 'Yodlash',     kr: 'Ёдлаш' },
  daily:    { uz: 'Kunlik',      kr: 'Кунлик' },
  blitz:    { uz: 'Blits',       kr: 'Блиц' },
}
function modeLabel(m: string) { return modeLabels[m] ? i18n.t(modeLabels[m]) : m }

const modeMeta: Record<string, { icon: string, tone: string }> = {
  exam:     { icon: 'exam',    tone: 'brand' },
  topic:    { icon: 'book',    tone: 'emerald' },
  ticket:   { icon: 'ticket',  tone: 'brand' },
  random:   { icon: 'shuffle', tone: 'ink' },
  mistakes: { icon: 'refresh', tone: 'rose' },
  marathon: { icon: 'bolt',    tone: 'violet' },
  memorize: { icon: 'bulb',    tone: 'sky' },
  daily:    { icon: 'star',    tone: 'violet' },
  blitz:    { icon: 'bolt',    tone: 'amber' },
}
function modeIcon(m: string) { return modeMeta[m]?.icon ?? 'exam' }
function modeTone(m: string) { return modeMeta[m]?.tone ?? 'brand' }
function attemptPct(a: any) { return a.total_questions ? Math.round((a.correct_count / a.total_questions) * 100) : 0 }

function timeAgo(iso: string) {
  const d = new Date(iso)
  const diffMs = Date.now() - d.getTime()
  const hrs = Math.floor(diffMs / (1000 * 60 * 60))
  const dys = Math.floor(hrs / 24)
  if (hrs < 1)  return i18n.t({ uz: 'hozirgina', kr: 'ҳозиргина' })
  if (hrs < 24) return `${hrs} ${i18n.t({ uz: 'soat oldin', kr: 'соат олдин' })}`
  if (dys === 1) return i18n.t({ uz: 'Kecha', kr: 'Кеча' })
  return `${dys} ${i18n.t({ uz: 'kun oldin', kr: 'кун олдин' })}`
}
</script>

<template>
  <div v-if="auth.user" class="max-w-6xl mx-auto px-4 sm:px-6 pb-20 md:pb-16">
    <OnboardingModal />

    <!-- Header: identity + quick stats (pl clears the mobile hamburger, pr clears the fixed notification bell) -->
    <header class="pt-4 sm:pt-8 pl-14 md:pl-0 pr-14 flex items-center justify-between gap-3">
      <div class="min-w-0">
        <div class="eyebrow">{{ todayLabel }}</div>
        <h1 class="text-xl sm:text-3xl font-semibold tracking-tightish text-ink-900 mt-0.5 truncate">
          {{ greeting }}<span v-if="firstName">, {{ firstName }}</span>
        </h1>
      </div>
      <div class="flex items-center gap-1.5 shrink-0">
        <NuxtLink to="/me/stats"
          class="inline-flex items-center gap-1.5 h-9 px-3 rounded-full text-sm font-semibold tabular-nums"
          style="background: var(--surface); border: 1px solid var(--border-soft); color: var(--text-1); box-shadow: var(--shadow-soft);">
          <AppIcon name="trophy" :size="14" class="text-amber-500" />
          {{ points.toLocaleString() }}
        </NuxtLink>
        <div v-if="streakCurrent > 0"
          class="inline-flex items-center gap-1 h-9 px-2.5 rounded-full text-sm font-semibold tabular-nums text-amber-700"
          style="background: rgba(251,191,36,0.14);">
          <AppIcon name="flame" :size="14" class="text-amber-500" />
          {{ streakCurrent }}
        </div>
      </div>
    </header>

    <!-- Readiness / exam progress -->
    <div class="card p-4 sm:p-5 mt-4">
      <div class="flex items-center justify-between gap-3">
        <div class="text-sm font-medium" style="color: var(--text-3);">
          {{ i18n.t({ uz: 'Tayyorgarlik', kr: 'Тайёргарлик' }) }}
        </div>
        <NuxtLink to="/me/profile" class="inline-flex items-center gap-1 text-xs font-medium" style="color: var(--text-3);">
          <template v-if="examDaysLeft !== null && examDaysLeft > 0">
            {{ i18n.t({ uz: 'Imtihongacha', kr: 'Имтиҳонгача' }) }}
            <b style="color: var(--text-1);">{{ examDaysLeft }} {{ i18n.t({ uz: 'kun', kr: 'кун' }) }}</b>
          </template>
          <template v-else-if="examDaysLeft === 0">
            <b class="text-rose-700">{{ i18n.t({ uz: 'Imtihon bugun!', kr: 'Имтиҳон бугун!' }) }}</b>
          </template>
          <template v-else>
            {{ i18n.t({ uz: 'Sanani belgilash', kr: 'Санани белгилаш' }) }}
          </template>
          <AppIcon name="settings" :size="12" />
        </NuxtLink>
      </div>
      <div class="flex items-end justify-between mt-1.5">
        <div class="text-3xl font-bold tabular-nums text-ink-900">{{ readiness }}%</div>
        <div class="text-xs mb-1" style="color: var(--text-4);">
          {{ i18n.t({ uz: 'Aniqlik', kr: 'Аниқлик' }) }}: <span class="tabular-nums">{{ accuracy }}%</span>
        </div>
      </div>
      <div class="h-2 rounded-full overflow-hidden mt-2" style="background: var(--surface-inset);">
        <div class="h-full rounded-full transition-all duration-500"
             :style="{ width: readiness + '%', background: 'linear-gradient(90deg, var(--accent), #8b5cf6)' }"></div>
      </div>
    </div>

    <!-- Primary actions: Continue (if in-progress) + Exam — big, side by side -->
    <div class="mt-3 grid gap-3" :class="current ? 'grid-cols-2' : 'grid-cols-1'">
      <NuxtLink v-if="current" :to="`/test/play/${current.id}`"
        class="flex items-center justify-between gap-2 rounded-2xl p-4 sm:p-5 text-white transition-all active:scale-[0.98]"
        style="background: linear-gradient(120deg, #059669, #10b981); box-shadow: 0 12px 30px -14px rgba(16,185,129,0.55);">
        <div class="min-w-0">
          <div class="text-base sm:text-lg font-bold leading-tight">{{ i18n.t({ uz: 'Davom etish', kr: 'Давом этиш' }) }}</div>
          <div class="text-xs sm:text-sm text-white/85 mt-0.5 truncate tabular-nums">{{ current.answered }}/{{ current.total }} · {{ modeLabel(current.mode) }}</div>
        </div>
        <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-full grid place-items-center shrink-0" style="background: #fff; color: #059669;">
          <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor"><path d="M6 4l11 6-11 6z"/></svg>
        </div>
      </NuxtLink>

      <NuxtLink to="/test/start/exam"
        class="exam-cta flex items-center justify-between gap-2 rounded-2xl p-4 sm:p-5 text-white transition-all active:scale-[0.98]">
        <div class="min-w-0">
          <div class="text-base sm:text-lg font-bold leading-tight">{{ i18n.t({ uz: 'Imtihon', kr: 'Имтиҳон' }) }}</div>
          <div class="text-xs sm:text-sm text-white/85 mt-0.5 truncate">
            {{ current ? i18n.t({ uz: 'Yangi imtihon', kr: 'Янги имтиҳон' }) : i18n.t({ uz: '20 savol · 25 daqiqa · real imtihon', kr: '20 савол · 25 дақиқа · реал имтиҳон' }) }}
          </div>
        </div>
        <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-full grid place-items-center shrink-0" style="background: #fff; color: #3f5894;">
          <AppIcon name="exam" :size="20" />
        </div>
      </NuxtLink>
    </div>

    <!-- Weekly XP competition teaser -->
    <NuxtLink to="/me/stats"
      class="mt-3 flex items-center gap-3 rounded-2xl p-3.5 sm:p-4 transition-all active:scale-[0.99]"
      style="background: linear-gradient(120deg, rgba(251,191,36,0.16), rgba(245,158,11,0.05)); border: 1px solid rgba(245,158,11,0.32);">
      <div class="w-10 h-10 rounded-full grid place-items-center shrink-0 shadow-soft"
           style="background: linear-gradient(135deg, #fbbf24, #d97706);">
        <AppIcon name="trophy" :size="20" class="text-white" />
      </div>
      <div class="min-w-0 flex-1">
        <div class="text-sm font-bold leading-tight" style="color: var(--text-1);">
          {{ i18n.t({ uz: 'Haftalik XP musobaqasi', kr: 'Ҳафталик XP мусобақаси' }) }}
        </div>
        <div class="text-2xs mt-0.5 tabular-nums" style="color: var(--text-3);">
          {{ i18n.t({ uz: '1-o\'rin — 150 000 so\'m · oylik 500 000 so\'m', kr: '1-ўрин — 150 000 сўм · ойлик 500 000 сўм' }) }}
        </div>
      </div>
      <AppIcon name="chev-r" :size="18" class="shrink-0" style="color: var(--text-4);" />
    </NuxtLink>

    <!-- Daily allowance + guest nudge -->
    <div v-if="(dailyTests && dailyTests.limit !== null) || isGuest" class="mt-3 flex flex-wrap items-center gap-2">
      <template v-if="dailyTests && dailyTests.limit !== null">
        <div v-if="freeTestsLeft > 0" class="inline-flex items-center gap-2 h-8 px-3 rounded-full text-xs font-medium"
             style="background: var(--accent-soft); color: var(--accent);">
          <span class="flex gap-1" aria-hidden="true">
            <span v-for="n in dailyTests.limit" :key="n" class="w-1.5 h-1.5 rounded-full"
                  :style="{ background: n <= freeTestsLeft ? 'var(--accent)' : 'var(--border-1)' }"></span>
          </span>
          {{ i18n.t({ uz: `Bugun ${freeTestsLeft} ta bepul test`, kr: `Бугун ${freeTestsLeft} та бепул тест` }) }}
        </div>
        <NuxtLink v-else to="/pricing" class="inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-medium text-amber-700"
             style="background: rgba(251,191,36,0.14);">
          <AppIcon name="spark" :size="12" />
          {{ i18n.t({ uz: 'Bugungi limit tugadi — Premium: cheksiz', kr: 'Бугунги лимит тугади — Премиум: чексиз' }) }}
        </NuxtLink>
      </template>
      <NuxtLink v-if="isGuest" to="/register" class="text-xs underline decoration-ink-300 underline-offset-4" style="color: var(--text-3);">
        {{ i18n.t({ uz: 'Natijani saqlash uchun ro\'yxatdan o\'ting', kr: 'Натижани сақлаш учун рўйхатдан ўтинг' }) }}
      </NuxtLink>
    </div>

    <!-- Tile grid: every mode one tap away -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3 mt-5">
      <NuxtLink v-for="t in tiles" :key="t.to" :to="t.to"
        class="relative flex items-center gap-3 p-3 rounded-2xl transition-all active:scale-[0.97] hover:-translate-y-0.5"
        style="background: var(--surface); border: 1px solid var(--border-soft); box-shadow: var(--shadow-card);">
        <IconTile :icon="t.icon" :tone="(t.tone as any)" :size="42" />
        <div class="min-w-0 flex-1">
          <div class="font-semibold text-[15px] leading-tight text-ink-900 truncate">{{ t.title }}</div>
        </div>
        <span v-if="(t as any).tag"
              class="absolute top-2 right-2 px-1.5 h-[18px] rounded-full text-[10px] font-bold grid place-items-center whitespace-nowrap"
              style="background: var(--accent-soft); color: var(--accent);">
          {{ (t as any).tag }}
        </span>
        <span v-else-if="(t as any).badge"
              class="absolute top-2 right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold grid place-items-center tabular-nums">
          {{ (t as any).badge }}
        </span>
      </NuxtLink>
    </div>

    <!-- Secondary: topic strength + recent attempts -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 mt-6">
      <div class="lg:col-span-7">
        <TopicStrengthList />
      </div>
      <div class="lg:col-span-5">
        <div class="card">
          <div class="px-4 sm:px-5 py-3.5 flex items-center justify-between" style="border-bottom: 1px solid var(--divider);">
            <div class="text-sm font-semibold text-ink-900">
              {{ i18n.t({ uz: 'So\'nggi urinishlar', kr: 'Сўнгги уринишлар' }) }}
            </div>
            <NuxtLink to="/me/stats" class="text-xs font-medium" style="color: var(--text-3);">
              {{ i18n.t({ uz: 'Hammasi', kr: 'Ҳаммаси' }) }} →
            </NuxtLink>
          </div>
          <div v-if="!stats?.recent?.length" class="p-8 text-center text-sm" style="color: var(--text-3);">
            {{ i18n.t({ uz: 'Hozircha urinishlar yo\'q', kr: 'Ҳозирча уринишлар йўқ' }) }}
          </div>
          <div v-else class="divide-y" style="border-color: var(--divider);">
            <NuxtLink v-for="a in stats.recent.slice(0, 5)" :key="a.id" :to="`/test/result/${a.id}`"
              class="group flex items-center gap-3 px-4 sm:px-5 py-3 transition-colors hover:bg-ink-50">
              <IconTile :icon="modeIcon(a.mode)" :tone="(modeTone(a.mode) as any)" :size="38" />
              <div class="min-w-0 flex-1">
                <div class="text-sm font-semibold text-ink-900 truncate">{{ modeLabel(a.mode) }}</div>
                <div class="text-2xs mt-0.5" style="color: var(--text-4);">
                  <span class="tabular-nums">{{ a.correct_count }}/{{ a.total_questions }}</span> · {{ timeAgo(a.created_at) }}
                </div>
              </div>
              <span class="inline-flex items-center gap-1 px-2 h-6 rounded-full text-2xs font-bold tabular-nums shrink-0"
                    :class="a.is_passed ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'">
                <AppIcon :name="a.is_passed ? 'check' : 'x'" :size="10" />
                {{ attemptPct(a) }}%
              </span>
              <AppIcon name="chev-r" :size="14" class="text-ink-300 shrink-0 group-hover:translate-x-0.5 transition-transform" />
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>

    <!-- Telegram channel banner -->
    <a href="https://t.me/avtoprav_uz" target="_blank" rel="noopener"
       class="card mt-4 sm:mt-5 p-4 sm:p-5 flex items-center gap-3.5 group hover:border-sky-300 transition-colors">
      <span class="w-11 h-11 rounded-xl grid place-items-center flex-shrink-0 text-white" style="background: #229ED9;">
        <AppIcon name="send" :size="20" />
      </span>
      <div class="min-w-0 flex-1">
        <div class="text-sm font-semibold text-ink-900">
          {{ i18n.t({ uz: 'Telegram kanalimiz', kr: 'Telegram каналимиз' }) }} · @avtoprav_uz
        </div>
        <div class="text-xs mt-0.5" style="color: var(--text-3);">
          {{ i18n.t({ uz: 'Taklif va murojaatlar uchun, yangiliklardan xabardor bo\'ling', kr: 'Таклиф ва мурожаатлар учун, янгиликлардан хабардор бўлинг' }) }}
        </div>
      </div>
      <span class="hidden sm:inline-flex items-center gap-1.5 px-3.5 h-9 rounded-lg text-sm font-medium text-white flex-shrink-0 transition-opacity group-hover:opacity-90" style="background: #229ED9;">
        {{ i18n.t({ uz: 'Obuna bo\'lish', kr: 'Обуна бўлиш' }) }}
      </span>
      <AppIcon name="chev-r" :size="16" class="sm:hidden text-ink-300 flex-shrink-0" />
    </a>
  </div>

  <!-- First visit: guest session is being created client-side -->
  <div v-else class="min-h-[70vh] grid place-items-center">
    <div class="text-center">
      <div class="inline-flex w-12 h-12 rounded-2xl bg-ink-900 text-white items-center justify-center mb-4">
        <svg class="w-5 h-5 animate-spin" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="7.5" stroke="currentColor" stroke-width="2" stroke-opacity="0.25"/>
          <path d="M17.5 10A7.5 7.5 0 0 0 10 2.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </div>
      <div class="text-sm text-ink-500">{{ i18n.t({ uz: 'Yuklanmoqda...', kr: 'Юкланмоқда...' }) }}</div>
    </div>
  </div>
</template>
