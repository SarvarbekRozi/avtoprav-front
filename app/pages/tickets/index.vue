<script setup lang="ts">
/**
 * `NuxtLink` ni ANIQ import qilamiz. Sabab: pastda `<component :is>` bilan
 * "havola yoki oddiy div" tanlanadi. Agar u yerda SATR ('NuxtLink') berilsa,
 * Vue `resolveDynamicComponent('NuxtLink')` chaqiradi, Nuxt esa NuxtLink ni
 * GLOBAL ro'yxatga qo'ymaydi (`addComponent` da `global: true` yo'q) va
 * uning avto-import transformi faqat `resolveComponent(...)` ni almashtiradi.
 * Natijada satr o'zgarmay qoladi va brauzer `<NuxtLink>` degan NOMA'LUM
 * teg chizadi: `<a href>` yo'q, karta bosilmaydi, fokus tushmaydi, ekran
 * o'quvchi havola deb e'lon qilmaydi. `.tcard { display: block }` tufayli
 * sahifa vizual jihatdan mukammal ko'ringani uchun buni ko'z bilan
 * payqab bo'lmaydi — qurilgan chunkda tekshirilgan.
 */
import { NuxtLink } from '#components'

definePageMeta({ middleware: 'auth' })

const i18n = useI18n()
const auth = useAuthStore()

/**
 * `server: false` — SSR'da auth tokeni yo'q, `/tickets` esa tokensiz 401
 * beradi va sahifa bo'sh holatda qotib qolardi (aynan shu xato /topics da
 * ham bor edi). `watch` mehmon yaralgan zahoti qayta so'raydi.
 */
const { data: ticketsRes, status, error, refresh } = await useAsyncData(
  'tickets',
  () => apiFetch<{ data: any[] }>('/tickets'),
  { server: false, default: () => ({ data: [] as any[] }), watch: [() => auth.user?.id] },
)
const tickets = computed(() => ticketsRes.value?.data || [])

/**
 * `pending` EMAS, `status`. Sabab: `server: false` bo'lganda so'rov serverda
 * umuman bajarilmaydi va status 'idle' bo'lib qoladi. Nuxt 4 da
 * `experimental.pendingWhenIdle` sukut bo'yicha false — ya'ni idle holatda
 * `pending` ham FALSE. Natijada SSR skeletni emas, "Biletlar mavjud emas"
 * bo'sh holatini chizardi; tekshirildi — SSR HTML'ida aynan shu matn bor edi.
 */
const yuklanmoqda = computed(() => status.value === 'idle' || status.value === 'pending')

/**
 * Bilet holati. Uchta guruh BUTUN ro'yxatni bo'ladi (maketdagi sonlar ham
 * shunday: 28 + 26 + 9 = 63), shuning uchun mezon urinishlar bo'yicha:
 *   mukammal    — eng yaxshi natija o'tish chegarasidan yuqori
 *   tayyor      — yechilgan, lekin hali mukammal emas
 *   ishlanmagan — hali umuman yechilmagan
 *
 * `is_ready` (savoli yetarli) — bu ALOHIDA narsa: bunday bilet ochilmaydi.
 * U kamdan-kam uchraydi (savollar hali yuklanmagan bilet), shuning uchun
 * alohida filtr emas, faqat kartada o'chirilgan holat sifatida ko'rinadi.
 */
type Holat = 'mukammal' | 'tayyor' | 'ishlanmagan'

/** Biletdagi savollar soni. Odatda 20, lekin admin savolni nofaol qilsa
    kamayishi mumkin — chegarani qotirib qo'yib bo'lmaydi. */
function jami(t: any) { return t.questions_count || 20 }

