<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const i18n = useI18n()
const { data: ticketsRes, pending } = await useAsyncData('tickets', () => apiFetch<{ data: any[] }>('/tickets'))
const tickets = computed(() => ticketsRes.value?.data || [])

const filter = ref<'all' | 'ready' | 'unfinished' | 'mastered'>('all')

const filtered = computed(() => {
  if (filter.value === 'ready')      return tickets.value.filter(t => t.is_ready && !t.is_locked)
  if (filter.value === 'unfinished') return tickets.value.filter(t => t.attempts === 0 && t.is_ready)
  if (filter.value === 'mastered')   return tickets.value.filter(t => t.best_score >= 18)
  return tickets.value
})

function tileClass(t: any) {
  if (t.is_locked)         return 'bg-ink-50 text-ink-400 border-ink-200 cursor-not-allowed'
  if (!t.is_ready)         return 'bg-ink-50 text-ink-300 border-ink-200 cursor-not-allowed'
  if (t.best_score >= 18)  return 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:border-emerald-400 hover:bg-emerald-100'
  if (t.best_score >= 16)  return 'bg-white text-ink-900 border-emerald-200 hover:border-emerald-400'
  if (t.attempts > 0)      return 'bg-white text-ink-900 border-amber-200 hover:border-amber-400'
  return 'bg-white text-ink-900 border-ink-200 hover:border-ink-400'
}

const counts = computed(() => ({
  all:        tickets.value.length,
  ready:      tickets.value.filter(t => t.is_ready && !t.is_locked).length,
  unfinished: tickets.value.filter(t => t.attempts === 0 && t.is_ready).length,
  mastered:   tickets.value.filter(t => t.best_score >= 18).length,
}))

const filters = computed(() => [
  { id: 'all',        label: i18n.t({ uz: 'Hammasi',    kr: 'Ҳаммаси' }),       count: counts.value.all },
  { id: 'unfinished', label: i18n.t({ uz: 'Ishlanmagan', kr: 'Ишланмаган' }),    count: counts.value.unfinished },
  { id: 'ready',      label: i18n.t({ uz: 'Tayyor',      kr: 'Тайёр' }),         count: counts.value.ready },
  { id: 'mastered',   label: i18n.t({ uz: 'Mukammal',    kr: 'Мукаммал' }),      count: counts.value.mastered },
] as const)
</script>

<template>
  <div class="max-w-6xl mx-auto px-4 sm:px-6 py-10">
    <!-- Header -->
    <div class="mb-8">
      <div class="eyebrow mb-2">{{ i18n.t({ uz: 'Katalog', kr: 'Каталог' }) }}</div>
      <h1 class="text-3xl font-semibold tracking-tightest text-ink-900">
        {{ i18n.t({ uz: 'Rasmiy biletlar', kr: 'Расмий билетлар' }) }}
      </h1>
      <p class="text-ink-500 mt-2 max-w-2xl">
        {{ i18n.t({
          uz: 'Har bir bilet 20 ta savoldan iborat. Imtihondan o\'tish uchun 18 ta to\'g\'ri javob kerak.',
          kr: 'Ҳар бир билет 20 та саволдан иборат. Имтиҳондан ўтиш учун 18 та тўғри жавоб керак.'
        }) }}
      </p>
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap items-center gap-1 mb-6 p-1 bg-ink-100 rounded-xl w-fit">
      <button v-for="f in filters" :key="f.id"
        @click="filter = f.id as any"
        class="px-3.5 h-9 inline-flex items-center gap-2 rounded-lg text-sm font-medium transition-all"
        :class="filter === f.id ? 'bg-white text-ink-900 shadow-soft' : 'text-ink-600 hover:text-ink-900'">
        {{ f.label }}
        <span class="text-2xs px-1.5 py-0.5 rounded-md"
              :class="filter === f.id ? 'bg-ink-100 text-ink-600' : 'bg-white/60 text-ink-500'">
          {{ f.count }}
        </span>
      </button>
    </div>

    <!-- Loading -->
    <div v-if="pending" class="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2 sm:gap-3">
      <div v-for="i in 30" :key="i" class="aspect-square rounded-xl bg-ink-100 animate-pulse"></div>
    </div>

    <!-- Empty -->
    <div v-else-if="tickets.length === 0" class="card p-12 text-center">
      <div class="text-ink-400 mb-2">
        <svg class="w-10 h-10 mx-auto" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="6" width="18" height="12" rx="2" stroke="currentColor" stroke-width="1.5"/>
          <path d="M3 10h18" stroke="currentColor" stroke-width="1.5"/>
        </svg>
      </div>
      <p class="text-ink-600">{{ i18n.t({
        uz: 'Hozircha biletlar mavjud emas.',
        kr: 'Ҳозирча билетлар мавжуд эмас.'
      }) }}</p>
    </div>

    <!-- Grid -->
    <div v-else class="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2 sm:gap-3">
      <component v-for="t in filtered" :key="t.id"
        :is="(t.is_locked || !t.is_ready) ? 'div' : 'NuxtLink'"
        :to="(t.is_locked || !t.is_ready) ? undefined : `/test/start/ticket?ticket_id=${t.id}`"
        :class="tileClass(t)"
        class="relative aspect-square flex flex-col items-center justify-center border rounded-xl transition-all duration-150 group">
        <span v-if="t.is_locked" class="absolute top-1.5 right-1.5 text-2xs">
          <svg class="w-3 h-3" viewBox="0 0 12 12" fill="currentColor"><path d="M6 1.5a2.25 2.25 0 0 0-2.25 2.25v1.5h-.375A.875.875 0 0 0 2.5 6.125v3.75c0 .483.392.875.875.875h5.25a.875.875 0 0 0 .875-.875v-3.75a.875.875 0 0 0-.875-.875H8.25v-1.5A2.25 2.25 0 0 0 6 1.5Zm-1.25 3.75v-1.5a1.25 1.25 0 0 1 2.5 0v1.5h-2.5Z"/></svg>
        </span>
        <span v-else-if="t.best_score >= 18" class="absolute top-1.5 right-1.5 text-emerald-500">
          <svg class="w-3 h-3" viewBox="0 0 12 12" fill="currentColor"><path d="M6 1l1.545 3.13L11 4.635l-2.5 2.435.59 3.43L6 8.88 2.91 10.5l.59-3.43L1 4.635l3.455-.505L6 1z"/></svg>
        </span>
        <div class="text-xl sm:text-2xl font-semibold tracking-tightish">{{ t.number }}</div>
        <div v-if="t.best_score !== null" class="text-2xs mt-0.5 font-medium opacity-80">{{ t.best_score }}/20</div>
        <div v-else class="text-2xs mt-0.5 opacity-60">{{ t.questions_count }}{{ i18n.t({ uz: ' s.', kr: ' с.' }) }}</div>
      </component>
    </div>

    <div v-if="filtered.length === 0 && tickets.length > 0" class="text-center py-12 text-ink-400 text-sm">
      {{ i18n.t({ uz: 'Filtrga mos bilet yo\'q', kr: 'Филтрга мос билет йўқ' }) }}
    </div>
  </div>
</template>
