<script setup lang="ts">
const auth = useAuthStore()
const i18n = useI18n()

const { data: stats } = await useAsyncData('home-stats', async () => {
  if (!auth.token) return null
  try { return await apiFetch<any>('/me/stats') } catch { return null }
}, { server: false })

const primaryModes = computed(() => [
  {
    id: 'exam',
    icon: 'exam',
    title: i18n.t({ uz: 'Imtihon rejimi', kr: 'Имтиҳон режими' }),
    desc:  i18n.t({ uz: '20 savol · 25 daqiqa · 2 xato ruxsat etiladi', kr: '20 савол · 25 дақиқа · 2 хато рухсат этилади' }),
    to:    '/test/start/exam',
    cta:   i18n.t({ uz: 'Boshlash', kr: 'Бошлаш' }),
    accent: true,
  },
  {
    id: 'tickets',
    icon: 'ticket',
    title: i18n.t({ uz: 'Biletlar', kr: 'Билетлар' }),
    desc:  i18n.t({ uz: 'Rasmiy GAI biletlari (1–100), har birida 20 savol', kr: 'Расмий ГАИ билетлари (1–100), ҳар бирида 20 савол' }),
    to:    '/tickets',
    cta:   i18n.t({ uz: 'Ochish', kr: 'Очиш' }),
  },
])

const practiceModes = computed(() => [
  {
    id: 'topics',
    icon: 'book',
    title: i18n.t({ uz: 'Mavzular bo\'yicha', kr: 'Мавзулар бўйича' }),
    desc:  i18n.t({ uz: 'Bitta mavzuni chuqur o\'rganing', kr: 'Битта мавзуни чуқур ўрганинг' }),
    to:    '/topics',
    iconBg: 'bg-emerald-100 text-emerald-700',
    iconBgHover: 'group-hover:bg-emerald-500 group-hover:text-white',
  },
  {
    id: 'random',
    icon: 'shuffle',
    title: i18n.t({ uz: 'Tasodifiy 20 savol', kr: 'Тасодифий 20 савол' }),
    desc:  i18n.t({ uz: 'Tezkor mashq, vaqt cheklovsiz', kr: 'Тезкор машқ, вақт чекловсиз' }),
    to:    '/test/start/random',
    iconBg: 'bg-amber-100 text-amber-700',
    iconBgHover: 'group-hover:bg-amber-500 group-hover:text-white',
  },
  {
    id: 'mistakes',
    icon: 'refresh',
    title: i18n.t({ uz: 'Xato ustida ishlash', kr: 'Хато устида ишлаш' }),
    desc:  i18n.t({ uz: 'Faqat siz xato qilgan savollar', kr: 'Фақат сиз хато қилган саволлар' }),
    to:    '/test/start/mistakes',
    iconBg: 'bg-rose-100 text-rose-700',
    iconBgHover: 'group-hover:bg-rose-500 group-hover:text-white',
  },
  {
    id: 'marathon',
    icon: 'bolt',
    title: i18n.t({ uz: 'Marafon', kr: 'Марафон' }),
    desc:  i18n.t({ uz: 'To\'xtamasdan ko\'p savol yeching', kr: 'Тўхтамасдан кўп савол ечинг' }),
    to:    '/test/start/marathon',
    iconBg: 'bg-violet-100 text-violet-700',
    iconBgHover: 'group-hover:bg-violet-500 group-hover:text-white',
  },
  {
    id: 'memorize',
    icon: 'bulb',
    title: i18n.t({ uz: 'Yodlash rejimi', kr: 'Ёдлаш режими' }),
    desc:  i18n.t({ uz: 'Javob va izoh ko\'rinib turadi', kr: 'Жавоб ва изоҳ кўриниб туради' }),
    to:    '/test/start/memorize',
    iconBg: 'bg-sky-100 text-sky-700',
    iconBgHover: 'group-hover:bg-sky-500 group-hover:text-white',
  },
])
</script>