function holat(t: any): Holat {
  // 18 emas, `min(18, jami)`: 17 savolli biletda 18 ball olib bo'lmaydi va
  // bilet HECH QACHON "Mukammal" bo'lolmasdi, hammasini to'g'ri yechsa ham.
  if (t.best_score != null && t.best_score >= Math.min(18, jami(t))) return 'mukammal'
  if ((t.attempts ?? 0) > 0) return 'tayyor'
  return 'ishlanmagan'
}

const HOLAT = {
  mukammal:    { icon: 'star',         soz: { uz: 'Mukammal',    kr: 'Мукаммал' } },
  tayyor:      { icon: 'check-circle', soz: { uz: 'Tayyor',      kr: 'Тайёр' } },
  ishlanmagan: { icon: '',             soz: { uz: 'Ishlanmagan', kr: 'Ишланмаган' } },
} as const

type Filtr = 'all' | 'ishlanmagan' | 'tayyor' | 'mukammal'
const filtr = ref<Filtr>('all')
const qidiruv = ref('')

/** Ko'rinish: katak yoki ro'yxat. Tanlov eslab qolinadi. */
const korinish = useCookie<'grid' | 'list'>('tickets-view', {
  default: () => 'grid', sameSite: 'lax', maxAge: 60 * 60 * 24 * 365,
})

const sonlar = computed(() => {
  const t = tickets.value
  return {
    all: t.length,
    ishlanmagan: t.filter(x => holat(x) === 'ishlanmagan').length,
    tayyor: t.filter(x => holat(x) === 'tayyor').length,
    mukammal: t.filter(x => holat(x) === 'mukammal').length,
  }
})

const filtrlar = computed(() => [
  { id: 'all' as const, label: i18n.t({ uz: 'Hammasi', kr: 'Ҳаммаси' }), son: sonlar.value.all, nuqta: '' },
  { id: 'ishlanmagan' as const, label: i18n.t(HOLAT.ishlanmagan.soz), son: sonlar.value.ishlanmagan, nuqta: 'dot' },
  { id: 'tayyor' as const, label: i18n.t(HOLAT.tayyor.soz), son: sonlar.value.tayyor, nuqta: 'check-circle' },
  { id: 'mukammal' as const, label: i18n.t(HOLAT.mukammal.soz), son: sonlar.value.mukammal, nuqta: 'star' },
])

/** Qidiruv: bilet raqami yoki nomi bo'yicha. */
function nom(t: any) { return i18n.locale.value === 'uz_cyrl' ? t.title_kr : t.title_uz }

const topilgan = computed(() => {
  const q = qidiruv.value.trim().toLowerCase()
  return tickets.value.filter((t) => {
    if (filtr.value !== 'all' && holat(t) !== filtr.value) return false
    if (!q) return true
    return String(t.number).includes(q) || (nom(t) || '').toLowerCase().includes(q)
  })
})

/**
 * Boshida 35 ta ko'rsatiladi (maketdagidek), qolgani tugma bilan ochiladi.
 * Filtr yoki qidiruv o'zgarganda cheklov qaytadi — foydalanuvchi yangi
 * ro'yxatni boshidan ko'radi.
 */
const CHEK = 35
const hammasi = ref(false)
watch([filtr, qidiruv], () => { hammasi.value = false })

const korinadigan = computed(() => hammasi.value ? topilgan.value : topilgan.value.slice(0, CHEK))
const qolgan = computed(() => Math.max(0, topilgan.value.length - CHEK))
</script>

