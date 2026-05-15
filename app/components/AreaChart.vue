<script setup lang="ts">
const props = defineProps<{
  data: Array<{ date: string, accuracy: number | null, answered: number }>
}>()

const theme = useTheme()
const W = 560
const H = 200
const PAD = 16

// Use only points with data, but keep a slot per day for x-axis.
// Fill nulls with previous value or 0 for visual continuity.
const filled = computed(() => {
  let prev = 0
  return props.data.map(d => {
    const v = d.accuracy ?? prev
    prev = v
    return v
  })
})

const min = computed(() => Math.max(0, Math.min(...filled.value) - 5))
const max = computed(() => Math.min(100, Math.max(...filled.value, 70) + 5))

function x(i: number) {
  if (filled.value.length === 1) return W / 2
  return PAD + (i * (W - PAD * 2)) / (filled.value.length - 1)
}
function y(v: number) {
  return H - PAD - ((v - min.value) * (H - PAD * 2)) / (max.value - min.value || 1)
}

const pts = computed(() => filled.value.map((v, i) => `${x(i)},${y(v)}`).join(' '))
const areaPts = computed(() => {
  if (!filled.value.length) return ''
  return `${x(0)},${H - PAD} ` + pts.value + ` ${x(filled.value.length - 1)},${H - PAD}`
})

const lastValue = computed(() => filled.value[filled.value.length - 1] ?? 0)
const lastX = computed(() => x(filled.value.length - 1))
const lastY = computed(() => y(lastValue.value))
</script>

<template>
  <svg :viewBox="`0 0 ${W} ${H}`" class="w-full h-auto block">
    <!-- gridlines -->
    <line v-for="i in 5" :key="i"
          :x1="PAD" :x2="W - PAD"
          :y1="PAD + ((i - 1) * (H - PAD * 2)) / 4"
          :y2="PAD + ((i - 1) * (H - PAD * 2)) / 4"
          :stroke="theme.isDark.value ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.05)'" stroke-width="1"/>
    <defs>
      <linearGradient id="lc-area" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%"  stop-color="#3f5894" :stop-opacity="theme.isDark.value ? '0.4' : '0.22'"/>
        <stop offset="100%" stop-color="#3f5894" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <polygon v-if="areaPts" :points="areaPts" fill="url(#lc-area)"/>
    <polyline v-if="pts" :points="pts" fill="none" :stroke="theme.isDark.value ? '#9eaecf' : '#3f5894'" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round"/>
    <circle :cx="lastX" :cy="lastY" r="5" :fill="theme.isDark.value ? '#fff' : '#0e1016'" :stroke="theme.isDark.value ? '#0b0e15' : '#fff'" stroke-width="2"/>
    <text :x="lastX - 30" :y="lastY - 14"
          font-family="Inter" font-size="11" font-weight="600" :fill="theme.isDark.value ? '#fff' : '#0e1016'">
      {{ Math.round(lastValue) }}%
    </text>
  </svg>
</template>
