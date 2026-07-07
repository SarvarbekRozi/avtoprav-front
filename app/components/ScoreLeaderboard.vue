<script setup lang="ts">
const props = defineProps<{
  endpoint: string
  title: { uz: string, kr: string }
  subtitle?: { uz: string, kr: string }
  icon?: string
  tone?: string
  boardKey?: string
}>()

const i18n = useI18n()
const { data, pending } = await useAsyncData(props.boardKey || `board-${props.endpoint}`,
  () => apiFetch<any>(props.endpoint),
  { server: false, default: () => null },
)

const top = computed(() => data.value?.top ?? [])
const me = computed(() => data.value?.me ?? null)
const outOf = computed<number | null>(() => data.value?.out_of ?? null)
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
function fmtScore(s: number | null) {
  if (s === null || s === undefined) return '—'
  return outOf.value ? `${s}/${outOf.value}` : `${s}`
}
</script>

<template>
  <div class="card overflow-hidden">
    <div class="px-5 py-4 flex items-center gap-3" style="border-bottom: 1px solid var(--divider);">
      <IconTile :icon="icon || 'trophy'" :tone="(tone as any) || 'amber'" :size="38" />
      <div class="min-w-0">
        <div class="text-sm font-semibold" style="color: var(--text-1);">{{ i18n.t(title) }}</div>
        <div v-if="subtitle" class="text-2xs mt-0.5" style="color: var(--text-3);">{{ i18n.t(subtitle) }}</div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="pending && !top.length" class="p-5 space-y-2">
      <div v-for="i in 4" :key="i" class="h-10 rounded-lg animate-pulse" style="background: var(--surface-inset);"></div>
    </div>

    <!-- Empty -->
    <div v-else-if="!top.length" class="p-8 text-center text-sm" style="color: var(--text-3);">
      {{ i18n.t({ uz: 'Hozircha ishtirokchi yo\'q. Birinchi bo\'ling!', kr: 'Ҳозирча иштирокчи йўқ. Биринчи бўлинг!' }) }}
    </div>

    <!-- List -->
    <div v-else class="divide-y" style="border-color: var(--divider);">
      <div v-for="u in top" :key="u.id"
           class="flex items-center gap-3 px-5 py-2.5"
           :style="u.is_me ? { background: 'var(--accent-soft)' } : {}">
        <div class="w-7 h-7 rounded-full grid place-items-center text-xs font-bold tabular-nums flex-shrink-0"
             :style="medalColor(u.rank)
               ? { background: medalColor(u.rank)!, color: '#fff' }
               : { background: 'var(--surface-inset)', color: 'var(--text-3)' }">
          {{ u.rank }}
        </div>
        <div class="w-8 h-8 rounded-full grid place-items-center text-xs font-semibold flex-shrink-0"
             style="background: var(--text-1); color: var(--surface);">
          {{ initials(u.full_name, u.login) }}
        </div>
        <div class="flex-1 min-w-0 text-sm font-medium truncate" style="color: var(--text-1);">
          {{ u.full_name || u.login }}
          <span v-if="u.is_me" class="text-2xs ml-1" style="color: var(--text-3);">({{ i18n.t({ uz: 'siz', kr: 'сиз' }) }})</span>
        </div>
        <div class="text-sm font-bold tabular-nums shrink-0" style="color: var(--text-1);">{{ fmtScore(u.score) }}</div>
      </div>

      <!-- Guest: register to compete -->
      <NuxtLink v-if="me?.is_guest" to="/register"
           class="flex items-center gap-3 px-5 py-2.5 transition-opacity hover:opacity-80"
           style="background: var(--accent-soft); border-top: 1px solid var(--divider);">
        <div class="w-7 h-7 rounded-full grid place-items-center text-xs font-bold flex-shrink-0"
             style="background: var(--surface-inset); color: var(--text-3);">?</div>
        <div class="flex-1 min-w-0 text-sm font-medium" style="color: var(--accent);">
          {{ i18n.t({ uz: 'Reytingda qatnashish uchun ro\'yxatdan o\'ting →', kr: 'Рейтингда қатнашиш учун рўйхатдан ўтинг →' }) }}
        </div>
      </NuxtLink>

      <!-- Your best if not in top -->
      <div v-else-if="me && me.score !== null && !meInTop"
           class="flex items-center gap-3 px-5 py-2.5"
           style="background: var(--accent-soft); border-top: 1px solid var(--divider);">
        <div class="w-7 h-7 rounded-full grid place-items-center text-2xs font-bold tabular-nums flex-shrink-0"
             style="background: var(--surface-inset); color: var(--text-3);">{{ me.rank }}</div>
        <div class="w-8 h-8 rounded-full grid place-items-center text-xs font-semibold flex-shrink-0"
             style="background: var(--text-1); color: var(--surface);">{{ initials(me.full_name, me.login) }}</div>
        <div class="flex-1 min-w-0 text-sm font-medium truncate" style="color: var(--text-1);">
          {{ me.full_name || me.login }}
          <span class="text-2xs ml-1" style="color: var(--text-3);">({{ i18n.t({ uz: 'siz', kr: 'сиз' }) }})</span>
        </div>
        <div class="text-sm font-bold tabular-nums shrink-0" style="color: var(--text-1);">{{ fmtScore(me.score) }}</div>
      </div>
    </div>
  </div>
</template>
