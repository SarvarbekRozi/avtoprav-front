<script setup lang="ts">
definePageMeta({ middleware: 'auth', layout: 'test' })

const route = useRoute()
const i18n = useI18n()
const attemptId = Number(route.params.attemptId)

interface QuestionPayload {
  attempt: { id: number, mode: string, total: number, time_limit_sec: number, started_at: string, remaining_sec: number | null }
  position: number
  question: { id: number, text: string, image: string | null, topic: string | null, options: Array<{ id: number, text: string }> }
}

const state = ref<QuestionPayload | null>(null)
const selectedOptionId = ref<number | null>(null)
const lastAnswer = ref<{ is_correct: boolean, correct_option_id: number, explanation_uz: string | null, explanation_kr: string | null } | null>(null)
const loading = ref(true)
const submitting = ref(false)
const finished = ref(false)
const summary = ref<any>(null)
const questionStartedAt = ref(Date.now())
const remainingSec = ref<number | null>(null)
const error = ref('')
let timerId: any = null

const isExam = computed(() => state.value?.attempt?.mode === 'exam')
const showExplanation = computed(() => !!lastAnswer.value && !isExam.value)

function optionLetter(i: number) { return String.fromCharCode(65 + i) }
function explanationText() {
  if (!lastAnswer.value) return ''
  return i18n.locale.value === 'uz_cyrl' ? lastAnswer.value.explanation_kr : lastAnswer.value.explanation_uz
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const res = await apiFetch<any>(`/test/${attemptId}`)
    if (res.finished || res.status === 'finished' || res.status === 'failed' || res.status === 'expired') {
      await navigateTo(`/test/result/${attemptId}`, { replace: true })
      return
    }
    state.value = res.current
    remainingSec.value = state.value?.attempt.remaining_sec ?? null
    selectedOptionId.value = null
    lastAnswer.value = null
    questionStartedAt.value = Date.now()
    startTimer()
  } catch (e: any) {
    error.value = e?.data?.message || 'Xatolik'
  } finally {
    loading.value = false
  }
}

function startTimer() {
  stopTimer()
  if (remainingSec.value === null) return
  timerId = setInterval(() => {
    if (remainingSec.value === null) return
    remainingSec.value = Math.max(0, remainingSec.value - 1)
    if (remainingSec.value === 0) {
      stopTimer()
      finishAttempt()
    }
  }, 1000)
}
function stopTimer() {
  if (timerId) { clearInterval(timerId); timerId = null }
}

async function submitAnswer() {
  if (submitting.value || !state.value) return
  submitting.value = true
  try {
    const elapsed = Math.floor((Date.now() - questionStartedAt.value) / 1000)
    const res = await apiFetch<any>(`/test/${attemptId}/answer`, {
      method: 'POST',
      body: { question_id: state.value.question.id, option_id: selectedOptionId.value, time_spent_sec: elapsed },
    })
    lastAnswer.value = res.answer
    if (res.finished) {
      stopTimer()
      summary.value = res.attempt
      finished.value = true
      setTimeout(() => navigateTo(`/test/result/${attemptId}`), 600)
      return
    }
    if (isExam.value) {
      state.value = res.next
      remainingSec.value = state.value?.attempt.remaining_sec ?? remainingSec.value
      selectedOptionId.value = null
      lastAnswer.value = null
      questionStartedAt.value = Date.now()
    } else {
      state.value._next = res.next
    }
  } catch (e: any) {
    error.value = e?.data?.message || 'Xatolik'
  } finally {
    submitting.value = false
  }
}

function goNext() {
  if (!state.value?._next) return
  state.value = state.value._next
  remainingSec.value = state.value?.attempt.remaining_sec ?? remainingSec.value
  selectedOptionId.value = null
  lastAnswer.value = null
  questionStartedAt.value = Date.now()
}

async function finishAttempt() {
  try { await apiFetch(`/test/${attemptId}/finish`, { method: 'POST' }) } catch {}
  await navigateTo(`/test/result/${attemptId}`, { replace: true })
}

