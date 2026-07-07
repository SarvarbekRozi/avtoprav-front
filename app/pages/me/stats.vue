<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const i18n = useI18n()
const { data: stats } = await useAsyncData('me-stats', () => apiFetch<any>('/me/stats'))

const period = ref<'7' | '30' | '90'>('30')

const timelineFiltered = computed(() => {
  const arr = stats.value?.timeline ?? []
  const n = period.value === '7' ? 7 : period.value === '30' ? 30 : 90
  return arr.slice(-n)
})

function fmtTime(sec: number) {
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60
  if (h) return `${h}${i18n.t({ uz: 's', kr: 'с' })} ${m}${i18n.t({ uz: 'd', kr: 'д' })}`
  return `${m}${i18n.t({ uz: 'd', kr: 'д' })} ${s}${i18n.t({ uz: 's', kr: 'с' })}`
}
</script>

<template>
  <div class="max-w-6xl mx-auto px-4 sm:px-6 py-10" v-if="stats">
    <div class="mb-7">
      <div class="eyebrow">{{ i18n.t({ uz: 'Tahlil', kr: 'Таҳлил' }) }}</div>
      <h1 class="text-3xl font-semibold tracking-tightest text-ink-900 mt-1.5">
        {{ i18n.t({ uz: 'Statistika', kr: 'Статистика' }) }}
      </h1>
    </div>

    <!-- Hero KPI row -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      <div class="card p-5">
        <div class="eyebrow mb-2">{{ i18n.t({ uz: 'Aniqlik', kr: 'Аниқлик' }) }}</div>
        <div class="text-3xl font-semibold tracking-tightish tabular-nums text-ink-900">{{ stats.totals.accuracy_percent }}%</div>
      </div>
      <div class="card p-5">
        <div class="eyebrow mb-2">{{ i18n.t({ uz: 'Urinish', kr: 'Уриниш' }) }}</div>
        <div class="text-3xl font-semibold tracking-tightish tabular-nums text-ink-900">{{ stats.totals.attempts }}</div>
        <div class="text-2xs mt-1 text-ink-500">
          <span class="text-emerald-600 font-medium">{{ stats.totals.attempts_passed }}</span> {{ i18n.t({ uz: 'muvaffaqiyatli', kr: 'муваффақиятли' }) }}
        </div>
      </div>
      <div class="card p-5">
        <div class="eyebrow mb-2">{{ i18n.t({ uz: 'Savollar', kr: 'Саволлар' }) }}</div>
        <div class="text-3xl font-semibold tracking-tightish tabular-nums text-ink-900">{{ stats.totals.questions_seen }}</div>
        <div class="text-2xs mt-1 text-ink-500 tabular-nums">
          <span class="text-emerald-600">{{ stats.totals.correct }}</span> / <span class="text-rose-500">{{ stats.totals.wrong }}</span>
        </div>
      </div>
      <!-- Hero readiness (dark) -->
      <div class="rounded-2xl p-5" style="background: #0e1016; color: #fff; border: 1px solid #0e1016;">
        <div class="text-2xs uppercase tracking-[0.12em] font-semibold text-white/55 mb-2">{{ i18n.t({ uz: 'Imtihonga tayyorlik', kr: 'Имтиҳонга тайёрлик' }) }}</div>
        <div class="text-3xl font-semibold tracking-tightish tabular-nums text-white">{{ stats.totals.readiness_percent }}%</div>
        <div class="mt-3 h-1.5 rounded-full overflow-hidden bg-white/10">
          <div class="h-full bg-gradient-to-r from-emerald-400 to-emerald-600" :style="{ width: stats.totals.readiness_percent + '%' }"></div>
        </div>
      </div>
    </div>

    <!-- Chart + Donut -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-6">
      <div class="card lg:col-span-8 p-5">
        <div class="flex items-center justify-between mb-4">
          <div>
            <div class="text-sm font-semibold text-ink-900">{{ i18n.t({ uz: 'Vaqt davomida o\'sish', kr: 'Вақт давомида ўсиш' }) }}</div>
            <div class="text-2xs mt-0.5 text-ink-500">{{ i18n.t({ uz: 'Kunlik aniqlik', kr: 'Кунлик аниқлик' }) }}</div>
          </div>
          <div class="flex items-center gap-0.5 p-0.5 rounded-md text-2xs font-medium bg-ink-100">
            <button v-for="p in (['7','30','90'] as const)" :key="p"
              @click="period = p"
              class="px-2.5 h-7 inline-flex items-center rounded transition-all"
              :class="period === p ? 'bg-white text-ink-900 shadow-soft' : 'text-ink-500 hover:text-ink-900'">
              {{ p }} {{ i18n.t({ uz: 'kun', kr: 'кун' }) }}
            </button>
          </div>
        </div>
        <AreaChart :data="timelineFiltered" />
      </div>

      <div class="card lg:col-span-4 p-5 flex flex-col">
        <div class="text-sm font-semibold text-ink-900">{{ i18n.t({ uz: 'Umumiy progress', kr: 'Умумий прогресс' }) }}</div>
        <div class="text-2xs text-ink-500 mt-0.5">{{ i18n.t({ uz: 'Barcha mavzular bo\'yicha', kr: 'Барча мавзулар бўйича' }) }}</div>
        <div class="flex-1 flex items-center justify-center my-4">
          <Donut :value="Math.round(stats.totals.accuracy_percent)" />
        </div>
        <div class="grid grid-cols-2 gap-2 text-2xs">
          <div class="flex items-center justify-between">
            <span class="flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span class="text-ink-600">{{ i18n.t({ uz: 'To\'g\'ri', kr: 'Тўғри' }) }}</span>
            </span>
            <span class="tabular-nums font-semibold text-ink-900">{{ stats.totals.correct }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-rose-500"></span>
              <span class="text-ink-600">{{ i18n.t({ uz: 'Xato', kr: 'Хато' }) }}</span>
            </span>
            <span class="tabular-nums font-semibold text-ink-900">{{ stats.totals.wrong }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Topic distribution + Top-5 wrong -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-6">
      <div class="lg:col-span-7">
        <TopicStrengthList />
      </div>

      <div class="card lg:col-span-5">
        <div class="px-5 py-4 border-b border-ink-200/70">
          <div class="text-sm font-semibold text-ink-900">{{ i18n.t({ uz: 'Eng ko\'p xato qilingan TOP-5', kr: 'Энг кўп хато қилинган ТОП-5' }) }}</div>
        </div>
        <div v-if="!stats.top_mistakes?.length" class="p-8 text-center text-ink-500 text-sm">
          {{ i18n.t({ uz: 'Hozircha xato qilingan savollar yo\'q.', kr: 'Ҳозирча хато қилинган саволлар йўқ.' }) }}
        </div>
        <div v-else class="divide-y divide-ink-200/70">
          <div v-for="(r, i) in stats.top_mistakes" :key="r.id" class="px-5 py-3.5">
            <div class="flex items-start gap-3">
              <div class="w-6 h-6 rounded-md grid place-items-center text-xs font-semibold flex-shrink-0 tabular-nums bg-ink-100 text-ink-600">
                {{ i + 1 }}
              </div>
              <div class="flex-1 min-w-0">
                <div class="text-sm leading-snug line-clamp-2 text-ink-900">{{ r.text }}</div>
                <div class="flex items-center gap-2 mt-1.5">
                  <span v-if="r.topic" class="badge">{{ r.topic }}</span>
                  <span class="text-2xs tabular-nums text-rose-600">{{ r.error_rate }}% {{ i18n.t({ uz: 'xato', kr: 'хато' }) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Mode leaderboards: daily challenge + blitz records -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
      <ScoreLeaderboard
        endpoint="/leaderboard/daily"
        :title="{ uz: 'Bugungi challenge · TOP 10', kr: 'Бугунги челлендж · ТОП 10' }"
        :subtitle="{ uz: '20 savoldan nechta to\'g\'ri', kr: '20 саволдан нечта тўғри' }"
        icon="star" tone="violet" />
      <ScoreLeaderboard
        endpoint="/leaderboard/blitz"
        :title="{ uz: 'Blits rekordlar · TOP 10', kr: 'Блиц рекордлар · ТОП 10' }"
        :subtitle="{ uz: '60 soniyada eng ko\'p to\'g\'ri', kr: '60 сонияда энг кўп тўғри' }"
        icon="bolt" tone="amber" />
    </div>

    <!-- XP Leaderboard -->
    <div class="mb-6">
      <LeaderboardCard />
    </div>

    <!-- Time / extras row -->
    <div class="card p-5 mb-6 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm">
      <div>
        <span class="text-ink-500">{{ i18n.t({ uz: 'Sarflangan vaqt:', kr: 'Сарфланган вақт:' }) }}</span>
        <span class="font-semibold ml-1.5 text-ink-900 tabular-nums">{{ fmtTime(stats.totals.time_spent_sec ?? 0) }}</span>
      </div>
      <div>
        <span class="text-ink-500">{{ i18n.t({ uz: 'Hal qilinmagan xato:', kr: 'Ҳал қилинмаган хато:' }) }}</span>
        <span class="font-semibold ml-1.5 tabular-nums" :class="stats.totals.mistakes_pending ? 'text-rose-600' : 'text-ink-900'">{{ stats.totals.mistakes_pending }}</span>
      </div>
    </div>
  </div>
</template>
