<script setup lang="ts">
definePageMeta({ middleware: 'guest', layout: false })

const i18n = useI18n()

async function changeLocale(value: 'uz_latn' | 'uz_cyrl') {
  await i18n.setLocale(value)
}

const statBlobs: Record<string, string> = {
  brand:   'rgba(63,88,148,0.35)',
  emerald: 'rgba(16,185,129,0.30)',
  amber:   'rgba(245,158,11,0.30)',
  violet:  'rgba(139,92,246,0.30)',
  rose:    'rgba(244,63,94,0.30)',
  sky:     'rgba(14,165,233,0.30)',
}
function statBlob(t: string) { return statBlobs[t] || statBlobs.brand }

const features = computed(() => [
  { tone: 'emerald', icon: 'stat',    title: i18n.t({ uz: 'Statistika',         kr: 'Статистика' }),         desc: i18n.t({ uz: 'Mavzular bo\'yicha kuchli/zaif tomonlaringizni tahlil bilan ko\'ring.', kr: 'Мавзулар бўйича кучли/заиф томонларингизни таҳлил билан кўринг.' }) },
  { tone: 'amber',   icon: 'flame-outline', title: i18n.t({ uz: 'Kunlik seriya',     kr: 'Кунлик серия' }),     desc: i18n.t({ uz: 'Har kuni 20 savol — odat shakllantiring va seriyangizni saqlang.', kr: 'Ҳар куни 20 савол — одат шакллантиринг ва серияни сақланг.' }) },
  { tone: 'brand',   icon: 'ticket',  title: i18n.t({ uz: '63 ta rasmiy bilet', kr: '63 та расмий билет' }), desc: i18n.t({ uz: 'Rasmiy biletlar to\'plami — jami 1248 ta savol.', kr: 'Расмий билетлар тўплами — жами 1248 та савол.' }) },
  { tone: 'violet',  icon: 'sparkle', title: i18n.t({ uz: 'AI tahlil',          kr: 'AI таҳлил' }),          desc: i18n.t({ uz: 'Zaif mavzularingizni aniqlab, shaxsiy mashq tavsiyalarini beradi.', kr: 'Заиф мавзуларингизни аниқлаб, шахсий машқ тавсияларини беради.' }) },
  { tone: 'sky',     icon: 'refresh', title: i18n.t({ uz: 'Xatolar ustida ish', kr: 'Хатолар устида иш' }), desc: i18n.t({ uz: 'Yo\'l qo\'ygan xatolar avtomatik takrorlanadi — to\'liq o\'zlashtiringizcha.', kr: 'Йўл қўйган хатолар автоматик такрорланади — тўлиқ ўзлаштирингизча.' }) },
])

const pricingFeatures = computed(() => ({
  free: [
    i18n.t({ uz: 'Kuniga 50 ta savol',     kr: 'Кунига 50 та савол' }),
    i18n.t({ uz: '1–10 biletlar bepul',    kr: '1–10 билетлар бепул' }),
    i18n.t({ uz: 'Mavzular bo\'yicha mashq', kr: 'Мавзулар бўйича машқ' }),
  ],
  premium: [
    i18n.t({ uz: 'Cheksiz savollar',                      kr: 'Чексиз саволлар' }),
    i18n.t({ uz: 'Barcha 63 bilet',                       kr: 'Барча 63 билет' }),
    i18n.t({ uz: 'Marafon va xatolar rejimi',             kr: 'Марафон ва хатолар режими' }),
    i18n.t({ uz: 'AI tahlil va tavsiyalar',               kr: 'AI таҳлил ва тавсиялар' }),
    i18n.t({ uz: 'Kengaytirilgan statistika',             kr: 'Кенгайтирилган статистика' }),
  ],
  yearly: [
    i18n.t({ uz: 'Premium\'ning hammasi',                  kr: 'Премиумнинг ҳаммаси' }),
    i18n.t({ uz: 'Yillik — qulayroq narx',                 kr: 'Йиллик — қулайроқ нарх' }),
    i18n.t({ uz: 'Imtihon kuni hisoblagichi',              kr: 'Имтиҳон куни ҳисоблагичи' }),
    i18n.t({ uz: 'Barcha kelajak yangilanishlar',          kr: 'Барча келажак янгиланишлар' }),
  ],
}))