<template>
  <!-- Konteyner dashboard, tariflar va mavzular bilan AYNAN bir xil -->
  <div class="tickets mx-auto w-full max-w-[1800px] px-4 sm:px-6 lg:px-8 xl:px-10 pt-6 lg:pt-8 pb-16 md:pb-12">
    <!-- XP chip maketda shu yerda edi, lekin u yon menyuda ham bor —
         takrorlanmasin uchun olib tashlandi. -->
    <header class="head">
      <div class="eyebrow eyebrow-blue">{{ i18n.t({ uz: 'Biletlar', kr: 'Билетлар' }) }}</div>
      <h1 class="page-title">{{ i18n.t({ uz: 'Rasmiy biletlar', kr: 'Расмий билетлар' }) }}</h1>
      <p class="page-sub">
        {{ i18n.t({
          uz: 'Har bir bilet 20 ta savoldan iborat. Imtihondan o\'tish uchun 18 ta to\'g\'ri javob kerak.',
          kr: 'Ҳар бир билет 20 та саволдан иборат. Имтиҳондан ўтиш учун 18 та тўғри жавоб керак.'
        }) }}
      </p>
    </header>

    <!-- ── Filtrlar + qidiruv + ko'rinish ── -->
    <div class="panel">
      <div class="chips" role="group"
           :aria-label="i18n.t({ uz: 'Biletlarni filtrlash', kr: 'Билетларни филтрлаш' })">
        <button v-for="f in filtrlar" :key="f.id" type="button" class="chip"
                :class="filtr === f.id && 'chip-on'" :aria-pressed="filtr === f.id"
                @click="filtr = f.id">
          <span v-if="f.nuqta === 'dot'" class="chip-dot" aria-hidden="true" />
          <AppIcon v-else-if="f.nuqta" :name="f.nuqta" :size="14"
                   :class="`chip-ic chip-ic-${f.id}`" aria-hidden="true" />
          {{ f.label }}
          <span class="chip-son tabular-nums">{{ f.son }}</span>
        </button>
      </div>

      <div class="tools">
        <div class="search">
          <AppIcon name="search" :size="17" class="search-ic" aria-hidden="true" />
          <input v-model="qidiruv" type="search" class="search-in"
                 :aria-label="i18n.t({ uz: 'Bilet qidirish', kr: 'Билет қидириш' })"
                 :placeholder="i18n.t({
                   uz: 'Bilet nomi yoki raqamini qidirish…',
                   kr: 'Билет номи ёки рақамини қидириш…'
                 })">
        </div>

        <div class="views" role="group"
             :aria-label="i18n.t({ uz: 'Ko\'rinish', kr: 'Кўриниш' })">
          <button type="button" class="view" :class="korinish === 'grid' && 'view-on'"
                  :aria-pressed="korinish === 'grid'"
                  :aria-label="i18n.t({ uz: 'Katak ko\'rinishi', kr: 'Катак кўриниши' })"
                  @click="korinish = 'grid'">
            <AppIcon name="grid" :size="18" />
          </button>
          <button type="button" class="view" :class="korinish === 'list' && 'view-on'"
                  :aria-pressed="korinish === 'list'"
                  :aria-label="i18n.t({ uz: 'Ro\'yxat ko\'rinishi', kr: 'Рўйхат кўриниши' })"
                  @click="korinish = 'list'">
            <AppIcon name="list" :size="18" />
          </button>
        </div>
      </div>
    </div>

    <!-- Yuklanmoqda -->
    <div v-if="yuklanmoqda" class="grid-tickets">
      <div v-for="i in 21" :key="i" class="tcard skeleton" aria-hidden="true" />
      <span class="sr-only" role="status">{{ i18n.t({ uz: 'Biletlar yuklanmoqda…', kr: 'Билетлар юкланмоқда…' }) }}</span>
    </div>

    <!-- Xato (bo'sh holatdan ajratilgan) -->
    <div v-else-if="error" class="empty">
      <span class="empty-icon empty-icon-err"><AppIcon name="alert" :size="26" /></span>
      <p class="empty-text">{{ i18n.t({ uz: 'Biletlarni yuklab bo\'lmadi.', kr: 'Билетларни юклаб бўлмади.' }) }}</p>
      <button type="button" class="empty-retry" @click="refresh()">
        <AppIcon name="refresh" :size="15" />
        {{ i18n.t({ uz: 'Qayta urinish', kr: 'Қайта уриниш' }) }}
      </button>
    </div>

    <!-- Umuman bilet yo'q -->
    <div v-else-if="!tickets.length" class="empty">
      <span class="empty-icon"><AppIcon name="ticket" :size="26" /></span>
      <p class="empty-text">{{ i18n.t({ uz: 'Hozircha biletlar mavjud emas.', kr: 'Ҳозирча билетлар мавжуд эмас.' }) }}</p>
    </div>

    <!-- Filtrga mos kelmadi -->
    <div v-else-if="!topilgan.length" class="empty">
      <span class="empty-icon"><AppIcon name="search" :size="26" /></span>
      <p class="empty-text">{{ i18n.t({ uz: 'Mos bilet topilmadi.', kr: 'Мос билет топилмади.' }) }}</p>
    </div>

    <template v-else>
      <!-- ── KATAK ko'rinishi ── -->
      <div v-if="korinish === 'grid'" class="grid-tickets">
        <component :is="t.is_ready ? NuxtLink : 'div'" v-for="t in korinadigan" :key="t.id"
                   :to="t.is_ready ? `/test/start/ticket?ticket_id=${t.id}` : undefined"
                   class="tcard" :class="[`t-${holat(t)}`, !t.is_ready && 'tcard-off']"
                   :aria-disabled="!t.is_ready || undefined">
          <div class="tnum">{{ t.number }}</div>
          <div class="tqty">{{ t.questions_count }} {{ i18n.t({ uz: 's.', kr: 'с.' }) }}</div>

          <div class="tfoot">
            <span class="tstat">
              <span v-if="holat(t) === 'ishlanmagan'" class="tdot" aria-hidden="true" />
              <AppIcon v-else :name="HOLAT[holat(t)].icon" :size="13" aria-hidden="true" />
              {{ t.is_ready
                ? i18n.t(HOLAT[holat(t)].soz)
                : i18n.t({ uz: 'Tayyorlanmoqda', kr: 'Тайёрланмоқда' }) }}
            </span>
            <span v-if="t.is_ready" class="tgo" aria-hidden="true"><AppIcon name="arrow" :size="14" /></span>
          </div>
        </component>
      </div>

      <!-- ── RO'YXAT ko'rinishi ── -->
      <ul v-else class="list">
        <li v-for="t in korinadigan" :key="t.id">
          <component :is="t.is_ready ? NuxtLink : 'div'"
                     :to="t.is_ready ? `/test/start/ticket?ticket_id=${t.id}` : undefined"
                     class="lrow" :class="[`t-${holat(t)}`, !t.is_ready && 'tcard-off']">
            <span class="lnum tabular-nums">{{ t.number }}</span>
            <span class="lname">{{ nom(t) || i18n.t({ uz: 'Bilet', kr: 'Билет' }) + ' ' + t.number }}</span>
            <span class="lqty">{{ t.questions_count }} {{ i18n.t({ uz: 'savol', kr: 'савол' }) }}</span>
            <span v-if="t.best_score !== null" class="lscore tabular-nums">{{ t.best_score }}/{{ jami(t) }}</span>
            <span class="tstat lstat">
              <span v-if="holat(t) === 'ishlanmagan'" class="tdot" aria-hidden="true" />
              <AppIcon v-else :name="HOLAT[holat(t)].icon" :size="13" aria-hidden="true" />
              {{ t.is_ready
                ? i18n.t(HOLAT[holat(t)].soz)
                : i18n.t({ uz: 'Tayyorlanmoqda', kr: 'Тайёрланмоқда' }) }}
            </span>
            <span v-if="t.is_ready" class="tgo" aria-hidden="true"><AppIcon name="arrow" :size="14" /></span>
          </component>
        </li>
      </ul>

      <!-- Qolganini ko'rsatish -->
      <div v-if="!hammasi && qolgan" class="more-wrap">
        <button type="button" class="more" @click="hammasi = true">
          {{ i18n.t({
            uz: `Barcha ${topilgan.length} ta biletni ko'rsatish`,
            kr: `Барча ${topilgan.length} та билетни кўрсатиш`
          }) }}
          <AppIcon name="chev-d" :size="16" />
        </button>
      </div>
    </template>
  </div>
</template>

<style scoped>
/* ── Sarlavha ── */
/* Ilgari bu yerda `display: flex` bor edi — u faqat XP chipni sarlavhaning
   o'ng tomoniga surish uchun kerak edi. Chip olib tashlangach, oddiy blok. */
.head { min-width: 0; }

/* Maketda eyebrow KO'K (kulrang emas) */
.eyebrow-blue { color: var(--primary-ink); }

.page-title {
  margin-top: 0.35rem;
  font-size: 1.75rem; font-weight: 700; letter-spacing: -0.025em; line-height: 1.15;
  color: var(--text-1);
}
@media (min-width: 640px) { .page-title { font-size: 2.0625rem; } }
.page-sub { margin-top: 0.5rem; font-size: 0.9375rem; line-height: 1.6; color: var(--text-3); }

/* ── Filtr paneli ── */
.panel {
  display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between;
  gap: 0.75rem;
  margin-top: 1.5rem;
}
.chips { display: flex; flex-wrap: wrap; gap: 0.5rem; }

.chip {
  display: inline-flex; align-items: center; gap: 0.45rem;
  height: 2.75rem; padding: 0 1rem;
  border-radius: 0.75rem;
  border: 1px solid var(--border-soft);
  background: var(--surface);
  font-size: 0.875rem; font-weight: 500;
  color: var(--text-2);
  transition: border-color .15s, background .15s, color .15s;
}
.chip:hover { border-color: var(--primary); }
.chip-on {
  border-color: var(--primary);
  color: var(--primary-ink);
  font-weight: 600;
  box-shadow: 0 0 0 3px var(--primary-ring);
}
.chip:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }

