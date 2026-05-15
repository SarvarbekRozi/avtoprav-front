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

function fmtTime(sec: number) {
  const m = Math.floor(sec / 60), s = sec % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

const passed = computed(() => a.value?.is_passed)
const percent = computed(() => {
  if (!a.value || a.value.total_questions === 0) return 0
  return Math.round((a.value.correct_count / a.value.total_questions) * 100)
})
</script>

<template>
  <div class="max-w-3xl mx-auto px-4 sm:px-6 py-10" v-if="a">
    <!-- Hero result -->
    <div class="card p-8 mb-6 text-center"
         :class="passed ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50/50 border-rose-200'">
      <div class="inline-flex w-12 h-12 rounded-2xl items-center justify-center mb-5"
           :class="passed ? 'bg-emerald-500 text-white' : 'bg-rose-100 text-rose-600'">
        <svg v-if="passed" class="w-6 h-6" viewBox="0 0 24 24" fill="none">
          <path d="M5 12L10 17L19 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <svg v-else class="w-6 h-6" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8"/>
          <path d="M12 7v6M12 16v.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
        </svg>
      </div>

      <div class="text-2xl font-semibold tracking-tightish text-ink-900 mb-1">
        {{ passed
          ? i18n.t({ uz: 'Imtihondan o\'tdingiz', kr: 'Имтиҳондан ўтдингиз' })
          : i18n.t({ uz: 'Yana harakat qilib ko\'ring', kr: 'Яна ҳаракат қилиб кўринг' }) }}
      </div>
      <p class="text-sm text-ink-500 max-w-md mx-auto">
        {{ passed
          ? i18n.t({ uz: 'Ajoyib natija. Davom eting va boshqa rejimlarni ham sinab ko\'ring.', kr: 'Ажойиб натижа. Давом этинг ва бошқа режимларни ҳам синаб кўринг.' })
          : i18n.t({ uz: 'Xato javoblaringizni qayta ko\'rib chiqing va yana urinib ko\'ring.', kr: 'Хато жавобларингизни қайта кўриб чиқинг ва яна уриниб кўринг.' }) }}
      </p>

      <div class="grid grid-cols-3 gap-4 mt-7 max-w-md mx-auto">
        <div>
          <div class="text-3xl font-semibold tracking-tightish text-emerald-600 tabular-nums">{{ a.correct_count }}</div>
          <div class="text-2xs uppercase tracking-wider text-ink-500 font-semibold mt-1">{{ i18n.t({ uz: 'To\'g\'ri', kr: 'Тўғри' }) }}</div>
        </div>
        <div>
          <div class="text-3xl font-semibold tracking-tightish text-rose-500 tabular-nums">{{ a.wrong_count }}</div>
          <div class="text-2xs uppercase tracking-wider text-ink-500 font-semibold mt-1">{{ i18n.t({ uz: 'Xato', kr: 'Хато' }) }}</div>
        </div>
        <div>
          <div class="text-3xl font-semibold tracking-tightish text-ink-900 tabular-nums">{{ percent }}%</div>
          <div class="text-2xs uppercase tracking-wider text-ink-500 font-semibold mt-1">{{ i18n.t({ uz: 'Aniqlik', kr: 'Аниқлик' }) }}</div>
        </div>
      </div>

      <div class="mt-5 text-2xs text-ink-500 flex items-center justify-center gap-3">
        <span class="tabular-nums">⏱ {{ fmtTime(a.time_spent_sec) }}</span>
        <span>·</span>
        <span>{{ a.total_questions }} {{ i18n.t({ uz: 'savol', kr: 'савол' }) }}</span>
      </div>
    </div>

    <!-- Actions -->
    <div class="flex flex-wrap gap-2.5 justify-center mb-8">
      <NuxtLink :to="`/test/start/${a.mode}`" class="btn-primary">
        <svg class="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none">
          <path d="M2 7a5 5 0 1 0 1.5-3.5M2 3v3h3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        {{ i18n.t({ uz: 'Qayta urinish', kr: 'Қайта уриниш' }) }}
      </NuxtLink>
      <NuxtLink to="/" class="btn-outline">{{ i18n.t({ uz: 'Bosh sahifa', kr: 'Бош саҳифа' }) }}</NuxtLink>
      <NuxtLink to="/me/stats" class="btn-ghost">{{ i18n.t({ uz: 'Statistika', kr: 'Статистика' }) }}</NuxtLink>
    </div>

    <!-- Answers review -->
    <div v-if="wrongAnswers.length || showAll" class="card">
      <div class="px-5 py-4 border-b border-ink-200/70 flex items-center justify-between">
        <div>
          <div class="text-sm font-semibold text-ink-900">
            {{ showAll
              ? i18n.t({ uz: 'Barcha savollar', kr: 'Барча саволлар' })
              : i18n.t({ uz: 'Xato javoblar', kr: 'Хато жавоблар' }) }}
          </div>
          <div class="text-2xs text-ink-500 mt-0.5">
            {{ showAll ? answers.length : wrongAnswers.length }} {{ i18n.t({ uz: 'ta', kr: 'та' }) }}
          </div>
        </div>
        <button @click="showAll = !showAll" class="btn-ghost btn-sm">
          {{ showAll
            ? i18n.t({ uz: 'Faqat xatolar', kr: 'Фақат хатолар' })
            : i18n.t({ uz: 'Hammasini ko\'rsatish', kr: 'Ҳаммасини кўрсатиш' }) }}
        </button>
      </div>

      <div class="divide-y divide-ink-200/70">
        <div v-for="ans in (showAll ? answers : wrongAnswers)" :key="ans.position" class="p-5">
          <div class="flex items-center gap-2 mb-3">
            <span class="badge"
                  :class="ans.is_correct ? 'bg-emerald-50 text-emerald-700' :
                          ans.is_skipped ? 'bg-ink-100 text-ink-500' :
                          'bg-rose-50 text-rose-700'">
              <span class="tabular-nums">#{{ ans.position }}</span>
              <svg v-if="ans.is_correct" class="w-3 h-3" viewBox="0 0 12 12" fill="none"><path d="M2 6.5L4.5 9L10 3.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
              <svg v-else-if="!ans.is_skipped" class="w-3 h-3" viewBox="0 0 12 12" fill="none"><path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
              <span v-else>○</span>
            </span>
          </div>

          <div class="font-medium text-ink-900 mb-3 leading-relaxed">{{ ans.question.text }}</div>
          <img v-if="ans.question.image" :src="ans.question.image" class="rounded-lg border border-ink-200 max-h-40 mb-3">

          <ul class="space-y-1.5 text-sm">
            <li v-for="o in ans.question.options" :key="o.id"
                class="flex items-start gap-2.5 px-3 py-2 rounded-lg"
                :class="{
                  'bg-emerald-50 text-emerald-900 font-medium': o.is_correct,
                  'bg-rose-50 text-rose-700': !o.is_correct && o.id === ans.chosen_option_id,
                }">
              <span class="w-4 h-4 rounded-full grid place-items-center flex-shrink-0 mt-0.5"
                    :class="o.is_correct ? 'bg-emerald-500 text-white' :
                            (o.id === ans.chosen_option_id ? 'bg-rose-500 text-white' : 'border border-ink-200')">
                <svg v-if="o.is_correct" class="w-2.5 h-2.5" viewBox="0 0 10 10" fill="none"><path d="M2 5L4 7L8 3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
                <svg v-else-if="o.id === ans.chosen_option_id" class="w-2.5 h-2.5" viewBox="0 0 10 10" fill="none"><path d="M2.5 2.5l5 5M7.5 2.5l-5 5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
              </span>
              <span class="leading-relaxed">{{ o.text }}</span>
            </li>
          </ul>

          <div v-if="ans.question.explanation" class="mt-3 px-3.5 py-2.5 bg-amber-50 border border-amber-200 rounded-lg text-sm flex gap-2.5">
            <svg class="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.4"/>
              <path d="M8 5v3.5M8 10.5v.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
            </svg>
            <div class="text-amber-800 leading-relaxed">{{ ans.question.explanation }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
