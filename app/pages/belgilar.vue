<script setup lang="ts">
// OCHIQ sahifa — auth middleware YO'Q.
// Sabab: bu bepul ma'lumotnoma; qidiruv tizimlari indekslay olishi va
// ro'yxatdan o'tmagan odam ham ko'ra olishi kerak.

type Sign = {
  number: string
  category: number
  name_uz: string
  name_kr: string
  description_uz: string | null
  description_kr: string | null
  rule_uz: string | null
  rule_kr: string | null
  image: string | null
}
type Category = { id: number, slug: string, name_uz: string, name_kr: string, count: number }
type Credit = { license: string, count: number, artists: string[] }
type Payload = {
  categories: Category[]
  signs: Sign[]
  source: { text: string, text_url: string, images: string, images_url: string }
  credits: Credit[]
}

const i18n = useI18n()
const route = useRoute()
const router = useRouter()

// SSR bilan yuklanadi — botlar ham to'liq kontentni ko'radi.
const { data, error, refresh, pending } = await useAsyncData(
  'road-signs',
  () => apiFetch<Payload>('/signs'),
  { default: () => ({ categories: [], signs: [], source: null as any, credits: [] }) },
)

const categories = computed(() => data.value?.categories ?? [])
const allSigns = computed(() => data.value?.signs ?? [])

const isCyrl = computed(() => i18n.locale.value === 'uz_cyrl')
function name(s: Sign) { return (isCyrl.value ? s.name_kr : s.name_uz) || s.name_uz }
function desc(s: Sign) { return (isCyrl.value ? s.description_kr : s.description_uz) || '' }
function rule(s: Sign) { return (isCyrl.value ? s.rule_kr : s.rule_uz) || '' }
function catName(c: Category) { return isCyrl.value ? c.name_kr : c.name_uz }

/**
 * Chipda QISQA nom: rasmiy nom "Ogohlantiruvchi belgilar" — chipda faqat
 * "Ogohlantiruvchi" yozilsa yetarli (maketda ham shunday) va chiplar ikki
 * qatorga sig'adi. Rasmiy to'liq nom modalda va `title` da qoladi.
 */
function shortCat(c: Category) {
  return catName(c).replace(/\s+(belgilar|belgilari|белгилар|белгилари)$/i, '')
}

/** Kategoriya ikonkasi — slug bo'yicha (id emas: config'da tartib o'zgarsa
    ham to'g'ri qolsin). */
const CAT_ICON: Record<string, string> = {
  ogohlantiruvchi: 'alert',
  imtiyoz: 'diamond',
  taqiqlovchi: 'ban',
  buyuruvchi: 'circle-dot',
  axborot: 'info',
  servis: 'wrench',
  qoshimcha: 'grid',
}

// ── Filtr holati (URL'da saqlanadi — havolani ulashsa bo'ladi) ──────────
const activeCat = ref<number | null>(route.query.turi ? Number(route.query.turi) : null)
const search = ref(String(route.query.q ?? ''))

watch([activeCat, search], ([cat, q]) => {
  router.replace({
    query: {
      ...(cat ? { turi: String(cat) } : {}),
      ...(q ? { q } : {}),
    },
  })
})

/**
 * Qidiruv ikkala yozuvda ham ishlashi kerak: foydalanuvchi lotinda yozsa ham,
 * kirillda yozsa ham topsin. Shuning uchun ikkala nom bo'ylab qidiramiz.
 */
