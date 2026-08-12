<script setup lang="ts">
/**
 * Aniqlik dinamikasi — chiziqli grafik.
 *
 * Nega kutubxona emas: bitta chiziq + punktir o'rtacha + hover. Chart.js/
 * ApexCharts ~200KB qo'shadi va ularning standart ko'rinishini maketga
 * moslashtirish o'z SVG'sini yozishdan uzoqroq. Bu yerda o'lchamlar to'liq
 * nazoratda.
 *
 * Dizayn qoidalari (dataviz): 2px chiziq, hairline SOLID to'r (punktir to'r
 * shovqin), punktir FAQAT o'rtacha chizig'i uchun (u chegara — punktir ayni
 * shu ma'noni beradi), tanlab yorliqlash (faqat oxirgi nuqta), hover
 * krossxair + tooltip, ekran o'quvchi uchun jadval-egizak.
 */
export interface Nuqta { date: string, accuracy: number | null }

const props = withDefaults(defineProps<{
  points: Nuqta[]
  /** O'rtacha aniqlik (punktir chiziq). `null` bo'lsa chizilmaydi. */
  avg?: number | null
  height?: number
}>(), { avg: null, height: 200 })

const i18n = useI18n()

// ── Geometriya ────────────────────────────────────────────────────────────
// `viewBox` ichida ishlaymiz: kenglik 100% ga cho'ziladi, nisbat saqlanmaydi
// (`preserveAspectRatio="none"` YO'Q — matn cho'zilib ketardi, shuning uchun
// kenglik o'lchanadi va nuqtalar shu kenglikka qayta hisoblanadi).
const W = ref(760)
const PAD = { chap: 38, ong: 14, tepa: 16, past: 26 }
const chizH = computed(() => props.height - PAD.tepa - PAD.past)
const chizW = computed(() => W.value - PAD.chap - PAD.ong)

const konteyner = ref<HTMLElement | null>(null)
let ro: ResizeObserver | null = null
onMounted(() => {
  if (!konteyner.value) return
  ro = new ResizeObserver(([e]) => { W.value = Math.max(320, Math.round(e.contentRect.width)) })
  ro.observe(konteyner.value)
})
onBeforeUnmount(() => ro?.disconnect())

/** Faqat ma'lumot BOR kunlar chiziladi. Bo'sh kunni "0%" deb ko'rsatish yoki
    ular ustidan chiziq tortish — bo'lmagan ma'lumotni o'ylab chiqarish. */
const borlar = computed(() => props.points
  .map((p, i) => ({ ...p, i }))
  .filter(p => p.accuracy !== null) as (Nuqta & { i: number, accuracy: number })[])

/** Y o'qi shkalasi — 10 ga bo'linadigan yuqori chegara, kamida 50%. */
const yMax = computed(() => {
  const m = Math.max(props.avg ?? 0, ...borlar.value.map(p => p.accuracy), 0)
  return Math.max(50, Math.ceil(m / 10) * 10)
})
const yBelgilar = computed(() => {
  const n = yMax.value / 10
  return Array.from({ length: n + 1 }, (_, k) => k * 10)
})

const oxirgiIndeks = computed(() => Math.max(1, props.points.length - 1))
const x = (i: number) => PAD.chap + (props.points.length <= 1 ? chizW.value / 2 : (i / oxirgiIndeks.value) * chizW.value)
const y = (v: number) => PAD.tepa + chizH.value - (v / yMax.value) * chizH.value

const chiziq = computed(() => borlar.value.map((p, k) => `${k ? 'L' : 'M'}${x(p.i).toFixed(1)},${y(p.accuracy).toFixed(1)}`).join(' '))
const maydon = computed(() => {
  if (borlar.value.length < 2) return ''
  const b = borlar.value
  const past = PAD.tepa + chizH.value
  return `${chiziq.value} L${x(b[b.length - 1]!.i).toFixed(1)},${past} L${x(b[0]!.i).toFixed(1)},${past} Z`
})

