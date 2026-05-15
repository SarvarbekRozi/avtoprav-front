<script setup lang="ts">
const auth = useAuthStore()
const i18n = useI18n()

// Redirect logged-out visitors to landing page (works on SSR + client)
if (!auth.token) {
  await navigateTo('/welcome', { replace: true })
}

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
  const src = auth.user?.full_name || auth.user?.login || ''
  return src.split(/\s+/).filter(Boolean)[0] || ''
})

const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 12) return i18n.t({ uz: 'Xayrli tong', kr: 'Хайрли тонг' })
  if (h < 18) return i18n.t({ uz: 'Xayrli kun',  kr: 'Хайрли кун' })
  return i18n.t({ uz: 'Xayrli oqshom', kr: 'Хайрли оқшом' })
})

const examDaysLeft = computed(() => auth.user?.exam_days_left ?? null)

const current = computed(() => stats.value?.current_attempt as { id: number, mode: string, answered: number, total: number } | null)

const practiceModes = computed(() => [
  {
    id: 'topics', icon: 'book', tone: 'emerald',
    title: i18n.t({ uz: 'Mavzular bo\'yicha', kr: 'Мавзулар бўйича' }),
    desc:  i18n.t({ uz: 'Bitta mavzuni chuqur o\'rganing', kr: 'Битта мавзуни чуқур ўрганинг' }),
    meta:  i18n.t({ uz: 'Mashq', kr: 'Машқ' }),
    to:    '/topics',
  },
  {
    id: 'random', icon: 'shuffle', tone: 'amber',
    title: i18n.t({ uz: 'Tasodifiy 20', kr: 'Тасодифий 20' }),
    desc:  i18n.t({ uz: 'Tezkor mashq, vaqt cheklovsiz', kr: 'Тезкор машқ, вақт чекловсиз' }),
    meta:  i18n.t({ uz: '≈ 12 daqiqa', kr: '≈ 12 дақиқа' }),
    to:    '/test/start/random',
  },
  {
    id: 'mistakes', icon: 'refresh', tone: 'rose',
    title: i18n.t({ uz: 'Xato ustida ishlash', kr: 'Хато устида ишлаш' }),
    desc:  i18n.t({ uz: 'Faqat siz xato qilgan savollar', kr: 'Фақат сиз хато қилган саволлар' }),
    meta:  computed(() => stats.value ? `${stats.value.totals.mistakes_pending} ${i18n.t({ uz: 'ta xato', kr: 'та хато' })}` : '').value,
    to:    '/test/start/mistakes',
  },
  {
    id: 'marathon', icon: 'bolt', tone: 'violet',
    title: i18n.t({ uz: 'Marafon', kr: 'Марафон' }),
    desc:  i18n.t({ uz: 'To\'xtamasdan ko\'p savol yeching', kr: 'Тўхтамасдан кўп савол ечинг' }),
    meta:  i18n.t({ uz: 'Cheklovsiz', kr: 'Чекловсиз' }),
    to:    '/test/start/marathon',
  },
  {
    id: 'memorize', icon: 'bulb', tone: 'sky',
    title: i18n.t({ uz: 'Yodlash rejimi', kr: 'Ёдлаш режими' }),
    desc:  i18n.t({ uz: 'Javob va izoh ko\'rinib turadi', kr: 'Жавоб ва изоҳ кўриниб туради' }),
    meta:  i18n.t({ uz: 'O\'rganish', kr: 'Ўрганиш' }),
    to:    '/test/start/memorize',
  },
  {
    id: 'tickets', icon: 'ticket', tone: 'brand',
    title: i18n.t({ uz: 'Bilet bo\'yicha', kr: 'Билет бўйича' }),
    desc:  i18n.t({ uz: 'GAI biletlari · 1—100', kr: 'ГАИ билетлари · 1—100' }),
    meta:  i18n.t({ uz: 'Katalog', kr: 'Каталог' }),
    to:    '/tickets',
  },
])

