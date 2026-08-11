<script setup lang="ts">
import type { Tone } from '~/composables/useTone'

definePageMeta({ middleware: 'auth' })

const i18n = useI18n()
const auth = useAuthStore()

/**
 * `server: false` — SSR'da auth tokeni yo'q, `/topics` esa tokensiz 401 beradi.
 * Ilgari bu sahifa SSR'da so'rardi: birinchi marta kelgan mehmon (cookie'si
 * yo'q) to'g'ridan-to'g'ri /topics ga kirsa, server bo'sh javob olib "Mavzular
 * mavjud emas" holatini chizardi; gidratsiyadan keyin token yaralsa ham hech
 * qanday qayta so'rov bo'lmagani uchun sahifa F5 bosilmaguncha bo'sh qolardi.
 * `watch` mehmon yaralgan (yoki foydalanuvchi almashgan) zahoti qayta so'raydi.
 * Ayni naqsh `useTopicStats.ts` da ham ishlatilgan.
 */
const { data: topicsRes, status, error, refresh } = await useAsyncData(
  'topics',
  () => apiFetch<{ data: any[] }>('/topics'),
  { server: false, default: () => ({ data: [] as any[] }), watch: [() => auth.user?.id] },
)
const topics = computed(() => topicsRes.value?.data || [])

/**
 * `pending` EMAS, `status`: `server: false` da so'rov serverda bajarilmaydi
 * va status 'idle' qoladi, Nuxt 4 da esa `experimental.pendingWhenIdle`
 * sukut bo'yicha false — ya'ni `pending` ham false. Natijada SSR skeletni
 * emas, "Mavzular mavjud emas" bo'sh holatini chizardi.
 */
const yuklanmoqda = computed(() => status.value === 'idle' || status.value === 'pending')

function name(t: any) { return i18n.locale.value === 'uz_cyrl' ? t.name_kr : t.name_uz }

/**
 * Mavzu → ikonka + rang. POZITSIYA bo'yicha aylanma emas, NOM bo'yicha: yangi
 * mavzu qo'shilsa yoki tartib o'zgarsa, mavjud mavzular rangi va ikonkasi
 * o'zgarib ketmasin (foydalanuvchi ularni ko'rinishidan eslab qoladi).
 * Kalitlar — nomdagi o'zak so'z; qidiruv apostrofga sezgir emas, chunki
 * ma'lumotda tipografik `‘` ishlatilgan ("ko‘rsatgich").
 */
