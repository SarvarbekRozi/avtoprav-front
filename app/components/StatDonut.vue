<script setup lang="ts">
/**
 * Qamrov donut — uch bo'lakli (o'zlashtirilgan / ko'rib chiqilgan / qolgan).
 *
 * Dataviz qoidalari: bo'laklar orasida 2px SIRT oraliq (chegara chizig'i
 * emas), <= 6 bo'lak, legendada aniq sonlar (rang yolg'iz ma'no tashimaydi),
 * markazda bitta bosh son. Ranglar validatordan o'tgan.
 */
export interface Bolak { key: string, label: string, value: number, tone: 'ok' | 'seen' | 'rest' }

const props = withDefaults(defineProps<{
  parts: Bolak[]
  /** Markazdagi bosh foiz */
  percent: number
  centerTop?: string
  centerSub?: string
  size?: number
}>(), { size: 176, centerTop: '', centerSub: '' })

const i18n = useI18n()

const R = computed(() => props.size / 2)
const QALIN = 16
const r = computed(() => R.value - QALIN / 2 - 2)
const aylana = computed(() => 2 * Math.PI * r.value)

const jami = computed(() => props.parts.reduce((a, b) => a + b.value, 0))

/**
 * Har bo'lak yoy uzunligi. ORALIQ: bo'laklar orasida 2px sirt bo'shligi —
 * `stroke-dasharray` da yoydan 2px ayirib qoldiramiz. Juda kichik bo'lak
 * (2px dan kam) butunlay yo'qolib qolmasin uchun eng kami 1px qoldiriladi.
 */
const ORALIQ = 2
const yoylar = computed(() => {
  const t = jami.value
  if (!t) return []
  let siljish = 0
  return props.parts.map((p) => {
    const toliq = (p.value / t) * aylana.value
    const kor = p.value > 0 ? Math.max(1, toliq - ORALIQ) : 0
    const y = { ...p, dash: `${kor} ${aylana.value - kor}`, offset: -siljish }
    siljish += toliq
    return y
  })
})
</script>

<template>
  <div class="dn">
    <div class="dn-wrap" :style="{ width: `${size}px`, height: `${size}px` }">
      <svg :viewBox="`0 0 ${size} ${size}`" class="dn-svg" aria-hidden="true">
        <!-- Fon halqasi -->
        <circle :cx="R" :cy="R" :r="r" class="dn-track" :stroke-width="QALIN" />
        <!-- Bo'laklar: 12 dan (tepadan) boshlanadi -->
        <g :transform="`rotate(-90 ${R} ${R})`">
          <circle
            v-for="a in yoylar" :key="a.key"
            :cx="R" :cy="R" :r="r" fill="none"
            :class="`dn-arc dn-${a.tone}`" :stroke-width="QALIN"
            :stroke-dasharray="a.dash" :stroke-dashoffset="a.offset"
            stroke-linecap="butt"
          />
        </g>
      </svg>
      <!-- Markazdagi bosh son: `tabular-nums` YO'Q (katta yakka sonda
           teng kenglikdagi raqamlar bo'sh ko'rinadi) -->
      <div class="dn-mid">
        <div class="dn-pct">{{ percent }}%</div>
        <div v-if="centerTop" class="dn-top">{{ centerTop }}</div>
        <div v-if="centerSub" class="dn-sub">{{ centerSub }}</div>
      </div>
    </div>

    <!-- Legenda — aniq son va foiz bilan, ya'ni ma'no rangga bog'liq emas -->
    <ul class="dn-legend">
      <li v-for="p in parts" :key="p.key">
        <span class="dn-dot" :class="`dn-${p.tone}`" />
        <span class="dn-lbl">{{ p.label }}</span>
        <span class="dn-val tabular-nums">{{ p.value.toLocaleString() }}</span>
        <span class="dn-share tabular-nums">({{ jami ? (p.value / jami * 100).toFixed(1) : 0 }}%)</span>
      </li>
    </ul>

    <table class="sr-only">
      <caption>{{ i18n.t({ uz: 'Savollar banki qamrovi', kr: 'Саволлар банки қамрови' }) }}</caption>
      <tbody>
        <tr v-for="p in parts" :key="`t${p.key}`"><th scope="row">{{ p.label }}</th><td>{{ p.value }}</td></tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
/* Validatordan o'tgan ranglar: yorug' #059669/#4f6ef0, qorong'i #0fa974/#6183f7
   (CVD ΔE 23-26, kontrast >= 3:1, yorqinlik diapazoni ikkala rejimda ham). */
.dn { --c-ok: #059669; --c-seen: #4f6ef0; }
:global(.dark) .dn { --c-ok: #0fa974; --c-seen: #6183f7; }

.dn { display: flex; flex-direction: column; gap: 1rem; }
@container (min-width: 26rem) { .dn { flex-direction: row; align-items: center; gap: 1.5rem; } }

.dn-wrap { position: relative; flex-shrink: 0; margin: 0 auto; }
.dn-svg { display: block; width: 100%; height: 100%; }
.dn-track { fill: none; stroke: var(--surface-inset); }
.dn-arc { transition: stroke-dasharray 0.5s ease; }
.dn-ok { stroke: var(--c-ok); }
.dn-seen { stroke: var(--c-seen); }
.dn-rest { stroke: var(--border-1); }

.dn-mid { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
.dn-pct { font-size: 1.75rem; font-weight: 700; letter-spacing: -0.02em; color: var(--text-1); }
.dn-top { font-size: 0.75rem; color: var(--text-3); margin-top: 0.1rem; }
.dn-sub { font-size: 0.6875rem; color: var(--text-3); }

.dn-legend { flex: 1 1 auto; min-width: 0; display: grid; gap: 0.625rem; }
.dn-legend li { display: flex; align-items: center; gap: 0.5rem; font-size: 0.8125rem; }
.dn-dot { flex-shrink: 0; width: 0.5rem; height: 0.5rem; border-radius: 9999px; }
.dn-dot.dn-ok { background: var(--c-ok); }
.dn-dot.dn-seen { background: var(--c-seen); }
.dn-dot.dn-rest { background: var(--border-1); }
.dn-lbl { flex: 1 1 auto; min-width: 0; color: var(--text-3); }
.dn-val { font-weight: 600; color: var(--text-1); }
.dn-share { color: var(--text-3); font-size: 0.75rem; }

@media (prefers-reduced-motion: reduce) { .dn-arc { transition: none; } }
</style>