// ── X o'qi yorliqlari ─────────────────────────────────────────────────────
const OY = {
  uz: ['yan', 'fev', 'mar', 'apr', 'may', 'iyun', 'iyul', 'avg', 'sen', 'okt', 'noy', 'dek'],
  kr: ['ян', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'],
}
function kunOy(iso: string) {
  const [, m, d] = iso.split('-')
  const oy = i18n.locale.value === 'uz_cyrl' ? OY.kr : OY.uz
  return `${Number(d)} ${oy[Number(m) - 1]}`
}
/** Yorliqlar bir-birining ustiga chiqmasin: kenglikka qarab qadam tanlanadi. */
const xYorliqlar = computed(() => {
  const n = props.points.length
  if (!n) return []
  const sigadi = Math.max(2, Math.floor(chizW.value / 74))
  const qadam = Math.max(1, Math.ceil((n - 1) / sigadi))
  const out: { i: number, matn: string }[] = []
  for (let i = 0; i < n; i += qadam) out.push({ i, matn: kunOy(props.points[i]!.date) })
  const oxir = n - 1
  if (out[out.length - 1]!.i !== oxir && x(oxir) - x(out[out.length - 1]!.i) > 52) {
    out.push({ i: oxir, matn: kunOy(props.points[oxir]!.date) })
  }
  return out
})

// ── Hover: krossxair + tooltip ────────────────────────────────────────────
const hover = ref<number | null>(null)
function harakat(e: MouseEvent) {
  if (!borlar.value.length) return
  const r = (e.currentTarget as SVGElement).getBoundingClientRect()
  const px = ((e.clientX - r.left) / r.width) * W.value
  // eng yaqin MA'LUMOTLI nuqta (bo'sh kunga tooltip ko'rsatishning ma'nosi yo'q)
  let eng = borlar.value[0]!.i, d = Infinity
  for (const p of borlar.value) {
    const dd = Math.abs(x(p.i) - px)
    if (dd < d) { d = dd; eng = p.i }
  }
  hover.value = eng
}
const hoverNuqta = computed(() => hover.value === null ? null : props.points[hover.value] ?? null)

const oxirgiBor = computed(() => borlar.value[borlar.value.length - 1] ?? null)
/** Ikkitadan kam nuqtada chiziq chizib bo'lmaydi — bo'sh to'r ko'rsatish
    o'rniga rostini aytamiz. */
const bosh = computed(() => borlar.value.length < 2)
</script>

<template>
  <div ref="konteyner" class="lc">
    <svg
      :viewBox="`0 0 ${W} ${height}`" :height="height" class="lc-svg"
      role="img" :aria-label="i18n.t({ uz: 'Aniqlik dinamikasi grafigi', kr: 'Аниқлик динамикаси графиги' })"
      @mousemove="harakat" @mouseleave="hover = null"
    >
      <!-- To'r: SOLID hairline, sirtdan bir pog'ona farq (punktir to'r shovqin) -->
      <g class="lc-grid">
        <line v-for="v in yBelgilar" :key="`g${v}`" :x1="PAD.chap" :x2="W - PAD.ong" :y1="y(v)" :y2="y(v)" />
      </g>
      <!-- Y yorliqlari -->
      <g class="lc-ylbl">
        <text v-for="v in yBelgilar" :key="`y${v}`" :x="PAD.chap - 8" :y="y(v) + 3.5" text-anchor="end">{{ v }}%</text>
      </g>

      <!-- Yengil to'ldirish — chiziqni "og'irlashtirmaydigan" darajada shaffof -->
      <path v-if="maydon" :d="maydon" class="lc-area" />

      <!-- O'rtacha: PUNKTIR (u chegara, shuning uchun punktir o'rinli) -->
      <template v-if="avg !== null">
        <line :x1="PAD.chap" :x2="W - PAD.ong" :y1="y(avg)" :y2="y(avg)" class="lc-avg" />
      </template>

      <!-- Asosiy chiziq: 2px -->
      <path v-if="chiziq" :d="chiziq" class="lc-line" />

      <!-- Nuqtalar: 2px sirt halqasi bilan (ustma-ust tushganda ajralib turadi) -->
      <circle
        v-for="p in borlar" :key="`p${p.i}`"
        :cx="x(p.i)" :cy="y(p.accuracy)" r="3.5"
        class="lc-dot" :class="{ on: hover === p.i }"
      />

      <!-- Krossxair -->
      <template v-if="hover !== null && hoverNuqta?.accuracy !== null && hoverNuqta">
        <line :x1="x(hover)" :x2="x(hover)" :y1="PAD.tepa" :y2="PAD.tepa + chizH" class="lc-cross" />
      </template>

      <!-- X yorliqlari -->
      <g class="lc-xlbl">
        <text v-for="t in xYorliqlar" :key="`x${t.i}`" :x="x(t.i)" :y="height - 8" text-anchor="middle">{{ t.matn }}</text>
      </g>
    </svg>

    <!-- Oxirgi qiymat yorlig'i — TANLAB yorliqlash (har nuqtaga son qo'yilmaydi) -->
    <div
      v-if="oxirgiBor && hover === null"
      class="lc-badge"
      :style="{ left: `${(x(oxirgiBor.i) / W) * 100}%`, top: `${y(oxirgiBor.accuracy) - 30}px` }"
    >{{ oxirgiBor.accuracy }}%</div>

    <!-- Hover tooltip -->
    <div
      v-if="hover !== null && hoverNuqta && hoverNuqta.accuracy !== null"
      class="lc-tip"
      :style="{ left: `${(x(hover) / W) * 100}%`, top: `${y(hoverNuqta.accuracy) - 30}px` }"
    >
      <b>{{ hoverNuqta.accuracy }}%</b>
      <span>{{ kunOy(hoverNuqta.date) }}</span>
    </div>

    <!-- Ma'lumot yo'q holati — bo'sh to'r ustida -->
    <p v-if="bosh" class="lc-bosh">
      {{ i18n.t({
        uz: 'Bu davrda hali test yechilmagan — grafik uchun kamida ikki kunlik ma\'lumot kerak.',
        kr: 'Бу даврда ҳали тест ечилмаган — график учун камида икки кунлик маълумот керак.'
      }) }}
    </p>

    <!-- Legenda: ikki belgi bor (chiziq + o'rtacha), shuning uchun kerak -->
    <div v-if="!bosh" class="lc-legend">
      <span class="lg"><i class="lg-line" />{{ i18n.t({ uz: 'Aniqlik', kr: 'Аниқлик' }) }}</span>
      <span v-if="avg !== null" class="lg"><i class="lg-dash" />{{ i18n.t({ uz: 'O\'rtacha', kr: 'Ўртача' }) }} ({{ avg }}%)</span>
    </div>

    <!-- Jadval-egizak: qiymat FAQAT tooltipda qolmasin (ekran o'quvchi uchun) -->
    <table class="sr-only">
      <caption>{{ i18n.t({ uz: 'Kunlik aniqlik', kr: 'Кунлик аниқлик' }) }}</caption>
      <thead><tr>
        <th>{{ i18n.t({ uz: 'Sana', kr: 'Сана' }) }}</th>
        <th>{{ i18n.t({ uz: 'Aniqlik', kr: 'Аниқлик' }) }}</th>
      </tr></thead>
      <tbody>
        <tr v-for="p in borlar" :key="`t${p.i}`"><td>{{ p.date }}</td><td>{{ p.accuracy }}%</td></tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.lc { position: relative; }
.lc-svg { display: block; width: 100%; overflow: visible; }

/* Chart ranglari — dataviz validatoridan o'tgan (CVD ΔE 26.4, kontrast >= 3:1).
   Qorong'ida BOSHQA pog'ona: och rang to'q sirtda yorqinlik beradi, shuning
   uchun mode uchun alohida tanlangan (avtomatik teskari qilinmagan). */
.lc { --c-line: #4f6ef0; }
:global(.dark) .lc { --c-line: #6183f7; }

.lc-grid line { stroke: var(--divider); stroke-width: 1; }
.lc-ylbl text, .lc-xlbl text { font-size: 10.5px; fill: var(--text-3); font-variant-numeric: tabular-nums; }

.lc-area { fill: var(--c-line); opacity: 0.08; }
.lc-line { fill: none; stroke: var(--c-line); stroke-width: 2; stroke-linejoin: round; stroke-linecap: round; }
.lc-avg { stroke: var(--text-4); stroke-width: 1; stroke-dasharray: 5 4; }

.lc-dot { fill: var(--c-line); stroke: var(--surface); stroke-width: 2; }
.lc-dot.on { r: 5; }
.lc-cross { stroke: var(--text-muted); stroke-width: 1; stroke-dasharray: 3 3; }

.lc-badge, .lc-tip {
  position: absolute; transform: translateX(-50%);
  padding: 0.2rem 0.45rem; border-radius: 0.375rem;
  font-size: 0.75rem; font-weight: 700; white-space: nowrap;
  pointer-events: none;
}
.lc-badge { background: var(--c-line); color: #fff; }
.lc-tip {
  display: flex; align-items: baseline; gap: 0.35rem;
  background: var(--text-1); color: var(--surface);
  box-shadow: var(--shadow-card);
}
.lc-tip span { font-weight: 500; opacity: 0.7; }

.lc-bosh {
  position: absolute; left: 50%; top: 45%; transform: translate(-50%, -50%);
  max-width: 22rem; text-align: center;
  font-size: 0.8125rem; line-height: 1.5; color: var(--text-3);
}
.lc-legend { display: flex; flex-wrap: wrap; gap: 1rem; margin-top: 0.5rem; padding-left: 38px; }
.lg { display: inline-flex; align-items: center; gap: 0.4rem; font-size: 0.75rem; color: var(--text-3); }
.lg-line { width: 1rem; height: 2px; border-radius: 1px; background: var(--c-line); }
.lg-dash { width: 1rem; height: 0; border-top: 1px dashed var(--text-4); }
</style>