const modeLabels: Record<string, { uz: string, kr: string }> = {
  exam:     { uz: 'Imtihon',     kr: 'Имтиҳон' },
  topic:    { uz: 'Mavzu',       kr: 'Мавзу' },
  ticket:   { uz: 'Bilet',       kr: 'Билет' },
  random:   { uz: 'Tasodifiy',   kr: 'Тасодифий' },
  mistakes: { uz: 'Xatolar',     kr: 'Хатолар' },
  marathon: { uz: 'Marafon',     kr: 'Марафон' },
  memorize: { uz: 'Yodlash',     kr: 'Ёдлаш' },
}
function modeLabel(m: string) { return modeLabels[m] ? i18n.t(modeLabels[m]) : m }

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
  <div v-if="auth.user">
    <!-- Hero greeting + countdown -->
    <section class="max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-6">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div class="lg:col-span-7">
          <div class="eyebrow">{{ todayLabel }}</div>
          <h1 class="text-2xl sm:text-[2.25rem] leading-[1.1] font-semibold tracking-tightest mt-1.5 text-ink-900">
            {{ greeting }}<span v-if="firstName">, {{ firstName }}</span>.<br>
            <span v-if="examDaysLeft !== null && examDaysLeft > 0" class="text-ink-500">
              {{ i18n.t({ uz: 'Imtihongacha', kr: 'Имтиҳонгача' }) }} {{ examDaysLeft }} {{ i18n.t({ uz: 'kun qoldi.', kr: 'кун қолди.' }) }}
            </span>
            <span v-else-if="examDaysLeft === 0" class="text-rose-600">
              {{ i18n.t({ uz: 'Imtihon bugun!', kr: 'Имтиҳон бугун!' }) }}
            </span>
            <span v-else class="text-ink-500">
              {{ i18n.t({ uz: 'Profilingizdan imtihon kunini qo\'shing.', kr: 'Профилингиздан имтиҳон кунини қўшинг.' }) }}
            </span>
          </h1>

          <div class="flex flex-wrap items-center gap-2.5 mt-5">
            <NuxtLink v-if="current" :to="`/test/play/${current.id}`" class="btn-primary btn-lg">
              {{ i18n.t({ uz: 'Davom etish', kr: 'Давом этиш' }) }} ·
              <span class="tabular-nums">{{ current.answered }} / {{ current.total }}</span>
              <AppIcon name="arrow" :size="14" />
            </NuxtLink>
            <NuxtLink to="/test/start/exam" class="btn-primary btn-lg" v-else>
              <AppIcon name="exam" :size="15" />
              {{ i18n.t({ uz: 'Imtihon rejimi', kr: 'Имтиҳон режими' }) }}
            </NuxtLink>
            <NuxtLink :to="current ? '/test/start/exam' : '/tickets'" class="btn-outline btn-lg">
              <AppIcon v-if="current" name="exam" :size="15" />
              {{ current ? i18n.t({ uz: 'Imtihon rejimi', kr: 'Имтиҳон режими' }) : i18n.t({ uz: 'Biletlar', kr: 'Билетлар' }) }}
            </NuxtLink>
          </div>
        </div>

        <div class="lg:col-span-5">
          <StreakBadge />
        </div>
      </div>
    </section>

    <!-- KPI strip -->
    <section v-if="stats" class="max-w-6xl mx-auto px-4 sm:px-6 pb-8">
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <!-- XP card (dark accent) -->
        <NuxtLink to="/me/stats"
          class="rounded-2xl p-5 relative overflow-hidden block transition-all hover:-translate-y-0.5"
          style="background: #0e1016; color: #fff; border: 1px solid #0e1016; box-shadow: var(--shadow-card);">
          <div aria-hidden="true" class="absolute -right-12 -top-12 w-32 h-32 rounded-full blur-2xl" style="background: rgba(251,191,36,0.18);"></div>
          <div class="absolute top-3 right-3 w-9 h-9 rounded-xl grid place-items-center" style="background: rgba(255,255,255,0.08);">
            <AppIcon name="trophy" :size="18" class="text-amber-300" />
          </div>
          <div class="text-2xs uppercase tracking-[0.12em] font-semibold text-white/55 mb-2">XP</div>
          <div class="text-2xl font-semibold tracking-tightish tabular-nums text-white">{{ (auth.user?.points ?? 0).toLocaleString() }}</div>
        </NuxtLink>
        <div class="card p-5 relative overflow-hidden">
          <div class="absolute top-3 right-3"><IconTile icon="spark" tone="emerald" :size="36" /></div>
          <div class="eyebrow mb-2">{{ i18n.t({ uz: 'Aniqlik', kr: 'Аниқлик' }) }}</div>
          <div class="text-2xl font-semibold tracking-tightish tabular-nums text-ink-900">{{ stats.totals.accuracy_percent }}%</div>
        </div>
        <div class="card p-5 relative overflow-hidden">
          <div class="absolute top-3 right-3"><IconTile icon="stat" tone="violet" :size="36" /></div>
          <div class="eyebrow mb-2">{{ i18n.t({ uz: 'Savollar', kr: 'Саволлар' }) }}</div>
          <div class="text-2xl font-semibold tracking-tightish tabular-nums text-ink-900">{{ stats.totals.questions_seen }}</div>
        </div>
        <div class="card p-5 relative overflow-hidden">
          <div class="absolute top-3 right-3"><IconTile icon="refresh" tone="rose" :size="36" /></div>
          <div class="eyebrow mb-2">{{ i18n.t({ uz: 'Hal qilinmagan xato', kr: 'Ҳал қилинмаган хато' }) }}</div>
          <div class="text-2xl font-semibold tracking-tightish tabular-nums"
               :class="stats.totals.mistakes_pending ? 'text-rose-600' : 'text-ink-900'">
            {{ stats.totals.mistakes_pending }}
          </div>
        </div>
      </div>
    </section>

    <!-- Practice modes -->
    <section class="max-w-6xl mx-auto px-4 sm:px-6 pb-10">
      <div class="mb-5">
        <div class="eyebrow">02 · {{ i18n.t({ uz: 'Mashq rejimlari', kr: 'Машқ режимлари' }) }}</div>
        <h2 class="text-xl sm:text-2xl font-semibold tracking-tightish text-ink-900 mt-1">
          {{ i18n.t({ uz: 'Bugungi rejangizni tanlang', kr: 'Бугунги режангизни танланг' }) }}
        </h2>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        <NuxtLink v-for="m in practiceModes" :key="m.id" :to="m.to"
          class="card card-hover p-5 group relative block">
          <div class="flex items-start gap-3.5">
            <IconTile :icon="m.icon" :tone="(m.tone as any)" :size="44" />
            <div class="flex-1 min-w-0">
              <div class="font-semibold leading-snug text-ink-900">{{ m.title }}</div>
              <div class="text-sm mt-1 leading-relaxed text-ink-500">{{ m.desc }}</div>
              <div class="text-2xs mt-2.5 font-medium text-ink-400">{{ m.meta }}</div>
            </div>
            <AppIcon name="chev-r" :size="16"
              class="text-ink-300 group-hover:translate-x-0.5 transition-transform flex-shrink-0 mt-1" />
          </div>
        </NuxtLink>
      </div>
    </section>

    <!-- Bottom row -->
    <section class="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div class="lg:col-span-7">
          <TopicStrengthList />
        </div>
        <div class="lg:col-span-5">
          <div class="card">
            <div class="px-5 py-4 border-b border-ink-200/70 flex items-center justify-between">
              <div class="text-sm font-semibold text-ink-900">
                {{ i18n.t({ uz: 'So\'nggi urinishlar', kr: 'Сўнгги уринишлар' }) }}
              </div>
              <NuxtLink to="/me/stats" class="text-xs font-medium text-ink-600 hover:text-ink-900">
                {{ i18n.t({ uz: 'Hammasi', kr: 'Ҳаммаси' }) }} →
              </NuxtLink>
            </div>
            <div v-if="!stats?.recent?.length" class="p-8 text-center text-ink-500 text-sm">
              {{ i18n.t({ uz: 'Hozircha urinishlar yo\'q', kr: 'Ҳозирча уринишлар йўқ' }) }}
            </div>
            <div v-else class="divide-y divide-ink-200/70">
              <NuxtLink v-for="a in stats.recent.slice(0, 5)" :key="a.id" :to="`/test/result/${a.id}`"
                class="flex items-center justify-between px-5 py-3.5 hover:bg-ink-50 transition-colors group">
                <div class="flex items-center gap-3 min-w-0">
                  <div class="w-1.5 h-9 rounded-full flex-shrink-0"
                       :class="a.is_passed ? 'bg-emerald-500' : 'bg-rose-400'"></div>
                  <div class="min-w-0">
                    <div class="flex items-center gap-2">
                      <span class="badge">{{ modeLabel(a.mode) }}</span>
                      <span class="font-semibold text-ink-900 tabular-nums">{{ a.correct_count }} / {{ a.total_questions }}</span>
                    </div>
                    <div class="text-2xs text-ink-500 mt-0.5">{{ timeAgo(a.created_at) }}</div>
                  </div>
                </div>
                <AppIcon name="chev-r" :size="14" class="text-ink-300 group-hover:text-ink-900 transition-colors" />
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
