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

// Kategoriya bo'yicha guruhlab chiqaramiz (filtr "hammasi" bo'lganda).
const grouped = computed(() => {
  const out: { cat: Category, items: Sign[] }[] = []
  for (const c of categories.value) {
    const items = filtered.value.filter(s => s.category === c.id)
    if (items.length) out.push({ cat: c, items })
  }
  return out
})

// ── Detal oynasi ────────────────────────────────────────────────────────
const selected = ref<Sign | null>(null)

function open(s: Sign) { selected.value = s }
function close() { selected.value = null }

// Oyna ochiqda fon aylanmasin.
watch(selected, (v) => {
  if (import.meta.client) document.body.style.overflow = v ? 'hidden' : ''
})
onBeforeUnmount(() => {
  if (import.meta.client) document.body.style.overflow = ''
})

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') close()
}
onMounted(() => document.addEventListener('keydown', onKey))
onBeforeUnmount(() => document.removeEventListener('keydown', onKey))

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
    uz: 'Yo\'l belgilari — barcha belgilar rasmi va izohi | Avtoprav',
    kr: 'Йўл белгилари — барча белгилар расми ва изоҳи | Avtoprav',
  }),
  description: () => i18n.t({
    uz: 'O\'zbekiston yo\'l harakati qoidalaridagi barcha yo\'l belgilari: rasmi, rasmiy nomi va izohi. Ogohlantiruvchi, taqiqlovchi, buyuruvchi va boshqa belgilar.',
    kr: 'Ўзбекистон йўл ҳаракати қоидаларидаги барча йўл белгилари: расми, расмий номи ва изоҳи.',
  }),
  ogTitle: () => i18n.t({ uz: 'Yo\'l belgilari ma\'lumotnomasi', kr: 'Йўл белгилари маълумотномаси' }),
  ogDescription: () => i18n.t({
    uz: 'Barcha yo\'l belgilari rasmi va rasmiy izohi bilan — bepul.',
    kr: 'Барча йўл белгилари расми ва расмий изоҳи билан — бепул.',
  }),
})
</script>