function normalize(v: string) {
  return v.toLowerCase().replace(/[ʻʼ'`‘’]/g, '').trim()
}

const filtered = computed(() => {
  const q = normalize(search.value)
  return allSigns.value.filter((s) => {
    if (activeCat.value && s.category !== activeCat.value) return false
    if (!q) return true
    return normalize(s.number).includes(q)
      || normalize(s.name_uz).includes(q)
      || normalize(s.name_kr).includes(q)
  })
})

/* ── Saqlangan belgilar ────────────────────────────────────────────────────
   Faqat shu QURILMADA saqlanadi (localStorage) — hisobga bog'lanmagan,
   shuning uchun mehmon ham belgilay oladi va backend kerak emas.
   `mijoz` bayrog'i shart: SSR'da localStorage yo'q, agar birinchi render'da
   holat boshqacha bo'lsa Vue gidratsiya nomuvofiqligidan ogohlantiradi. */
const SAQLASH_KALIT = 'belgilar:saqlangan'
const mijoz = ref(false)
const saqlangan = ref<string[]>([])

function saqlanganmi(s: Sign) { return mijoz.value && saqlangan.value.includes(s.number) }
function saqlaAlmash(s: Sign) {
  const i = saqlangan.value.indexOf(s.number)
  if (i >= 0) saqlangan.value.splice(i, 1)
  else saqlangan.value.push(s.number)
  try { localStorage.setItem(SAQLASH_KALIT, JSON.stringify(saqlangan.value)) }
  catch { /* xotira to'la yoki rejim taqiqlagan — belgilash sessiyada qoladi */ }
}

// ── Detal oynasi ────────────────────────────────────────────────────────
const selected = ref<Sign | null>(null)

function open(s: Sign) { selected.value = s }
function close() { selected.value = null }

// Oyna ochiqda fon aylanmasin.
watch(selected, (v) => {
  if (import.meta.client) document.body.style.overflow = v ? 'hidden' : ''
})

function onKey(e: KeyboardEvent) {
  if (!selected.value) return
  if (e.key === 'Escape') close()
  if (e.key === 'ArrowRight') step(1)
  if (e.key === 'ArrowLeft') step(-1)
}

onMounted(() => {
  mijoz.value = true
  try { saqlangan.value = JSON.parse(localStorage.getItem(SAQLASH_KALIT) || '[]') }
  catch { saqlangan.value = [] }
  document.addEventListener('keydown', onKey)
})
onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKey)
  if (import.meta.client) document.body.style.overflow = ''
})

// Oldingi/keyingi belgiga o'tish (filtrlangan ro'yxat bo'ylab).
const selectedIndex = computed(() =>
  selected.value ? filtered.value.findIndex(s => s.number === selected.value!.number) : -1,
)
function step(delta: number) {
  const i = selectedIndex.value
  if (i < 0) return
  const next = filtered.value[i + delta]
  if (next) selected.value = next
}

// ── SEO ─────────────────────────────────────────────────────────────────
useSeoMeta({
  title: () => i18n.t({
    uz: 'Yo\'l belgilari kutubxonasi — barcha belgilar rasmi va izohi | Avtoprav',
    kr: 'Йўл белгилари кутубхонаси — барча белгилар расми ва изоҳи | Avtoprav',
  }),
  description: () => i18n.t({
    uz: 'O\'zbekiston yo\'l harakati qoidalaridagi barcha yo\'l belgilari: rasmi, rasmiy nomi va izohi. Ogohlantiruvchi, taqiqlovchi, buyuruvchi va boshqa belgilar.',
    kr: 'Ўзбекистон йўл ҳаракати қоидаларидаги барча йўл белгилари: расми, расмий номи ва изоҳи.',
  }),
  ogTitle: () => i18n.t({ uz: 'Yo\'l belgilari kutubxonasi', kr: 'Йўл белгилари кутубхонаси' }),
  ogDescription: () => i18n.t({
    uz: 'Barcha yo\'l belgilari rasmi va rasmiy izohi bilan — bepul.',
    kr: 'Барча йўл белгилари расми ва расмий изоҳи билан — бепул.',
  }),
})
</script>

