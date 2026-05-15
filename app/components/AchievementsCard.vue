<script setup lang="ts">
const i18n = useI18n()
const auth = useAuthStore()

const { data: stats } = await useAsyncData('me-stats-ach', async () => {
  if (!auth.token) return null
  try { return await apiFetch<any>('/me/stats') } catch { return null }
}, { server: false })

const items = useAchievements(stats)

const earned = computed(() => items.value.filter(a => a.on))
const totalCount = computed(() => items.value.length)
</script>

<template>
  <div class="card">
    <div class="px-5 py-4 flex items-center justify-between" style="border-bottom: 1px solid var(--divider);">
      <div class="flex items-center gap-2">
        <div class="text-sm font-semibold" style="color: var(--text-1);">
          {{ i18n.t({ uz: 'Yutuqlar', kr: 'Ютуқлар' }) }}
        </div>
        <span class="badge-info tabular-nums">{{ earned.length }} / {{ totalCount }}</span>
      </div>
      <div class="text-2xs" style="color: var(--text-4);">
        {{ i18n.t({ uz: 'Mashq qilib ko\'paytiring', kr: 'Машқ қилиб кўпайтиринг' }) }}
      </div>
    </div>

    <div class="p-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      <div v-for="b in items" :key="b.id"
           class="flex flex-col items-center text-center p-3 rounded-xl transition-all"
           :class="b.on ? 'card-hover' : ''"
           :style="{
             background: b.on ? 'var(--surface-soft)' : 'var(--surface-soft)',
             opacity: b.on ? '1' : '0.5',
             filter: b.on ? 'none' : 'grayscale(0.6)',
           }">
        <IconTile :icon="b.icon" :tone="b.tone" :size="42" />
        <div class="mt-2 text-xs font-semibold" style="color: var(--text-2);">{{ i18n.t(b.title) }}</div>
        <div class="text-2xs mt-0.5 leading-tight" style="color: var(--text-4);">{{ i18n.t(b.desc) }}</div>
        <div v-if="!b.on && b.progress" class="mt-2 w-full">
          <div class="h-1 rounded-full overflow-hidden" style="background: var(--surface-inset);">
            <div class="h-full rounded-full" style="background: var(--text-3);"
                 :style="{ width: Math.min(100, (b.progress.value / b.progress.target) * 100) + '%' }"></div>
          </div>
          <div class="text-2xs mt-1 tabular-nums" style="color: var(--text-4);">
            {{ b.progress.value }} / {{ b.progress.target }}
          </div>
        </div>
        <div v-else-if="b.on" class="mt-2 badge-success">
          <AppIcon name="check" :size="10" /> {{ i18n.t({ uz: 'Qo\'lga kiritildi', kr: 'Қўлга киритилди' }) }}
        </div>
      </div>
    </div>
  </div>
</template>
