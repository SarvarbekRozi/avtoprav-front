<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const i18n = useI18n()
const { data: topicsRes, pending } = await useAsyncData('topics', () => apiFetch<{ data: any[] }>('/topics'))
const topics = computed(() => topicsRes.value?.data || [])

function name(t: any)        { return i18n.locale.value === 'uz_cyrl' ? t.name_kr : t.name_uz }
function description(t: any) { return i18n.locale.value === 'uz_cyrl' ? t.description_kr : t.description_uz }
</script>

<template>
  <div class="max-w-6xl mx-auto px-4 sm:px-6 py-10">
    <div class="mb-8">
      <div class="eyebrow mb-2">{{ i18n.t({ uz: 'Mashq', kr: 'Машқ' }) }}</div>
      <h1 class="text-3xl font-semibold tracking-tightest text-ink-900">
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
      <div v-for="i in 6" :key="i" class="card p-5 h-36 animate-pulse">
        <div class="h-4 w-3/4 bg-ink-100 rounded mb-3"></div>
        <div class="h-3 w-1/3 bg-ink-100 rounded mb-2"></div>
        <div class="h-3 w-full bg-ink-100 rounded"></div>
      </div>
    </div>

    <!-- Empty -->
    <div v-else-if="topics.length === 0" class="card p-12 text-center">
      <div class="text-ink-400 mb-2">
        <svg class="w-10 h-10 mx-auto" viewBox="0 0 24 24" fill="none">
          <path d="M4 5h16v14H4zM8 9h8M8 13h8M8 17h5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </div>
      <p class="text-ink-600">{{ i18n.t({
        uz: 'Mavzular hozircha mavjud emas.',
        kr: 'Мавзулар ҳозирча мавжуд эмас.'
      }) }}</p>
    </div>

    <!-- Grid -->
    <div v-else class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <NuxtLink v-for="t in topics" :key="t.id"
        :to="t.is_locked || t.questions_count === 0 ? '' : `/test/start/topic?topic_id=${t.id}`"
        class="card card-hover p-5 group block relative"
        :class="{ 'opacity-60 pointer-events-none': t.is_locked || t.questions_count === 0 }">
        <div v-if="t.is_premium" class="badge-warn absolute top-4 right-4">Premium</div>

        <div class="flex items-start justify-between gap-3 mb-2">
          <div class="font-semibold text-ink-900 leading-snug pr-6">{{ name(t) }}</div>
        </div>

        <div class="flex items-center gap-2 text-2xs text-ink-500 mb-3">
          <span>{{ t.questions_count }} {{ i18n.t({ uz: 'savol', kr: 'савол' }) }}</span>
        </div>

        <p v-if="description(t)" class="text-sm text-ink-500 leading-relaxed line-clamp-2">
          {{ description(t) }}
        </p>

        <div class="mt-4 pt-4 border-t border-ink-200/70 flex items-center justify-between">
          <span v-if="t.is_locked" class="text-sm text-amber-700 font-medium">
            {{ i18n.t({ uz: 'Premium kerak', kr: 'Премиум керак' }) }}
          </span>
          <span v-else class="text-sm font-medium text-ink-700 group-hover:text-ink-900">
            {{ i18n.t({ uz: 'Mashq qilish', kr: 'Машқ қилиш' }) }}
          </span>
          <svg class="w-4 h-4 text-ink-300 group-hover:text-ink-900 group-hover:translate-x-0.5 transition-all"
               viewBox="0 0 16 16" fill="none">
            <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
      </NuxtLink>
    </div>
  </div>
</template>