<template>
  <div class="signs mx-auto w-full max-w-[1800px] px-4 sm:px-6 lg:px-8 xl:px-10 pt-6 lg:pt-8 pb-16 md:pb-12">
    <!-- ── Sarlavha ────────────────────────────────────────────────────── -->
    <header class="head">
      <div class="eyebrow">{{ i18n.t({ uz: 'Ma\'lumotnoma', kr: 'Маълумотнома' }) }}</div>
      <h1 class="page-title">{{ i18n.t({ uz: 'Yo\'l belgilari kutubxonasi', kr: 'Йўл белгилари кутубхонаси' }) }}</h1>
      <p class="page-sub">
        {{ i18n.t({
          uz: 'Yo\'l belgilari yo\'llarda harakat xavfsizligini ta\'minlash, haydovchi va piyodalarni ogohlantirish, axborot berish hamda harakatni tartibga solish uchun xizmat qiladi.',
          kr: 'Йўл белгилари йўлларда ҳаракат хавфсизлигини таъминлаш, ҳайдовчи ва пиёдаларни огоҳлантириш, ахборот бериш ҳамда ҳаракатни тартибга солиш учун хизмат қилади.'
        }) }}
      </p>
    </header>

    <!-- ── Qidiruv ─────────────────────────────────────────────────────── -->
    <div class="search">
      <AppIcon name="search" :size="19" class="search-ic" />
      <input
        v-model="search"
        type="search"
        class="search-in"
        :aria-label="i18n.t({ uz: 'Belgi qidirish', kr: 'Белги қидириш' })"
        :placeholder="i18n.t({
          uz: 'Belgi nomi yoki raqami (masalan: 1.1 yoki «temir yo\'l kesishmasi»)',
          kr: 'Белги номи ёки рақами (масалан: 1.1 ёки «темир йўл кесишмаси»)'
        })"
      >
    </div>

    <!-- ── Kategoriya chiplari ─────────────────────────────────────────── -->
    <div class="chips" role="group" :aria-label="i18n.t({ uz: 'Belgi turlari', kr: 'Белги турлари' })">
      <button
        type="button" class="chip" :class="{ on: activeCat === null }"
        :aria-pressed="activeCat === null"
        @click="activeCat = null"
      >
        {{ i18n.t({ uz: 'Hammasi', kr: 'Ҳаммаси' }) }}
        <span class="chip-n tabular-nums">{{ allSigns.length }}</span>
      </button>
      <button
        v-for="c in categories" :key="c.id"
        type="button" class="chip" :class="[`chip-${c.slug}`, { on: activeCat === c.id }]"
        :aria-pressed="activeCat === c.id" :title="catName(c)"
        @click="activeCat = c.id"
      >
        <AppIcon :name="CAT_ICON[c.slug] || 'sign'" :size="17" class="chip-ic" />
        {{ shortCat(c) }}
        <span class="chip-n tabular-nums">{{ c.count }}</span>
      </button>
    </div>

    <!-- Yuklanmadi (tarmoq/server xatosi) — "topilmadi" dan FARQLI holat.
         Aks holda foydalanuvchi qidiruvim natija bermadi deb o'ylaydi. -->
    <div v-if="error && !allSigns.length" class="panel-card empty">
      <p class="empty-title">{{ i18n.t({ uz: 'Belgilar yuklanmadi', kr: 'Белгилар юкланмади' }) }}</p>
      <p class="empty-text">
        {{ i18n.t({ uz: 'Internet aloqasini tekshirib, qayta urinib ko\'ring.', kr: 'Интернет алоқасини текшириб, қайта уриниб кўринг.' }) }}
      </p>
      <button type="button" class="retry" :disabled="pending" @click="refresh()">
        {{ pending ? i18n.t({ uz: 'Yuklanmoqda…', kr: 'Юкланмоқда…' }) : i18n.t({ uz: 'Qayta urinish', kr: 'Қайта уриниш' }) }}
      </button>
    </div>

    <!-- Qidiruvga mos natija yo'q -->
    <div v-else-if="!filtered.length" class="panel-card empty">
      <p class="empty-title">{{ i18n.t({ uz: 'Hech narsa topilmadi', kr: 'Ҳеч нарса топилмади' }) }}</p>
      <p class="empty-text">
        {{ i18n.t({ uz: 'Boshqa so\'z yoki raqam bilan qidirib ko\'ring.', kr: 'Бошқа сўз ёки рақам билан қидириб кўринг.' }) }}
      </p>
    </div>

    <!-- ── Belgilar to'ri ──────────────────────────────────────────────── -->
    <div v-else class="grid-signs">
      <article v-for="s in filtered" :key="s.number" class="scard" :class="{ saved: saqlanganmi(s) }">
        <!-- Butun karta = asosiy harakat. Saqlash tugmasi ALOHIDA (ichma-ich
             tugma HTML'da mumkin emas), shuning uchun ustiga qo'yiladi. -->
        <button
          type="button" class="scard-main"
          :aria-label="`${s.number} — ${name(s)}`"
          @click="open(s)"
        >
          <span class="sthumb">
            <img
              v-if="s.image" :src="s.image" :alt="`${s.number} ${name(s)}`"
              loading="lazy" decoding="async"
            >
            <!-- Rasmi hali yo'q belgilar (2022/2024-yilda qo'shilganlar).
                 Raqamni takrorlamaymiz — u pastda baribir yozilgan. -->
            <span v-else class="sthumb-none"><AppIcon name="sign" :size="32" /></span>
          </span>

          <span class="sbody">
            <span class="stext">
              <span class="snum tabular-nums">{{ s.number }}</span>
              <span class="sname" :title="name(s)">{{ name(s) }}</span>
            </span>
            <span class="sgo" aria-hidden="true"><AppIcon name="arrow" :size="15" /></span>
          </span>
        </button>

        <button
          type="button" class="sbm" :aria-pressed="saqlanganmi(s)"
          :aria-label="saqlanganmi(s)
            ? `${i18n.t({ uz: 'Saqlanganlardan olib tashlash', kr: 'Сақланганлардан олиб ташлаш' })} — ${s.number}`
            : `${i18n.t({ uz: 'Saqlash', kr: 'Сақлаш' })} — ${s.number}`"
          @click="saqlaAlmash(s)"
        >
          <AppIcon :name="saqlanganmi(s) ? 'bookmark-on' : 'bookmark'" :size="17" />
        </button>
      </article>
    </div>

    <!-- ── Manba va litsenziya (CC BY-SA talabi) ───────────────────────── -->
    <div v-if="data?.source" class="panel-card src">
      <div class="src-title">{{ i18n.t({ uz: 'Manba va litsenziya', kr: 'Манба ва лицензия' }) }}</div>
      <p>
        {{ i18n.t({ uz: 'Nom va izohlar:', kr: 'Ном ва изоҳлар:' }) }}
        <a :href="data.source.text_url" target="_blank" rel="noopener">{{ data.source.text }}</a>.
      </p>
      <p>
        {{ i18n.t({ uz: 'Belgi rasmlari:', kr: 'Белги расмлари:' }) }}
        <a :href="data.source.images_url" target="_blank" rel="noopener">{{ data.source.images }}</a>
        <template v-for="c in data.credits" :key="c.license">
          · {{ c.license }} ({{ c.count }})
        </template>
      </p>

      <!-- CC BY-SA litsenziyasi mualliflarni ko'rsatishni TALAB qiladi.
           Ro'yxat uzun bo'lgani uchun yig'iladigan qilingan. -->
      <details v-if="data.credits.length">
        <summary>{{ i18n.t({ uz: 'Rasm mualliflari', kr: 'Расм муаллифлари' }) }}</summary>
        <div class="src-artists">
          <div v-for="c in data.credits" :key="c.license">
            <span class="src-lic">{{ c.license }}:</span>
            {{ c.artists.length ? c.artists.join(', ') : i18n.t({ uz: 'muallif ko\'rsatilmagan', kr: 'муаллиф кўрсатилмаган' }) }}
          </div>
        </div>
      </details>
    </div>

    <!-- ── Detal oynasi ────────────────────────────────────────────────── -->
    <ClientOnly>
      <Teleport to="body">
        <Transition name="sign-modal" :duration="{ enter: 200, leave: 160 }">
          <div v-if="selected" class="sign-backdrop" @click.self="close">
            <div class="sign-panel" role="dialog" aria-modal="true" :aria-label="`${selected.number} ${name(selected)}`">
              <button class="sign-close" :aria-label="i18n.t({ uz: 'Yopish', kr: 'Ёпиш' })" @click="close">
                <AppIcon name="x" :size="18" />
              </button>

              <div class="sign-in">
                <div class="sign-top">
                  <div class="sign-hero">
                    <img v-if="selected.image" :src="selected.image" :alt="`${selected.number} ${name(selected)}`">
                    <span v-else class="sign-hero-num tabular-nums">{{ selected.number }}</span>
                  </div>

                  <div class="sign-txt">
                    <div class="sign-num tabular-nums">{{ selected.number }}</div>
                    <h2 class="sign-name">{{ name(selected) }}</h2>

                    <p v-if="desc(selected)" class="sign-desc">{{ desc(selected) }}</p>

                    <div v-if="rule(selected)" class="sign-rule">
                      <div class="sign-rule-lbl">{{ i18n.t({ uz: 'Qo\'llash qoidasi', kr: 'Қўллаш қоидаси' }) }}</div>
                      {{ rule(selected) }}
                    </div>

                    <p v-if="!desc(selected) && !rule(selected)" class="sign-none">
                      {{ i18n.t({
                        uz: 'Bu belgi uchun qoidalarda qo\'shimcha izoh berilmagan.',
                        kr: 'Бу белги учун қоидаларда қўшимча изоҳ берилмаган.'
                      }) }}
                    </p>
                  </div>
                </div>

                <div class="sign-nav">
                  <button
                    type="button" class="sign-step" :disabled="selectedIndex <= 0"
                    @click="step(-1)"
                  >
                    <AppIcon name="chev-l" :size="16" />
                    {{ i18n.t({ uz: 'Oldingi', kr: 'Олдинги' }) }}
                  </button>
                  <span class="sign-count tabular-nums">{{ selectedIndex + 1 }} / {{ filtered.length }}</span>
                  <button
                    type="button" class="sign-step" :disabled="selectedIndex >= filtered.length - 1"
                    @click="step(1)"
                  >
                    {{ i18n.t({ uz: 'Keyingi', kr: 'Кейинги' }) }}
                    <AppIcon name="chev-r" :size="16" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </Teleport>
    </ClientOnly>
  </div>
