<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const i18n = useI18n()
const auth = useAuthStore()
const goal = ref(auth.user?.daily_goal || 20)
const saving = ref(false)
const saved = ref(false)

async function saveGoal() {
  saving.value = true
  saved.value = false
  try {
    await apiFetch('/me/goal', { method: 'PATCH', body: { daily_goal: goal.value } })
    if (auth.user) auth.user.daily_goal = goal.value
    saved.value = true
    setTimeout(() => saved.value = false, 2000)
  } finally {
    saving.value = false
  }
}

const presets = [10, 15, 20, 30, 50]

const initials = computed(() => {
  const src = auth.user?.full_name || auth.user?.login || ''
  return src.split(/\s+/).filter(Boolean).slice(0, 2).map(s => s[0]?.toUpperCase()).join('') || '·'
})
</script>

<template>
  <div class="max-w-3xl mx-auto px-4 sm:px-6 py-10" v-if="auth.user">
    <div class="mb-8">
      <div class="eyebrow mb-2">{{ i18n.t({ uz: 'Sozlamalar', kr: 'Созламалар' }) }}</div>
      <h1 class="text-3xl font-semibold tracking-tightest text-ink-900">
        {{ i18n.t({ uz: 'Profil', kr: 'Профил' }) }}
      </h1>
    </div>

    <!-- Identity -->
    <div class="card p-6 mb-4">
      <div class="flex items-start gap-4">
        <div class="w-14 h-14 rounded-2xl bg-ink-900 text-white grid place-items-center text-lg font-semibold">
          {{ initials }}
        </div>
        <div class="flex-1 min-w-0">
          <div class="font-semibold text-ink-900 truncate">{{ auth.user.full_name || auth.user.login }}</div>
          <div class="text-sm text-ink-500 truncate">@{{ auth.user.login }}</div>
          <div v-if="auth.user.is_premium" class="badge-warn mt-2">
            <svg class="w-3 h-3" viewBox="0 0 12 12" fill="currentColor"><path d="M2 5l1.5-3 1.5 2h2l1.5-2L10 5l-1 5H3z"/></svg>
            Premium
          </div>
        </div>
      </div>

      <div class="divider my-5"></div>

      <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
        <div>
          <dt class="text-2xs uppercase tracking-wider text-ink-500 font-semibold">Login</dt>
          <dd class="text-ink-900 mt-0.5">{{ auth.user.login }}</dd>
        </div>
        <div v-if="auth.user.email">
          <dt class="text-2xs uppercase tracking-wider text-ink-500 font-semibold">Email</dt>
          <dd class="text-ink-900 mt-0.5">{{ auth.user.email }}</dd>
        </div>
        <div v-if="auth.user.full_name">
          <dt class="text-2xs uppercase tracking-wider text-ink-500 font-semibold">{{ i18n.t({ uz: 'F.I.Sh.', kr: 'Ф.И.Ш.' }) }}</dt>
          <dd class="text-ink-900 mt-0.5">{{ auth.user.full_name }}</dd>
        </div>
        <div v-if="auth.user.phone">
          <dt class="text-2xs uppercase tracking-wider text-ink-500 font-semibold">{{ i18n.t({ uz: 'Telefon', kr: 'Телефон' }) }}</dt>
          <dd class="text-ink-900 mt-0.5">{{ auth.user.phone }}</dd>
        </div>
      </dl>
    </div>

    <!-- Daily goal -->
    <div class="card p-6 mb-4">
      <div class="mb-1">
        <div class="text-base font-semibold text-ink-900">
          {{ i18n.t({ uz: 'Kunlik maqsad', kr: 'Кунлик мақсад' }) }}
        </div>
        <p class="text-sm text-ink-500 mt-1">
          {{ i18n.t({
            uz: 'Har kuni shu nechta savol yechganingizda kunlik maqsad bajariladi va seriya o\'sadi.',
            kr: 'Ҳар куни шу нечта савол ечганингизда кунлик мақсад бажарилади ва серия ўсади.'
          }) }}
        </p>
      </div>

      <div class="mt-4 flex flex-wrap gap-2">
        <button v-for="p in presets" :key="p" @click="goal = p"
          class="h-10 min-w-[3rem] px-3 rounded-lg text-sm font-semibold border transition-all"
          :class="goal === p
            ? 'bg-ink-900 text-white border-ink-900'
            : 'bg-white text-ink-700 border-ink-200 hover:border-ink-400'">
          {{ p }}
        </button>
      </div>

      <div class="mt-4 flex items-center gap-3">
        <input v-model.number="goal" type="number" min="5" max="100" class="input w-32" />
        <button @click="saveGoal" :disabled="saving" class="btn-primary">
          <span v-if="saving" class="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
          <span v-else>{{ i18n.t({ uz: 'Saqlash', kr: 'Сақлаш' }) }}</span>
        </button>
        <span v-if="saved" class="text-emerald-600 text-sm flex items-center gap-1">
          <svg class="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none"><path d="M2 7.5L5.5 11L12 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
          {{ i18n.t({ uz: 'Saqlandi', kr: 'Сақланди' }) }}
        </span>
      </div>
    </div>

    <!-- Streak card -->
    <StreakBadge />
  </div>
</template>
