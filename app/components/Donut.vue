<script setup lang="ts">
const props = withDefaults(defineProps<{
  value: number
  size?: number
  thickness?: number
  label?: string
}>(), {
  size: 160,
  thickness: 14,
})

const i18n = useI18n()

const theme = useTheme()
const r = computed(() => (props.size - props.thickness) / 2 - 2)
const c = computed(() => 2 * Math.PI * r.value)
const dash = computed(() => (Math.max(0, Math.min(100, props.value)) / 100) * c.value)
const center = computed(() => props.size / 2)
const trackColor = computed(() => theme.isDark.value ? '#1d2029' : '#eeeef1')
</script>

<template>
  <div class="relative inline-block">
    <svg :width="size" :height="size" :viewBox="`0 0 ${size} ${size}`">
      <circle :cx="center" :cy="center" :r="r" fill="none" :stroke="trackColor" :stroke-width="thickness"/>
      <circle :cx="center" :cy="center" :r="r" fill="none" stroke="#10b981" :stroke-width="thickness"
              :stroke-dasharray="`${dash} ${c}`" stroke-linecap="round"
              :transform="`rotate(-90 ${center} ${center})`"/>
    </svg>
    <div class="absolute inset-0 flex flex-col items-center justify-center">
      <div class="text-3xl font-semibold tabular-nums tracking-tight text-ink-900">{{ value }}%</div>
      <div class="text-2xs mt-0.5 text-ink-500">{{ label || i18n.t({ uz: 'aniqlik', kr: 'аниқлик' }) }}</div>
    </div>
  </div>
</template>