</template>

<style scoped>
/* ── Sahifaga xos tokenlar ────────────────────────────────────────────────
   Kategoriya ikonkalari rangi. `--warn` (#f59e0b) oq fonda 2.15:1 beradi,
   shuning uchun ikonka uchun to'qroq amber olinadi (3.05:1). Ikonka matn
   yorlig'i bilan takrorlanadi, ya'ni ma'no faqat rangda emas. */
.signs {
  --sign-amber: #d97706;
}
.dark .signs { --sign-amber: var(--warn); }

.panel-card {
  background: var(--surface);
  border: 1px solid var(--border-1);
  border-radius: 1rem;
  box-shadow: var(--shadow-card);
}

/* ── Sarlavha ────────────────────────────────────────────────────────── */
.head { max-width: 62rem; }
.page-title {
  margin-top: 0.35rem;
  font-size: 1.875rem; font-weight: 700; letter-spacing: -0.025em; line-height: 1.15;
  color: var(--text-1);
}
@media (min-width: 640px) { .page-title { font-size: 2.375rem; } }
.page-sub { margin-top: 0.625rem; font-size: 0.9375rem; line-height: 1.65; color: var(--text-3); }

/* ── Qidiruv ─────────────────────────────────────────────────────────── */
.search { position: relative; margin-top: 1.75rem; }
.search-ic {
  position: absolute; left: 1.125rem; top: 50%; transform: translateY(-50%);
  color: var(--text-4); pointer-events: none;
}
.search-in {
  width: 100%; height: 3.5rem;
  padding: 0 1.125rem 0 3rem;
  border-radius: 0.875rem; border: 1px solid var(--border-1);
  background: var(--surface); color: var(--text-1);
  font-size: 0.9375rem;
  box-shadow: var(--shadow-soft);
  transition: border-color 0.15s, box-shadow 0.15s;
}
.search-in::placeholder { color: var(--text-4); }
.search-in:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-ring); }
/* Chrome'ning `type="search"` uchun o'z tozalash tugmasi — mavzuga mos emas */
.search-in::-webkit-search-cancel-button { -webkit-appearance: none; appearance: none; }

