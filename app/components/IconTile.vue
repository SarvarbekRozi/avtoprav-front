<script setup lang="ts">
type Tone = 'brand' | 'emerald' | 'amber' | 'rose' | 'violet' | 'sky' | 'ink'

const props = withDefaults(defineProps<{
  icon: string
  tone?: Tone
  size?: number
}>(), {
  tone: 'brand',
  size: 44,
})

const theme = useTheme()

const tonesLight: Record<Tone, { bg: string, fg: string }> = {
  brand:   { bg: '#e7ecf5', fg: '#23335c' },
  emerald: { bg: '#d1fae5', fg: '#047857' },
  amber:   { bg: '#fef3c7', fg: '#b45309' },
  rose:    { bg: '#ffe4e6', fg: '#be123c' },
  violet:  { bg: '#ede9fe', fg: '#6d28d9' },
  sky:     { bg: '#e0f2fe', fg: '#0369a1' },
  ink:     { bg: '#eeeef1', fg: '#2f3340' },
}
const tonesDark: Record<Tone, { bg: string, fg: string }> = {
  brand:   { bg: 'rgba(63,88,148,0.22)',   fg: '#9eaecf' },
  emerald: { bg: 'rgba(16,185,129,0.18)',  fg: '#6ee7b7' },
  amber:   { bg: 'rgba(251,191,36,0.18)',  fg: '#fcd34d' },
  rose:    { bg: 'rgba(244,63,94,0.18)',   fg: '#fda4af' },
  violet:  { bg: 'rgba(139,92,246,0.18)',  fg: '#c4b5fd' },
  sky:     { bg: 'rgba(14,165,233,0.18)',  fg: '#7dd3fc' },
  ink:     { bg: 'rgba(255,255,255,0.08)', fg: '#eeeef1' },
}

const t = computed(() => (theme.isDark.value ? tonesDark : tonesLight)[props.tone])
</script>

<template>
  <div class="rounded-xl grid place-items-center flex-shrink-0 transition-colors"
       :style="{ width: size + 'px', height: size + 'px', background: t.bg, color: t.fg }">
    <AppIcon :name="icon" :size="Math.round(size * 0.45)" />
  </div>
</template>
