<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const i18n = useI18n()
const { data: topicsRes, pending } = await useAsyncData('topics', () => apiFetch<{ data: any[] }>('/topics'))
const topics = computed(() => topicsRes.value?.data || [])

function name(t: any)        { return i18n.locale.value === 'uz_cyrl' ? t.name_kr : t.name_uz }
function description(t: any) { return i18n.locale.value === 'uz_cyrl' ? t.description_kr : t.description_uz }

const TONE_ROTATION = ['brand', 'sky', 'amber', 'rose', 'violet', 'emerald', 'ink'] as const
function toneFor(i: number) { return TONE_ROTATION[i % TONE_ROTATION.length] }

function progress(t: any) {
  // Backend may not provide; default 0. If `accuracy` provided per topic, use it.
  return Number.isFinite(t.accuracy) ? Math.round(t.accuracy) : 0
}
function progressColor(p: number) {
  if (p >= 80) return '#10b981'
  if (p >= 60) return '#3f5894'
  if (p >= 50) return '#f59e0b'
  if (p > 0)   return '#f43f5e'
  return '#d9dade'
}
</script>

<template>
  <div class="max-w-6xl mx-auto px-4 sm:px-6 py-10">
    <div class="mb-7">
      <div class="eyebrow">{{ i18n.t({ uz: 'Mashq', kr: 'Машқ' }) }}</div>
      <h1 class="text-3xl font-semibold tracking-tightest text-ink-900 mt-1.5">
        {{ i18n.t({ uz: 'Mavzular bo\'yicha mashq', kr: 'Мавзулар бўйича машқ' }) }}
      </h1>
      <p class="text-ink-500 mt-2 max-w-2xl">
        {{ i18n.t({
          uz: 'Bitta mavzuni tanlang va shu yo\'nalishdagi savollar bilan chuqur shug\'ullaning.',
          kr: 'Битта мавзуни танланг ва шу йўналишдаги саволлар билан чуқур шуғулланинг.'
        }) }}
      </p>
    </div>

    <!-- Loading -->
    <div v-if="pending" class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-for="i in 6" :key="i" class="card p-5 h-48 animate-pulse"></div>
    </div>

    <!-- Empty -->
    <div v-else-if="topics.length === 0" class="card p-12 text-center">
      <div class="text-ink-400 mb-2 flex justify-center"><AppIcon name="book" :size="40" /></div>
      <p class="text-ink-600">{{ i18n.t({
        uz: 'Mavzular hozircha mavjud emas.',
        kr: 'Мавзулар ҳозирча мавжуд эмас.'
      }) }}</p>
    </div>

    <!-- Grid -->
    <div v-else class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <NuxtLink v-for="(t, i) in topics" :key="t.id"
        :to="t.is_locked || t.questions_count === 0 ? '' : `/test/start/topic?topic_id=${t.id}`"
        class="card card-hover p-5 group block relative"
        :class="{ 'opacity-70 pointer-events-none': t.is_locked }">
        <span v-if="t.is_premium" class="badge-warn absolute top-4 right-4">
          <AppIcon name="spark" :size="10" />
          Premium
        </span>

        <IconTile icon="sign" :tone="toneFor(i)" :size="40" />

        <div class="font-semibold mt-4 leading-snug pr-12 text-ink-900">{{ name(t) }}</div>
        <div class="text-2xs mt-1 text-ink-500">{{ t.questions_count }} {{ i18n.t({ uz: 'ta savol', kr: 'та савол' }) }}</div>

        <p v-if="description(t)" class="text-sm mt-2.5 leading-relaxed line-clamp-2 text-ink-500">
          {{ description(t) }}
        </p>

        <div class="mt-4">
          <div class="flex items-center justify-between text-2xs mb-1.5">
            <span class="text-ink-500">{{ i18n.t({ uz: 'O\'zlashtirilgan', kr: 'Ўзлаштирилган' }) }}</span>
            <span class="tabular-nums font-semibold text-ink-800">{{ progress(t) }}%</span>
          </div>
          <div class="h-1.5 rounded-full overflow-hidden bg-ink-100">
            <div class="h-full rounded-full transition-all duration-500"
                 :style="{ background: progressColor(progress(t)), width: progress(t) + '%' }"></div>
          </div>
        </div>

        <div class="mt-4 pt-4 border-t border-ink-200/70 flex items-center justify-between">
          <span class="text-sm font-medium" :class="t.is_locked ? 'text-amber-700' : 'text-ink-700'">
            {{ t.is_locked ? i18n.t({ uz: 'Premium kerak', kr: 'Премиум керак' }) : i18n.t({ uz: 'Mashq qilish', kr: 'Машқ қилиш' }) }}
          </span>
          <AppIcon name="arrow" :size="14" class="text-ink-300 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </NuxtLink>
    </div>
  </div>
</template>