/* ── Kategoriya chiplari ─────────────────────────────────────────────── */
.chips { display: flex; flex-wrap: wrap; gap: 0.625rem; margin-top: 1rem; }
.chip {
  display: inline-flex; align-items: center; gap: 0.5rem;
  height: 2.75rem; padding: 0 1rem;
  border-radius: 0.625rem; border: 1px solid var(--border-1);
  background: var(--surface); color: var(--text-2);
  font-size: 0.875rem; font-weight: 600;
  box-shadow: var(--shadow-soft);
  transition: border-color 0.15s, background 0.15s, color 0.15s;
}
.chip:hover { border-color: var(--text-muted); }
.chip.on {
  background: var(--primary-strong); border-color: var(--primary-strong);
  color: var(--primary-contrast);
}
.chip-n { font-weight: 600; color: var(--text-4); }
.chip.on .chip-n { color: var(--primary-contrast); opacity: 0.75; }
.chip-ic { flex-shrink: 0; }
.chip.on .chip-ic { color: var(--primary-contrast); }

/* Ikonka ranglari — kategoriya ma'nosiga mos (maketdagidek) */
.chip-ogohlantiruvchi .chip-ic { color: var(--danger); }
.chip-imtiyoz .chip-ic        { color: var(--sign-amber); }
.chip-taqiqlovchi .chip-ic    { color: var(--danger); }
.chip-buyuruvchi .chip-ic     { color: var(--primary); }
.chip-axborot .chip-ic        { color: var(--primary); }
.chip-servis .chip-ic         { color: var(--primary); }
.chip-qoshimcha .chip-ic      { color: var(--ok-ink); }

