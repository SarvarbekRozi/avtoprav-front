<script setup lang="ts">
type Period = 'all' | 'week' | 'month'

const props = withDefaults(defineProps<{
  defaultPeriod?: Period
  showFooter?: boolean
}>(), {
  defaultPeriod: 'all',
  showFooter: true,
})

const i18n = useI18n()
const auth = useAuthStore()
const period = ref<Period>(props.defaultPeriod)

const { data, refresh, pending } = await useAsyncData<any>(
  () => `leaderboard-${period.value}`,
  () => apiFetch<any>(`/leaderboard?period=${period.value}&limit=10`),
  { server: false, watch: [period], default: () => null },
)

const top = computed(() => data.value?.top ?? [])
const me = computed(() => data.value?.me ?? null)
const meInTop = computed(() => top.value.some((u: any) => u.is_me))

function initials(name: string | null, login: string) {
  const src = name || login || ''
  return src.split(/\s+/).filter(Boolean).slice(0, 2).map(s => s[0]?.toUpperCase()).join('') || '·'
}

function medalColor(rank: number) {
  if (rank === 1) return '#f59e0b'
  if (rank === 2) return '#94a3b8'
  if (rank === 3) return '#b45309'
  return null
}
</script>

<template>
  <div class="card">
    <div class="px-5 py-4 flex items-center justify-between" style="border-bottom: 1px solid var(--divider);">
      <div>
        <div class="text-sm font-semibold flex items-center gap-2" style="color: var(--text-1);">
          <AppIcon name="trophy" :size="16" class="text-amber-500" />
          {{ i18n.t({ uz: 'Reyting', kr: 'Рейтинг' }) }}
        </div>
        <div class="text-2xs mt-0.5" style="color: var(--text-3);">
          {{ data?.totals?.participants ?? '—' }} {{ i18n.t({ uz: 'ishtirokchi', kr: 'иштирокчи' }) }}
        </div>
      </div>
      <div class="flex items-center gap-0.5 p-0.5 rounded-md text-2xs font-medium" style="background: var(--surface-inset);">
        <button v-for="p in (['week','month','all'] as const)" :key="p" @click="period = p"
          class="px-2.5 h-7 inline-flex items-center rounded transition-all"
          :style="period === p
            ? { background: 'var(--surface)', color: 'var(--text-1)', boxShadow: 'var(--shadow-soft)' }
            : { color: 'var(--text-3)' }">
          {{ p === 'week' ? i18n.t({ uz: 'Hafta', kr: 'Ҳафта' })
             : p === 'month' ? i18n.t({ uz: 'Oy', kr: 'Ой' })
             : i18n.t({ uz: 'Hammasi', kr: 'Ҳаммаси' }) }}
        </button>
      </div>
    </div>

    <!-- Loading skeleton -->
    <div v-if="pending && !top.length" class="p-5 space-y-2">
      <div v-for="i in 5" :key="i" class="h-10 rounded-lg animate-pulse" style="background: var(--surface-inset);"></div>
    </div>

    <!-- Empty -->
    <div v-else-if="!top.length" class="p-8 text-center text-sm" style="color: var(--text-3);">
      {{ i18n.t({ uz: 'Hozircha ishtirokchi yo\'q. Birinchi bo\'ling!', kr: 'Ҳозирча иштирокчи йўқ. Биринчи бўлинг!' }) }}
    </div>

    <!-- List -->
    <div v-else class="divide-y" style="border-color: var(--divider);">
      <div v-for="u in top" :key="u.id"
           class="flex items-center gap-3 px-5 py-3 transition-colors"
           :style="u.is_me ? { background: 'var(--accent-soft)' } : {}">
        <div class="w-7 h-7 rounded-full grid place-items-center text-xs font-semibold tabular-nums flex-shrink-0 text-white"
             :style="{ background: medalColor(u.rank) || 'var(--surface-inset)', color: medalColor(u.rank) ? '#fff' : 'var(--text-3)' }">
          {{ u.rank }}
        </div>
        <div class="w-8 h-8 rounded-full grid place-items-center text-xs font-semibold flex-shrink-0"
             style="background: var(--text-1); color: var(--surface);">
          {{ initials(u.full_name, u.login) }}
        </div>
        <div class="flex-1 min-w-0">
          <div class="text-sm font-medium truncate" style="color: var(--text-1);">
            {{ u.full_name || u.login }}
            <span v-if="u.is_me" class="text-2xs ml-1" style="color: var(--text-3);">
              ({{ i18n.t({ uz: 'siz', kr: 'сиз' }) }})
            </span>
          </div>
          <div v-if="u.streak" class="text-2xs tabular-nums" style="color: var(--text-4);">
            <AppIcon name="flame" :size="9" class="inline-block text-amber-500 align-baseline mr-0.5" />
            {{ u.streak }} {{ i18n.t({ uz: 'kun', kr: 'кун' }) }}
          </div>
        </div>
        <div class="text-sm font-semibold tabular-nums flex items-baseline gap-1" style="color: var(--text-1);">
          {{ u.points.toLocaleString() }}
          <span class="text-2xs font-medium" style="color: var(--text-4);">XP</span>
        </div>
      </div>

      <!-- Guest: rating needs an account -->
      <NuxtLink v-if="me?.is_guest" to="/register" class="flex items-center gap-3 px-5 py-3 transition-opacity hover:opacity-80"
           style="background: var(--accent-soft); border-top: 1px solid var(--divider);">
        <div class="w-8 h-8 rounded-full grid place-items-center text-xs font-semibold flex-shrink-0"
             style="background: var(--text-1); color: var(--surface);">·</div>
        <div class="flex-1 min-w-0 text-sm font-medium" style="color: var(--accent);">
          {{ i18n.t({ uz: 'Reytingda qatnashish uchun ro\'yxatdan o\'ting →', kr: 'Рейтингда қатнашиш учун рўйхатдан ўтинг →' }) }}
        </div>
        <div class="text-sm font-semibold tabular-nums flex items-baseline gap-1" style="color: var(--text-1);">
          {{ (me.points ?? 0).toLocaleString() }}
          <span class="text-2xs font-medium" style="color: var(--text-4);">XP</span>
        </div>
      </NuxtLink>

      <!-- "You" row if not in top -->
      <div v-else-if="me && !meInTop" class="flex items-center gap-3 px-5 py-3"
           style="background: var(--accent-soft); border-top: 1px solid var(--divider);">
        <div class="w-7 h-7 rounded-full grid place-items-center text-2xs font-semibold tabular-nums flex-shrink-0"
             style="background: var(--surface-inset); color: var(--text-3);">
          {{ me.rank }}
        </div>
        <div class="w-8 h-8 rounded-full grid place-items-center text-xs font-semibold flex-shrink-0"
             style="background: var(--text-1); color: var(--surface);">
          {{ initials(me.full_name, me.login) }}
        </div>
        <div class="flex-1 min-w-0">
          <div class="text-sm font-medium truncate" style="color: var(--text-1);">
            {{ me.full_name || me.login }}
            <span class="text-2xs ml-1" style="color: var(--text-3);">({{ i18n.t({ uz: 'siz', kr: 'сиз' }) }})</span>
          </div>
        </div>
        <div class="text-sm font-semibold tabular-nums flex items-baseline gap-1" style="color: var(--text-1);">
          {{ me.points.toLocaleString() }}
          <span class="text-2xs font-medium" style="color: var(--text-4);">XP</span>
        </div>
      </div>
    </div>

    <!-- Footer: how to earn -->
    <div v-if="showFooter" class="px-5 py-3 text-2xs" style="border-top: 1px solid var(--divider); color: var(--text-3); background: var(--surface-soft);">
      <span class="font-semibold" style="color: var(--text-2);">
        {{ i18n.t({ uz: 'Qanday XP olinadi:', kr: 'Қандай XP олинади:' }) }}
      </span>
      {{ i18n.t({ uz: 'to\'g\'ri javob +5 · imtihonda +10 · imtihondan o\'tish +50 · 20/20 +100 · kunlik maqsad +30',
                   kr: 'тўғри жавоб +5 · имтиҳонда +10 · имтиҳондан ўтиш +50 · 20/20 +100 · кунлик мақсад +30' }) }}
    </div>
  </div>
</template>
