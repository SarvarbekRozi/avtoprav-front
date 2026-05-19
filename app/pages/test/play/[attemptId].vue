<script setup lang="ts">
definePageMeta({ middleware: 'auth', layout: 'test' })

const route = useRoute()
const i18n = useI18n()
const attemptId = Number(route.params.attemptId)

interface QuestionPayload {
  attempt: { id: number, mode: string, total: number, time_limit_sec: number, started_at: string, remaining_sec: number | null }
  position: number
  question: { id: number, text: string, image: string | null, topic: string | null, options: Array<{ id: number, text: string }> }
  answer: null | {
    is_answered: boolean
    is_correct: boolean
    is_skipped: boolean
    selected_option_id: number | null
    correct_option_id: number
    explanation_uz: string | null
    explanation_kr: string | null
  }
}

type ProgressEntry = { position: number, status: 'unseen' | 'correct' | 'wrong' | 'skipped' }

const state = ref<QuestionPayload | null>(null)
const progress = ref<ProgressEntry[]>([])
const selectedOptionId = ref<number | null>(null)
const lastAnswer = ref<{ is_correct: boolean, correct_option_id: number, explanation_uz: string | null, explanation_kr: string | null } | null>(null)
const loading = ref(true)
const submitting = ref(false)
const navigating = ref(false)
const finished = ref(false)
const questionStartedAt = ref(Date.now())
const remainingSec = ref<number | null>(null)
const error = ref('')
let timerId: any = null

const auth = useAuthStore()
const lastPointsDelta = ref<number | null>(null)
const previousPoints = ref<number>(auth.user?.points ?? 0)

const isExam = computed(() => state.value?.attempt?.mode === 'exam')
const canNavigate = computed(() => !!state.value && !isExam.value)
const showExplanation = computed(() => !!lastAnswer.value && !isExam.value)

function optionLetter(i: number) { return String.fromCharCode(65 + i) }
function explanationText() {
  if (!lastAnswer.value) return ''
  return i18n.locale.value === 'uz_cyrl' ? lastAnswer.value.explanation_kr : lastAnswer.value.explanation_uz
}

function hydrateFromAnswer(payload: QuestionPayload) {
  // If this question already has an answer, restore state
  if (payload.answer?.is_answered) {
    selectedOptionId.value = payload.answer.selected_option_id
    lastAnswer.value = {
      is_correct: payload.answer.is_correct,
      correct_option_id: payload.answer.correct_option_id,
      explanation_uz: payload.answer.explanation_uz,
      explanation_kr: payload.answer.explanation_kr,
    }
  } else {
    selectedOptionId.value = null
    lastAnswer.value = null
  }
  questionStartedAt.value = Date.now()
}

async function load(position?: number) {
  loading.value = true
  error.value = ''
  try {
    const url = position ? `/test/${attemptId}?position=${position}` : `/test/${attemptId}`
    const res = await apiFetch<any>(url)
    if (res.finished || res.status === 'finished' || res.status === 'failed' || res.status === 'expired') {
      await navigateTo(`/test/result/${attemptId}`, { replace: true })
      return
    }
    state.value = res.current
    progress.value = res.progress ?? []
    remainingSec.value = state.value?.attempt.remaining_sec ?? null
    hydrateFromAnswer(state.value!)
    startTimer()
  } catch (e: any) {
    error.value = e?.data?.message || 'Xatolik'
  } finally {
    loading.value = false
  }
}