<template>
  <div class="max-w-6xl mx-auto px-4 sm:px-6 py-10">
    <!-- Sarlavha -->
    <div class="mb-7">
      <div class="eyebrow">{{ i18n.t({ uz: 'Ma\'lumotnoma', kr: 'Маълумотнома' }) }}</div>
      <h1 class="text-3xl font-semibold tracking-tightest mt-1.5" style="color: var(--text-1);">
        {{ i18n.t({ uz: 'Yo\'l belgilari', kr: 'Йўл белгилари' }) }}
      </h1>
      <p class="mt-2 max-w-2xl" style="color: var(--text-3);">
        {{ i18n.t({
          uz: 'Barcha yo\'l belgilari — rasmi, rasmiy nomi va izohi bilan. Belgini bosing va batafsil o\'qing.',
          kr: 'Барча йўл белгилари — расми, расмий номи ва изоҳи билан. Белгини босинг ва батафсил ўқинг.'
        }) }}
      </p>
    </div>

    <!-- Qidiruv -->
    <div class="relative mb-4">
      <span class="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style="color: var(--text-4);">
        <svg width="17" height="17" viewBox="0 0 16 16" fill="none">
          <circle cx="7" cy="7" r="4.5" stroke="currentColor" stroke-width="1.5" />
          <path d="M10.5 10.5L14 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
        </svg>
      </span>
      <input
        v-model="search"
        type="search"
        :placeholder="i18n.t({ uz: 'Belgi nomi yoki raqami (masalan: 3.24 yoki tezlik)', kr: 'Белги номи ёки рақами (масалан: 3.24 ёки тезлик)' })"
        class="w-full rounded-xl pl-10 pr-4 h-12 text-[15px] outline-none transition-colors"
        style="background: var(--surface); border: 1px solid var(--border-soft); color: var(--text-1);"
      >
    </div>

    <!-- Kategoriya filtri -->
    <div class="flex flex-wrap gap-2 mb-7">
      <button
        class="px-3.5 h-9 rounded-lg text-sm font-medium transition-colors"
        :style="activeCat === null
          ? { background: 'var(--text-1)', color: 'var(--surface)' }
          : { background: 'var(--surface)', color: 'var(--text-2)', border: '1px solid var(--border-soft)' }"
        @click="activeCat = null"
      >
        {{ i18n.t({ uz: 'Hammasi', kr: 'Ҳаммаси' }) }}
        <span class="ml-1 tabular-nums opacity-60">{{ allSigns.length }}</span>
      </button>
      <button
        v-for="c in categories"
        :key="c.id"
        class="px-3.5 h-9 rounded-lg text-sm font-medium transition-colors"
        :style="activeCat === c.id
          ? { background: 'var(--text-1)', color: 'var(--surface)' }
          : { background: 'var(--surface)', color: 'var(--text-2)', border: '1px solid var(--border-soft)' }"
        @click="activeCat = c.id"
      >
        {{ catName(c) }}
        <span class="ml-1 tabular-nums opacity-60">{{ c.count }}</span>
      </button>
    </div>

    <!-- Yuklanmadi (tarmoq/server xatosi) — "topilmadi" dan FARQLI holat.
         Aks holda foydalanuvchi qidiruvim natija bermadi deb o'ylaydi. -->
    <div v-if="error && !allSigns.length" class="card p-10 text-center">
      <div class="text-[15px] font-medium" style="color: var(--text-2);">
        {{ i18n.t({ uz: 'Belgilar yuklanmadi', kr: 'Белгилар юкланмади' }) }}
      </div>
      <p class="text-sm mt-1 mb-4" style="color: var(--text-4);">
        {{ i18n.t({ uz: 'Internet aloqasini tekshirib, qayta urinib ko\'ring.', kr: 'Интернет алоқасини текшириб, қайта уриниб кўринг.' }) }}
      </p>
      <button class="btn-secondary text-sm" :disabled="pending" @click="refresh()">
        {{ pending ? i18n.t({ uz: 'Yuklanmoqda…', kr: 'Юкланмоқда…' }) : i18n.t({ uz: 'Qayta urinish', kr: 'Қайта уриниш' }) }}
      </button>
    </div>

    <!-- Qidiruvga mos natija yo'q -->
    <div v-else-if="!filtered.length" class="card p-10 text-center">
      <div class="text-[15px] font-medium" style="color: var(--text-2);">
        {{ i18n.t({ uz: 'Hech narsa topilmadi', kr: 'Ҳеч нарса топилмади' }) }}
      </div>
      <p class="text-sm mt-1" style="color: var(--text-4);">
        {{ i18n.t({ uz: 'Boshqa so\'z yoki raqam bilan qidirib ko\'ring.', kr: 'Бошқа сўз ёки рақам билан қидириб кўринг.' }) }}
      </p>
    </div>

    <!-- Belgilar (kategoriya bo'yicha) -->
    <div v-for="g in grouped" :key="g.cat.id" class="mb-10">
      <div class="flex items-baseline gap-2 mb-3">
        <h2 class="text-lg font-semibold" style="color: var(--text-1);">{{ catName(g.cat) }}</h2>
        <span class="text-xs tabular-nums" style="color: var(--text-4);">{{ g.items.length }}</span>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 items-stretch">
        <button
          v-for="s in g.items"
          :key="s.number"
          class="card sign-card p-3 text-left flex flex-col gap-2 hover:-translate-y-0.5"
          style="box-shadow: var(--shadow-soft);"
          @click="open(s)"
        >
          <div class="sign-thumb" style="background: var(--surface-inset);">
            <img
              v-if="s.image"
              :src="s.image"
              :alt="`${s.number} ${name(s)}`"
              loading="lazy"
              decoding="async"
            >
            <!-- Rasmi hali yo'q belgilar (2022/2024-yilda qo'shilganlar).
                 Raqamni takrorlamaymiz — u pastda baribir yozilgan. -->
            <span v-else style="color: var(--text-4); opacity: 0.5;">
              <AppIcon name="sign" :size="30" />
            </span>
          </div>
          <div class="w-full">
            <div class="text-[11px] font-semibold tabular-nums" style="color: var(--accent);">{{ s.number }}</div>
            <div class="text-[12.5px] leading-snug line-clamp-2" style="color: var(--text-2);">{{ name(s) }}</div>
          </div>
        </button>
      </div>
    </div>

    <!-- Manba va litsenziya (CC BY-SA talabi) -->
    <div v-if="data?.source" class="card p-5 mt-2 text-xs leading-relaxed" style="color: var(--text-4);">
      <div class="font-semibold mb-1.5" style="color: var(--text-3);">
        {{ i18n.t({ uz: 'Manba va litsenziya', kr: 'Манба ва лицензия' }) }}
      </div>
      <p>
        {{ i18n.t({ uz: 'Nom va izohlar:', kr: 'Ном ва изоҳлар:' }) }}
        <a :href="data.source.text_url" target="_blank" rel="noopener" class="underline">{{ data.source.text }}</a>.
      </p>
      <p class="mt-1">
        {{ i18n.t({ uz: 'Belgi rasmlari:', kr: 'Белги расмлари:' }) }}
        <a :href="data.source.images_url" target="_blank" rel="noopener" class="underline">{{ data.source.images }}</a>
        <template v-for="c in data.credits" :key="c.license">
          · {{ c.license }} ({{ c.count }})
        </template>
      </p>

      <!-- CC BY-SA litsenziyasi mualliflarni ko'rsatishni TALAB qiladi.
           Ro'yxat uzun bo'lgani uchun yig'iladigan qilingan. -->
      <details v-if="data.credits.length" class="mt-2">
        <summary class="cursor-pointer select-none underline">
          {{ i18n.t({ uz: 'Rasm mualliflari', kr: 'Расм муаллифлари' }) }}
        </summary>
        <div class="mt-2 space-y-1.5">
          <div v-for="c in data.credits" :key="c.license">
            <span class="font-medium">{{ c.license }}:</span>
            {{ c.artists.length ? c.artists.join(', ') : i18n.t({ uz: 'muallif ko\'rsatilmagan', kr: 'муаллиф кўрсатилмаган' }) }}
          </div>
        </div>
      </details>
    </div>

    <!-- ── Detal oynasi ────────────────────────────────────────────── -->
    <ClientOnly>
      <Teleport to="body">
        <Transition name="sign-modal" :duration="{ enter: 200, leave: 160 }">
          <div v-if="selected" class="sign-backdrop" @click.self="close">
            <div class="sign-panel card" role="dialog" aria-modal="true">
              <!-- Yopish -->
              <button class="sign-close" :aria-label="i18n.t({ uz: 'Yopish', kr: 'Ёпиш' })" @click="close">
                <AppIcon name="x" :size="18" />
              </button>

              <div class="p-6 sm:p-7">
                <div class="flex flex-col sm:flex-row gap-6">
                  <!-- Rasm -->
                  <div class="sign-hero mx-auto sm:mx-0" style="background: var(--surface-inset);">
                    <img
                      v-if="selected.image"
                      :src="selected.image"
                      :alt="`${selected.number} ${name(selected)}`"
                    >
                    <span v-else class="text-3xl font-semibold tabular-nums" style="color: var(--text-4);">
                      {{ selected.number }}
                    </span>
                  </div>

                  <!-- Matn -->
                  <div class="min-w-0 flex-1">
                    <div class="text-xs font-semibold tabular-nums mb-1" style="color: var(--accent);">
                      {{ selected.number }}
                    </div>
                    <h3 class="text-xl font-semibold leading-snug" style="color: var(--text-1);">
                      {{ name(selected) }}
                    </h3>

                    <p v-if="desc(selected)" class="mt-3 text-[14.5px] leading-relaxed" style="color: var(--text-2);">
                      {{ desc(selected) }}
                    </p>

                    <div v-if="rule(selected)" class="mt-4 rounded-xl p-3.5 text-[13.5px] leading-relaxed"
                         style="background: var(--surface-inset); color: var(--text-3);">
                      <div class="text-[11px] font-semibold uppercase tracking-wide mb-1" style="color: var(--text-4);">
                        {{ i18n.t({ uz: 'Qo\'llash qoidasi', kr: 'Қўллаш қоидаси' }) }}
                      </div>
                      {{ rule(selected) }}
                    </div>

                    <p v-if="!desc(selected) && !rule(selected)" class="mt-3 text-sm" style="color: var(--text-4);">
                      {{ i18n.t({
                        uz: 'Bu belgi uchun qoidalarda qo\'shimcha izoh berilmagan.',
                        kr: 'Бу белги учун қоидаларда қўшимча изоҳ берилмаган.'
                      }) }}
                    </p>
                  </div>
                </div>

                <!-- Oldingi / keyingi -->
                <div class="flex items-center justify-between mt-6 pt-4" style="border-top: 1px solid var(--border-soft);">
                  <button
                    class="btn-ghost text-sm"
                    :disabled="selectedIndex <= 0"
                    :style="selectedIndex <= 0 ? { opacity: 0.35, cursor: 'default' } : {}"
                    @click="step(-1)"
                  >
                    <AppIcon name="chev-l" :size="16" />
                    {{ i18n.t({ uz: 'Oldingi', kr: 'Олдинги' }) }}
                  </button>
                  <span class="text-xs tabular-nums" style="color: var(--text-4);">
                    {{ selectedIndex + 1 }} / {{ filtered.length }}
                  </span>
                  <button
                    class="btn-ghost text-sm"
                    :disabled="selectedIndex >= filtered.length - 1"
                    :style="selectedIndex >= filtered.length - 1 ? { opacity: 0.35, cursor: 'default' } : {}"
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
/*
  Belgi rasmlari turli nisbatda (kvadrat, uzun-tor 300x600, keng 1083x698).
  Qutiga ANIQ balandlik beriladi, rasm esa o'sha chegaraga sig'diriladi —
  shunda barcha kartalar bir xil bo'yda chiqadi.

  DIQQAT: bu yerda `display: grid` ISHLAMAYDI. Grid qatori (auto) rasmning
  tabiiy balandligiga moslashadi va quti chegarasidan oshib ketadi, natijada
  rasmdagi `max-height: 100%` 96px emas, o'sha oshgan qator balandligiga
  nisbatan hisoblanadi va rasm kesilib qoladi.
  Flexbox'da esa foiz to'g'ridan-to'g'ri qutining aniq balandligiga bog'lanadi.
*/
.sign-thumb {
  width: 100%;
  height: 96px;              /* barcha kartalarda bir xil */
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  border-radius: 0.5rem;
  overflow: hidden;
}

