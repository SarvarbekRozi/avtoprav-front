<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const i18n = useI18n()
const { data } = await useAsyncData('me-bookmarks', () => apiFetch<any>('/me/bookmarks'))
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 py-10">
    <div class="mb-8">
      <div class="eyebrow mb-2">{{ i18n.t({ uz: 'Sizning to\'plamingiz', kr: 'Сизнинг тўпламингиз' }) }}</div>
      <h1 class="text-3xl font-semibold tracking-tightest text-ink-900">
        {{ i18n.t({ uz: 'Saqlangan savollar', kr: 'Сақланган саволлар' }) }}
      </h1>
    </div>

    <!-- Empty -->
    <div v-if="!data?.data?.length" class="card p-12 text-center">
      <div class="w-12 h-12 rounded-2xl bg-ink-100 text-ink-500 grid place-items-center mx-auto mb-4">
        <svg class="w-5 h-5" viewBox="0 0 20 20" fill="none">
          <path d="M5 3h10v15l-5-3-5 3V3z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
        </svg>
      </div>
      <div class="font-semibold text-ink-900 mb-1">
        {{ i18n.t({ uz: 'Bo\'sh', kr: 'Бўш' }) }}
      </div>
      <p class="text-sm text-ink-500">{{ i18n.t({ uz: 'Hali saqlangan savollar yo\'q', kr: 'Ҳали сақланган саволлар йўқ' }) }}</p>
    </div>

    <!-- List -->
    <div v-else class="space-y-4">
      <div v-for="q in data.data" :key="q.id" class="card p-6">
        <div v-if="q.topic" class="text-2xs uppercase tracking-wider text-ink-500 font-semibold mb-2">{{ q.topic }}</div>
        <div class="font-medium text-ink-900 mb-3 leading-relaxed">{{ q.text }}</div>
        <img v-if="q.image" :src="q.image" class="rounded-lg border border-ink-200 mb-3 max-h-60">
        <ul class="space-y-1.5 text-sm">
          <li v-for="o in q.options" :key="o.id" class="flex items-start gap-2.5 py-1">
            <span class="w-4 h-4 rounded-full grid place-items-center flex-shrink-0 mt-0.5"
                  :class="o.is_correct ? 'bg-emerald-500 text-white' : 'border border-ink-200'">
              <svg v-if="o.is_correct" class="w-2.5 h-2.5" viewBox="0 0 10 10" fill="none">
                <path d="M2 5L4 7L8 3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </span>
            <span :class="o.is_correct ? 'text-ink-900 font-medium' : 'text-ink-500'">{{ o.text }}</span>
          </li>
        </ul>
        <div v-if="q.explanation" class="mt-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm flex gap-2.5">
          <svg class="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.4"/>
            <path d="M8 5v3.5M8 10.5v.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
          </svg>
          <div>
            <div class="font-semibold text-amber-900 mb-0.5">{{ i18n.t({ uz: 'Izoh', kr: 'Изоҳ' }) }}</div>
            <div class="text-amber-800">{{ q.explanation }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