async function jumpTo(position: number) {
  if (!canNavigate.value || navigating.value || position === state.value?.position) return
  navigating.value = true
  try {
    const res = await apiFetch<any>(`/test/${attemptId}?position=${position}`)
    state.value = res.current
    progress.value = res.progress ?? progress.value
    remainingSec.value = state.value?.attempt.remaining_sec ?? remainingSec.value
    hydrateFromAnswer(state.value!)
  } catch (e: any) {
    error.value = e?.data?.message || 'Xatolik'
  } finally {
    navigating.value = false
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

let autoAdvanceTimer: any = null

function onOptionClick(optionId: number) {
  if (submitting.value) return
  if (lastAnswer.value) return
  selectedOptionId.value = optionId
  submitAnswer()
}

async function submitAnswer() {
  if (submitting.value || !state.value) return
  if (lastAnswer.value && !isExam.value) { goNext(); return }
  submitting.value = true
  try {
    const elapsed = Math.floor((Date.now() - questionStartedAt.value) / 1000)
    const res = await apiFetch<any>(`/test/${attemptId}/answer`, {
      method: 'POST',
      body: { question_id: state.value.question.id, option_id: selectedOptionId.value, time_spent_sec: elapsed },
    })
    lastAnswer.value = res.answer
    progress.value = res.progress ?? progress.value
    if (typeof res.user_points === 'number' && auth.user) {
      const delta = res.user_points - (auth.user.points ?? 0)
      auth.user.points = res.user_points
      if (delta > 0) {
        lastPointsDelta.value = delta
        setTimeout(() => { lastPointsDelta.value = null }, 1500)
      }
    }
    if (res.finished) {
      stopTimer()
      finished.value = true
      setTimeout(() => navigateTo(`/test/result/${attemptId}`), 800)
      return
    }
    if (isExam.value) {
      state.value = res.next
      remainingSec.value = state.value?.attempt.remaining_sec ?? remainingSec.value
      hydrateFromAnswer(state.value!)
    } else {
      state.value._next = res.next
      if (autoAdvanceTimer) clearTimeout(autoAdvanceTimer)
      autoAdvanceTimer = setTimeout(() => {
        if (lastAnswer.value) goNext()
      }, 1500)
    }
  } catch (e: any) {
    error.value = e?.data?.message || 'Xatolik'
  } finally {
    submitting.value = false
  }
}

function goNext() {
  if (state.value?._next) {
    state.value = state.value._next
    remainingSec.value = state.value?.attempt.remaining_sec ?? remainingSec.value
    hydrateFromAnswer(state.value!)
    return
  }
  // Else jump to next unseen question, or just position+1
  const cur = state.value?.position ?? 0
  const nextUnseen = progress.value.find(p => p.position > cur && p.status === 'unseen')
                  || progress.value.find(p => p.status === 'unseen')
  if (nextUnseen) jumpTo(nextUnseen.position)
  else if (cur < (state.value?.attempt.total ?? 0)) jumpTo(cur + 1)
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
  const total = state.value?.attempt.total ?? 0
  if (!total) return 0
  const answered = progress.value.filter(p => p.status !== 'unseen').length
  return Math.round((answered / total) * 100)
})

const timerCritical = computed(() => remainingSec.value !== null && remainingSec.value < 60)

function optionState(o: any) {
  if (!lastAnswer.value) return selectedOptionId.value === o.id ? 'selected' : 'idle'
  if (o.id === lastAnswer.value.correct_option_id) return 'correct'
  if (o.id === selectedOptionId.value) return 'wrong'
  return 'idle'
}

function tileStyleFor(p: ProgressEntry, isCurrent: boolean) {
  if (isCurrent) {
    return {
      background: 'var(--text-1)', color: 'var(--surface)', borderColor: 'var(--text-1)',
      ring: '0 0 0 2px var(--surface), 0 0 0 4px var(--text-1)',
    }
  }
  switch (p.status) {
    case 'correct': return { background: '#10b981', color: '#fff', borderColor: '#10b981', ring: 'none' }
    case 'wrong':   return { background: '#f43f5e', color: '#fff', borderColor: '#f43f5e', ring: 'none' }
    case 'skipped': return { background: 'rgba(251,191,36,0.18)', color: '#b45309', borderColor: 'rgba(251,191,36,0.4)', ring: 'none' }
    default:        return { background: 'var(--surface)', color: 'var(--text-3)', borderColor: 'var(--border-1)', ring: 'none' }
  }
}

onMounted(() => load())
onBeforeUnmount(() => {
  stopTimer()
  if (autoAdvanceTimer) clearTimeout(autoAdvanceTimer)
})
</script>

<template>
  <ClientOnly>
  <div class="min-h-screen flex flex-col">
    <!-- Top bar -->
    <header class="border-b sticky top-0 z-10"
            style="background: var(--surface); border-color: var(--border-soft);">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-3">
        <button @click="exitConfirm" class="btn-ghost btn-sm">
          <AppIcon name="chev-l" :size="14" />
          {{ i18n.t({ uz: 'Chiqish', kr: 'Чиқиш' }) }}
        </button>

        <div v-if="state" class="flex items-center gap-3">
          <div class="text-sm font-medium tabular-nums" style="color: var(--text-2);">
            <span class="font-semibold" style="color: var(--text-1);">{{ state.position }}</span>
            <span class="mx-1" style="color: var(--text-4);">/</span>
            <span>{{ state.attempt.total }}</span>
          </div>
          <div v-if="auth.user"
               class="relative flex items-center gap-1.5 h-7 px-2 rounded-full text-xs"
               style="background: linear-gradient(90deg, rgba(63,88,148,0.10), rgba(251,191,36,0.10)); border: 1px solid rgba(63,88,148,0.20);">
            <AppIcon name="trophy" :size="11" class="text-amber-500" />
            <span class="font-semibold tabular-nums" style="color: var(--text-1);">{{ (auth.user.points ?? 0).toLocaleString() }}</span>
            <Transition
              enter-active-class="transition duration-300 ease-out"
              enter-from-class="opacity-0 -translate-y-1"
              enter-to-class="opacity-100 translate-y-0"
              leave-active-class="transition duration-500 ease-in"
              leave-from-class="opacity-100"
              leave-to-class="opacity-0 -translate-y-2">
              <span v-if="lastPointsDelta"
                    class="absolute -top-4 right-0 text-sm font-bold text-emerald-500 tabular-nums whitespace-nowrap">
                +{{ lastPointsDelta }}
              </span>
            </Transition>
          </div>
        </div>

        <div v-if="remainingSec !== null"
             class="font-mono text-sm tabular-nums h-8 px-3 rounded-lg flex items-center gap-1.5 transition-all"
             :class="timerCritical ? 'bg-rose-50 text-rose-700 border border-rose-200 animate-pulse' : 'bg-ink-100 text-ink-700'">
          <AppIcon name="clock" :size="13" />
          {{ timerLabel }}
        </div>
        <div v-else class="text-sm text-ink-300">—</div>
      </div>
      <div class="h-1 bg-ink-100">
        <div class="h-1 bg-ink-900 transition-all duration-300" :style="{ width: progressPercent + '%' }"></div>
      </div>
    </header>

    <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <!-- Top: Question number grid (full width) -->
      <section v-if="state && progress.length" class="card p-5 lg:p-6">
        <div class="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <div class="eyebrow">{{ i18n.t({ uz: 'Savollar', kr: 'Саволлар' }) }}</div>
          <div v-if="isExam" class="text-xs text-amber-700 flex items-center gap-1">
            <AppIcon name="lock" :size="12" />
            {{ i18n.t({ uz: 'Imtihon: tartib bo\'yicha', kr: 'Имтиҳон: тартиб бўйича' }) }}
          </div>
          <div v-else class="text-xs text-ink-400">
            {{ i18n.t({ uz: 'Tugmani bosing va o\'sha savolga o\'ting', kr: 'Тугмани босинг ва ўша саволга ўтинг' }) }}
          </div>
        </div>
        <div class="grid gap-2"
             style="grid-template-columns: repeat(auto-fill, minmax(48px, 1fr));">
          <button v-for="p in progress" :key="p.position"
            :disabled="!canNavigate"
            @click="jumpTo(p.position)"
            class="relative aspect-square rounded-lg text-sm font-semibold tabular-nums border transition-all flex items-center justify-center"
            :class="canNavigate ? 'hover:-translate-y-0.5 hover:shadow-soft cursor-pointer' : 'cursor-not-allowed'"
            :style="{
              background: tileStyleFor(p, p.position === state.position).background,
              color: tileStyleFor(p, p.position === state.position).color,
              borderColor: tileStyleFor(p, p.position === state.position).borderColor,
              boxShadow: tileStyleFor(p, p.position === state.position).ring,
            }">
            {{ p.position }}
          </button>
        </div>
        <!-- legend -->
        <div class="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-ink-500">
          <span class="flex items-center gap-1.5"><span class="w-3.5 h-3.5 rounded border border-ink-900 bg-ink-900"></span>{{ i18n.t({ uz: 'Joriy', kr: 'Жорий' }) }}</span>
          <span class="flex items-center gap-1.5"><span class="w-3.5 h-3.5 rounded bg-emerald-500"></span>{{ i18n.t({ uz: 'To\'g\'ri', kr: 'Тўғри' }) }}</span>
          <span class="flex items-center gap-1.5"><span class="w-3.5 h-3.5 rounded bg-rose-500"></span>{{ i18n.t({ uz: 'Xato', kr: 'Хато' }) }}</span>
          <span class="flex items-center gap-1.5"><span class="w-3.5 h-3.5 rounded bg-amber-100 border border-amber-200"></span>{{ i18n.t({ uz: 'O\'tkazilgan', kr: 'Ўтказилган' }) }}</span>
          <span class="flex items-center gap-1.5"><span class="w-3.5 h-3.5 rounded border border-ink-200 bg-white"></span>{{ i18n.t({ uz: 'Tegilmagan', kr: 'Тегилмаган' }) }}</span>
        </div>
      </section>

      <!-- Main content -->
      <div class="min-w-0">
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

            <!-- Question text (top, full width) -->
            <div class="card p-6 lg:p-7">
              <div class="text-lg lg:text-xl font-medium text-ink-900 leading-relaxed">{{ state.question.text }}</div>
            </div>

            <!-- Below: image on left, options on right (stacked on mobile) -->
            <div :class="state.question.image ? 'grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-5 items-start' : ''">
              <div v-if="state.question.image" class="card p-3 md:sticky md:top-20">
                <img :src="state.question.image"
                     class="w-full rounded-lg border border-ink-200 max-h-[420px] object-contain bg-ink-50">
              </div>

              <div class="space-y-2">
                <button v-for="(o, i) in state.question.options" :key="o.id"
                        :disabled="!!lastAnswer || submitting"
                        @click="onOptionClick(o.id)"
                        class="w-full text-left px-4 py-3.5 rounded-xl border transition-all duration-150
                               flex items-start gap-3 disabled:cursor-not-allowed"
                        :class="[
                          optionState(o) === 'selected' ? 'border-ink-900' :
                          optionState(o) === 'correct'  ? 'border-emerald-500' :
                          optionState(o) === 'wrong'    ? 'border-rose-500' :
                          'border-ink-200 bg-white hover:border-ink-400',
                        ]"
                        :style="{
                          background:
                            optionState(o) === 'selected' ? 'var(--surface-hover)' :
                            optionState(o) === 'correct'  ? 'rgba(16,185,129,0.12)' :
                            optionState(o) === 'wrong'    ? 'rgba(244,63,94,0.10)' :
                            'var(--surface)',
                        }">
                  <span class="w-7 h-7 rounded-lg flex items-center justify-center font-semibold text-sm flex-shrink-0 transition-all"
                        :style="{
                          background:
                            optionState(o) === 'selected' ? 'var(--text-1)' :
                            optionState(o) === 'correct'  ? '#10b981' :
                            optionState(o) === 'wrong'    ? '#f43f5e' :
                            'var(--surface-inset)',
                          color: optionState(o) === 'idle' ? 'var(--text-2)' : '#fff',
                        }">{{ optionLetter(i) }}</span>

                  <span class="flex-1 text-sm md:text-base leading-relaxed pt-0.5"
                        :class="optionState(o) === 'correct' ? 'text-emerald-900 font-medium' :
                                optionState(o) === 'wrong' ? 'text-rose-900' : 'text-ink-900'">
                    {{ o.text }}
                  </span>

                  <span v-if="optionState(o) === 'correct'" class="text-emerald-600 flex-shrink-0">
                    <AppIcon name="check" :size="20" />
                  </span>
                  <span v-else-if="optionState(o) === 'wrong'" class="text-rose-500 flex-shrink-0">
                    <AppIcon name="x" :size="20" />
                  </span>
                </button>
              </div>
            </div>

            <div v-if="showExplanation && explanationText()"
                 class="p-4 rounded-2xl border flex gap-3"
                 style="background: rgba(251,191,36,0.10); border-color: rgba(251,191,36,0.30);">
              <AppIcon name="info" :size="18" class="flex-shrink-0 mt-0.5 text-amber-600" />
              <div class="text-sm leading-relaxed text-amber-900">
                <b>{{ i18n.t({ uz: 'Izoh.', kr: 'Изоҳ.' }) }}</b>
                {{ explanationText() }}
              </div>
            </div>

          </div>
      </div>
    </main>
  </div>

  <template #fallback>
    <div class="min-h-screen flex items-center justify-center" style="background: var(--canvas);">
      <div class="inline-block w-6 h-6 border-2 border-ink-300 border-t-ink-900 rounded-full animate-spin"></div>
    </div>
  </template>
  </ClientOnly>
</template>