const TOPIC_STYLE: Array<{ key: string, icon: string, tone: Tone }> = [
  // 1–4: umumiy boblar
  { key: 'umumiy qoidalar',   icon: 'users',          tone: 'violet' },
  { key: 'haydovchi',         icon: 'traffic-cone',   tone: 'sky' },
  { key: 'piyoda',            icon: 'pedestrian', tone: 'amber' },
  { key: 'maxsus transport',  icon: 'ambulance',      tone: 'rose' },
  // 5–11: yo'l belgilari
  { key: 'ogohlantiruvchi belgilar', icon: 'alert', tone: 'violet' },
  { key: 'imtiyoz belgilari', icon: 'diamond',        tone: 'emerald' },
  { key: 'taqiqlovchi belgilar', icon: 'ban',         tone: 'ink' },
  { key: 'buyuruvchi belgilar', icon: 'arrow-lr',     tone: 'sky' },
  { key: 'axborot',           icon: 'sign',       tone: 'emerald' },
  { key: 'servis belgilari',  icon: 'wrench',         tone: 'sky' },
  // 12–16: chiziqlar va ishoralar
  { key: 'yotiq chiziq',      icon: 'equal',          tone: 'ink' },
  { key: 'tik chiziq',        icon: 'columns',        tone: 'ink' },
  { key: 'svetofor',          icon: 'light-signal',   tone: 'amber' },
  { key: 'tartibga soluvchi', icon: 'user-cog',       tone: 'violet' },
  { key: 'avariya',           icon: 'octagon-alert',  tone: 'rose' },
  // 17–31: harakatlanish qoidalari
  { key: 'manyovr',           icon: 'waypoints',      tone: 'sky' },
  { key: 'joylashuv',         icon: 'route',          tone: 'sky' },
  // 'tezlik' EMAS: ma'lumotdagi nom "Harakatlanish tezligi" — `includes('tezlik')`
  // yolg'on bo'lardi va bu yagona mavzu fallbackka tushardi.
  { key: 'tezlig',            icon: 'gauge',          tone: 'amber' },
  { key: 'quvib',             icon: 'arrow-lr',       tone: 'amber' },
  { key: 'to‘xtash',          icon: 'parking',        tone: 'rose' },
  { key: 'chorraha',          icon: 'fork',           tone: 'violet' },
  { key: 'temir yo',          icon: 'train',          tone: 'rose' },
  { key: 'avtomagistral',     icon: 'route',          tone: 'emerald' },
  { key: 'turar joy',         icon: 'home',          tone: 'emerald' },
  { key: 'nishab',            icon: 'mountain',       tone: 'ink' },
  // 32–42: qolganlar
  // Apostrofsiz dublikat kalitlar (`yonalishli`, `organish`, `toxtash`) olib
  // tashlandi: `norm()` apostrofning HAMMA ko'rinishini bittasiga keltiradi,
  // shuning uchun apostrofli kalit ikkala yozuvni ham ushlaydi; apostrofsiz
  // varianti esa hech qachon mos kelmaydigan o'lik kod edi.
  { key: 'yo‘nalishli transport', icon: 'bus',        tone: 'sky' },
  { key: 'yoritish',          icon: 'bulb',           tone: 'amber' },
  { key: 'shatak',            icon: 'link',           tone: 'ink' },
  { key: 'o‘rgatish',         icon: 'graduation',     tone: 'violet' },
  { key: 'odam tashish',      icon: 'users',          tone: 'violet' },
  { key: 'yuk tashish',       icon: 'package',        tone: 'amber' },
  { key: 'velosiped',         icon: 'bike',           tone: 'emerald' },
  { key: 'mansabdor',         icon: 'clipboard',      tone: 'ink' },
  { key: 'taqiqlovchi shart', icon: 'shield-alert',   tone: 'rose' },
  { key: 'xafsizligi asos',   icon: 'shield',         tone: 'emerald' },
  { key: 'tibbiy yordam',     icon: 'pulse',          tone: 'rose' },
]

