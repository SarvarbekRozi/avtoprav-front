<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const route = useRoute()
const i18n = useI18n()
const attemptId = Number(route.params.attemptId)

const { data } = await useAsyncData(`result-${attemptId}`, () => apiFetch<any>(`/test/${attemptId}/result`))
const showAll = ref(false)

const a = computed(() => data.value?.attempt)
const answers = computed(() => data.value?.answers || [])
const wrongAnswers = computed(() => answers.value.filter((x: any) => !x.is_correct))
const firstWrong = computed(() => wrongAnswers.value[0])

// AI instructor explanation (generated + cached on first request)
const explaining = ref<Record<number, boolean>>({})
const explainErr = ref<Record<number, string>>({})
async function explain(q: any) {
  if (explaining.value[q.id]) return
  explaining.value[q.id] = true
  explainErr.value[q.id] = ''
  try {
    const r = await apiFetch<{ explanation_uz: string, explanation_kr: string }>(`/questions/${q.id}/explain`, { method: 'POST' })
    q.explanation_uz = r.explanation_uz
    q.explanation_kr = r.explanation_kr
  }
  catch (e: any) {
    explainErr.value[q.id] = e?.data?.message || i18n.t({ uz: 'Xatolik yuz berdi', kr: 'Хатолик юз берди' })
  }
  finally {
    explaining.value[q.id] = false
  }
}

function fmtTime(sec: number) {
  const m = Math.floor(sec / 60), s = sec % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}
function fmtTimeWord(sec: number) {
  const m = Math.floor(sec / 60), s = sec % 60
  return `${m} ${i18n.t({ uz: 'daq', kr: 'дақ' })} ${s} ${i18n.t({ uz: 'son', kr: 'сон' })}`
}

const passed = computed(() => a.value?.is_passed)
const percent = computed(() => {
  if (!a.value || a.value.total_questions === 0) return 0
  return Math.round((a.value.correct_count / a.value.total_questions) * 100)
})

const modeLabels: Record<string, { uz: string, kr: string }> = {
  exam:     { uz: 'Imtihon rejimi',     kr: 'Имтиҳон режими' },
  topic:    { uz: 'Mavzu',               kr: 'Мавзу' },
  ticket:   { uz: 'Bilet',               kr: 'Билет' },
  random:   { uz: 'Tasodifiy',           kr: 'Тасодифий' },
  mistakes: { uz: 'Xatolar ustida ish', kr: 'Хатолар устида иш' },
  marathon: { uz: 'Marafon',             kr: 'Марафон' },
  memorize: { uz: 'Yodlash',             kr: 'Ёдлаш' },
  daily:    { uz: 'Kunlik challenge',    kr: 'Кунлик челлендж' },
  blitz:    { uz: 'Blits · 60 soniya',   kr: 'Блиц · 60 сония' },
}
const modeLabel = computed(() => a.value ? i18n.t(modeLabels[a.value.mode] ?? { uz: a.value.mode, kr: a.value.mode }) : '')

const retakeLink = computed(() => {
  if (!a.value) return '/'
  const base = `/test/start/${a.value.mode}`
  if (a.value.mode === 'topic' && a.value.topic_id) return `${base}?topic_id=${a.value.topic_id}`
  if (a.value.mode === 'ticket' && a.value.ticket_id) return `${base}?ticket_id=${a.value.ticket_id}`
  return base
})

function chosenLetter(ans: any) {
  if (!ans.chosen_option_id) return null
  const idx = ans.question.options.findIndex((o: any) => o.id === ans.chosen_option_id)
  return idx >= 0 ? String.fromCharCode(65 + idx) : null
}
function correctLetter(ans: any) {
  const idx = ans.question.options.findIndex((o: any) => o.is_correct)
  return idx >= 0 ? String.fromCharCode(65 + idx) : null
}
function correctText(ans: any) {
  return ans.question.options.find((o: any) => o.is_correct)?.text || ''
}
function chosenText(ans: any) {
  return ans.question.options.find((o: any) => o.id === ans.chosen_option_id)?.text || i18n.t({ uz: 'O\'tkazib yuborilgan', kr: 'Ўтказиб юборилган' })
}