/* ── Bo'sh / xato holati ─────────────────────────────────────────────── */
.empty { margin-top: 1.5rem; padding: 3rem 1.5rem; text-align: center; }
.empty-title { font-size: 0.9375rem; font-weight: 600; color: var(--text-2); }
.empty-text { margin-top: 0.25rem; font-size: 0.875rem; color: var(--text-3); }
.retry {
  margin-top: 1rem; height: 2.5rem; padding: 0 1.125rem;
  border-radius: 0.5rem; background: var(--primary-strong); color: var(--primary-contrast);
  font-size: 0.875rem; font-weight: 600;
}
.retry:disabled { opacity: 0.6; }

/* ── Belgilar to'ri ───────────────────────────────────────────────────────
   Maketda 5 ustun. `max(11rem, (100% - 4rem)/5)` — 5 ustunda 4 ta oraliq
   (4 x 1rem = 4rem), ya'ni keng ekranda ham 6-chi ustun sig'maydi, kartalar
   kengayadi. `100%` KONTEYNERga nisbatan — yon menyu kengligi ahamiyatsiz. */
.grid-signs {
  display: grid; gap: 1rem; margin-top: 1.5rem;
  grid-template-columns: repeat(auto-fill, minmax(max(11rem, (100% - 4rem) / 5), 1fr));
}

.scard {
  position: relative;
  background: var(--surface); border: 1px solid var(--border-1);
  border-radius: 0.875rem;
  box-shadow: var(--shadow-soft);
  transition: border-color 0.15s, background 0.15s, box-shadow 0.15s, transform 0.15s;
}
.scard:hover {
  border-color: var(--primary); background: var(--primary-soft);
  box-shadow: var(--shadow-card); transform: translateY(-1px);
}
.scard:has(.scard-main:focus-visible) { border-color: var(--primary); background: var(--primary-soft); }
.scard.saved { border-color: var(--warn); }

.scard-main {
  display: flex; flex-direction: column; gap: 0.75rem;
  width: 100%; height: 100%; padding: 1rem;
  text-align: left; border-radius: 0.875rem;
}
.scard-main:focus { outline: none; }
.scard-main:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }

