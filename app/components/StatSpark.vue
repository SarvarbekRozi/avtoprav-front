<script setup lang="ts">
/**
 * KPI kartasidagi kichik sparkline.
 *
 * Ataylab O'QIB BO'LMAYDIGAN darajada mayda: o'qi, yorlig'i va tooltipi yo'q —
 * u faqat "shakl" (o'sdimi/tushdimi) beradi, aniq sonlar kartadagi katta
 * raqamda va asosiy grafikda bor. Shu sababli `aria-hidden`.
 */
const props = withDefaults(defineProps<{
  values: (number | null)[]
  tone?: 'primary' | 'blue' | 'amber'
  height?: number
}>(), { tone: 'primary', height: 40 })

const W = 120
const H = computed(() => props.height)

/** null qiymatlar tashlanadi — bo'sh kunni 0 deb chizish yolg'on shakl beradi. */
const bor = computed(() => props.values
  .map((v, i) => ({ v, i }))
  .filter(p => p.v !== null) as { v: number, i: number }[])

const chegara = computed(() => {
  const vs = bor.value.map(p => p.v)
  const min = Math.min(...vs, 0)
  const max = Math.max(...vs, 1)
  return { min, max: max === min ? min + 1 : max }
})

const n = computed(() => Math.max(1, props.values.length - 1))
const px = (i: number) => (i / n.value) * (W - 2) + 1
const py = (v: number) => {
  const { min, max } = chegara.value
  return H.value - 3 - ((v - min) / (max - min)) * (H.value - 6)
}

const yol = computed(() => bor.value.map((p, k) => `${k ? 'L' : 'M'}${px(p.i).toFixed(1)},${py(p.v).toFixed(1)}`).join(' '))
const maydon = computed(() => {
  if (bor.value.length < 2) return ''
  const b = bor.value
  return `${yol.value} L${px(b[b.length - 1]!.i).toFixed(1)},${H.value} L${px(b[0]!.i).toFixed(1)},${H.value} Z`
})
</script>

<template>
  <svg
    v-if="bor.length > 1" :viewBox="`0 0 ${W} ${H}`" :class="`sp sp-${tone}`"
    preserveAspectRatio="none" aria-hidden="true" focusable="false"
  >
    <path v-if="maydon" :d="maydon" class="sp-area" />
    <path :d="yol" class="sp-line" />
  </svg>
</template>

<style scoped>
.sp { display: block; width: 100%; height: 100%; }
.sp-primary { --c: #6a5cf0; }
.sp-blue    { --c: #3b82f6; }
.sp-amber   { --c: #f97316; }
:global(.dark) .sp-primary { --c: #8f83f6; }
:global(.dark) .sp-blue    { --c: #60a5fa; }
:global(.dark) .sp-amber   { --c: #fb923c; }

/* `preserveAspectRatio="none"` chiziq qalinligini cho'zadi, shuning uchun
   `vector-effect` bilan qalinlik doim 1.5px bo'lib qoladi. */
.sp-line { fill: none; stroke: var(--c); stroke-width: 1.5; vector-effect: non-scaling-stroke; stroke-linejoin: round; }
.sp-area { fill: var(--c); opacity: 0.12; }
</style>
