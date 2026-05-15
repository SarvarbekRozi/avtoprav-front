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

function tileStyle(t: any) {
  if (t.is_locked)         return { bg: 'var(--surface-soft)', border: 'var(--surface-inset)', fg: 'var(--text-4)',  cursor: 'not-allowed' }
  if (!t.is_ready)         return { bg: 'var(--surface-soft)', border: 'var(--surface-inset)', fg: 'var(--text-muted)', cursor: 'not-allowed' }
  if (t.best_score >= 18)  return { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', fg: '#047857', cursor: 'pointer' }
  if (t.best_score >= 16)  return { bg: 'var(--surface)',       border: 'rgba(16,185,129,0.3)', fg: 'var(--text-1)', cursor: 'pointer' }
  if (t.attempts > 0)      return { bg: 'var(--surface)',       border: 'rgba(251,191,36,0.3)', fg: 'var(--text-1)', cursor: 'pointer' }
  return                          { bg: 'var(--surface)',       border: 'var(--border-1)',     fg: 'var(--text-1)', cursor: 'pointer' }
}

const counts = computed(() => ({
  all:        tickets.value.length,
  ready:      tickets.value.filter(t => t.is_ready && !t.is_locked).length,
  unfinished: tickets.value.filter(t => t.attempts === 0 && t.is_ready).length,
  mastered:   tickets.value.filter(t => t.best_score >= 18).length,
}))

const filters = computed(() => [
  { id: 'all',        label: i18n.t({ uz: 'Hammasi',    kr: 'Ҳаммаси' }),    count: counts.value.all },
  { id: 'unfinished', label: i18n.t({ uz: 'Ishlanmagan', kr: 'Ишланмаган' }), count: counts.value.unfinished },
  { id: 'ready',      label: i18n.t({ uz: 'Tayyor',      kr: 'Тайёр' }),     count: counts.value.ready },
  { id: 'mastered',   label: i18n.t({ uz: 'Mukammal',    kr: 'Мукаммал' }),  count: counts.value.mastered },
] as const)
</script>

<template>
  <div class="max-w-6xl mx-auto px-4 sm:px-6 py-10">
    <!-- Header -->
    <div class="mb-7">
      <div class="eyebrow">{{ i18n.t({ uz: 'Katalog', kr: 'Каталог' }) }}</div>
      <h1 class="text-3xl font-semibold tracking-tightest text-ink-900 mt-1.5">
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
        <span class="text-2xs px-1.5 py-0.5 rounded-md tabular-nums"
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
      <div class="text-ink-400 mb-2 flex justify-center"><AppIcon name="ticket" :size="40" /></div>
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
        class="relative aspect-square flex flex-col items-center justify-center border rounded-xl transition-all duration-150 hover:-translate-y-0.5"
        :style="{
          background: tileStyle(t).bg,
          borderColor: tileStyle(t).border,
          color: tileStyle(t).fg,
          cursor: tileStyle(t).cursor,
        }">
        <AppIcon v-if="t.is_locked" name="lock" :size="10" class="absolute top-1.5 right-1.5 text-ink-400" />
        <AppIcon v-else-if="t.best_score >= 18" name="star" :size="10" class="absolute top-1.5 right-1.5 text-amber-500" />
        <div class="text-xl font-semibold tracking-tightish">{{ t.number }}</div>
        <div v-if="t.best_score !== null" class="text-2xs mt-0.5 font-medium opacity-80 tabular-nums">{{ t.best_score }}/20</div>
        <div v-else class="text-2xs mt-0.5 opacity-60">{{ t.questions_count }} {{ i18n.t({ uz: 's.', kr: 'с.' }) }}</div>
      </component>
    </div>

    <!-- Legend -->
    <div class="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2 text-2xs text-ink-500">
      <span class="flex items-center gap-2">
        <span class="w-4 h-4 rounded-md" style="background: var(--surface); border: 1px solid var(--border-1);"></span>
        {{ i18n.t({ uz: 'Hali ishlanmagan',   kr: 'Ҳали ишланмаган' }) }}
      </span>
      <span class="flex items-center gap-2">
        <span class="w-4 h-4 rounded-md" style="background: rgba(251,191,36,0.15); border: 1px solid rgba(251,191,36,0.3);"></span>
        {{ i18n.t({ uz: 'Mashq qilingan',     kr: 'Машқ қилинган' }) }}
      </span>
      <span class="flex items-center gap-2">
        <span class="w-4 h-4 rounded-md" style="background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.3);"></span>
        {{ i18n.t({ uz: 'Mukammal · ≥18',     kr: 'Мукаммал · ≥18' }) }}
      </span>
      <span class="flex items-center gap-2">
        <span class="w-4 h-4 rounded-md" style="background: var(--surface-soft); border: 1px solid var(--border-1);"></span>
        {{ i18n.t({ uz: 'Yopiq · Premium',    kr: 'Ёпиқ · Премиум' }) }}
      </span>
    </div>

    <div v-if="filtered.length === 0 && tickets.length > 0" class="text-center py-12 text-ink-400 text-sm">
      {{ i18n.t({ uz: 'Filtrga mos bilet yo\'q', kr: 'Филтрга мос билет йўқ' }) }}
    </div>
  </div>
</template>