/* Rasmlar turli nisbatda (kvadrat, uzun-tor 300x600, keng 1083x698).
   Qutiga ANIQ balandlik beriladi, rasm esa chegaraga sig'diriladi — shunda
   barcha kartalar bir xil bo'yda chiqadi.
   DIQQAT: `display: grid` ISHLAMAYDI — grid qatori (auto) rasmning tabiiy
   balandligiga moslashib qutidan oshadi va `max-height: 100%` o'sha oshgan
   qatorga nisbatan hisoblanib rasm kesiladi. Flex'da foiz to'g'ridan-to'g'ri
   qutining aniq balandligiga bog'lanadi. */
.sthumb {
  display: flex; align-items: center; justify-content: center;
  width: 100%; height: 5.5rem;
  padding: 0.25rem;
}
.sthumb img {
  display: block; width: auto; height: auto;
  max-width: 100%; max-height: 100%; object-fit: contain;
}
.sthumb-none { color: var(--text-muted); }

.sbody { display: flex; align-items: flex-end; gap: 0.5rem; margin-top: auto; }
.stext { flex: 1 1 auto; min-width: 0; }
.snum { display: block; font-size: 0.75rem; font-weight: 600; color: var(--text-3); }
/* Maketda nom 2 qatorga qirqiladi. To'liq nom `title` da va modalda bor. */
.sname {
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
  margin-top: 0.125rem;
  font-size: 0.8125rem; line-height: 1.35; color: var(--text-1);
}
.sgo {
  flex-shrink: 0; display: grid; place-items: center;
  width: 1.75rem; height: 1.75rem; border-radius: 0.5rem;
  background: var(--surface-inset); color: var(--text-3);
  transition: background 0.15s, color 0.15s;
}
.scard:hover .sgo { background: var(--surface); color: var(--primary-ink); }

/* `--text-muted` EMAS: u oq fonda 1.98:1 beradi, saqlash tugmasi esa
   MATNSIZ boshqaruv (faqat aria-label), ya'ni WCAG 1.4.11 bo'yicha 3:1 kerak.
   `--text-4` (#888b96) 3.40:1 — hamon xira, lekin ko'rinadi. */
.sbm {
  position: absolute; top: 0.5rem; right: 0.5rem; z-index: 1;
  display: grid; place-items: center;
  width: 1.875rem; height: 1.875rem; border-radius: 0.5rem;
  color: var(--text-4);
  transition: background 0.15s, color 0.15s;
}
/* Ko'rinishi 30px qoladi (karta burchagida ixcham turishi kerak), lekin barmoq
   bilan bosish uchun 36px zona kerak — pseudo-element joy egallamaydi. */
.sbm::after { content: ''; position: absolute; inset: -3px; border-radius: 0.625rem; }
.sbm:hover { background: var(--surface-inset); color: var(--text-2); }
.sbm[aria-pressed="true"] { color: var(--warn-ink); }
.dark .sbm[aria-pressed="true"] { color: var(--warn); }

/* ── Manba ───────────────────────────────────────────────────────────── */
.src { margin-top: 1.5rem; padding: 1.25rem; font-size: 0.75rem; line-height: 1.6; color: var(--text-3); }
.src-title { font-weight: 600; color: var(--text-2); margin-bottom: 0.375rem; }
.src p + p { margin-top: 0.25rem; }
.src a { text-decoration: underline; }
.src a:hover { color: var(--primary-ink); }
.src details { margin-top: 0.5rem; }
.src summary { cursor: pointer; user-select: none; text-decoration: underline; }
.src-artists { margin-top: 0.5rem; display: grid; gap: 0.375rem; }
.src-lic { font-weight: 600; color: var(--text-2); }

/* ── Detal oynasi ────────────────────────────────────────────────────── */
.sign-backdrop {
  position: fixed; inset: 0; z-index: 60;
  display: grid; place-items: center; padding: 1rem;
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(2px);
}
.sign-panel {
  position: relative; width: 100%; max-width: 40rem; max-height: 90vh; overflow-y: auto;
  background: var(--surface); border: 1px solid var(--border-1);
  border-radius: 1rem; box-shadow: var(--shadow-lift);
}
.sign-close {
  position: absolute; top: 0.75rem; right: 0.75rem;
  width: 2rem; height: 2rem; border-radius: 0.5rem;
  display: grid; place-items: center; color: var(--text-4);
  transition: background 0.15s, color 0.15s;
}
.sign-close:hover { background: var(--surface-inset); color: var(--text-1); }