.chip-son {
  font-size: 0.75rem; font-weight: 600;
  color: var(--text-4);
}
.chip-on .chip-son { color: var(--primary-ink); }

.chip-dot { width: 0.5rem; height: 0.5rem; border-radius: 9999px; background: var(--warn); }
/* `-ink` tokenlari, `--primary`/`--ok-surface-2` EMAS: bular ma'no tashuvchi
   ikonkalar va WCAG 1.4.11 bo'yicha 3:1 kerak. `--ok-surface-2` (#10b981)
   oq fonda 2.56:1 beradi — yulduzcha yuvilib ketardi. Kartadagi holat
   ranglari bilan ham shu bilan bir xil bo'ladi. */
.chip-ic-tayyor { color: var(--primary-ink); }
.chip-ic-mukammal { color: var(--ok-ink); }

/* ── Qidiruv + ko'rinish ── */
.tools { display: flex; align-items: center; gap: 0.75rem; }

.search { position: relative; }
.search-ic {
  position: absolute; left: 0.85rem; top: 50%; transform: translateY(-50%);
  color: var(--text-4); pointer-events: none;
}
.search-in {
  width: 21rem; max-width: 100%;
  height: 2.75rem; padding: 0 0.9rem 0 2.6rem;
  border-radius: 0.75rem;
  border: 1px solid var(--border-soft);
  background: var(--surface);
  font-size: 0.875rem; color: var(--text-1);
  transition: border-color .15s, box-shadow .15s;
}
.search-in::placeholder { color: var(--text-4); }
.search-in:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-ring); }

