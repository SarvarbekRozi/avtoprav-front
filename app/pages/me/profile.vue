<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const i18n = useI18n()
const auth = useAuthStore()
const goal = ref(auth.user?.daily_goal || 20)
const goalSaving = ref(false)
const goalSaved = ref(false)
const examDate = ref(auth.user?.exam_date || '')
const examSaving = ref(false)
const examSaved = ref(false)

async function saveGoal() {
  goalSaving.value = true
  goalSaved.value = false
  try {
    await apiFetch('/me/goal', { method: 'PATCH', body: { daily_goal: goal.value } })
    if (auth.user) auth.user.daily_goal = goal.value
    goalSaved.value = true
    setTimeout(() => goalSaved.value = false, 2000)
  } finally {
    goalSaving.value = false
  }
}

async function saveExamDate() {
  examSaving.value = true
  examSaved.value = false
  try {
    await apiFetch('/me/exam-date', { method: 'PATCH', body: { exam_date: examDate.value || null } })
    await auth.fetchMe()
    examSaved.value = true
    setTimeout(() => examSaved.value = false, 2000)
  } finally {
    examSaving.value = false
  }
}

const presets = [10, 15, 20, 30, 50]

const initials = computed(() => {
  const src = auth.user?.full_name || auth.user?.login || ''
  return src.split(/\s+/).filter(Boolean).slice(0, 2).map(s => s[0]?.toUpperCase()).join('') || '·'
})

const examDaysLeft = computed(() => auth.user?.exam_days_left ?? null)

const minExamDate = computed(() => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
})