.sign-in { padding: 1.5rem; }
@media (min-width: 640px) { .sign-in { padding: 1.75rem; } }
.sign-top { display: flex; flex-direction: column; gap: 1.5rem; }
@media (min-width: 640px) { .sign-top { flex-direction: row; } }

.sign-hero {
  flex: none; display: flex; align-items: center; justify-content: center;
  width: 10rem; height: 10rem; margin: 0 auto;
  padding: 0.75rem; border-radius: 0.75rem;
  background: var(--surface-inset); overflow: hidden;
}
@media (min-width: 640px) { .sign-hero { margin: 0; } }
.sign-hero img {
  display: block; width: auto; height: auto;
  max-width: 100%; max-height: 100%; object-fit: contain;
}
.sign-hero-num { font-size: 1.875rem; font-weight: 600; color: var(--text-4); }

.sign-txt { min-width: 0; flex: 1 1 auto; }
.sign-num { font-size: 0.75rem; font-weight: 600; color: var(--primary-ink); margin-bottom: 0.25rem; }
.sign-name { font-size: 1.25rem; font-weight: 600; line-height: 1.35; color: var(--text-1); }
.sign-desc { margin-top: 0.75rem; font-size: 0.9063rem; line-height: 1.65; color: var(--text-2); }
.sign-rule {
  margin-top: 1rem; padding: 0.875rem; border-radius: 0.75rem;
  background: var(--surface-inset); color: var(--text-2);
  font-size: 0.8438rem; line-height: 1.65;
}
.sign-rule-lbl {
  font-size: 0.6875rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em;
  color: var(--text-3); margin-bottom: 0.25rem;
}
.sign-none { margin-top: 0.75rem; font-size: 0.875rem; color: var(--text-3); }

.sign-nav {
  display: flex; align-items: center; justify-content: space-between;
  margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid var(--border-soft);
}
.sign-step {
  display: inline-flex; align-items: center; gap: 0.35rem;
  height: 2.25rem; padding: 0 0.75rem; border-radius: 0.5rem;
  font-size: 0.875rem; font-weight: 500; color: var(--text-2);
  transition: background 0.15s;
}
.sign-step:hover:not(:disabled) { background: var(--surface-inset); }
.sign-step:disabled { opacity: 0.35; cursor: default; }
.sign-count { font-size: 0.75rem; color: var(--text-3); }

.sign-modal-enter-active,
.sign-modal-leave-active { transition: opacity 0.2s ease; }
.sign-modal-enter-from,
.sign-modal-leave-to { opacity: 0; }
.sign-modal-enter-active .sign-panel { transition: transform 0.2s ease; }
.sign-modal-leave-active .sign-panel { transition: transform 0.16s ease; }
.sign-modal-enter-from .sign-panel,
.sign-modal-leave-to .sign-panel { transform: scale(0.97); }

@media (prefers-reduced-motion: reduce) {
  .scard, .sgo, .sbm, .chip, .search-in { transition: none; }
  .scard:hover { transform: none; }
  .sign-modal-enter-active, .sign-modal-leave-active,
  .sign-modal-enter-active .sign-panel, .sign-modal-leave-active .sign-panel { transition: none; }
}

/* ── Mobil ───────────────────────────────────────────────────────────────
   Mobil menyu tugmasi `fixed top-3 left-3` (40px) — sarlavha uning ostida
   qolmasin. Xuddi shu tuzatish /tickets, /topics va natija sahifasida ham bor. */
@media (max-width: 767px) {
  .signs { padding-top: 3.75rem; }
  .page-title { font-size: 1.625rem; }
  .search-in { height: 3rem; font-size: 0.875rem; }
  .chip { height: 2.5rem; padding: 0 0.75rem; font-size: 0.8125rem; }
  .grid-signs { gap: 0.75rem; grid-template-columns: repeat(auto-fill, minmax(8.5rem, 1fr)); }
  .sthumb { height: 4.5rem; }
}
</style>
