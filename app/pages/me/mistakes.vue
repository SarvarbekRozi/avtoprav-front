<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const i18n = useI18n()
const route = useRoute()

// Statistikadagi "Eng ko'p xato" ro'yxatidan kelinganda shu savol birinchi
// chiqadi (backend ?focus bilan saralaydi) va ajratib ko'rsatiladi.
const focusId = computed(() => Number(route.query.focus) || null)

const { data } = await useAsyncData(
  () => `me-mistakes-${focusId.value ?? 'all'}`,
  () => apiFetch<any>('/me/mistakes', { query: focusId.value ? { focus: focusId.value } : undefined }),
  { watch: [focusId] },
)

function startMistakesTest() { return navigateTo('/test/start/mistakes') }

// Fokusdagi savolga aylantiramiz — ro'yxat uzun bo'lsa ko'rinmay qolmasin.
onMounted(() => {
  if (!focusId.value) return
  nextTick(() => {
    document.getElementById(`q-${focusId.value}`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  })
})
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 py-10">
    <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
      <div>
        <div class="eyebrow mb-2">{{ i18n.t({ uz: 'Sizning xatolar', kr: 'Сизнинг хатолар' }) }}</div>
        <h1 class="text-3xl font-semibold tracking-tightest text-ink-900">
          {{ i18n.t({ uz: 'Xato qilgan savollar', kr: 'Хато қилган саволлар' }) }}
        </h1>
      </div>
      <button v-if="data?.data?.length" @click="startMistakesTest" class="btn-primary self-start sm:self-auto">
        {{ i18n.t({ uz: 'Mashq qilishni boshlash', kr: 'Машқ қилишни бошлаш' }) }}
        <svg class="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none">
          <path d="M2.5 7h9M7 2.5L11.5 7 7 11.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>

    <!-- Empty -->
    <div v-if="!data?.data?.length" class="card p-12 text-center">
      <div class="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 grid place-items-center mx-auto mb-4">
        <svg class="w-5 h-5" viewBox="0 0 20 20" fill="none">
          <path d="M3 10.5L8 15.5L17 5.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <div class="font-semibold text-ink-900 mb-1">
        {{ i18n.t({ uz: 'Xatolar yo\'q', kr: 'Хатолар йўқ' }) }}
      </div>
      <p class="text-sm text-ink-500">
        {{ i18n.t({ uz: 'Hozircha xato qilingan savollar yo\'q. Test yechib boshlang.', kr: 'Ҳозирча хато қилинган саволлар йўқ. Тест ечиб бошланг.' }) }}
      </p>
    </div>

    <!-- List -->
    <div v-else class="space-y-3">
      <div v-for="q in data.data" :key="q.id" :id="`q-${q.id}`"
        class="card p-5 transition-shadow"
        :class="q.id === focusId ? 'ring-2 ring-brand-500 shadow-lift' : ''">
        <div class="flex items-start gap-4">
          <img v-if="q.image" :src="q.image" class="w-20 h-20 rounded-lg object-cover border border-ink-200 flex-shrink-0">
          <div class="flex-1 min-w-0">
            <div v-if="q.topic" class="text-2xs uppercase tracking-wider text-ink-500 font-semibold mb-1.5">
              {{ q.topic }}
            </div>
            <div class="text-ink-900 leading-relaxed">{{ q.text }}</div>
            <div class="mt-3 flex items-center gap-2 text-xs">
              <span class="badge-danger">
                {{ q.wrong_count }}× {{ i18n.t({ uz: 'xato', kr: 'хато' }) }}
              </span>
              <span class="text-ink-500">{{ q.last_wrong_at }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
