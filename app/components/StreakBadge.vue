<script setup lang="ts">
const props = defineProps<{ compact?: boolean }>()
const i18n = useI18n()
const auth = useAuthStore()

const { data: streak, refresh } = await useAsyncData('streak-badge', async () => {
  if (!auth.token) return null
  try { return await apiFetch<any>('/me/streak') } catch { return null }
}, { server: false, default: () => null })

defineExpose({ refresh })

const weekdayLabels = computed(() => {
  return i18n.locale.value === 'uz_cyrl'
    ? ['Ду','Се','Чо','Па','Жу','Ша','Як']
    : ['Du','Se','Ch','Pa','Ju','Sh','Ya']
})
</script>

<template>
  <!-- Full card -->
  <div v-if="streak && !props.compact" class="card p-5 sm:p-6 relative overflow-hidden">
    <!-- decorative -->
    <div aria-hidden="true" class="absolute -right-16 -top-16 w-48 h-48 rounded-full bg-amber-100/50 blur-3xl"></div>
    <div aria-hidden="true" class="absolute -left-12 -bottom-16 w-40 h-40 rounded-full bg-emerald-100/40 blur-3xl"></div>

    <div class="relative flex items-start justify-between gap-4 mb-5">
      <div class="flex items-start gap-3">
        <div class="w-11 h-11 rounded-2xl grid place-items-center flex-shrink-0"
             :class="streak.current > 0 ? 'bg-amber-100 text-amber-700' : 'bg-ink-100 text-ink-400'">
          <svg v-if="streak.current > 0" class="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 2c-.5 1.6-1.5 3.1-2.9 4.2C5.3 7.7 4 9.6 4 12c0 3.3 2.7 6 6 6s6-2.7 6-6c0-1.6-.6-2.9-1.5-4-.5.6-1.1.9-1.8.9-1.2 0-2-1-1.7-2.1.3-1.6-.4-3.7-1-4.8z"/>
          </svg>
          <svg v-else class="w-5 h-5" viewBox="0 0 20 20" fill="none">
            <path d="M10 2l2 5.5L18 8l-4.5 4 1.5 6L10 15l-5 3 1.5-6L2 8l6-.5L10 2z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>
          </svg>
        </div>
        <div>
          <div class="eyebrow mb-1.5">{{ i18n.t({ uz: 'Bugungi maqsad', kr: 'Бугунги мақсад' }) }}</div>
          <div class="flex items-baseline gap-2.5">
            <span class="text-3xl font-semibold tracking-tightest text-ink-900">{{ streak.today_progress }}</span>
            <span class="text-lg text-ink-400">/ {{ streak.today_goal }}</span>
            <span v-if="streak.today_reached" class="badge-success">
              <svg class="w-3 h-3" viewBox="0 0 12 12" fill="none"><path d="M2 6.5L4.5 9L10 3.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
              {{ i18n.t({ uz: 'Bajarildi', kr: 'Бажарилди' }) }}
            </span>
          </div>
        </div>
      </div>

      <div class="text-right">
        <div class="eyebrow mb-1.5">{{ i18n.t({ uz: 'Seriya', kr: 'Серия' }) }}</div>
        <div class="flex items-baseline gap-1.5 justify-end">
          <span class="text-3xl font-semibold tracking-tightest"
                :class="streak.current > 0 ? 'text-amber-600' : 'text-ink-400'">{{ streak.current }}</span>
          <span class="text-xs text-ink-500">{{ i18n.t({ uz: 'kun', kr: 'кун' }) }}</span>
        </div>
        <div class="text-2xs text-ink-400 mt-0.5">
          {{ i18n.t({ uz: 'Rekord:', kr: 'Рекорд:' }) }} {{ streak.longest }}
        </div>
      </div>
    </div>

    <div class="relative h-2 bg-ink-100 rounded-full overflow-hidden mb-5">
      <div class="h-full rounded-full transition-all duration-500"
           :class="streak.today_reached
             ? 'bg-gradient-to-r from-emerald-400 to-emerald-600'
             : 'bg-gradient-to-r from-amber-400 to-orange-500'"
           :style="{ width: Math.min(100, streak.percent) + '%' }"></div>
    </div>

    <div class="relative grid grid-cols-7 gap-1.5">
      <div v-for="(day, i) in streak.week" :key="i" class="text-center">
        <div class="text-2xs text-ink-400 mb-1.5">{{ weekdayLabels[i] }}</div>
        <div class="aspect-square rounded-lg flex items-center justify-center text-2xs font-semibold transition-all duration-200 hover:scale-105"
             :class="day.reached
               ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-sm'
               : day.questions > 0
                 ? 'bg-gradient-to-br from-amber-50 to-amber-100 text-amber-700 border border-amber-200'
                 : 'bg-ink-50 text-ink-300 border border-ink-200/70'">
          <svg v-if="day.reached" class="w-3 h-3" viewBox="0 0 12 12" fill="none">
            <path d="M2 6.5L4.5 9L10 3.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span v-else-if="day.questions > 0">{{ day.questions }}</span>
          <span v-else>·</span>
        </div>
      </div>
    </div>
  </div>

  <!-- Compact (header) -->
  <div v-else-if="streak && props.compact && streak.current > 0"
       class="hidden sm:flex items-center gap-1.5 h-8 px-2.5 rounded-full bg-amber-50 border border-amber-200 text-sm">
    <svg class="w-3.5 h-3.5 text-amber-600" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 1.5c-.4 1.3-1.2 2.5-2.3 3.4C4.2 6.2 3 7.7 3 9.7 3 12.5 5.2 14.5 8 14.5s5-2 5-4.8c0-1.3-.5-2.3-1.2-3.2-.4.5-.9.7-1.4.7-1 0-1.6-.8-1.4-1.7.2-1.3-.3-3-1-4Z"/>
    </svg>
    <span class="font-semibold text-amber-800">{{ streak.current }}</span>
  </div>
</template>