function exitConfirm() {
  if (confirm(i18n.t({ uz: 'Testdan chiqasizmi? Natija saqlanadi.', kr: 'Тестдан чиқасизми? Натижа сақланади.' }))) {
    finishAttempt()
  }
}

const timerLabel = computed(() => {
  if (remainingSec.value === null) return ''
  const m = Math.floor(remainingSec.value / 60)
  const s = remainingSec.value % 60
  return `${m}:${s.toString().padStart(2, '0')}`
})

const progressPercent = computed(() => {
  if (!state.value) return 0
  return Math.round((state.value.position / state.value.attempt.total) * 100)
})

const timerCritical = computed(() => remainingSec.value !== null && remainingSec.value < 60)

onMounted(load)
onBeforeUnmount(stopTimer)
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <!-- Top bar -->
    <header class="bg-white border-b border-ink-200/70 sticky top-0 z-10">
      <div class="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
        <button @click="exitConfirm" class="btn-ghost btn-sm">
          <svg class="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none">
            <path d="M9 3.5L5.5 7L9 10.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          {{ i18n.t({ uz: 'Chiqish', kr: 'Чиқиш' }) }}
        </button>

        <div v-if="state" class="text-sm font-medium text-ink-700 tabular-nums">
          <span class="text-ink-900 font-semibold">{{ state.position }}</span>
          <span class="text-ink-400 mx-1">/</span>
          <span>{{ state.attempt.total }}</span>
        </div>

        <div v-if="remainingSec !== null"
             class="font-mono text-sm tabular-nums h-8 px-3 rounded-lg flex items-center gap-1.5 transition-all"
             :class="timerCritical ? 'bg-rose-50 text-rose-700 border border-rose-200 animate-pulse' : 'bg-ink-100 text-ink-700'">
          <svg class="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7.5" r="5.5" stroke="currentColor" stroke-width="1.5"/>
            <path d="M7 4.5V7.5L8.5 8.5M7 1V2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          {{ timerLabel }}
        </div>
        <div v-else class="text-sm text-ink-300">—</div>
      </div>
      <div class="h-1 bg-ink-100">
        <div class="h-1 bg-ink-900 transition-all duration-300" :style="{ width: progressPercent + '%' }"></div>
      </div>
    </header>

    <main class="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-8">
      <!-- Loading -->
      <div v-if="loading" class="space-y-4">
        <div class="h-3 w-1/4 bg-ink-100 rounded animate-pulse"></div>
        <div class="card p-6">
          <div class="h-5 w-3/4 bg-ink-100 rounded animate-pulse mb-3"></div>
          <div class="h-5 w-1/2 bg-ink-100 rounded animate-pulse"></div>
        </div>
        <div class="space-y-2">
          <div v-for="i in 4" :key="i" class="h-14 bg-ink-100 rounded-xl animate-pulse"></div>
        </div>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="card p-8 text-center">
        <div class="text-rose-600 font-medium mb-4">{{ error }}</div>
        <NuxtLink to="/" class="btn-primary">{{ i18n.t({ uz: 'Bosh sahifaga', kr: 'Бош саҳифага' }) }}</NuxtLink>
      </div>

      <!-- Question -->
      <div v-else-if="state" class="space-y-5 anim-in" :key="state.question.id">
        <div v-if="state.question.topic" class="eyebrow">{{ state.question.topic }}</div>

        <div class="card p-6">
          <div class="text-lg font-medium text-ink-900 leading-relaxed">{{ state.question.text }}</div>
          <img v-if="state.question.image" :src="state.question.image"
               class="mt-5 w-full rounded-xl border border-ink-200 max-h-80 object-contain bg-ink-50">
        </div>

        <div class="space-y-2">
          <button v-for="(o, i) in state.question.options" :key="o.id"
                  :disabled="!!lastAnswer && !isExam"
                  @click="selectedOptionId = o.id"
                  class="w-full text-left px-4 py-3.5 rounded-xl border transition-all duration-150
                         flex items-start gap-3 disabled:cursor-not-allowed"
                  :class="[
                    !lastAnswer && selectedOptionId === o.id
                      ? 'border-ink-900 bg-ink-900/[0.03] shadow-soft'
                    : lastAnswer && o.id === lastAnswer.correct_option_id
                      ? 'border-emerald-500 bg-emerald-50'
                    : lastAnswer && o.id === selectedOptionId
                      ? 'border-rose-500 bg-rose-50'
                    : 'border-ink-200 bg-white hover:border-ink-400',
                  ]">
            <span class="w-7 h-7 rounded-lg flex items-center justify-center font-semibold text-sm flex-shrink-0 transition-all"
                  :class="[
                    !lastAnswer && selectedOptionId === o.id
                      ? 'bg-ink-900 text-white'
                    : lastAnswer && o.id === lastAnswer.correct_option_id
                      ? 'bg-emerald-500 text-white'
                    : lastAnswer && o.id === selectedOptionId
                      ? 'bg-rose-500 text-white'
                    : 'bg-ink-100 text-ink-700',
                  ]">{{ optionLetter(i) }}</span>

            <span class="flex-1 text-sm md:text-base leading-relaxed pt-0.5"
                  :class="lastAnswer && o.id === lastAnswer.correct_option_id ? 'text-emerald-900 font-medium' :
                          lastAnswer && o.id === selectedOptionId ? 'text-rose-900' : 'text-ink-900'">
              {{ o.text }}
            </span>

            <span v-if="lastAnswer && o.id === lastAnswer.correct_option_id" class="text-emerald-600 flex-shrink-0">
              <svg class="w-5 h-5" viewBox="0 0 20 20" fill="none">
                <path d="M4 10.5L8 14.5L16 5.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </span>
            <span v-else-if="lastAnswer && o.id === selectedOptionId" class="text-rose-500 flex-shrink-0">
              <svg class="w-5 h-5" viewBox="0 0 20 20" fill="none">
                <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
              </svg>
            </span>
          </button>
        </div>

        <div v-if="showExplanation && explanationText()" class="card bg-amber-50 border-amber-200 p-4">
          <div class="flex gap-3">
            <svg class="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="1.5"/>
              <path d="M10 6v4.5M10 13v.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
            <div class="text-sm">
              <div class="font-semibold text-amber-900 mb-1">{{ i18n.t({ uz: 'Izoh', kr: 'Изоҳ' }) }}</div>
              <div class="text-amber-800 leading-relaxed">{{ explanationText() }}</div>
            </div>
          </div>
        </div>

        <div class="h-28 md:h-0"></div>
      </div>
    </main>

    <!-- Action bar -->
    <div v-if="state"
         class="md:static md:max-w-3xl md:mx-auto md:px-6 md:pb-8
                fixed bottom-0 left-0 right-0 px-4 py-3
                bg-white/95 backdrop-blur border-t border-ink-200/70
                md:border-0 md:bg-transparent md:py-0 md:backdrop-blur-0">
      <div class="flex gap-2">
        <button v-if="!lastAnswer || isExam" :disabled="submitting || selectedOptionId === null"
                @click="submitAnswer" class="btn-primary btn-lg flex-1">
          <span v-if="submitting" class="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
          <span v-else>{{ i18n.t({ uz: 'Javob berish', kr: 'Жавоб бериш' }) }}</span>
        </button>
        <button v-else @click="goNext" class="btn-primary btn-lg flex-1">
          {{ state._next ? i18n.t({ uz: 'Keyingi savol', kr: 'Кейинги савол' }) : i18n.t({ uz: 'Yakunlash', kr: 'Якунлаш' }) }}
          <svg class="w-4 h-4" viewBox="0 0 16 16" fill="none">
            <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <button v-if="!lastAnswer" @click="selectedOptionId = null; submitAnswer()" class="btn-outline btn-lg">
          {{ i18n.t({ uz: 'O\'tkazib yuborish', kr: 'Ўтказиб юбориш' }) }}
        </button>
      </div>
    </div>
  </div>
</template>