.views { display: flex; gap: 0.35rem; }
.view {
  width: 2.75rem; height: 2.75rem;
  display: grid; place-items: center;
  border-radius: 0.75rem;
  border: 1px solid var(--border-soft);
  background: var(--surface);
  color: var(--text-3);
  transition: color .15s, border-color .15s, background .15s;
}
.view:hover { color: var(--text-1); }
.view-on { color: var(--primary-ink); border-color: var(--primary); background: var(--primary-soft); }
.view:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }

/* ── Katak to'ri ──
   `@media` EMAS, formula: `@media` deraza kengligini o'lchaydi, sidebar esa
   ~280px ni olib qo'yadi va ustunlar noto'g'ri hisoblanadi. `100%` grid
   KONTEYNERiga nisbatan — sidebar bor/yo'qligidan qat'i nazar to'g'ri.
   Maketda 7 ta ustun; `minmax(9.5rem, …)` shu zichlikni beradi va tor
   ekranda o'zi kamayadi. */
/* `max(9.5rem, (100% - 6rem)/7)` — ustun soni 7 tadan oshmasin.
   Oddiy `minmax(9.5rem, 1fr)` bo'lsa 1920px da 9, 2560px da 10 ustun chiqib,
   maketdagi zich ritm buzilardi. 7 ustunda 6 ta oraliq bor: 6 x 1rem = 6rem.
   `100%` grid KONTEYNERiga nisbatan hisoblanadi, ya'ni sidebar bor/yo'qligi
   ahamiyatsiz (@media deraza kengligini o'lchagani uchun bu yerda yaramaydi). */