// Subtle interactive 3D tilt on hover (used via v-tilt on cards)
const vTilt = {
  mounted(el: HTMLElement) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    el.style.transition = 'transform .18s ease-out'
    el.style.willChange = 'transform'
    const MAX = 7
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect()
      const px = (e.clientX - r.left) / r.width - 0.5
      const py = (e.clientY - r.top) / r.height - 0.5
      el.style.transform = `perspective(820px) rotateX(${(-py * MAX).toFixed(2)}deg) rotateY(${(px * MAX).toFixed(2)}deg) translateY(-5px)`
    }
    const onLeave = () => { el.style.transform = '' }
    el.addEventListener('mousemove', onMove)
    el.addEventListener('mouseleave', onLeave)
    ;(el as any)._tilt = () => { el.removeEventListener('mousemove', onMove); el.removeEventListener('mouseleave', onLeave) }
  },
  unmounted(el: any) { el._tilt?.() },
}
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <!-- Public header -->
    <header class="sticky top-0 z-30 bg-white/70 backdrop-blur-md border-b border-ink-200/60">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        <NuxtLink to="/welcome" class="flex items-center gap-2.5">
          <div class="w-7 h-7 rounded-lg bg-ink-900 text-white grid place-items-center text-sm font-bold tracking-tight">A</div>
          <span class="font-semibold tracking-tightish text-ink-900">Avtoprav</span>
        </NuxtLink>

        <nav class="hidden md:flex items-center gap-6 text-sm text-ink-600">
          <a href="#features" class="hover:text-ink-900 transition-colors">{{ i18n.t({ uz: 'Imkoniyatlar', kr: 'Имкониятлар' }) }}</a>
          <a href="#pricing"  class="hover:text-ink-900 transition-colors">{{ i18n.t({ uz: 'Tariflar',    kr: 'Тарифлар' }) }}</a>
          <span class="hover:text-ink-900 transition-colors cursor-default">{{ i18n.t({ uz: 'Yordam', kr: 'Ёрдам' }) }}</span>
        </nav>

        <div class="flex items-center gap-2">
          <div class="hidden sm:flex items-center bg-ink-100 rounded-md p-0.5 text-xs font-medium">
            <button @click="changeLocale('uz_latn')" :class="i18n.locale.value === 'uz_latn' ? 'bg-white shadow-soft text-ink-900' : 'text-ink-500'" class="px-2 py-1 rounded">Lotin</button>
            <button @click="changeLocale('uz_cyrl')" :class="i18n.locale.value === 'uz_cyrl' ? 'bg-white shadow-soft text-ink-900' : 'text-ink-500'" class="px-2 py-1 rounded">Кирилл</button>
          </div>
          <NuxtLink to="/login" class="btn-ghost text-sm">{{ i18n.t({ uz: 'Kirish', kr: 'Кириш' }) }}</NuxtLink>
          <NuxtLink to="/register" class="btn-primary text-sm">{{ i18n.t({ uz: 'Ro\'yxatdan o\'tish', kr: 'Рўйхатдан ўтиш' }) }}</NuxtLink>
        </div>
      </div>
    </header>

    <main class="flex-1">
      <!-- Hero -->
      <section class="relative overflow-hidden">
        <div aria-hidden="true" class="pointer-events-none absolute inset-0">
          <div class="absolute -top-32 -left-32 w-[28rem] h-[28rem] rounded-full bg-brand-200/40 blur-3xl"></div>
          <div class="absolute -top-24 right-0 w-[22rem] h-[22rem] rounded-full bg-amber-100/60 blur-3xl"></div>
        </div>

        <div class="relative max-w-6xl mx-auto px-4 sm:px-6 pt-16 sm:pt-20 pb-12">
          <div class="grid grid-cols-12 gap-10 items-center">
            <!-- Hero copy -->
            <div class="col-span-12 lg:col-span-7">
              <div class="inline-flex items-center gap-2 h-7 px-2.5 rounded-full bg-white border border-ink-200/70 shadow-soft text-2xs font-semibold text-ink-700 mb-6">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                {{ i18n.t({ uz: 'AVTOPRAV · 2026 yangilangan biletlar', kr: 'AVTOPRAV · 2026 янгиланган билетлар' }) }}
              </div>

              <h1 class="text-3xl sm:text-5xl lg:text-[3.25rem] font-semibold tracking-tightest leading-[1.05] text-ink-900 text-balance">
                {{ i18n.t({
                  uz: 'Yo\'l harakati imtihoniga ishonch bilan tayyorlaning.',
                  kr: 'Йўл ҳаракати имтиҳонига ишонч билан тайёрланинг.'
                }) }}
              </h1>
              <p class="mt-5 text-lg text-ink-500 max-w-2xl leading-relaxed text-balance">
                {{ i18n.t({
                  uz: 'Rasmiy biletlar, mavzular bo\'yicha mashq, xatolar ustida ish va shaxsiy AI tahlil — hammasi bir joyda. Bepul boshlang.',
                  kr: 'Расмий билетлар, мавзулар бўйича машқ, хатолар устида иш ва шахсий AI таҳлил — ҳаммаси бир жойда. Бепул бошланг.'
                }) }}
              </p>

              <div class="mt-7 flex flex-wrap gap-3">
                <NuxtLink to="/register" class="btn-gradient btn-lg">
                  <AppIcon name="exam" :size="16" />
                  {{ i18n.t({ uz: 'Bepul boshlash', kr: 'Бепул бошлаш' }) }}
                </NuxtLink>
                <a href="#features" class="btn-outline btn-lg">
                  {{ i18n.t({ uz: 'Imkoniyatlar', kr: 'Имкониятлар' }) }}
                  <AppIcon name="arrow" :size="14" />
                </a>
              </div>

              <div class="mt-7 flex flex-wrap items-center gap-x-7 gap-y-2 text-sm text-ink-600">
                <div v-for="t in [
                  i18n.t({ uz: 'Reklama yo\'q', kr: 'Реклама йўқ' }),
                  i18n.t({ uz: '1248 ta savol', kr: '1248 та савол' }),
                  i18n.t({ uz: '2 tilda · lotin + kirill', kr: '2 тилда · лотин + кирилл' }),
                  i18n.t({ uz: 'Yutuqlar va reyting', kr: 'Ютуқлар ва рейтинг' }),
                ]" :key="t" class="flex items-center gap-2">
                  <span class="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 grid place-items-center">
                    <AppIcon name="check" :size="12" />
                  </span>
                  {{ t }}
                </div>
              </div>
            </div>

            <!-- Floating demo -->
            <div class="col-span-12 lg:col-span-5 relative min-h-[420px]">
              <ClientOnly>
                <Car3D height="440px" />
                <template #fallback>
                  <div class="rounded-3xl w-full" style="height: 440px; background: linear-gradient(160deg, #312e81 0%, #6d28d9 45%, #be185d 100%);"></div>
                </template>
              </ClientOnly>
              <div class="mt-3 text-center text-2xs text-ink-400">
                {{ i18n.t({ uz: 'Aylantirish uchun sudrang ↻', kr: 'Айлантириш учун судранг ↻' }) }}
              </div>

              <!-- floating chip top-right -->
              <div class="absolute -top-4 -right-3 card px-3.5 py-2.5 flex items-center gap-2.5" style="transform: rotate(4deg);">
                <AppIcon name="flame" :size="20" class="text-amber-600" />
                <div>
                  <div class="eyebrow">{{ i18n.t({ uz: 'Seriya', kr: 'Серия' }) }}</div>
                  <div class="font-semibold tabular-nums text-ink-900 -mt-0.5">14 {{ i18n.t({ uz: 'kun', kr: 'кун' }) }}</div>
                </div>
              </div>

              <!-- floating chip bottom-left -->
              <div class="absolute -bottom-3 -left-4 card px-3.5 py-2.5 flex items-center gap-3" style="transform: rotate(-3deg);">
                <div class="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 grid place-items-center">
                  <AppIcon name="check" :size="16" />
                </div>
                <div>
                  <div class="eyebrow">{{ i18n.t({ uz: 'Bilet #42', kr: 'Билет #42' }) }}</div>
                  <div class="font-semibold tabular-nums text-ink-900 -mt-0.5">19 / 20 · {{ i18n.t({ uz: 'A\'lo', kr: 'Аъло' }) }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Stats — Bento grid -->
      <section class="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-8">
          <div>
            <div class="inline-flex items-center gap-2 px-2.5 h-7 rounded-full text-2xs font-bold uppercase tracking-[0.12em]"
                 style="background: linear-gradient(90deg, rgba(139,92,246,0.12), rgba(6,182,212,0.12)); color: #6d28d9;">
              <span class="w-1.5 h-1.5 rounded-full" style="background: linear-gradient(90deg, #8b5cf6, #06b6d4);"></span>
              {{ i18n.t({ uz: 'Raqamlarda', kr: 'Рақамларда' }) }}
            </div>
            <h2 class="text-3xl sm:text-4xl font-semibold tracking-tightest text-ink-900 mt-3 leading-[1.1]">
              {{ i18n.t({ uz: 'Tayyorgarlik uchun', kr: 'Тайёргарлик учун' }) }}
              <span class="bg-clip-text text-transparent" style="background-image: linear-gradient(135deg, #8b5cf6, #6366f1, #06b6d4);">
                {{ i18n.t({ uz: 'kerakli hamma narsa', kr: 'керакли ҳамма нарса' }) }}
              </span>
            </h2>
          </div>
          <p class="text-sm text-ink-500 max-w-xs">
            {{ i18n.t({
              uz: 'Avtoprav — haydovchilik imtihoniga tayyorlanishning qulay va bepul yo\'li.',
              kr: 'Avtoprav — ҳайдовчилик имтиҳонига тайёрланишнинг қулай ва бепул йўли.'
            }) }}
          </p>
        </div>

        <!-- Bento grid -->
        <div class="grid grid-cols-12 gap-3 sm:gap-4">
          <!-- Hero stat: 48,217 active users -->
          <div class="col-span-12 sm:col-span-7 relative overflow-hidden rounded-3xl p-7 sm:p-9 transition-all hover:-translate-y-1"
               style="background: linear-gradient(135deg, #0e1016 0%, #1e1b3a 50%, #1e293b 100%); color: #fff; min-height: 220px;">
            <!-- decorative dot pattern -->
            <div aria-hidden="true" class="absolute inset-0 opacity-30 pointer-events-none"
                 style="background-image: radial-gradient(rgba(255,255,255,0.18) 1px, transparent 1px); background-size: 18px 18px;"></div>
            <!-- glow blobs -->
            <div aria-hidden="true" class="absolute -top-20 -right-20 w-60 h-60 rounded-full blur-3xl pulse-slow" style="background: rgba(139,92,246,0.45);"></div>
            <div aria-hidden="true" class="absolute -bottom-24 -left-16 w-72 h-72 rounded-full blur-3xl pulse-slow" style="background: rgba(6,182,212,0.30); animation-delay: 1.5s;"></div>

            <div class="relative h-full flex flex-col">
              <div class="flex items-center gap-2 mb-auto">
                <div class="w-9 h-9 rounded-xl grid place-items-center"
                     style="background: rgba(255,255,255,0.08); backdrop-filter: blur(8px);">
                  <AppIcon name="user" :size="16" class="text-violet-300" />
                </div>
                <span class="text-xs font-medium tracking-wider uppercase text-white/55">
                  {{ i18n.t({ uz: 'Savollar bazasi', kr: 'Саволлар базаси' }) }}
                </span>
                <span class="ml-auto inline-flex items-center gap-1 text-2xs font-bold px-2 h-6 rounded-full"
                      style="background: rgba(16,185,129,0.18); color: #6ee7b7;">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  2026
                </span>
              </div>

              <div class="mt-8">
                <div class="text-6xl sm:text-7xl font-bold tracking-tightest tabular-nums leading-[0.9] bg-clip-text text-transparent"
                     style="background-image: linear-gradient(135deg, #fff 0%, #c4b5fd 50%, #67e8f9 100%);">
                  1 248
                </div>
                <div class="text-sm text-white/60 mt-3 leading-relaxed">
                  {{ i18n.t({
                    uz: 'rasmiy GAI savollari — 63 bilet, 42 mavzuda',
                    kr: 'расмий ГАИ саволлари — 63 билет, 42 мавзуда'
                  }) }}
                </div>
              </div>
            </div>
          </div>

          <!-- 92% passed -->
          <div class="col-span-6 sm:col-span-5 relative overflow-hidden rounded-3xl p-6 transition-all hover:-translate-y-1"
               style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border: 1px solid rgba(16,185,129,0.20); min-height: 220px;">
            <div aria-hidden="true" class="absolute -bottom-12 -right-12 w-48 h-48 rounded-full blur-2xl" style="background: rgba(16,185,129,0.25);"></div>
            <div class="relative h-full flex flex-col justify-between">
              <div class="flex items-start justify-between">
                <div class="w-10 h-10 rounded-xl grid place-items-center"
                     style="background: rgba(16,185,129,0.18); color: #047857;">
                  <AppIcon name="check" :size="18" />
                </div>
                <!-- mini ring -->
                <svg class="w-12 h-12" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(16,185,129,0.15)" stroke-width="3"/>
                  <circle cx="18" cy="18" r="15" fill="none" stroke="#10b981" stroke-width="3"
                          stroke-dasharray="94.25" stroke-dashoffset="0" stroke-linecap="round"
                          transform="rotate(-90 18 18)"/>
                </svg>
              </div>
              <div class="mt-4">
                <div class="text-5xl sm:text-6xl font-bold tracking-tightest tabular-nums leading-none"
                     style="color: #065f46;">
                  100<span class="text-3xl sm:text-4xl">%</span>
                </div>
                <div class="text-sm text-emerald-900/70 mt-2 leading-snug font-medium">
                  {{ i18n.t({ uz: 'reklamasiz, sof o\'quv tajribasi', kr: 'рекламасиз, соф ўқув тажрибаси' }) }}
                </div>
              </div>
            </div>
          </div>

          <!-- 1 247 questions -->
          <div class="col-span-6 sm:col-span-4 relative overflow-hidden rounded-3xl p-6 transition-all hover:-translate-y-1"
               style="background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); border: 1px solid rgba(245,158,11,0.22); min-height: 170px;">
            <div aria-hidden="true" class="absolute -top-10 -right-10 w-36 h-36 rounded-full blur-2xl" style="background: rgba(245,158,11,0.25);"></div>
            <div class="relative h-full flex flex-col justify-between">
              <div class="w-10 h-10 rounded-xl grid place-items-center"
                   style="background: rgba(245,158,11,0.18); color: #b45309;">
                <AppIcon name="ticket" :size="18" />
              </div>
              <div class="mt-4">
                <div class="text-4xl sm:text-5xl font-bold tracking-tightest tabular-nums leading-none"
                     style="color: #78350f;">63</div>
                <div class="text-sm text-amber-900/70 mt-2 leading-snug font-medium">
                  {{ i18n.t({ uz: 'rasmiy bilet', kr: 'расмий билет' }) }}
                </div>
              </div>
            </div>
          </div>

          <!-- 4.9 rating -->
          <div class="col-span-6 sm:col-span-4 relative overflow-hidden rounded-3xl p-6 transition-all hover:-translate-y-1"
               style="background: linear-gradient(135deg, #faf5ff 0%, #ede9fe 100%); border: 1px solid rgba(139,92,246,0.22); min-height: 170px;">
            <div aria-hidden="true" class="absolute -top-10 -left-10 w-36 h-36 rounded-full blur-2xl" style="background: rgba(139,92,246,0.25);"></div>
            <div class="relative h-full flex flex-col justify-between">
              <div class="w-10 h-10 rounded-xl grid place-items-center"
                   style="background: rgba(139,92,246,0.18); color: #6d28d9;">
                <AppIcon name="book" :size="18" />
              </div>
              <div class="mt-4">
                <div class="text-4xl sm:text-5xl font-bold tracking-tightest tabular-nums leading-none"
                     style="color: #4c1d95;">42</div>
                <div class="text-sm text-violet-900/70 mt-2 leading-snug font-medium">
                  {{ i18n.t({ uz: 'mavzu (bo\'lim)', kr: 'мавзу (бўлим)' }) }}
                </div>
              </div>
            </div>
          </div>

          <!-- Trust ticker -->
          <div class="col-span-6 sm:col-span-4 relative overflow-hidden rounded-3xl p-6 transition-all hover:-translate-y-1"
               style="background: linear-gradient(135deg, #ecfeff 0%, #cffafe 100%); border: 1px solid rgba(6,182,212,0.22); min-height: 170px;">
            <div aria-hidden="true" class="absolute -bottom-10 -right-10 w-36 h-36 rounded-full blur-2xl" style="background: rgba(6,182,212,0.25);"></div>
            <div class="relative h-full flex flex-col justify-between">
              <div class="w-10 h-10 rounded-xl grid place-items-center"
                   style="background: rgba(6,182,212,0.18); color: #0e7490;">
                <AppIcon name="globe" :size="18" />
              </div>
              <div class="mt-4">
                <div class="text-4xl sm:text-5xl font-bold tracking-tightest tabular-nums leading-none"
                     style="color: #155e75;">2<span class="text-2xl ml-1">{{ i18n.t({ uz: 'til', kr: 'тил' }) }}</span></div>
                <div class="text-sm text-cyan-900/70 mt-2 leading-snug font-medium">
                  {{ i18n.t({ uz: 'lotin + kirill', kr: 'лотин + кирилл' }) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Points + Leaderboard promo -->
      <section class="max-w-6xl mx-auto px-4 sm:px-6 pb-16 scroll-mt-20">
        <div class="rounded-3xl p-6 sm:p-10 relative overflow-hidden"
             style="background: #0e1016; color: #fff;">
          <div aria-hidden="true" class="absolute -right-24 -top-24 w-96 h-96 rounded-full blur-3xl" style="background: rgba(251,191,36,0.15);"></div>
          <div aria-hidden="true" class="absolute -left-32 -bottom-32 w-[28rem] h-[28rem] rounded-full blur-3xl" style="background: rgba(63,88,148,0.30);"></div>

          <div class="relative grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <div class="inline-flex items-center gap-1.5 px-2.5 h-7 rounded-full text-2xs font-semibold uppercase tracking-wider"
                   style="background: rgba(251,191,36,0.15); color: #fcd34d;">
                <AppIcon name="trophy" :size="11" />
                {{ i18n.t({ uz: 'YANGI', kr: 'ЯНГИ' }) }}
              </div>

              <h2 class="text-3xl sm:text-4xl font-semibold tracking-tightest leading-[1.1] text-white mt-4 text-balance">
                {{ i18n.t({
                  uz: 'XP yig\'ing, reytingda yuqoriga ko\'tariling.',
                  kr: 'XP йиғинг, рейтингда юқорига кўтарилинг.'
                }) }}
              </h2>
              <p class="text-base sm:text-lg text-white/65 mt-4 leading-relaxed text-balance">
                {{ i18n.t({
                  uz: 'Har bir to\'g\'ri javob — XP. Har bir imtihon — bonus. Eng faol o\'quvchilar haftalik va umumiy reytinga chiqadi.',
                  kr: 'Ҳар бир тўғри жавоб — XP. Ҳар бир имтиҳон — бонус. Энг фаол ўқувчилар ҳафталик ва умумий рейтингга чиқади.'
                }) }}
              </p>

              <div class="mt-6 grid grid-cols-2 gap-3">
                <div class="rounded-xl p-3 flex items-center gap-3" style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.08);">
                  <span class="text-2xl font-semibold tabular-nums" style="color: #6ee7b7;">+5</span>
                  <div class="text-2xs text-white/70 leading-tight">{{ i18n.t({ uz: 'to\'g\'ri javob (har biri)', kr: 'тўғри жавоб (ҳар бири)' }) }}</div>
                </div>
                <div class="rounded-xl p-3 flex items-center gap-3" style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.08);">
                  <span class="text-2xl font-semibold tabular-nums" style="color: #fcd34d;">+10</span>
                  <div class="text-2xs text-white/70 leading-tight">{{ i18n.t({ uz: 'imtihonda to\'g\'ri javob', kr: 'имтиҳонда тўғри жавоб' }) }}</div>
                </div>
                <div class="rounded-xl p-3 flex items-center gap-3" style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.08);">
                  <span class="text-2xl font-semibold tabular-nums" style="color: #fca5a5;">+30</span>
                  <div class="text-2xs text-white/70 leading-tight">{{ i18n.t({ uz: 'kunlik maqsad', kr: 'кунлик мақсад' }) }}</div>
                </div>
                <div class="rounded-xl p-3 flex items-center gap-3" style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.08);">
                  <span class="text-2xl font-semibold tabular-nums" style="color: #c4b5fd;">+100</span>
                  <div class="text-2xs text-white/70 leading-tight">{{ i18n.t({ uz: 'imtihon 20/20', kr: 'имтиҳон 20/20' }) }}</div>
                </div>
              </div>

              <div class="mt-7 flex flex-wrap gap-3">
                <NuxtLink to="/register" class="inline-flex items-center justify-center gap-2 h-12 px-5 rounded-xl bg-white text-ink-900 font-medium text-base hover:bg-white/90 transition-colors">
                  <AppIcon name="trophy" :size="16" />
                  {{ i18n.t({ uz: 'Reytingga qo\'shilish', kr: 'Рейтингга қўшилиш' }) }}
                </NuxtLink>
              </div>
            </div>

            <!-- Mock leaderboard -->
            <div class="rounded-2xl p-5" style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);">
              <div class="flex items-center justify-between mb-4">
                <div class="text-2xs uppercase tracking-[0.12em] font-semibold text-white/55">
                  {{ i18n.t({ uz: 'Haftalik reyting', kr: 'Ҳафталик рейтинг' }) }}
                </div>
                <div class="text-2xs text-white/45">
                  {{ i18n.t({ uz: 'namuna', kr: 'намуна' }) }}
                </div>
              </div>
              <div class="space-y-1.5">
                <div v-for="(u, i) in [
                  { n: 'Doniyor B.',  p: 1840, m: '#f59e0b' },
                  { n: 'Madina U.',   p: 1722, m: '#94a3b8' },
                  { n: 'Sherzod X.',  p: 1690, m: '#b45309' },
                  { n: 'Aziz K.',     p: 1612, m: null },
                  { n: 'Dilnoza M.',  p: 1588, m: null },
                ]" :key="u.n"
                     class="flex items-center gap-3 px-3 py-2.5 rounded-lg"
                     :style="i === 3 ? 'background: rgba(63,88,148,0.25);' : ''">
                  <div class="w-7 h-7 rounded-full grid place-items-center text-xs font-semibold tabular-nums flex-shrink-0"
                       :style="{ background: u.m || 'rgba(255,255,255,0.08)', color: u.m ? '#fff' : 'rgba(255,255,255,0.7)' }">
                    {{ i + 1 }}
                  </div>
                  <div class="flex-1 text-sm font-medium text-white truncate">
                    {{ u.n }}
                    <span v-if="i === 3" class="text-2xs text-white/55 ml-1">{{ i18n.t({ uz: '(siz)', kr: '(сиз)' }) }}</span>
                  </div>
                  <div class="text-sm font-semibold tabular-nums text-white">
                    {{ u.p.toLocaleString() }} <span class="text-2xs text-white/45">XP</span>
                  </div>
                </div>
              </div>

              <div class="mt-4 pt-4 border-t flex items-center gap-2 text-2xs text-white/55"
                   style="border-color: rgba(255,255,255,0.08);">
                <AppIcon name="info" :size="11" />
                {{ i18n.t({ uz: 'Har dushanbada haftalik reyting yangilanadi.', kr: 'Ҳар душанбада ҳафталик рейтинг янгиланади.' }) }}
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Features -->
      <section id="features" class="max-w-6xl mx-auto px-4 sm:px-6 pt-2 pb-16 scroll-mt-20">
        <div class="mb-7">
          <div class="eyebrow">01 · {{ i18n.t({ uz: 'Funksiyalar', kr: 'Функциялар' }) }}</div>
          <h2 class="text-2xl sm:text-3xl font-semibold tracking-tightish text-ink-900 mt-1.5">
            {{ i18n.t({ uz: 'Hamma narsa imtihon kuni uchun', kr: 'Ҳамма нарса имтиҳон куни учун' }) }}
          </h2>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- Hero exam card -->
          <div class="card card-hover md:col-span-2 md:row-span-2 p-6 relative overflow-hidden block"
               style="background: #0e1016; border-color: #0e1016; color: #fff;">
            <div aria-hidden="true" class="absolute -right-12 -top-12 w-48 h-48 rounded-full blur-3xl" style="background: rgba(63,88,148,0.4);"></div>
            <div aria-hidden="true" class="absolute right-8 -bottom-8 w-32 h-32 rounded-full blur-2xl" style="background: rgba(251,191,36,0.15);"></div>
            <div class="relative">
              <div class="text-2xs uppercase tracking-[0.12em] font-semibold text-white/60">{{ i18n.t({ uz: 'Tavsiya etiladi', kr: 'Тавсия этилади' }) }}</div>
              <div class="text-2xl font-semibold tracking-tightish mt-1">{{ i18n.t({ uz: 'Imtihon rejimi', kr: 'Имтиҳон режими' }) }}</div>
              <p class="text-sm mt-2 leading-relaxed text-white/70 max-w-md">
                {{ i18n.t({
                  uz: 'Rasmiy GAI imtihoniga to\'liq taqlid. 20 savol, 25 daqiqa, 2 xato ruxsat etiladi — aynan haqiqiy imtihondagi kabi.',
                  kr: 'Расмий ГАИ имтиҳонига тўлиқ тақлид. 20 савол, 25 дақиқа, 2 хато рухсат этилади — айнан ҳақиқий имтиҳондаги каби.'
                }) }}
              </p>

              <div class="mt-6 flex flex-col sm:flex-row items-stretch gap-2">
                <div class="rounded-xl p-3.5 bg-white/5 ring-1 ring-white/10 flex-1">
                  <div class="flex justify-between text-2xs text-white/50 mb-2 tabular-nums">
                    <span>Q 5 / 20</span><span>18:42</span>
                  </div>
                  <div class="text-xs text-white/85 leading-relaxed mb-2.5">"{{ i18n.t({ uz: 'Bu yo\'l belgisining ma\'nosi…', kr: 'Бу йўл белгисининг маъноси…' }) }}"</div>
                  <div class="space-y-1">
                    <div v-for="(l, i) in ['A','B','C','D']" :key="l" class="flex items-center gap-2 text-2xs">
                      <span class="w-4 h-4 rounded grid place-items-center font-semibold"
                            :style="i === 1
                              ? 'background: #fff; color: #0e1016'
                              : 'background: rgba(255,255,255,0.08); color: #fff'">{{ l }}</span>
                      <span class="text-white/70 truncate">{{ i18n.t({ uz: 'Variant matni…', kr: 'Вариант матни…' }) }}</span>
                    </div>
                  </div>
                </div>
                <div class="rounded-xl p-3.5 bg-white/5 ring-1 ring-white/10 flex-1 flex flex-col gap-2.5">
                  <div class="text-2xs uppercase tracking-wider text-white/50 font-semibold">{{ i18n.t({ uz: 'Joriy', kr: 'Жорий' }) }}</div>
                  <div class="flex items-baseline gap-1.5"><span class="text-3xl font-semibold tabular-nums">17</span><span class="text-sm text-white/60">/ 20</span></div>
                  <div class="h-1 bg-white/10 rounded-full overflow-hidden"><div class="h-full bg-emerald-500" style="width: 85%"></div></div>
                  <div class="text-2xs text-emerald-300/90 mt-auto">{{ i18n.t({ uz: 'Imtihonga tayyor', kr: 'Имтиҳонга тайёр' }) }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Feature cells -->
          <div v-for="f in features" :key="f.title" v-tilt class="card card-hover p-5">
            <IconTile :icon="f.icon" :tone="(f.tone as any)" :size="40" />
            <div class="mt-4 font-semibold text-ink-900">{{ f.title }}</div>
            <div class="text-sm text-ink-500 mt-1 leading-relaxed">{{ f.desc }}</div>
          </div>
        </div>
      </section>

      <!-- Pricing -->
      <section id="pricing" class="max-w-6xl mx-auto px-4 sm:px-6 pb-16 scroll-mt-20">
        <div class="mb-7">
          <div class="eyebrow">02 · {{ i18n.t({ uz: 'Tariflar', kr: 'Тарифлар' }) }}</div>
          <h2 class="text-2xl sm:text-3xl font-semibold tracking-tightish text-ink-900 mt-1.5">
            {{ i18n.t({ uz: 'Sodda va halol narxlash', kr: 'Содда ва ҳалол нархлаш' }) }}
          </h2>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- Free -->
          <div class="card p-6 relative">
            <div class="font-semibold tracking-tightish text-lg text-ink-900">{{ i18n.t({ uz: 'Bepul', kr: 'Бепул' }) }}</div>
            <div class="mt-4 flex items-baseline gap-1.5">
              <span class="text-3xl font-semibold tabular-nums tracking-tight text-ink-900">0</span>
              <span class="text-sm text-ink-500">{{ i18n.t({ uz: 'so\'m / oy', kr: "сўм / ой" }) }}</span>
            </div>
            <ul class="mt-5 space-y-2 text-sm text-ink-700">
              <li v-for="f in pricingFeatures.free" :key="f" class="flex items-start gap-2">
                <span class="w-4 h-4 rounded-full grid place-items-center flex-shrink-0 mt-0.5 bg-emerald-100 text-emerald-700">
                  <AppIcon name="check" :size="10" />
                </span>
                {{ f }}
              </li>
            </ul>
            <NuxtLink to="/register" class="btn-outline btn-lg w-full mt-6">{{ i18n.t({ uz: 'Hozir boshlash', kr: 'Ҳозир бошлаш' }) }}</NuxtLink>
          </div>

          <!-- Premium (highlight) -->
          <div class="relative p-6 rounded-2xl" style="background: #0e1016; color: #fff; border: 1px solid #0e1016;">
            <div class="absolute -top-3 left-6 badge" style="background: #fef3c7; color: #92400e;">{{ i18n.t({ uz: 'Eng mashhur', kr: 'Энг машҳур' }) }}</div>
            <div class="font-semibold tracking-tightish text-lg text-white">Premium</div>
            <div class="mt-4 flex items-baseline gap-1.5">
              <span class="text-3xl font-semibold tabular-nums tracking-tight text-white">29 000</span>
              <span class="text-sm text-white/60">{{ i18n.t({ uz: 'so\'m / oy', kr: 'сўм / ой' }) }}</span>
            </div>
            <ul class="mt-5 space-y-2 text-sm text-white/85">
              <li v-for="f in pricingFeatures.premium" :key="f" class="flex items-start gap-2">
                <span class="w-4 h-4 rounded-full grid place-items-center flex-shrink-0 mt-0.5 bg-white/10 text-emerald-300">
                  <AppIcon name="check" :size="10" />
                </span>
                {{ f }}
              </li>
            </ul>
            <NuxtLink to="/register" class="btn-lg w-full mt-6 inline-flex items-center justify-center gap-2 px-4 rounded-xl bg-white text-ink-900 font-medium text-base hover:bg-ink-100">
              {{ i18n.t({ uz: 'Premium olish', kr: 'Премиум олиш' }) }}
            </NuxtLink>
          </div>

          <!-- Yearly -->
          <div class="card p-6 relative">
            <div class="font-semibold tracking-tightish text-lg text-ink-900">{{ i18n.t({ uz: 'Yillik Pro', kr: 'Йиллик Pro' }) }}</div>
            <div class="mt-4 flex items-baseline gap-1.5">
              <span class="text-3xl font-semibold tabular-nums tracking-tight text-ink-900">249 000</span>
              <span class="text-sm text-ink-500">{{ i18n.t({ uz: 'so\'m / yil', kr: 'сўм / йил' }) }}</span>
            </div>
            <ul class="mt-5 space-y-2 text-sm text-ink-700">
              <li v-for="f in pricingFeatures.yearly" :key="f" class="flex items-start gap-2">
                <span class="w-4 h-4 rounded-full grid place-items-center flex-shrink-0 mt-0.5 bg-emerald-100 text-emerald-700">
                  <AppIcon name="check" :size="10" />
                </span>
                {{ f }}
              </li>
            </ul>
            <NuxtLink to="/register" class="btn-outline btn-lg w-full mt-6">{{ i18n.t({ uz: 'Tejash', kr: 'Тежаш' }) }}</NuxtLink>
          </div>
        </div>

        <div class="mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-2xs text-ink-500">
          <span class="flex items-center gap-1.5"><AppIcon name="lock" :size="12" /> {{ i18n.t({ uz: 'Xavfsiz to\'lov', kr: 'Хавфсиз тўлов' }) }}</span>
          <span>Click · Payme · Uzum · Humo / Uzcard</span>
        </div>
      </section>
    </main>

    <footer class="border-t border-ink-200/60 bg-white/40 backdrop-blur">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex items-center justify-between text-sm text-ink-500">
        <div class="flex items-center gap-2.5">
          <div class="w-5 h-5 rounded bg-ink-900 text-white grid place-items-center text-2xs font-bold">A</div>
          <span>© {{ new Date().getFullYear() }} Avtoprav</span>
        </div>
        <span>{{ i18n.t({ uz: 'Yo\'l harakati testlari · O\'zbekiston', kr: 'Йўл ҳаракати тестлари · Ўзбекистон' }) }}</span>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.pulse-slow {
  animation: pulse-slow 5s ease-in-out infinite;
}
@keyframes pulse-slow {
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50%      { opacity: 1;   transform: scale(1.1); }
}
</style>
