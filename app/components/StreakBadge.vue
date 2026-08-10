<script setup lang="ts">
const props = defineProps<{ compact?: boolean }>()
const i18n = useI18n()
const auth = useAuthStore()

const { data: streak, refresh } = await useAsyncData('streak-badge', async () => {
  if (!auth.token) return null
  try { return await apiFetch<any>('/me/streak') } catch { return null }
}, { server: false, default: () => null })

defineExpose({ refresh })

// Sunday=0 ... Saturday=6
const WEEKDAY_LATN = ['Yak', 'Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh']
const WEEKDAY_CYRL = ['Як',  'Ду', 'Се', 'Чо', 'Па', 'Жу', 'Ша']
const MONTH_LATN = ['yan','fev','mar','apr','may','iyn','iyl','avg','sen','okt','noy','dek']
const MONTH_CYRL = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек']

function todayISO() {
  // local date YYYY-MM-DD (without timezone shift)
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function parseDate(s: string) {
  // server returns "YYYY-MM-DD" — parse as local
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

const days = computed(() => {
  if (!streak.value?.week) return []
  const today = todayISO()
  return streak.value.week.map((d: any) => {
    const dt = parseDate(d.date)
    const isToday = d.date === today
    const dow = dt.getDay()
    const label = i18n.locale.value === 'uz_cyrl' ? WEEKDAY_CYRL[dow] : WEEKDAY_LATN[dow]
    return {
      date: d.date,
      dayOfMonth: dt.getDate(),
      weekday: label,
      questions: d.questions ?? 0,
      reached: !!d.reached,
      isToday,
      dt,
    }
  })
})

const todayLabel = computed(() => {
  const d = new Date()
  const dow = d.getDay()
  const month = i18n.locale.value === 'uz_cyrl' ? MONTH_CYRL[d.getMonth()] : MONTH_LATN[d.getMonth()]
  const wd = i18n.locale.value === 'uz_cyrl' ? WEEKDAY_CYRL[dow] : WEEKDAY_LATN[dow]
  return `${d.getDate()} ${month} · ${wd}`
})

const motivational = computed(() => {
  if (!streak.value) return ''
  if (streak.value.today_reached) {
    return i18n.t({ uz: 'Bugungi maqsad bajarildi. Ajoyib!', kr: 'Бугунги мақсад бажарилди. Ажойиб!' })
  }
  const cur = streak.value.current ?? 0
  const remaining = Math.max(0, (streak.value.today_goal ?? 0) - (streak.value.today_progress ?? 0))
  if (cur === 0) {
    return i18n.t({ uz: `Bugun ${remaining} ta savol — seriyani boshlang.`, kr: `Бугун ${remaining} та савол — серияни бошланг.` })
  }
  if (remaining > 0) {
    return i18n.t({
      uz: `Seriyani saqlash uchun yana ${remaining} ta savol.`,
      kr: `Серияни сақлаш учун яна ${remaining} та савол.`,
    })
  }
  return ''
})

function dayTooltip(d: any) {
  if (d.reached) return `${d.date} · ${i18n.t({ uz: 'Maqsad bajarildi', kr: 'Мақсад бажарилди' })}`
  if (d.questions > 0) return `${d.date} · ${d.questions} ${i18n.t({ uz: 'savol', kr: 'савол' })}`
  return `${d.date} · ${i18n.t({ uz: 'Bo\'sh kun', kr: 'Бўш кун' })}`
}
</script>

<template>
  <div v-if="streak && !props.compact" class="card relative overflow-hidden">
    <!-- Full card. Izohlar shablon ILDIZIDA turmasin — ildiz fragmentga
         aylanib, SSR/klient hidratsiyasi mos kelmay qoladi. -->
    <!-- ambient glow -->
    <div aria-hidden="true" class="pointer-events-none absolute -right-24 -top-24 w-64 h-64 rounded-full bg-amber-200/40 blur-3xl"></div>
    <div aria-hidden="true" class="pointer-events-none absolute -left-16 -bottom-20 w-56 h-56 rounded-full bg-emerald-100/40 blur-3xl"></div>

    <!-- Top: flame + streak -->
    <div class="relative px-5 sm:px-6 pt-5 sm:pt-6 pb-5 flex items-center gap-5">
      <!-- Flame icon (active vs inactive) -->
      <div class="relative flex-shrink-0">
        <div class="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl grid place-items-center transition-all"
             :class="streak.current > 0
               ? 'bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 shadow-lift'
               : 'bg-ink-100'">
          <AppIcon name="flame" :size="40"
                   :class="streak.current > 0 ? 'text-white drop-shadow' : 'text-ink-400'" />
        </div>
        <!-- small ping for active -->
        <span v-if="streak.current > 0" class="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white">
          <span class="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-60"></span>
        </span>
      </div>

      <div class="flex-1 min-w-0">
        <div class="flex items-baseline gap-2">
          <span class="text-4xl sm:text-5xl font-semibold tracking-tightest tabular-nums"
                :class="streak.current > 0 ? 'text-ink-900' : 'text-ink-400'">{{ streak.current }}</span>
          <span class="text-sm sm:text-base font-medium text-ink-600">
            {{ i18n.t({ uz: streak.current === 1 ? 'kunlik seriya' : 'kunlik seriya', kr: 'кунлик серия' }) }}
          </span>
        </div>
        <div class="text-xs text-ink-500 mt-1 flex items-center gap-2 flex-wrap">
          <span>{{ todayLabel }}</span>
          <span class="text-ink-300">·</span>
          <span class="flex items-center gap-1">
            <AppIcon name="trophy" :size="12" class="text-ink-400" />
            {{ i18n.t({ uz: 'Rekord:', kr: 'Рекорд:' }) }} <b class="text-ink-700">{{ streak.longest }}</b>
          </span>
        </div>
        <div v-if="motivational" class="text-sm mt-2 font-medium"
             :class="streak.today_reached ? 'text-emerald-700' : 'text-ink-700'">
          {{ motivational }}
        </div>
      </div>
    </div>

    <div class="relative h-px bg-ink-200/60 mx-5 sm:mx-6"></div>

    <!-- Middle: daily goal -->
    <div class="relative px-5 sm:px-6 py-5">
      <div class="flex items-center justify-between mb-3 gap-3">
        <div class="text-sm font-semibold text-ink-900">
          {{ i18n.t({ uz: 'Bugungi maqsad', kr: 'Бугунги мақсад' }) }}
        </div>
        <div class="flex items-center gap-2">
          <span class="text-sm tabular-nums">
            <b class="text-ink-900">{{ streak.today_progress }}</b>
            <span class="text-ink-400">/ {{ streak.today_goal }}</span>
          </span>
          <span v-if="streak.today_reached" class="badge-success">
            <AppIcon name="check" :size="12" />
            {{ i18n.t({ uz: 'Bajarildi', kr: 'Бажарилди' }) }}
          </span>
        </div>
      </div>

      <div class="relative h-2.5 bg-ink-100 rounded-full overflow-hidden">
        <div class="absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out"
             :class="streak.today_reached
               ? 'bg-gradient-to-r from-emerald-400 to-emerald-600'
               : 'bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500'"
             :style="{ width: Math.max(2, Math.min(100, streak.percent)) + '%' }">
        </div>
      </div>
    </div>

    <div class="relative h-px bg-ink-200/60 mx-5 sm:mx-6"></div>

    <!-- Bottom: week strip with real dates -->
    <div class="relative px-5 sm:px-6 py-5">
      <div class="flex items-center justify-between mb-3">
        <div class="text-2xs uppercase tracking-wider text-ink-500 font-semibold">
          {{ i18n.t({ uz: 'So\'nggi 7 kun', kr: 'Сўнгги 7 кун' }) }}
        </div>
        <div class="text-2xs text-ink-400 hidden sm:block">
          {{ i18n.t({ uz: 'Bugun belgilangan', kr: 'Бугун белгиланган' }) }}
        </div>
      </div>

      <div class="grid grid-cols-7 gap-1.5 sm:gap-2">
        <div v-for="d in days" :key="d.date" :title="dayTooltip(d)"
             class="relative flex flex-col items-center gap-1.5 group">
          <!-- weekday -->
          <div class="text-2xs font-medium"
               :class="d.isToday ? 'text-ink-900' : 'text-ink-400'">{{ d.weekday }}</div>

          <!-- tile -->
          <div class="relative aspect-square w-full rounded-xl flex items-center justify-center transition-all duration-200 group-hover:scale-105"
               :class="[
                 d.reached
                   ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-soft'
                   : d.questions > 0
                     ? 'bg-gradient-to-br from-amber-50 to-amber-100 text-amber-800 border border-amber-200'
                     : 'bg-white text-ink-300 border border-ink-200/70',
                 d.isToday ? 'ring-2 ring-ink-900 ring-offset-2 ring-offset-white' : '',
               ]">
            <AppIcon v-if="d.reached" name="check" :size="17" />
            <span v-else-if="d.questions > 0" class="text-xs font-semibold tabular-nums">{{ d.questions }}</span>
            <span v-else class="text-xs text-ink-300">·</span>
          </div>

          <!-- day-of-month -->
          <div class="text-2xs tabular-nums"
               :class="d.isToday ? 'text-ink-900 font-semibold' : 'text-ink-400'">{{ d.dayOfMonth }}</div>
        </div>
      </div>
    </div>
  </div>

  <div v-else-if="streak && props.compact && streak.current > 0"
       class="hidden sm:flex items-center gap-1.5 h-8 px-2.5 rounded-full
              bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200
              shadow-soft text-sm">
    <!-- Compact (header chip) -->
    <AppIcon name="flame" :size="14" class="text-amber-600" />
    <span class="font-semibold text-amber-800 tabular-nums">{{ streak.current }}</span>
  </div>
</template>