/** Tipografik apostrof va bosh harflarni tenglashtiradi. */
function norm(s: string) {
  return (s || '').toLowerCase().replace(/[‘’'`´]/g, '‘')
}

function styleFor(t: any): { icon: string, tone: Tone } {
  // DOIM `name_uz` — ko'rsatish uchun `name(t)` ishlatilsa ham. Kalitlar lotin
  // bo'lgani uchun kirill nom bilan qidirilganda 42/42 mavzu fallbackka
  // tushardi: til almashtirilgan zahoti hamma karta bir xil kitob ikonkasi va
  // bir xil ko'k plita bo'lib qolardi.
  const n = norm(t.name_uz)
  const hit = TOPIC_STYLE.find(s => n.includes(norm(s.key)))
  if (hit) return { icon: hit.icon, tone: hit.tone }
  // Mos kelmasa — bazadagi `icon` maydoni, u ham bo'sh bo'lsa umumiy ikonka.
  return { icon: t.icon || 'book', tone: 'brand' }
}

// O'zlashtirish = mavzudagi BARCHA savollarning qanchasi to'g'ri yechilgani.
function mastery(t: any) { return Number.isFinite(t.mastery) ? Math.round(t.mastery) : 0 }
// Aniqlik faqat savol yechilgan bo'lsa bor (backend aks holda null qaytaradi).
function hasAccuracy(t: any) { return Number.isFinite(t.accuracy) && t.answered > 0 }
function accuracy(t: any) { return hasAccuracy(t) ? Math.round(t.accuracy) : 0 }

/* `--ok`, `--ok-surface-2` EMAS: `-surface-2` oq belgi OSTIDAGI to'ldirish
   uchun mo'ljallangan va qorong'i rejimda QORAYADI (#059669). Bu yerda u
   halqa/chiziq rangi — ustida matn yo'q. Natijada dark rejimda 80%+ natija
   eng xira, 1–50% (--danger, och pushti) eng yorqin bo'lib, rang semantikasi
   teskari o'qilardi. `--ok` dark'da ochadi (#34d399) va qolgan uch holat
   bilan bir yorqinlik darajasida turadi. */
function progressColor(p: number) {
  if (p >= 80) return 'var(--ok)'
  if (p >= 60) return 'var(--primary)'
  if (p >= 50) return 'var(--warn)'
  if (p > 0)   return 'var(--danger)'
  return 'var(--border-1)'
}

/**
 * Halqa UZUNLIGI — o'zlashtirish, RANGI — aniqlik. Ikkisi bitta kartada turgani
 * uchun bir xil rangda bo'lishi kerak: pastdagi chiziq ham aniqlikni ko'rsatadi.
 * Hali yechilmagan mavzuda rang neytral kulrang.
 */
const RING_C = 2 * Math.PI * 15.5 // r=15.5 → aylana uzunligi 97.39
function ringDash(t: any) {
  const filled = Math.min(100, Math.max(0, mastery(t))) / 100 * RING_C
  return `${filled.toFixed(2)} ${RING_C.toFixed(2)}`
}

/** Yig'ma o'zlashtirish — TopicMasteryService formulasi bilan bir xil:
    barcha mavzulardagi to'g'ri yechilgan savol / barcha savol. Foizlarning
    o'rtachasi EMAS: unda 9 savolli mavzu 64 savolli mavzu bilan teng vaznda
    bo'lib, son haqiqatdan uzoqlashardi. */
const overall = computed(() => {
  const list = topics.value
  const total = list.reduce((s, t) => s + (t.questions_count || 0), 0)
  if (!total) return 0
  const done = list.reduce((s, t) => s + (t.mastered || 0), 0)
  return Math.round(done / total * 100)
})

const points = computed(() => auth.user?.points ?? 0)

const stats = computed(() => [
  { icon: 'layers', tone: 'sky' as Tone, value: String(topics.value.length),
    label: i18n.t({ uz: 'Mavzular', kr: 'Мавзулар' }) },
  { icon: 'target', tone: 'sky' as Tone, value: `${overall.value}%`,
    label: i18n.t({ uz: 'Umumiy o\'zlashtirish', kr: 'Умумий ўзлаштириш' }) },
  { icon: 'trophy', tone: 'amber' as Tone, value: `${points.value.toLocaleString()} XP`,
    label: i18n.t({ uz: 'Jami ball', kr: 'Жами балл' }) },
])
</script>

<template>
  <!-- Konteyner dashboard va tariflar bilan AYNAN bir xil — sahifalar chetlari
       bir chizig'da turadi. -->
  <div class="topics mx-auto w-full max-w-[1800px] px-4 sm:px-6 lg:px-8 xl:px-10 pt-6 lg:pt-8 pb-16 md:pb-12">
    <header class="mb-6">
      <div class="eyebrow">{{ i18n.t({ uz: 'Mashq', kr: 'Машқ' }) }}</div>
      <h1 class="page-title">
        {{ i18n.t({ uz: 'Mavzular bo\'yicha mashq', kr: 'Мавзулар бўйича машқ' }) }}
      </h1>
      <p class="page-sub">
        {{ i18n.t({
          uz: 'Bitta mavzuni tanlang va shu yo\'nalishdagi savollar bilan chuqur shug\'ullaning.',
          kr: 'Битта мавзуни танланг ва шу йўналишдаги саволлар билан чуқур шуғулланинг.'
        }) }}
      </p>
    </header>

    <!-- Yig'ma satr -->
    <section class="summary">
      <div class="summary-left">
        <IconTile icon="star" tone="violet" :size="44" />
        <div class="min-w-0">
          <div class="summary-title">
            {{ i18n.t({ uz: 'Muvaffaqiyat sari yana bir qadam!', kr: 'Муваффақият сари яна бир қадам!' }) }}
          </div>
          <p class="summary-note">
            {{ i18n.t({
              uz: 'Doimiy mashq qiling va bilimingizni mustahkamlang.',
              kr: 'Доимий машқ қилинг ва билимингизни мустаҳкамланг.'
            }) }}
          </p>
        </div>
      </div>

      <!-- `<dl>` EMAS: `<dt>`/`<dd>` HTML bo'yicha `dl > div` ning BEVOSITA
           farzandi bo'lishi va `dt` `dd` dan oldin kelishi shart. Bu yerda
           vizual tartib teskari (qiymat tepada) va yonida ikonka bor — ya'ni
           to'g'ri `<dl>` yasash uchun `display: contents` kabi nayranglar
           kerak bo'lardi, ular esa ba'zi ekran o'quvchilarda `dl` bog'lanishini
           buzadi. Oddiy `div`: markup haqiqiy, qiymat va yorliq esa yonma-yon
           o'qiladi ("42 Mavzular"). -->
      <div class="summary-stats">
        <div v-for="s in stats" :key="s.label" class="stat">
          <span class="stat-icon" :class="`stat-icon-${s.tone}`" aria-hidden="true">
            <AppIcon :name="s.icon" :size="18" />
          </span>
          <div class="min-w-0">
            <div class="stat-value">{{ s.value }}</div>
            <div class="stat-label">{{ s.label }}</div>
          </div>
        </div>
      </div>
    </section>

    <!-- Yuklanmoqda. 12 ta: uch ustunda to'rt qator — haqiqiy ro'yxatga
         yaqinroq, sahifa balandligi kamroq sakraydi. -->
    <div v-if="yuklanmoqda" class="grid-topics">
      <div v-for="i in 12" :key="i" class="topic-card skeleton" aria-hidden="true" />
      <span class="sr-only" role="status">
        {{ i18n.t({ uz: 'Mavzular yuklanmoqda…', kr: 'Мавзулар юкланмоқда…' }) }}
      </span>
    </div>

    <!-- Xato — bo'sh holatdan AJRATILGAN. Ilgari ikkisi bir xil "Mavzular
         mavjud emas" matni bo'lib, backend uzilishi shu matn ostida
         yashirinardi va foydalanuvchida qayta urinish yo'li yo'q edi. -->
    <div v-else-if="error" class="empty">
      <span class="empty-icon empty-icon-err"><AppIcon name="alert" :size="26" /></span>
      <p class="empty-text">
        {{ i18n.t({ uz: 'Mavzularni yuklab bo\'lmadi.', kr: 'Мавзуларни юклаб бўлмади.' }) }}
      </p>
      <button type="button" class="empty-retry" @click="refresh()">
        <AppIcon name="refresh" :size="15" />
        {{ i18n.t({ uz: 'Qayta urinish', kr: 'Қайта уриниш' }) }}
      </button>
    </div>

    <!-- Bo'sh -->
    <div v-else-if="topics.length === 0" class="empty">
      <span class="empty-icon"><AppIcon name="book" :size="26" /></span>
      <p class="empty-text">
        {{ i18n.t({ uz: 'Mavzular hozircha mavjud emas.', kr: 'Мавзулар ҳозирча мавжуд эмас.' }) }}
      </p>
    </div>

    <!-- Mavzular -->
    <div v-else class="grid-topics">
      <article v-for="t in topics" :key="t.id" class="topic-card"
               :class="t.questions_count === 0 && 'topic-card-off'">
        <div class="topic-head">
          <IconTile :icon="styleFor(t).icon" :tone="styleFor(t).tone" :size="44" />

          <div class="topic-id">
            <h2 class="topic-name" :title="name(t)">{{ name(t) }}</h2>
            <div class="topic-count">
              {{ t.questions_count }} {{ i18n.t({ uz: 'ta savol', kr: 'та савол' }) }}
            </div>
          </div>

          <!-- O'zlashtirish halqasi. SVG `aria-hidden`: foizi yonida matn
               bilan yozilgan, ekran o'quvchi ikki marta o'qimasin. -->
          <div class="topic-ring">
            <div class="ring-row">
              <svg class="mastery-ring" viewBox="0 0 36 36" aria-hidden="true">
                <circle class="ring-track" cx="18" cy="18" r="15.5" />
                <!-- `v-if`: 0% da yoy umuman chizilmaydi. `stroke-linecap: round`
                     bilan nol uzunlikdagi dash NUQTA bo'lib chiziladi (bu —
                     nuqtali chiziq yasashning standart usuli), shuning uchun
                     bo'sh halqaning tepasida soxta nuqta ko'rinib turardi. -->
                <circle v-if="mastery(t) > 0" class="ring-fill" cx="18" cy="18" r="15.5"
                        :style="{ stroke: progressColor(accuracy(t)), strokeDasharray: ringDash(t) }" />
              </svg>
              <span class="ring-pct">{{ mastery(t) }}%</span>
            </div>
            <div class="ring-label">{{ i18n.t({ uz: 'o\'zlashtirilgan', kr: 'ўзлаштирилган' }) }}</div>
          </div>
        </div>

        <!-- `margin-top: auto` — sarlavha ikki qatorga chiqqanda ham pastki blok
             qo'shni kartalar bilan bir chizig'da qoladi (maketdagidek).
             Tailwind `mt-auto` EMAS: scoped `.topic-foot` selektori (0,2,0)
             bitta klassli utilitani (0,1,0) bosib ketadi. -->
        <div class="topic-foot">
          <div class="topic-meta">
            <span v-if="hasAccuracy(t)" class="meta-left">
              {{ i18n.t({ uz: 'Aniqlik:', kr: 'Аниқлик:' }) }}
              <span class="meta-frac">{{ t.mastered }}/{{ t.answered }}</span>
            </span>
            <span v-else class="meta-left">
              {{ i18n.t({ uz: 'Hali boshlanmagan', kr: 'Ҳали бошланмаган' }) }}
            </span>
            <span class="meta-pct">{{ accuracy(t) }}%</span>
          </div>

          <div class="bar">
            <div class="bar-fill"
                 :style="{ background: progressColor(accuracy(t)), width: accuracy(t) + '%' }" />
          </div>

          <!-- Yagona havola, lekin `::after` bilan BUTUN karta bosiladi:
               kartani ham havola qilsak, ichida ikkinchi havola bo'lib
               qolardi (ekran o'quvchi uchun chalkash, HTMLда noto'g'ri). -->
          <NuxtLink v-if="t.questions_count > 0" class="topic-cta"
                    :to="`/test/start/topic?topic_id=${t.id}`"
                    :aria-label="i18n.t({ uz: `Mashq qilish: ${name(t)}`, kr: `Машқ қилиш: ${name(t)}` })">
            {{ i18n.t({ uz: 'Mashq qilish', kr: 'Машқ қилиш' }) }}
            <AppIcon name="arrow" :size="15" />
          </NuxtLink>
          <div v-else class="topic-cta topic-cta-off" aria-disabled="true">
            {{ i18n.t({ uz: 'Savollar tayyorlanmoqda', kr: 'Саволлар тайёрланмоқда' }) }}
          </div>
        </div>
      </article>
    </div>
  </div>
</template>

<style scoped>
/* Mobil menyu tugmasi (DashboardSidebar) `fixed top-3 left-3` va 40px —
   ya'ni y 12..52 ni egallaydi. Konteynerning `pt-6` (24px) bilan "MASHQ"
   yozuvi shu tugma OSTIDA qolib ketardi. `md` dan pastda tepadan qo'shimcha
   joy beramiz. Scoped `.topics` (0,2,0) Tailwind'ning `pt-6` (0,1,0) ni
   bosadi — shuning uchun bu yerda aniq yozib qo'yilgan. */
@media (max-width: 767px) {
  .topics { padding-top: 3.75rem; }
}

/* ── Sarlavha ── */
.page-title {
  margin-top: 0.35rem;
  font-size: 1.75rem; font-weight: 700; letter-spacing: -0.025em; line-height: 1.15;
  color: var(--text-1);
}
@media (min-width: 640px) { .page-title { font-size: 1.9375rem; } }
.page-sub { margin-top: 0.5rem; font-size: 0.9375rem; line-height: 1.6; color: var(--text-3); }

/* ── Yig'ma satr ── */
.summary {
  display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between;
  gap: 1.25rem;
  padding: 1.1rem 1.4rem;
  border-radius: 1rem;
  background: var(--surface);
  border: 1px solid var(--border-soft);
  box-shadow: var(--shadow-card);
}
.summary-left { display: flex; align-items: center; gap: 0.9rem; min-width: 0; }
.summary-title { font-size: 0.9375rem; font-weight: 600; color: var(--text-1); }
.summary-note { margin-top: 0.15rem; font-size: 0.8125rem; line-height: 1.45; color: var(--text-3); }

.summary-stats { display: flex; flex-wrap: wrap; align-items: center; }
.stat { display: flex; align-items: center; gap: 0.6rem; padding: 0.15rem 1.75rem; }
/* Ajratkich faqat ORASIDA — chetlarda ortiqcha chiziq qolmasin. */
.stat + .stat { border-left: 1px solid var(--divider); }
.stat:last-child { padding-right: 0.25rem; }

.stat-icon { display: grid; place-items: center; flex-shrink: 0; }
.stat-icon-sky { color: var(--primary); }
.stat-icon-amber { color: var(--warn); }

.stat-value {
  font-size: 1.125rem; font-weight: 700; letter-spacing: -0.02em; line-height: 1.2;
  font-variant-numeric: tabular-nums;
  color: var(--text-1);
}
.stat-label { font-size: 0.75rem; line-height: 1.3; color: var(--text-3); }

/* ── To'r ── */
/* `@media` EMAS, formula. Sabab: `@media` DERAZA kengligini o'lchaydi, sidebar
   esa ~271px ni olib qo'yadi. 768px derazada (iPad portret) sidebar paydo
   bo'lib, konteyner 440px ga tushardi va "2 ustun" qoidasi 210px lik ustun
   yasardi — kartada sarlavhaga 24px joy qolib, matn halqa ustiga chiqib
   ketardi. `100%` esa grid KONTEYNERiga nisbatan hisoblanadi, shuning uchun
   sidebar bor/yo'q, yig'ilgan/ochiq — farqi yo'q, o'zi to'g'ri qaror qiladi.
   `max(17.5rem, (100% - 3rem)/3)`: ustun kamida 280px, lekin ko'pi bilan
   UCHTA bo'ladi (maketdagidek) — juda keng ekranda to'rtinchisi qo'shilmaydi. */
.grid-topics {
  display: grid;
  gap: 1.5rem;
  grid-template-columns: repeat(auto-fill, minmax(max(17.5rem, (100% - 3rem) / 3), 1fr));
  margin-top: 1.5rem;
}

/* ── Mavzu kartasi ── */
.topic-card {
  position: relative;              /* .topic-cta::after uchun tayanch */
  display: flex; flex-direction: column;
  min-height: 13.5rem;
  padding: 1.15rem 1.25rem 1.25rem;
  border-radius: 1rem;
  background: var(--surface);
  border: 1px solid var(--border-soft);
  box-shadow: var(--shadow-card);
  transition: border-color .18s, box-shadow .18s, transform .18s;
}
.topic-card:hover { border-color: var(--primary); box-shadow: var(--shadow-lift); transform: translateY(-2px); }

/* Savoli yo'q mavzu. Blanket `opacity` BERILMAYDI: u kartaning hamma matniga
   ko'paytiruvchi bo'lib tushib, `--text-3` ni ~2.8:1 ga, tugma matnini
   ~2.1:1 ga tushirar edi — ya'ni butun karta AA dan chiqib ketardi.
   O'rniga fon bilan "o'chirilgan" ko'rinish beriladi, xiralashish esa faqat
   dekorativ halqaga qo'llanadi. */
.topic-card-off { background: var(--surface-soft); }
.topic-card-off:hover { border-color: var(--border-soft); box-shadow: var(--shadow-card); transform: none; }
.topic-card-off .topic-ring { opacity: 0.5; }

.topic-head { display: flex; align-items: flex-start; gap: 0.85rem; }
.topic-id { flex: 1 1 auto; min-width: 0; }
/* Uch qatorga cheklov. PDD boblari orasida 182 belgili nom bor ("Mansabdor
   shaxslarning va fuqarolarning yo'l harakati xavfsizligini ta'minlash…") —
   cheklovsiz u kartani 359px ga cho'zib, uch ustunli to'rda BUTUN qatorni
   cho'zib yuborardi va qo'shni kartalarda katta bo'sh joy qolardi.
   To'liq nom `title` atributida — hech narsa yo'qolmaydi. */
.topic-name {
  display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 3;
  overflow: hidden;
  /* Bitta uzun so'z ham blokdan toshib chiqmasin: "harakatlanishiga," ~111px
     va tor ustunda halqa ustiga chiqib ketardi (halqada `flex-shrink: 0`). */
  overflow-wrap: anywhere;
  font-size: 0.9375rem; font-weight: 600; line-height: 1.3; letter-spacing: -0.01em;
  color: var(--text-1);
}
.topic-count { margin-top: 0.2rem; font-size: 0.8125rem; color: var(--text-3); }

/* Halqa bloki */
.topic-ring { flex-shrink: 0; text-align: center; }
.ring-row { display: flex; align-items: center; gap: 0.4rem; }
/* `.mastery-ring`, `.ring` EMAS: `ring` — Tailwind'ning haqiqiy utilitasi
   (`--tw-ring-shadow`), u SVG atrofiga 3px ko'k KVADRAT box-shadow chizadi.
   Scoped stil unga qo'shiladi, bosmaydi — natijada halqa doira emas,
   kvadrat ramka ichida ko'rinardi. */
.mastery-ring { width: 2.125rem; height: 2.125rem; transform: rotate(-90deg); flex-shrink: 0; }
.ring-track { fill: none; stroke: var(--surface-inset); stroke-width: 3; }
.ring-fill { fill: none; stroke-width: 3; stroke-linecap: round; transition: stroke-dasharray .5s ease; }
.ring-pct {
  font-size: 0.8125rem; font-weight: 700; font-variant-numeric: tabular-nums;
  white-space: nowrap;
  color: var(--text-1);
}
.ring-label {
  margin-top: 0.1rem; font-size: 0.625rem; line-height: 1.2;
  white-space: nowrap;
  color: var(--text-3);
}

/* Pastki blok */
.topic-foot { margin-top: auto; padding-top: 1.15rem; }
.topic-meta {
  display: flex; align-items: baseline; justify-content: space-between; gap: 0.75rem;
  font-size: 0.8125rem;
}
.meta-left { color: var(--text-3); min-width: 0; }
.meta-frac { color: var(--text-2); font-variant-numeric: tabular-nums; }
.meta-pct { font-weight: 700; font-variant-numeric: tabular-nums; color: var(--text-1); flex-shrink: 0; }

.bar {
  margin-top: 0.5rem;
  height: 0.25rem; border-radius: 9999px; overflow: hidden;
  background: var(--surface-inset);
}
.bar-fill { height: 100%; border-radius: 9999px; transition: width .5s ease, background .3s; }

.topic-cta {
  display: flex; align-items: center; justify-content: center; gap: 0.4rem;
  height: 2.625rem; margin-top: 1rem;
  border-radius: 0.625rem;
  border: 1px solid var(--border-soft);
  background: var(--surface);
  font-size: 0.875rem; font-weight: 600;
  color: var(--primary-ink);
  transition: background .15s, border-color .15s, color .15s;
}
/* Butun kartani bosiladigan qiladi — havolaning O'ZI bitta bo'lib qoladi. */
.topic-cta::after { content: ''; position: absolute; inset: 0; border-radius: inherit; }
/* `:not(.topic-card-off)` SHART: `.topic-card:hover .topic-cta` (0,3,0)
   `.topic-cta-off` (0,1,0) dan kuchli — usiz bosilmaydigan "Savollar
   tayyorlanmoqda" bloki ham hover'da ko'k fon olib, faol tugmaga o'xshab
   qolardi va foydalanuvchi bosishga urinardi. */
.topic-card:not(.topic-card-off):hover .topic-cta { background: var(--primary-soft); border-color: transparent; }
.topic-cta:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }
.topic-cta :deep(svg) { transition: transform .18s; }
.topic-card:not(.topic-card-off):hover .topic-cta :deep(svg) { transform: translateX(2px); }

/* `--text-4` EMAS: 14px/600 matn uchun AA 4.5:1 talab qiladi, `--text-4`
   oq fonda 3.4:1 beradi. */
.topic-cta-off { color: var(--text-3); cursor: not-allowed; }
.topic-cta-off::after { content: none; }

/* Yuklanish skeleti — karta bilan bir o'lchamda, sahifa kamroq "sakraydi".
   `pointer-events: none`: usiz bo'sh skelet ustiga sichqoncha kelganda
   `.topic-card:hover` ishlab, u ko'tarilib ko'k ramka olardi. */
.skeleton { animation: skel 1.6s ease-in-out infinite; pointer-events: none; }
@keyframes skel { 0%, 100% { opacity: 1 } 50% { opacity: .55 } }

/* ── Bo'sh holat ── */
.empty {
  margin-top: 1.5rem; padding: 3.5rem 1.5rem;
  border-radius: 1rem;
  background: var(--surface); border: 1px solid var(--border-soft);
  text-align: center;
}
.empty-icon {
  width: 3.25rem; height: 3.25rem; margin: 0 auto 1rem;
  display: grid; place-items: center; border-radius: 9999px;
  background: var(--surface-inset); color: var(--text-3);
}
.empty-icon-err { background: var(--danger-soft); color: var(--danger-ink); }
.empty-text { font-size: 0.9375rem; color: var(--text-3); }
.empty-retry {
  display: inline-flex; align-items: center; gap: 0.4rem;
  margin-top: 1rem; padding: 0.6rem 1.1rem;
  border-radius: 0.625rem;
  font-size: 0.875rem; font-weight: 600;
  color: var(--primary-ink); background: var(--primary-soft);
}
.empty-retry:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }

