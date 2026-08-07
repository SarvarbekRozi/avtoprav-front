<script setup lang="ts">
/**
 * Sidebar'dagi "XP darajangiz" kartasi.
 *
 * Daraja backendda saqlanmaydi — u foydalanuvchining HAQIQIY XP balidan
 * determinatik hisoblanadi (quyidagi chegaralar bo'yicha). Ya'ni bu ko'rsatkich
 * to'qib chiqarilgan emas, shunchaki mavjud XP ning boshqacha ko'rinishi.
 */
const props = withDefaults(defineProps<{
  points: number
  /** joriy kunlik seriya; 0 bo'lsa ko'rsatilmaydi */
  streak?: number
  compact?: boolean
}>(), { streak: 0, compact: false })

const i18n = useI18n()

const THRESHOLDS = [0, 100, 250, 500, 1000, 2000, 3500, 5000, 7500, 10000, 15000, 25000, 50000, 100000]

const levelIndex = computed(() => {
  const i = THRESHOLDS.findIndex(t => props.points < t)
  return i === -1 ? THRESHOLDS.length : i // 1-based daraja
})
const floorXp = computed(() => THRESHOLDS[levelIndex.value - 1] ?? 0)
const nextXp = computed(() => THRESHOLDS[levelIndex.value] ?? null)

const percent = computed(() => {
  if (nextXp.value === null) return 100
  const span = nextXp.value - floorXp.value
  if (span <= 0) return 100
  return Math.max(3, Math.min(100, Math.round(((props.points - floorXp.value) / span) * 100)))
})
</script>

<template>
  <NuxtLink to="/me/stats"
    class="xp-card block rounded-2xl transition-colors"
    :class="compact ? 'p-3' : 'p-4'"
    :title="i18n.t({ uz: 'Statistika sahifasiga o\'tish', kr: 'Статистика саҳифасига ўтиш' })">
    <div class="flex items-center gap-1.5">
      <AppIcon name="trophy" :size="14" class="text-amber-500 shrink-0" />
      <span class="text-xs font-medium truncate" style="color: var(--text-3);">
        {{ i18n.t({ uz: 'XP darajangiz', kr: 'XP даражангиз' }) }}
      </span>
      <span v-if="streak > 0"
            class="ml-auto inline-flex items-center gap-0.5 px-1.5 h-5 rounded-full text-2xs font-bold tabular-nums shrink-0 text-amber-700"
            style="background: rgba(251,191,36,0.18);"
            :title="i18n.t({ uz: 'Kunlik seriya', kr: 'Кунлик серия' })">
        <AppIcon name="flame" :size="10" class="text-amber-500" />
        {{ streak }}
      </span>
    </div>

    <div class="mt-1.5 flex items-baseline gap-1.5">
      <span class="text-[26px] font-bold tabular-nums tracking-tight leading-none" style="color: var(--text-1);">
        {{ points.toLocaleString() }}
      </span>
      <span class="text-[13px] font-semibold" style="color: var(--text-4);">XP</span>
    </div>

    <div class="h-1.5 rounded-full overflow-hidden mt-3" style="background: var(--border-soft);">
      <div class="h-full rounded-full transition-[width] duration-700 ease-out"
           :style="{ width: percent + '%', background: 'var(--grad-progress)' }"></div>
    </div>

    <div class="text-xs mt-2 truncate" style="color: var(--text-4);">
      <template v-if="nextXp !== null">
        {{ i18n.t({ uz: 'Keyingi daraja', kr: 'Кейинги даража' }) }}: {{ nextXp.toLocaleString() }} XP
      </template>
      <template v-else>
        {{ i18n.t({ uz: 'Eng yuqori daraja', kr: 'Энг юқори даража' }) }}
      </template>
    </div>
  </NuxtLink>
</template>

<style scoped>
.xp-card { background: var(--surface-inset); }
.xp-card:hover { filter: brightness(0.98); }
</style>