.sign-hero {
  flex: none;
  width: 160px;
  height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem;
  border-radius: 0.75rem;
  overflow: hidden;
}

/* Rasm hech qachon qutidan oshmaydi; nisbati saqlanadi. */
.sign-thumb img,
.sign-hero img {
  display: block;
  width: auto;
  height: auto;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

/* Grid katakchasi bo'ylab cho'zilsin — bir qatordagi kartalar teng bo'yda. */
.sign-card {
  height: 100%;
}

.sign-backdrop {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: grid;
  place-items: center;
  padding: 1rem;
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(2px);
}

.sign-panel {
  position: relative;
  width: 100%;
  max-width: 40rem;
  max-height: 90vh;
  overflow-y: auto;
}

.sign-close {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  width: 2rem;
  height: 2rem;
  border-radius: 0.5rem;
  display: grid;
  place-items: center;
  color: var(--text-4);
  transition: background 0.15s, color 0.15s;
}
.sign-close:hover {
  background: var(--surface-inset);
  color: var(--text-1);
}

.sign-modal-enter-active,
.sign-modal-leave-active { transition: opacity 0.2s ease; }
.sign-modal-enter-from,
.sign-modal-leave-to { opacity: 0; }

.sign-modal-enter-active .sign-panel { transition: transform 0.2s ease; }
.sign-modal-leave-active .sign-panel { transition: transform 0.16s ease; }
.sign-modal-enter-from .sign-panel,
.sign-modal-leave-to .sign-panel { transform: scale(0.97); }

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
