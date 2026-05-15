<script setup lang="ts">
const i18n = useI18n()
const { data } = await useAsyncData('topic-stats', () => apiFetch<any>('/me/topic-stats'))

const strengthColors: Record<string, string> = {
  mastered:   'bg-emerald-500',
  strong:     'bg-brand-500',
  practicing: 'bg-amber-500',
  weak:       'bg-rose-500',
  unknown:    'bg-ink-300',
}
const strengthLabels: Record<string, { uz: string, kr: string }> = {
  mastered:   { uz: 'Mukammal',     kr: 'Мукаммал' },
  strong:     { uz: 'Yaxshi',       kr: 'Яхши' },
  practicing: { uz: 'Mashq kerak',  kr: 'Машқ керак' },
  weak:       { uz: 'Zaif',         kr: 'Заиф' },
  unknown:    { uz: 'Kam ma\'lumot', kr: 'Кам маълумот' },
}
const strengthBadge: Record<string, string> = {
  mastered:   'bg-emerald-50 text-emerald-700',
  strong:     'bg-brand-50 text-brand-700',
  practicing: 'bg-amber-50 text-amber-700',
  weak:       'bg-rose-50 text-rose-700',
  unknown:    'bg-ink-100 text-ink-500',
}
</script>

<template>
  <div v-if="data" class="space-y-4">
    <!-- Recommendation -->
    <div v-if="data.recommendation" class="card p-5 flex items-start gap-4">
      <div class="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 grid place-items-center flex-shrink-0">
        <svg class="w-4 h-4" viewBox="0 0 16 16" fill="none">
          <path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3.05 3.05l1.06 1.06M11.89 11.89l1.06 1.06M3.05 12.95l1.06-1.06M11.89 4.11l1.06-1.06M8 5a3 3 0 0 0-1.5 5.6V12h3v-1.4A3 3 0 0 0 8 5z" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <div class="flex-1 min-w-0">
        <div class="text-sm font-semibold text-ink-900">
          {{ i18n.t({ uz: 'Sizga tavsiya', kr: 'Сизга тавсия' }) }}
        </div>
        <div class="text-sm text-ink-600 mt-1">{{ data.recommendation.message }}</div>
        <NuxtLink :to="`/test/start/topic?topic_id=${data.recommendation.topic_id}`"
                  class="btn-soft btn-sm mt-3">
          {{ i18n.t({ uz: 'Shu mavzuni mashq qilish', kr: 'Шу мавзуни машқ қилиш' }) }}
          <svg class="w-3 h-3" viewBox="0 0 12 12" fill="none">
            <path d="M2.5 6h7M6 2.5L9.5 6 6 9.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </NuxtLink>
      </div>
    </div>

    <!-- Empty -->
    <div v-if="data.topics.length === 0" class="card p-8 text-center text-ink-500 text-sm">
      {{ i18n.t({
        uz: 'Hali yetarli ma\'lumot yo\'q. Bir nechta test yeching — tahlil shu yerda paydo bo\'ladi.',
        kr: 'Ҳали етарли маълумот йўқ. Бир нечта тест ечинг — таҳлил шу ерда пайдо бўлади.'
      }) }}
    </div>

    <!-- Topics list -->
    <div v-else class="card">
      <div class="px-5 py-4 border-b border-ink-200/70 flex items-center justify-between">
        <div>
          <div class="text-sm font-semibold text-ink-900">
            {{ i18n.t({ uz: 'Mavzular bo\'yicha daraja', kr: 'Мавзулар бўйича даража' }) }}
          </div>
          <div class="text-2xs text-ink-500 mt-0.5">
            {{ i18n.t({ uz: 'Aniqlik darajangiz tahlili', kr: 'Аниқлик даражангиз таҳлили' }) }}
          </div>
        </div>
      </div>
      <div class="divide-y divide-ink-200/70">
        <div v-for="t in data.topics" :key="t.topic_id || 'none'" class="px-5 py-3.5">
          <div class="flex items-center justify-between gap-3 mb-2">
            <div class="font-medium text-sm text-ink-900 truncate">{{ t.name }}</div>
            <div class="flex items-center gap-2 flex-shrink-0">
              <span v-if="t.accuracy !== null" class="text-sm font-semibold text-ink-900 tabular-nums">{{ t.accuracy }}%</span>
              <span class="text-2xs text-ink-500 tabular-nums">{{ t.correct }}/{{ t.correct + t.wrong }}</span>
              <span class="badge text-2xs" :class="strengthBadge[t.strength]">
                {{ i18n.t(strengthLabels[t.strength]) }}
              </span>
            </div>
          </div>
          <div class="h-1 bg-ink-100 rounded-full overflow-hidden">
            <div class="h-full rounded-full transition-all duration-500"
                 :class="strengthColors[t.strength]"
                 :style="{ width: (t.accuracy ?? 0) + '%' }"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
