<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const i18n = useI18n()
const { data: stats } = await useAsyncData('me-stats', () => apiFetch<any>('/me/stats'))

function fmtTime(sec: number) {
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60
  if (h) return `${h}${i18n.t({ uz: 's', kr: 'с' })} ${m}${i18n.t({ uz: 'd', kr: 'д' })}`
  return `${m}${i18n.t({ uz: 'd', kr: 'д' })} ${s}${i18n.t({ uz: 's', kr: 'с' })}`
}

const modeLabels: Record<string, { uz: string, kr: string }> = {
  exam:     { uz: 'Imtihon',     kr: 'Имтиҳон' },
  topic:    { uz: 'Mavzu',       kr: 'Мавзу' },
  ticket:   { uz: 'Bilet',       kr: 'Билет' },
  random:   { uz: 'Tasodifiy',   kr: 'Тасодифий' },
  mistakes: { uz: 'Xatolar',     kr: 'Хатолар' },
  marathon: { uz: 'Marafon',     kr: 'Марафон' },
  memorize: { uz: 'Yodlash',     kr: 'Ёдлаш' },
}
function modeLabel(m: string) { return modeLabels[m] ? i18n.t(modeLabels[m]) : m }
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 sm:px-6 py-10" v-if="stats">
    <div class="mb-8">
      <div class="eyebrow mb-2">{{ i18n.t({ uz: 'Tahlil', kr: 'Таҳлил' }) }}</div>
      <h1 class="text-3xl font-semibold tracking-tightest text-ink-900">
        {{ i18n.t({ uz: 'Statistika', kr: 'Статистика' }) }}
      </h1>
    </div>

    <!-- KPI grid -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
      <div class="card p-5">
        <div class="text-2xs uppercase tracking-wider text-ink-500 font-semibold mb-2">{{ i18n.t({ uz: 'Aniqlik', kr: 'Аниқлик' }) }}</div>
        <div class="text-3xl font-semibold tracking-tightish text-ink-900 tabular-nums">{{ stats.totals.accuracy_percent }}%</div>
      </div>
      <div class="card p-5">
        <div class="text-2xs uppercase tracking-wider text-ink-500 font-semibold mb-2">{{ i18n.t({ uz: 'Urinish', kr: 'Уриниш' }) }}</div>
        <div class="text-3xl font-semibold tracking-tightish text-ink-900 tabular-nums">{{ stats.totals.attempts }}</div>
        <div class="text-2xs text-ink-500 mt-1">
          <span class="text-emerald-600 font-medium">{{ stats.totals.attempts_passed }}</span> {{ i18n.t({ uz: 'muvaffaqiyatli', kr: 'муваффақиятли' }) }}
        </div>
      </div>
      <div class="card p-5">
        <div class="text-2xs uppercase tracking-wider text-ink-500 font-semibold mb-2">{{ i18n.t({ uz: 'Savollar', kr: 'Саволлар' }) }}</div>
        <div class="text-3xl font-semibold tracking-tightish text-ink-900 tabular-nums">{{ stats.totals.questions_seen }}</div>
        <div class="text-2xs text-ink-500 mt-1">
          <span class="text-emerald-600">{{ stats.totals.correct }}</span> / <span class="text-rose-500">{{ stats.totals.wrong }}</span>
        </div>
      </div>
      <div class="card p-5">
        <div class="text-2xs uppercase tracking-wider text-ink-500 font-semibold mb-2">{{ i18n.t({ uz: 'Hal qilinmagan xato', kr: 'Ҳал қилинмаган хато' }) }}</div>
        <div class="text-3xl font-semibold tracking-tightish tabular-nums"
             :class="stats.totals.mistakes_pending ? 'text-rose-600' : 'text-ink-900'">{{ stats.totals.mistakes_pending }}</div>
        <NuxtLink v-if="stats.totals.mistakes_pending" to="/me/mistakes"
                  class="text-2xs text-ink-500 hover:text-ink-900 mt-1 inline-block">
          {{ i18n.t({ uz: 'Mashq qilish →', kr: 'Машқ қилиш →' }) }}
        </NuxtLink>
      </div>
    </div>

    <!-- Time and totals -->
    <div class="card p-5 mb-6 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm">
      <div>
        <span class="text-ink-500">{{ i18n.t({ uz: 'Sarflangan vaqt:', kr: 'Сарфланган вақт:' }) }}</span>
        <span class="font-semibold ml-1.5 text-ink-900 tabular-nums">{{ fmtTime(stats.totals.time_spent_sec ?? 0) }}</span>
      </div>
      <div>
        <span class="text-ink-500">{{ i18n.t({ uz: 'Ko\'rgan savollar:', kr: 'Кўрган саволлар:' }) }}</span>
        <span class="font-semibold ml-1.5 text-ink-900 tabular-nums">{{ stats.totals.questions_seen ?? 0 }}</span>
      </div>
    </div>

    <!-- Topic strength -->
    <div class="mb-6">
      <TopicStrengthList />
    </div>

    <!-- Recent attempts -->
    <div class="card">
      <div class="px-5 py-4 border-b border-ink-200/70">
        <div class="text-sm font-semibold text-ink-900">{{ i18n.t({ uz: 'So\'nggi urinishlar', kr: 'Сўнгги уринишлар' }) }}</div>
      </div>
      <div v-if="!stats.recent?.length" class="p-8 text-center text-ink-500 text-sm">
        {{ i18n.t({ uz: 'Hozircha urinishlar yo\'q', kr: 'Ҳозирча уринишлар йўқ' }) }}
      </div>
      <div v-else class="divide-y divide-ink-200/70">
        <NuxtLink v-for="a in stats.recent" :key="a.id" :to="`/test/result/${a.id}`"
          class="flex items-center justify-between px-5 py-3.5 hover:bg-ink-50 transition-colors group">
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-2 h-8 rounded-full flex-shrink-0"
                 :class="a.is_passed ? 'bg-emerald-500' : 'bg-rose-400'"></div>
            <div class="min-w-0">
              <div class="flex items-center gap-2">
                <span class="badge">{{ modeLabel(a.mode) }}</span>
                <span class="font-semibold text-ink-900 tabular-nums">{{ a.correct_count }} / {{ a.total_questions }}</span>
              </div>
              <div class="text-2xs text-ink-500 mt-0.5">{{ new Date(a.created_at).toLocaleString() }}</div>
            </div>
          </div>
          <svg class="w-4 h-4 text-ink-300 group-hover:text-ink-900 group-hover:translate-x-0.5 transition-all" viewBox="0 0 16 16" fill="none">
            <path d="M6 4l4 4-4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