const examWeeks = computed(() => examDaysLeft.value ? Math.floor(examDaysLeft.value / 7) : 0)
const examHours = computed(() => examDaysLeft.value ? examDaysLeft.value * 24 : 0)
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 sm:px-6 py-10" v-if="auth.user">
    <!-- Hero -->
    <div class="card p-6 mb-5 relative overflow-hidden">
      <div aria-hidden="true" class="pointer-events-none absolute -right-20 -top-20 w-72 h-72 rounded-full blur-3xl" style="background: rgba(63,88,148,0.18);"></div>
      <div class="relative flex flex-col sm:flex-row items-start sm:items-center gap-5">
        <div class="w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-2xl bg-ink-900 text-white grid place-items-center text-2xl font-semibold flex-shrink-0">
          {{ initials }}
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex flex-wrap items-center gap-2">
            <h1 class="text-2xl font-semibold tracking-tightish text-ink-900">
              {{ auth.user.full_name || auth.user.login }}
            </h1>
            <span v-if="auth.user.is_premium" class="badge-warn">
              <AppIcon name="spark" :size="10" /> Premium
            </span>
          </div>
          <div class="text-sm text-ink-500 mt-1">
            <span v-if="auth.user.email">{{ auth.user.email }} · </span>
            @{{ auth.user.login }}
          </div>
          <div class="flex flex-wrap items-center gap-2 mt-3">
            <span class="inline-flex items-center gap-1.5 px-2.5 h-7 rounded-lg bg-amber-50 text-amber-700 text-sm font-semibold tabular-nums">
              <AppIcon name="spark" :size="12" /> {{ (auth.user.points ?? 0).toLocaleString() }} {{ i18n.t({ uz: 'ball', kr: 'балл' }) }}
            </span>
            <span class="inline-flex items-center gap-1.5 px-2.5 h-7 rounded-lg bg-orange-50 text-orange-700 text-sm font-semibold tabular-nums">
              <AppIcon name="flame" :size="12" /> {{ auth.user.streak_current ?? 0 }} {{ i18n.t({ uz: 'kun', kr: 'кун' }) }}
            </span>
          </div>
        </div>
        <NuxtLink to="/pricing" v-if="!auth.user.is_premium" class="btn-outline">
          <AppIcon name="spark" :size="14" />
          {{ i18n.t({ uz: 'Premium olish', kr: 'Премиум олиш' }) }}
        </NuxtLink>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
      <!-- Left col: settings -->
      <div class="lg:col-span-7 space-y-5">
        <!-- Exam date -->
        <div class="card p-6">
          <div class="flex items-center gap-2 mb-1">
            <div class="text-base font-semibold text-ink-900">
              {{ i18n.t({ uz: 'Imtihon sanasi', kr: 'Имтиҳон санаси' }) }}
            </div>
            <span v-if="examDaysLeft !== null && examDaysLeft > 0" class="badge-info tabular-nums">
              {{ examDaysLeft }} {{ i18n.t({ uz: 'kun', kr: 'кун' }) }}
            </span>
          </div>
          <p class="text-sm text-ink-500 mb-4">
            {{ i18n.t({
              uz: 'Bosh sahifada hisoblagich ko\'rinadi va sizga ko\'proq motivatsiya beradi.',
              kr: 'Бош саҳифада ҳисоблагич кўринади ва сизга кўпроқ мотивация беради.'
            }) }}
          </p>
          <div class="flex flex-wrap items-center gap-3">
            <input v-model="examDate" type="date" :min="minExamDate" class="input w-auto" />
            <button @click="saveExamDate" :disabled="examSaving" class="btn-primary">
              <span v-if="examSaving" class="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              <span v-else>{{ i18n.t({ uz: 'Saqlash', kr: 'Сақлаш' }) }}</span>
            </button>
            <span v-if="examSaved" class="text-emerald-600 text-sm flex items-center gap-1">
              <AppIcon name="check" :size="14" /> {{ i18n.t({ uz: 'Saqlandi', kr: 'Сақланди' }) }}
            </span>
          </div>
        </div>

        <!-- Daily goal -->
        <div class="card p-6">
          <div class="mb-1 text-base font-semibold text-ink-900">
            {{ i18n.t({ uz: 'Kunlik maqsad', kr: 'Кунлик мақсад' }) }}
          </div>
          <p class="text-sm text-ink-500 mb-4">
            {{ i18n.t({
              uz: 'Har kuni shu nechta savol yechganingizda kunlik maqsad bajariladi va seriya o\'sadi.',
              kr: 'Ҳар куни шу нечта савол ечганингизда кунлик мақсад бажарилади ва серия ўсади.'
            }) }}
          </p>

          <div class="flex flex-wrap gap-2 mb-4">
            <button v-for="p in presets" :key="p" @click="goal = p"
              class="h-10 min-w-[3rem] px-3 rounded-lg text-sm font-semibold border transition-all"
              :class="goal === p
                ? 'bg-ink-900 text-white border-ink-900'
                : 'bg-white text-ink-700 border-ink-200 hover:border-ink-400'">
              {{ p }}
            </button>
          </div>

          <div class="flex items-center gap-3">
            <input v-model.number="goal" type="number" min="5" max="100" class="input w-32" />
            <button @click="saveGoal" :disabled="goalSaving" class="btn-primary">
              <span v-if="goalSaving" class="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              <span v-else>{{ i18n.t({ uz: 'Saqlash', kr: 'Сақлаш' }) }}</span>
            </button>
            <span v-if="goalSaved" class="text-emerald-600 text-sm flex items-center gap-1">
              <AppIcon name="check" :size="14" /> {{ i18n.t({ uz: 'Saqlandi', kr: 'Сақланди' }) }}
            </span>
          </div>
        </div>

        <!-- Account details -->
        <div class="card">
          <div class="px-5 py-4 border-b border-ink-200/70">
            <div class="text-sm font-semibold text-ink-900">{{ i18n.t({ uz: 'Hisob ma\'lumotlari', kr: 'Ҳисоб маълумотлари' }) }}</div>
          </div>
          <div class="divide-y divide-ink-200/70">
            <div class="px-5 py-3.5 flex items-center gap-3">
              <span class="w-9 h-9 rounded-lg grid place-items-center flex-shrink-0 bg-ink-100 text-ink-700">
                <AppIcon name="user" :size="16" />
              </span>
              <div class="flex-1 min-w-0">
                <div class="text-sm font-medium text-ink-900">Login</div>
                <div class="text-2xs mt-0.5 text-ink-500">{{ auth.user.login }}</div>
              </div>
            </div>
            <div v-if="auth.user.email" class="px-5 py-3.5 flex items-center gap-3">
              <span class="w-9 h-9 rounded-lg grid place-items-center flex-shrink-0 bg-ink-100 text-ink-700">
                <AppIcon name="bell" :size="16" />
              </span>
              <div class="flex-1 min-w-0">
                <div class="text-sm font-medium text-ink-900">Email</div>
                <div class="text-2xs mt-0.5 text-ink-500">{{ auth.user.email }}</div>
              </div>
            </div>
            <div v-if="auth.user.phone" class="px-5 py-3.5 flex items-center gap-3">
              <span class="w-9 h-9 rounded-lg grid place-items-center flex-shrink-0 bg-ink-100 text-ink-700">
                <AppIcon name="card" :size="16" />
              </span>
              <div class="flex-1 min-w-0">
                <div class="text-sm font-medium text-ink-900">{{ i18n.t({ uz: 'Telefon', kr: 'Телефон' }) }}</div>
                <div class="text-2xs mt-0.5 text-ink-500">{{ auth.user.phone }}</div>
              </div>
            </div>
            <div class="px-5 py-3.5 flex items-center gap-3">
              <span class="w-9 h-9 rounded-lg grid place-items-center flex-shrink-0 bg-ink-100 text-ink-700">
                <AppIcon name="globe" :size="16" />
              </span>
              <div class="flex-1 min-w-0">
                <div class="text-sm font-medium text-ink-900">{{ i18n.t({ uz: 'Til', kr: 'Тил' }) }}</div>
                <div class="text-2xs mt-0.5 text-ink-500">
                  {{ auth.user.locale === 'uz_cyrl' ? i18n.t({ uz: 'Kirill', kr: 'Кирилл' }) : 'Lotin' }} · {{ i18n.t({ uz: 'O\'zbekcha', kr: 'Ўзбекча' }) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right col: countdown + streak + achievements -->
      <div class="lg:col-span-5 space-y-5">
        <!-- Countdown -->
        <div v-if="examDaysLeft !== null" class="card p-5">
          <div class="flex items-center justify-between mb-3">
            <div class="text-sm font-semibold text-ink-900">
              {{ i18n.t({ uz: 'Imtihongacha qoldi', kr: 'Имтиҳонгача қолди' }) }}
            </div>
            <span class="badge-warn tabular-nums">{{ auth.user.exam_date }}</span>
          </div>
          <div class="flex items-baseline gap-2">
            <span class="text-5xl font-semibold tracking-tightest tabular-nums"
                  :class="examDaysLeft <= 7 ? 'text-rose-600' : 'text-ink-900'">{{ examDaysLeft }}</span>
            <span class="text-base text-ink-500">{{ i18n.t({ uz: 'kun', kr: 'кун' }) }}</span>
          </div>
          <div class="mt-4 grid grid-cols-3 gap-2 text-2xs">
            <div class="rounded-xl p-3 text-center bg-ink-50 text-ink-700">
              <div class="text-xl font-semibold tabular-nums tracking-tight">{{ examWeeks }}</div>
              <div class="text-2xs opacity-70 mt-0.5">{{ i18n.t({ uz: 'hafta', kr: 'ҳафта' }) }}</div>
            </div>
            <div class="rounded-xl p-3 text-center bg-ink-900 text-white">
              <div class="text-xl font-semibold tabular-nums tracking-tight">{{ examDaysLeft }}</div>
              <div class="text-2xs opacity-70 mt-0.5">{{ i18n.t({ uz: 'kun', kr: 'кун' }) }}</div>
            </div>
            <div class="rounded-xl p-3 text-center bg-ink-50 text-ink-700">
              <div class="text-xl font-semibold tabular-nums tracking-tight">{{ examHours }}</div>
              <div class="text-2xs opacity-70 mt-0.5">{{ i18n.t({ uz: 'soat', kr: 'соат' }) }}</div>
            </div>
          </div>
        </div>

        <StreakBadge />
      </div>
    </div>

    <!-- Achievements (full width below) -->
    <div class="mt-5">
      <AchievementsCard />
    </div>
  </div>
</template>