<template>
  <div>
    <!-- HERO with subtle gradient -->
    <section class="relative overflow-hidden">
      <!-- decorative gradients -->
      <div aria-hidden="true" class="pointer-events-none absolute inset-0">
        <div class="absolute -top-32 -left-32 w-[28rem] h-[28rem] rounded-full bg-brand-200/40 blur-3xl"></div>
        <div class="absolute -top-24 right-0 w-[22rem] h-[22rem] rounded-full bg-amber-100/60 blur-3xl"></div>
        <div class="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-ink-200 to-transparent"></div>
      </div>

      <div class="relative max-w-6xl mx-auto px-4 sm:px-6 pt-14 sm:pt-20 pb-10">
        <div class="max-w-3xl">
          <div class="inline-flex items-center gap-2 h-7 px-2.5 rounded-full bg-white border border-ink-200/70 shadow-soft text-2xs font-semibold text-ink-700 mb-5">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            {{ i18n.t({ uz: 'AutoTest · 2026 yangilangan biletlar', kr: 'AutoTest · 2026 янгиланган билетлар' }) }}
          </div>

          <h1 class="text-3xl sm:text-5xl lg:text-[3.5rem] font-semibold tracking-tightest leading-[1.05] text-ink-900 text-balance">
            {{ i18n.t({
              uz: 'Yo\'l harakati imtihoniga ishonch bilan tayyorlaning.',
              kr: 'Йўл ҳаракати имтиҳонига ишонч билан тайёрланинг.'
            }) }}
          </h1>
          <p class="mt-5 text-lg text-ink-500 max-w-2xl text-balance leading-relaxed">
            {{ i18n.t({
              uz: 'Rasmiy GAI biletlari, mavzular bo\'yicha mashq va shaxsiy xatolar tahlili — bir joyda, bepul.',
              kr: 'Расмий ГАИ билетлари, мавзулар бўйича машқ ва шахсий хатолар таҳлили — бир жойда, бепул.'
            }) }}
          </p>

          <div class="mt-7 flex flex-wrap gap-2.5">
            <NuxtLink to="/test/start/exam" class="btn-primary btn-lg">
              <svg class="w-4 h-4" viewBox="0 0 16 16" fill="none">
                <path d="M4 3.5h6.5L13 6v6.5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1z" stroke="currentColor" stroke-width="1.4"/>
                <path d="M5.5 8.5L7 10l3-3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              {{ i18n.t({ uz: 'Imtihonni boshlash', kr: 'Имтиҳонни бошлаш' }) }}
            </NuxtLink>
            <NuxtLink to="/tickets" class="btn-outline btn-lg">
              {{ i18n.t({ uz: 'Biletlarni ko\'rish', kr: 'Билетларни кўриш' }) }}
              <svg class="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none">
                <path d="M2.5 7h9M7 2.5L11.5 7 7 11.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </NuxtLink>
            <NuxtLink v-if="!auth.token" to="/register" class="btn-ghost btn-lg">
              {{ i18n.t({ uz: 'Ro\'yxatdan o\'tish', kr: 'Рўйхатдан ўтиш' }) }}
            </NuxtLink>
          </div>

          <!-- mini features (only when not authed) -->
          <div v-if="!auth.token" class="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-ink-600">
            <div class="flex items-center gap-2">
              <span class="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 grid place-items-center">
                <svg class="w-3 h-3" viewBox="0 0 12 12" fill="none"><path d="M2 6.5L4.5 9L10 3.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </span>
              1200+ {{ i18n.t({ uz: 'savol', kr: 'савол' }) }}
            </div>
            <div class="flex items-center gap-2">
              <span class="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 grid place-items-center">
                <svg class="w-3 h-3" viewBox="0 0 12 12" fill="none"><path d="M2 6.5L4.5 9L10 3.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </span>
              {{ i18n.t({ uz: '2 tilda (lotin + kirill)', kr: '2 тилда (лотин + кирилл)' }) }}
            </div>
            <div class="flex items-center gap-2">
              <span class="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 grid place-items-center">
                <svg class="w-3 h-3" viewBox="0 0 12 12" fill="none"><path d="M2 6.5L4.5 9L10 3.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </span>
              {{ i18n.t({ uz: 'Reklama yo\'q · Bepul', kr: 'Реклама йўқ · Бепул' }) }}
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Stats strip (authenticated) -->
    <section v-if="auth.user && stats" class="max-w-6xl mx-auto px-4 sm:px-6 pb-8">
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <!-- accuracy -->
        <div class="card p-5 relative overflow-hidden">
          <div class="absolute top-3 right-3 w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 grid place-items-center">
            <svg class="w-4 h-4" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5"/>
              <circle cx="8" cy="8" r="2.2" fill="currentColor"/>
            </svg>
          </div>
          <div class="text-2xs uppercase tracking-wider text-ink-500 font-semibold mb-1.5">{{ i18n.t({ uz: 'Aniqlik', kr: 'Аниқлик' }) }}</div>
          <div class="text-2xl font-semibold tracking-tightish text-ink-900 tabular-nums">{{ stats.totals.accuracy_percent }}%</div>
        </div>
        <!-- attempts -->
        <div class="card p-5 relative overflow-hidden">
          <div class="absolute top-3 right-3 w-9 h-9 rounded-xl bg-brand-100 text-brand-700 grid place-items-center">
            <svg class="w-4 h-4" viewBox="0 0 16 16" fill="none">
              <path d="M3.5 8.5l3 3 6-7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div class="text-2xs uppercase tracking-wider text-ink-500 font-semibold mb-1.5">{{ i18n.t({ uz: 'Test yechgan', kr: 'Тест ечган' }) }}</div>
          <div class="text-2xl font-semibold tracking-tightish text-ink-900 tabular-nums">{{ stats.totals.attempts }}</div>
        </div>
        <!-- seen -->
        <div class="card p-5 relative overflow-hidden">
          <div class="absolute top-3 right-3 w-9 h-9 rounded-xl bg-violet-100 text-violet-700 grid place-items-center">
            <svg class="w-4 h-4" viewBox="0 0 16 16" fill="none">
              <path d="M2 8s2-4.5 6-4.5S14 8 14 8s-2 4.5-6 4.5S2 8 2 8z" stroke="currentColor" stroke-width="1.5"/>
              <circle cx="8" cy="8" r="2" stroke="currentColor" stroke-width="1.5"/>
            </svg>
          </div>
          <div class="text-2xs uppercase tracking-wider text-ink-500 font-semibold mb-1.5">{{ i18n.t({ uz: 'Savollar', kr: 'Саволлар' }) }}</div>
          <div class="text-2xl font-semibold tracking-tightish text-ink-900 tabular-nums">{{ stats.totals.questions_seen }}</div>
        </div>
        <!-- mistakes -->
        <div class="card p-5 relative overflow-hidden">
          <div class="absolute top-3 right-3 w-9 h-9 rounded-xl grid place-items-center"
               :class="stats.totals.mistakes_pending ? 'bg-rose-100 text-rose-700' : 'bg-ink-100 text-ink-500'">
            <svg class="w-4 h-4" viewBox="0 0 16 16" fill="none">
              <path d="M14 8a6 6 0 1 1-2-4.5M14 3v3h-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div class="text-2xs uppercase tracking-wider text-ink-500 font-semibold mb-1.5">{{ i18n.t({ uz: 'Hal qilinmagan xato', kr: 'Ҳал қилинмаган хато' }) }}</div>
          <div class="text-2xl font-semibold tracking-tightish tabular-nums"
               :class="stats.totals.mistakes_pending ? 'text-rose-600' : 'text-ink-900'">
            {{ stats.totals.mistakes_pending }}
          </div>
        </div>
      </div>
    </section>

    <!-- Streak (authenticated) -->
    <section v-if="auth.user" class="max-w-6xl mx-auto px-4 sm:px-6 pb-4">
      <StreakBadge />
    </section>

    <!-- Primary modes -->
    <section class="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <div class="flex items-end justify-between mb-5">
        <div>
          <div class="eyebrow mb-1.5">01 · {{ i18n.t({ uz: 'Asosiy', kr: 'Асосий' }) }}</div>
          <h2 class="text-xl sm:text-2xl font-semibold tracking-tightish text-ink-900">
            {{ i18n.t({ uz: 'Imtihonga tayyorgarlik', kr: 'Имтиҳонга тайёргарлик' }) }}
          </h2>
        </div>
      </div>

      <div class="grid md:grid-cols-2 gap-3.5">
        <!-- Exam (dark accent) -->
        <NuxtLink to="/test/start/exam"
          class="card card-hover p-6 group relative overflow-hidden bg-ink-900 border-ink-900 text-white hover:bg-ink-800">
          <!-- decorative gradient -->
          <div aria-hidden="true" class="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-brand-500/30 blur-3xl"></div>
          <div aria-hidden="true" class="absolute right-8 -bottom-8 w-32 h-32 rounded-full bg-amber-400/15 blur-2xl"></div>

          <div class="relative flex items-start gap-4">
            <div class="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur grid place-items-center flex-shrink-0 ring-1 ring-white/15">
              <svg class="w-5 h-5 text-white" viewBox="0 0 20 20" fill="none">
                <path d="M5 3.5h7.5L16 7v8.5a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 4 15.5v-10A1.5 1.5 0 0 1 5.5 4z" stroke="currentColor" stroke-width="1.4"/>
                <path d="M7 10.5l2 2 4-4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <span class="text-2xs uppercase tracking-[0.12em] font-semibold text-white/60">{{ i18n.t({ uz: 'Tavsiya etiladi', kr: 'Тавсия этилади' }) }}</span>
              </div>
              <div class="text-lg font-semibold tracking-tightish text-white">{{ i18n.t({ uz: 'Imtihon rejimi', kr: 'Имтиҳон режими' }) }}</div>
              <p class="text-sm mt-1.5 leading-relaxed text-white/70">
                {{ i18n.t({ uz: '20 savol · 25 daqiqa · 2 xato ruxsat etiladi', kr: '20 савол · 25 дақиқа · 2 хато рухсат этилади' }) }}
              </p>
            </div>
            <div class="w-9 h-9 rounded-full grid place-items-center flex-shrink-0 bg-white text-ink-900 transition-transform group-hover:translate-x-0.5 group-hover:scale-110">
              <svg class="w-4 h-4" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
          </div>
        </NuxtLink>

        <!-- Tickets -->
        <NuxtLink to="/tickets" class="card card-hover p-6 group relative overflow-hidden">
          <div aria-hidden="true" class="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-brand-100/60 blur-3xl"></div>

          <div class="relative flex items-start gap-4">
            <div class="w-12 h-12 rounded-2xl bg-brand-100 text-brand-700 grid place-items-center flex-shrink-0 transition-colors group-hover:bg-brand-500 group-hover:text-white">
              <svg class="w-5 h-5" viewBox="0 0 20 20" fill="none">
                <path d="M3 6.5A1.5 1.5 0 0 1 4.5 5h11A1.5 1.5 0 0 1 17 6.5v2a1.5 1.5 0 0 0 0 3v2a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 3 13.5v-2a1.5 1.5 0 0 0 0-3v-2z" stroke="currentColor" stroke-width="1.4"/>
                <path d="M8.5 6.5v7" stroke="currentColor" stroke-width="1.4" stroke-dasharray="1.5 1.5"/>
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <div class="text-2xs uppercase tracking-[0.12em] font-semibold text-ink-500 mb-1">{{ i18n.t({ uz: 'Rasmiy', kr: 'Расмий' }) }}</div>
              <div class="text-lg font-semibold tracking-tightish text-ink-900">{{ i18n.t({ uz: 'Biletlar', kr: 'Билетлар' }) }}</div>
              <p class="text-sm mt-1.5 leading-relaxed text-ink-500">
                {{ i18n.t({ uz: 'GAI biletlari (1–100), har birida 20 savol', kr: 'ГАИ билетлари (1–100), ҳар бирида 20 савол' }) }}
              </p>
            </div>
            <div class="w-9 h-9 rounded-full grid place-items-center flex-shrink-0 bg-ink-100 text-ink-700 transition-all group-hover:bg-ink-900 group-hover:text-white group-hover:translate-x-0.5">
              <svg class="w-4 h-4" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
          </div>
        </NuxtLink>
      </div>
    </section>

    <!-- Practice modes -->
    <section class="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
      <div class="flex items-end justify-between mb-5">
        <div>
          <div class="eyebrow mb-1.5">02 · {{ i18n.t({ uz: 'Mashq', kr: 'Машқ' }) }}</div>
          <h2 class="text-xl sm:text-2xl font-semibold tracking-tightish text-ink-900">
            {{ i18n.t({ uz: 'Mashq rejimlari', kr: 'Машқ режимлари' }) }}
          </h2>
        </div>
      </div>

      <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        <NuxtLink v-for="m in practiceModes" :key="m.id" :to="m.to"
          class="card card-hover p-5 group relative">
          <div class="flex items-start gap-3.5">
            <div class="w-11 h-11 rounded-xl grid place-items-center flex-shrink-0 transition-colors duration-200"
                 :class="[m.iconBg, m.iconBgHover]">
              <!-- book -->
              <svg v-if="m.icon === 'book'" class="w-5 h-5" viewBox="0 0 20 20" fill="none">
                <path d="M3 4.5A1.5 1.5 0 0 1 4.5 3H9v13.5A1.5 1.5 0 0 0 10.5 18H4.5A1.5 1.5 0 0 1 3 16.5v-12z" stroke="currentColor" stroke-width="1.4"/>
                <path d="M11 3h4.5A1.5 1.5 0 0 1 17 4.5v12a1.5 1.5 0 0 1-1.5 1.5h-4.5" stroke="currentColor" stroke-width="1.4"/>
              </svg>
              <!-- shuffle -->
              <svg v-else-if="m.icon === 'shuffle'" class="w-5 h-5" viewBox="0 0 20 20" fill="none">
                <path d="M3 5h2.5L13 15h4M14.5 12.5L17 15l-2.5 2.5M3 15h2.5L8 12M14.5 7.5L17 5l-2.5-2.5M13 5h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <!-- refresh / mistakes -->
              <svg v-else-if="m.icon === 'refresh'" class="w-5 h-5" viewBox="0 0 20 20" fill="none">
                <path d="M17 10a7 7 0 1 1-2.5-5.4M17 3.5v3.5h-3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <!-- bolt / marathon -->
              <svg v-else-if="m.icon === 'bolt'" class="w-5 h-5" viewBox="0 0 20 20" fill="none">
                <path d="M11 2L4 11h5l-1 7 7-9h-5l1-7z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>
              </svg>
              <!-- bulb / memorize -->
              <svg v-else-if="m.icon === 'bulb'" class="w-5 h-5" viewBox="0 0 20 20" fill="none">
                <path d="M10 2a5 5 0 0 0-3 9v2h6v-2a5 5 0 0 0-3-9zM8 17h4M9 15h2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>

            <div class="flex-1 min-w-0">
              <div class="font-semibold text-ink-900 leading-snug">{{ m.title }}</div>
              <div class="text-sm text-ink-500 mt-1 leading-relaxed">{{ m.desc }}</div>
            </div>

            <svg class="w-4 h-4 text-ink-300 group-hover:text-ink-900 group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-1"
                 viewBox="0 0 16 16" fill="none">
              <path d="M6 4l4 4-4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </NuxtLink>
      </div>
    </section>
  </div>
</template>