.grid-tickets {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fill, minmax(max(9.5rem, (100% - 6rem) / 7), 1fr));
  margin-top: 1.5rem;
}

.tcard {
  display: block;
  padding: 0.9rem 1rem 0.85rem;
  border-radius: 0.875rem;
  background: var(--surface);
  border: 1px solid var(--border-soft);
  box-shadow: var(--shadow-card);
  transition: border-color .15s, box-shadow .15s, transform .15s;
}
.tcard:hover { border-color: var(--primary); box-shadow: var(--shadow-lift); transform: translateY(-2px); }
.tcard:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }

.tnum { font-size: 1.625rem; font-weight: 700; letter-spacing: -0.02em; line-height: 1.1; color: var(--text-1); }
.tqty { margin-top: 0.1rem; font-size: 0.75rem; color: var(--text-3); }

.tfoot { margin-top: 1.15rem; display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; }

.tstat {
  display: inline-flex; align-items: center; gap: 0.3rem;
  font-size: 0.6875rem; font-weight: 600;
  white-space: nowrap;
}
.tdot { width: 0.4375rem; height: 0.4375rem; border-radius: 9999px; background: currentColor; }

/* Holat ranglari.
   `--warn` (#f59e0b) oq fonda 2.15:1 beradi — matn uchun yaramaydi.
   `--warn-ink` (#92400e) esa `--warn-soft` FONI uchun mo'ljallangan va oq
   ustida jigarrang bo'lib ko'rinadi, maketdagi apelsin tusdan uzoq.
   Shuning uchun oq fon uchun oraliq ton: #b45309 — 5.05:1 (AA dan yuqori)
   va ko'zga apelsin bo'lib ko'rinadi. Qorong'ida to'q sirt ustida yorqin
   amber ishlaydi. */