const avgTime = computed(() => {
  if (!a.value || a.value.total_questions === 0) return 0
  return Math.round(a.value.time_spent_sec / a.value.total_questions)
})

function gradeLabel(p: number) {
  if (p >= 95) return i18n.t({ uz: 'A\'lo', kr: 'Аъло' })
  if (p >= 85) return i18n.t({ uz: 'Yaxshi', kr: 'Яхши' })
  if (p >= 70) return i18n.t({ uz: 'O\'rtacha', kr: 'Ўртача' })
  return i18n.t({ uz: 'Past', kr: 'Паст' })
}

const pointsEarned = computed(() => a.value?.points_earned ?? 0)

// Achievements unlocked by this attempt (handed over from the play page)
const newAchievements = ref<any[]>([])
onMounted(() => {
  try {
    const raw = sessionStorage.getItem('testRewards:' + attemptId)
    if (raw) {
      newAchievements.value = JSON.parse(raw)
      sessionStorage.removeItem('testRewards:' + attemptId)
    }
  } catch {}
  // Refresh points + daily free-test allowance shown on the home page
  useAuthStore().fetchMe().catch(() => {})
})
</script>

<template>
  <div class="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10" v-if="a">
    <!-- Result summary: hero + stats in one compact card -->
    <div class="card overflow-hidden mb-6">
      <div class="px-5 pt-5 pb-4 text-center">
        <div class="inline-flex items-center gap-1.5 px-2.5 h-6 rounded-full text-2xs font-semibold uppercase tracking-wider"
             :class="passed ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'">
          <AppIcon :name="passed ? 'check' : 'x'" :size="11" />
          {{ passed ? i18n.t({ uz: 'Muvaffaqiyatli', kr: 'Муваффақиятли' }) : i18n.t({ uz: 'O\'tilmadi', kr: 'Ўтилмади' }) }}
        </div>
        <div class="text-3xl sm:text-4xl font-semibold tracking-tightest mt-2.5 text-ink-900 tabular-nums">
          {{ a.correct_count }} <span class="text-ink-300">/ {{ a.total_questions }}</span>
        </div>
        <div class="mt-1 text-sm text-ink-500">
          {{ modeLabel }} · {{ fmtTimeWord(a.time_spent_sec) }} · {{ percent }}%
        </div>
        <div v-if="pointsEarned > 0" class="mt-2 inline-flex items-center gap-1 px-2.5 h-6 rounded-full bg-amber-100 text-amber-700 font-semibold text-xs">
          <AppIcon name="spark" :size="12" /> +{{ pointsEarned }} {{ i18n.t({ uz: 'ball', kr: 'балл' }) }}
        </div>
      </div>
      <!-- Compact stat strip -->
      <div class="grid grid-cols-4 border-t" style="border-color: var(--divider);">
        <div class="py-3 text-center">
          <div class="text-2xs uppercase tracking-wider" style="color: var(--text-4);">{{ i18n.t({ uz: 'To\'g\'ri', kr: 'Тўғри' }) }}</div>
          <div class="text-lg font-bold tabular-nums text-emerald-700 mt-0.5">{{ a.correct_count }}</div>
        </div>
        <div class="py-3 text-center border-l" style="border-color: var(--divider);">
          <div class="text-2xs uppercase tracking-wider" style="color: var(--text-4);">{{ i18n.t({ uz: 'Xato', kr: 'Хато' }) }}</div>
          <div class="text-lg font-bold tabular-nums text-rose-700 mt-0.5">{{ a.wrong_count }}</div>
        </div>
        <div class="py-3 text-center border-l" style="border-color: var(--divider);">
          <div class="text-2xs uppercase tracking-wider" style="color: var(--text-4);">{{ i18n.t({ uz: 'Vaqt', kr: 'Вақт' }) }}</div>
          <div class="text-lg font-bold tabular-nums text-ink-900 mt-0.5">{{ avgTime }}<span class="text-2xs font-medium" style="color: var(--text-4);">s</span></div>
        </div>
        <div class="py-3 text-center border-l" style="border-color: var(--divider);">
          <div class="text-2xs uppercase tracking-wider" style="color: var(--text-4);">{{ i18n.t({ uz: 'Daraja', kr: 'Даража' }) }}</div>
          <div class="text-base sm:text-lg font-bold text-ink-900 mt-0.5 leading-tight">{{ gradeLabel(percent) }}</div>
        </div>
      </div>
    </div>

    <!-- Newly unlocked achievements -->
    <div v-if="newAchievements.length" class="card p-5 mb-6"
         style="background: rgba(251,191,36,0.08); border-color: rgba(251,191,36,0.35);">
      <div class="text-sm font-semibold mb-3 flex items-center gap-2 text-amber-700">
        <AppIcon name="trophy" :size="16" />
        {{ i18n.t({ uz: 'Yangi yutuq qo\'lga kiritildi!', kr: 'Янги ютуқ қўлга киритилди!' }) }}
      </div>
      <div class="flex flex-wrap gap-3">
        <div v-for="ach in newAchievements" :key="ach.id"
             class="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/70 border border-amber-200">
          <IconTile :icon="ach.icon" :tone="ach.tone" :size="36" />
          <div>
            <div class="text-sm font-semibold text-ink-900">{{ i18n.t(ach.title) }}</div>
            <div class="text-2xs font-semibold text-amber-600">+{{ ach.reward }} {{ i18n.t({ uz: 'ball', kr: 'балл' }) }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Per-question matrix -->
    <div class="card p-5 mb-6">
      <div class="flex items-center justify-between mb-3">
        <div class="text-sm font-semibold text-ink-900">{{ i18n.t({ uz: 'Savollar bo\'yicha', kr: 'Саволлар бўйича' }) }}</div>
        <button @click="showAll = !showAll" class="text-2xs font-medium text-ink-500 hover:text-ink-900">
          {{ showAll
            ? i18n.t({ uz: 'Faqat xatolar', kr: 'Фақат хатолар' })
            : i18n.t({ uz: 'Hammasini ko\'rsat →', kr: 'Ҳаммасини кўрсат →' }) }}
        </button>
      </div>
      <div class="grid grid-cols-10 gap-1.5">
        <div v-for="ans in answers" :key="ans.position"
             class="aspect-square rounded-md flex items-center justify-center text-xs font-semibold tabular-nums border"
             :style="ans.is_correct
               ? 'background: rgba(16,185,129,0.12); color: #047857; border-color: rgba(16,185,129,0.30);'
               : ans.is_skipped
                 ? 'background: var(--surface-soft); color: var(--text-4); border-color: var(--border-1);'
                 : 'background: rgba(244,63,94,0.10); color: #be123c; border-color: rgba(244,63,94,0.30);'">
          {{ ans.position }}
        </div>
      </div>
    </div>

    <!-- Wrong question reviews -->
    <div v-if="wrongAnswers.length" class="space-y-3 mb-6">
      <div v-for="(ans, idx) in (showAll ? answers : wrongAnswers)" :key="ans.position"
           class="card p-5"
           v-show="showAll || !ans.is_correct">
        <div class="flex items-center gap-2 mb-3">
          <span class="w-7 h-7 rounded-lg grid place-items-center flex-shrink-0"
                :class="ans.is_correct ? 'bg-emerald-50 text-emerald-700' : ans.is_skipped ? 'bg-ink-100 text-ink-500' : 'bg-rose-50 text-rose-600'">
            <AppIcon v-if="ans.is_correct" name="check" :size="14" />
            <AppIcon v-else-if="ans.is_skipped" name="info" :size="14" />
            <AppIcon v-else name="x" :size="14" />
          </span>
          <div class="text-sm font-semibold text-ink-900">
            {{ i18n.t({ uz: 'Savol', kr: 'Савол' }) }} {{ ans.position }} ·
            <span v-if="ans.is_correct" class="text-emerald-700">{{ i18n.t({ uz: 'To\'g\'ri', kr: 'Тўғри' }) }}</span>
            <span v-else-if="ans.is_skipped" class="text-ink-500">{{ i18n.t({ uz: 'O\'tkazib yuborilgan', kr: 'Ўтказиб юборилган' }) }}</span>
            <span v-else class="text-rose-600">{{ i18n.t({ uz: 'Xato javob', kr: 'Хато жавоб' }) }}</span>
          </div>
        </div>
        <div class="text-[15px] leading-relaxed mb-3 text-ink-800">{{ ans.question.text }}</div>
        <img v-if="ans.question.image" :src="ans.question.image" class="rounded-lg border border-ink-200 max-h-40 mb-3">

        <div v-if="!ans.is_correct" class="space-y-2">
          <div v-if="ans.chosen_option_id" class="px-3 py-2 rounded-lg bg-rose-50 text-rose-800 text-sm leading-snug">
            <span class="font-semibold">{{ i18n.t({ uz: 'Sizning javobingiz:', kr: 'Сизнинг жавобингиз:' }) }} {{ chosenLetter(ans) }}</span>
            · {{ chosenText(ans) }}
          </div>
          <div class="px-3 py-2 rounded-lg bg-emerald-50 text-emerald-800 text-sm leading-snug">
            <span class="font-semibold">{{ i18n.t({ uz: 'To\'g\'ri javob:', kr: 'Тўғри жавоб:' }) }} {{ correctLetter(ans) }}</span>
            · {{ correctText(ans) }}
          </div>
        </div>

        <div v-if="ans.question.explanation_uz" class="mt-3 px-3.5 py-2.5 bg-amber-50 border border-amber-200 rounded-lg text-sm flex gap-2.5">
          <AppIcon name="info" :size="16" class="text-amber-600 flex-shrink-0 mt-0.5" />
          <div class="text-amber-800 leading-relaxed">{{ i18n.t({ uz: ans.question.explanation_uz, kr: ans.question.explanation_kr }) }}</div>
        </div>
        <div v-else class="mt-3">
          <button @click="explain(ans.question)" :disabled="explaining[ans.question.id]"
            class="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-violet-50 border border-violet-200 text-violet-700 text-sm font-medium hover:bg-violet-100 disabled:opacity-60">
            {{ explaining[ans.question.id] ? i18n.t({ uz: 'Tushuntirilmoqda…', kr: 'Тушунтирилмоқда…' }) : i18n.t({ uz: '🤖 AI tushuntirish', kr: '🤖 AI тушунтириш' }) }}
          </button>
          <div v-if="explainErr[ans.question.id]" class="mt-1.5 text-xs text-rose-600">{{ explainErr[ans.question.id] }}</div>
        </div>
      </div>
    </div>

    <!-- Action buttons -->
    <div class="flex flex-wrap gap-2">
      <NuxtLink :to="retakeLink" class="btn-primary btn-lg flex-1 min-w-fit">
        {{ i18n.t({ uz: 'Qayta urinish', kr: 'Қайта уриниш' }) }}
        <AppIcon name="arrow" :size="14" />
      </NuxtLink>
      <NuxtLink to="/" class="btn-outline btn-lg">{{ i18n.t({ uz: 'Bosh sahifa', kr: 'Бош саҳифа' }) }}</NuxtLink>
      <NuxtLink to="/me/stats" class="btn-outline btn-lg">{{ i18n.t({ uz: 'Statistika', kr: 'Статистика' }) }}</NuxtLink>
    </div>
  </div>
</template>
