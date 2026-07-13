<script setup lang="ts">
const i18n = useI18n()

const { data } = await useAsyncData<any>(
  'competition-winners',
  () => apiFetch<any>('/leaderboard/winners'),
  { server: false, default: () => null },
)

const week = computed(() => data.value?.week ?? null)
const month = computed(() => data.value?.month ?? null)

function fmtSom(n: number | null | undefined) {
  return (n ?? 0).toLocaleString('ru-RU')
}
function name(p: any) {
  return p?.full_name || (p?.login ? '@' + p.login : '')
}

const blocks = computed(() => [
  {
    key: 'week',
    title: i18n.t({ uz: 'Haftalik musobaqa', kr: 'Ҳафталик мусобақа' }),
    prevLabel: i18n.t({ uz: 'O\'tgan hafta g\'olibi', kr: 'Ўтган ҳафта ғолиби' }),
    nowLabel: i18n.t({ uz: 'Shu hafta yetakchi', kr: 'Шу ҳафта етакчи' }),
    data: week.value,
  },
  {
    key: 'month',
    title: i18n.t({ uz: 'Oylik musobaqa', kr: 'Ойлик мусобақа' }),
    prevLabel: i18n.t({ uz: 'O\'tgan oy g\'olibi', kr: 'Ўтган ой ғолиби' }),
    nowLabel: i18n.t({ uz: 'Shu oy yetakchi', kr: 'Шу ой етакчи' }),
    data: month.value,
  },
])
</script>

<template>
  <div class="card overflow-hidden">
    <div class="px-5 py-4 flex items-center gap-2" style="border-bottom: 1px solid var(--divider);">
      <AppIcon name="trophy" :size="16" class="text-amber-500" />
      <div class="text-sm font-semibold" style="color: var(--text-1);">
        {{ i18n.t({ uz: 'Sovg\'ali g\'oliblar', kr: 'Совғали ғолиблар' }) }}
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x" style="border-color: var(--divider);">
      <div v-for="b in blocks" :key="b.key" class="p-5">
        <div class="flex items-baseline justify-between mb-3">
          <div class="text-sm font-semibold" style="color: var(--text-1);">{{ b.title }}</div>
          <div class="text-sm font-bold tabular-nums" style="color: #d97706;">
            {{ fmtSom(b.data?.current?.prize) }}
            <span class="text-2xs font-medium" style="color: var(--text-3);">{{ i18n.t({ uz: 'so\'m', kr: 'сўм' }) }}</span>
          </div>
        </div>

        <!-- Previous period winner (gold highlight) -->
        <div v-if="b.data?.previous?.leader"
             class="rounded-xl p-3 mb-2.5 flex items-center gap-2.5"
             style="background: linear-gradient(135deg, rgba(251,191,36,0.18), rgba(245,158,11,0.06)); border: 1px solid rgba(245,158,11,0.35);">
          <div class="w-8 h-8 rounded-full grid place-items-center shrink-0 text-white shadow-soft"
               style="background: linear-gradient(135deg, #fbbf24, #d97706);">
            <AppIcon name="trophy" :size="15" />
          </div>
          <div class="min-w-0 flex-1">
            <div class="text-2xs font-semibold uppercase tracking-wide" style="color: #b45309;">
              {{ b.prevLabel }} · {{ b.data.previous.label }}
            </div>
            <div class="text-sm font-bold truncate" style="color: var(--text-1);">{{ name(b.data.previous.leader) }}</div>
          </div>
          <div class="text-sm font-bold tabular-nums shrink-0" style="color: var(--text-1);">
            {{ b.data.previous.leader.points.toLocaleString() }}
            <span class="text-2xs" style="color: var(--text-4);">XP</span>
          </div>
        </div>
        <div v-else class="rounded-xl p-3 mb-2.5 text-2xs text-center" style="background: var(--surface-inset); color: var(--text-4);">
          {{ i18n.t({ uz: 'O\'tgan davrda ishtirokchi bo\'lmagan', kr: 'Ўтган даврда иштирокчи бўлмаган' }) }}
        </div>

        <!-- Current leader -->
        <div class="flex items-center gap-2.5 px-1">
          <div class="w-7 h-7 rounded-full grid place-items-center shrink-0 text-2xs font-semibold"
               style="background: var(--surface-inset); color: var(--text-3);">
            <AppIcon name="flame" :size="12" class="text-amber-500" />
          </div>
          <div class="min-w-0 flex-1">
            <div class="text-2xs" style="color: var(--text-3);">{{ b.nowLabel }} · {{ b.data?.current?.label }}</div>
            <div v-if="b.data?.current?.leader" class="text-sm font-medium truncate" style="color: var(--text-1);">
              {{ name(b.data.current.leader) }}
            </div>
            <div v-else class="text-sm" style="color: var(--text-4);">
              {{ i18n.t({ uz: 'Hali bo\'sh — birinchi bo\'ling!', kr: 'Ҳали бўш — биринчи бўлинг!' }) }}
            </div>
          </div>
          <div v-if="b.data?.current?.leader" class="text-sm font-semibold tabular-nums shrink-0" style="color: var(--text-1);">
            {{ b.data.current.leader.points.toLocaleString() }}
            <span class="text-2xs" style="color: var(--text-4);">XP</span>
          </div>
        </div>
      </div>
    </div>

    <div class="px-5 py-3 text-2xs" style="border-top: 1px solid var(--divider); background: var(--surface-soft); color: var(--text-4);">
      {{ i18n.t({
        uz: 'Har hafta (dushanba) va oy boshida g\'olib avtomatik aniqlanadi va e\'lon qilinadi.',
        kr: 'Ҳар ҳафта (душанба) ва ой бошида ғолиб автоматик аниқланади ва эълон қилинади.',
      }) }}
    </div>
  </div>
</template>