@media (prefers-reduced-motion: reduce) {
  .topic-card, .bar-fill, .ring-fill, .topic-cta, .topic-cta :deep(svg) { transition: none; }
  .skeleton { animation: none; }
  .topic-card:hover { transform: none; }
}

/* ── Mobil ── */
/* Statistika satri tor ekranda FLEX-WRAP bilan o'ralganda uchinchi element
   yangi qatorga tushib, `border-left` ajratkichi qator BOSHIDA ortiqcha
   vertikal chiziq bo'lib qolardi. Grid'da uchtasi doim bitta qatorda —
   ajratkich faqat oraliqda chiziladi. Ikonkalar yashiriladi: 100px ustunda
   ular matnga joy qoldirmaydi. */
/* Chegara 900px: 768–790px oralig'ida sidebar paydo bo'lib konteynerni
   siqadi va uchta statistikaning max-content kengligi (~376px) mavjud joyga
   ARANG sig'adi — o'ralish chegarasida turgan holatni umuman qoldirmaymiz. */
@media (max-width: 900px) {
  .summary-stats { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); width: 100%; }
  .stat { padding: 0.15rem 0.6rem; gap: 0; }
  .stat:first-child { padding-left: 0; }
  .stat:last-child { padding-right: 0; }
  .stat-icon { display: none; }
}
@media (max-width: 480px) {
  .summary { padding: 1rem 1.1rem; }
  .topic-card { min-height: 0; padding: 1rem 1.1rem 1.1rem; }
  .topic-foot { padding-top: 1rem; }
}
</style>