.tickets { --stat-warn: #b45309; }
.dark .tickets { --stat-warn: var(--warn); }
.t-ishlanmagan .tstat { color: var(--stat-warn); }
.t-tayyor      .tstat { color: var(--primary-ink); }
.t-mukammal    .tstat { color: var(--ok-ink); }

.tgo {
  width: 1.75rem; height: 1.75rem; flex-shrink: 0;
  display: grid; place-items: center;
  border-radius: 9999px;
  transition: transform .15s;
}
.t-ishlanmagan .tgo { background: var(--warn-soft); color: var(--warn-ink); }
.t-tayyor      .tgo { background: var(--primary-soft); color: var(--primary-ink); }
.t-mukammal    .tgo { background: color-mix(in srgb, var(--ok) 15%, transparent); color: var(--ok-ink); }
.tcard:hover .tgo, .lrow:hover .tgo { transform: translateX(2px); }

/* Savoli yetarli emas — ochilmaydi */
.tcard-off { background: var(--surface-soft); cursor: not-allowed; }
.tcard-off:hover { border-color: var(--border-soft); box-shadow: var(--shadow-card); transform: none; }
.tcard-off .tstat { color: var(--text-3); }

/* ── Ro'yxat ko'rinishi ── */
.list { margin-top: 1.5rem; display: flex; flex-direction: column; gap: 0.5rem; }
.lrow {
  display: flex; align-items: center; gap: 1rem;
  padding: 0.75rem 1.1rem;
  border-radius: 0.75rem;
  background: var(--surface);
  border: 1px solid var(--border-soft);
  transition: border-color .15s, box-shadow .15s;
}
.lrow:hover { border-color: var(--primary); box-shadow: var(--shadow-card); }
.lrow:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }
.lnum {
  width: 2.5rem; flex-shrink: 0;
  font-size: 1.0625rem; font-weight: 700; color: var(--text-1);
}
.lname { flex: 1 1 auto; min-width: 0; font-size: 0.875rem; color: var(--text-1);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.lqty { flex-shrink: 0; font-size: 0.8125rem; color: var(--text-3); }
.lscore { flex-shrink: 0; font-size: 0.8125rem; font-weight: 600; color: var(--text-2); }
.lstat { flex-shrink: 0; width: 7rem; }

/* O'chirilgan qator — `.lrow` dan KEYIN turishi shart: aks holda
   `.lrow { background }` va `.lrow:hover` yuqoridagi `.tcard-off` qoidalarini
   bosib ketadi va savoli yetarli bo'lmagan bilet ro'yxatda oddiy, bosiladigan
   qatorga o'xshab qolardi. */
.lrow.tcard-off { background: var(--surface-soft); cursor: not-allowed; }
.lrow.tcard-off:hover { border-color: var(--border-soft); box-shadow: none; }

/* ── "Barchasini ko'rsatish" ── */
.more-wrap { display: flex; justify-content: center; margin-top: 1.75rem; }
.more {
  display: inline-flex; align-items: center; gap: 0.5rem;
  height: 2.875rem; padding: 0 1.5rem;
  border-radius: 9999px;
  background: var(--surface);
  border: 1px solid var(--border-soft);
  box-shadow: var(--shadow-card);
  font-size: 0.9375rem; font-weight: 600;
  color: var(--text-1);
  transition: border-color .15s, box-shadow .15s;
}
.more:hover { border-color: var(--primary); box-shadow: var(--shadow-lift); }
.more:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }

/* ── Skelet va bo'sh holatlar ── */
.skeleton { min-height: 7.25rem; animation: skel 1.6s ease-in-out infinite; pointer-events: none; }
@keyframes skel { 0%, 100% { opacity: 1 } 50% { opacity: .55 } }

.empty {
  margin-top: 1.5rem; padding: 3.5rem 1.5rem;
  border-radius: 1rem; text-align: center;
  background: var(--surface); border: 1px solid var(--border-soft);
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

@media (prefers-reduced-motion: reduce) {
  .tcard, .tgo, .lrow, .more { transition: none; }
  .tcard:hover { transform: none; }
  .skeleton { animation: none; }
}

/* ── Mobil ── */
/* Mobil menyu tugmasi `fixed top-3 left-3` (40px) — sarlavha uning ostida
   qolmasin. Aynan shu tuzatish /topics da ham bor. */
@media (max-width: 767px) {
  .tickets { padding-top: 3.75rem; }
  .panel { gap: 0.6rem; }
  .tools { width: 100%; }
  .search { flex: 1 1 auto; }
  .search-in { width: 100%; }
  .grid-tickets { gap: 0.75rem; grid-template-columns: repeat(auto-fill, minmax(8rem, 1fr)); }
  .lname { display: none; }
}
</style>
