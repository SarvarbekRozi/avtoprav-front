<script setup lang="ts">
definePageMeta({ middleware: 'auth', layout: 'test' })

const route = useRoute()
const i18n = useI18n()
const attemptId = Number(route.params.attemptId)

interface AnswerInfo {
  is_answered: boolean
  is_correct: boolean
  is_skipped: boolean
  selected_option_id: number | null
  correct_option_id: number
  explanation_uz: string | null
  explanation_kr: string | null
}

interface QuestionItem {
  position: number
  is_bookmarked?: boolean
  question: {
    id: number
    text: string
    image: string | null
    topic: string | null
    options: Array<{ id: number, text: string }>
    correct_option_id: number
    explanation_uz: string | null
    explanation_kr: string | null
  }
  answer: AnswerInfo | null
}

interface LocalAnswerBuffer {
  question_id: number
  option_id: number | null
  time_spent_sec: number
}

interface AttemptInfo {
  id: number
  mode: string
  total: number
  time_limit_sec: number
  started_at: string
  remaining_sec: number | null
}

type ProgressEntry = { position: number, status: 'unseen' | 'correct' | 'wrong' | 'skipped' | 'answered' }

const attemptInfo = ref<AttemptInfo | null>(null)
const questions = ref<QuestionItem[]>([])
const currentPosition = ref<number>(1)
const progress = ref<ProgressEntry[]>([])
const localAnswers = ref<Record<number, LocalAnswerBuffer>>({})
const examFailModal = ref(false)
const zoomedImage = ref<string | null>(null)
const selectedOptionId = ref<number | null>(null)
const lastAnswer = ref<{ is_correct: boolean, correct_option_id: number, explanation_uz: string | null, explanation_kr: string | null } | null>(null)
const loading = ref(true)
const submitting = ref(false)
const finished = ref(false)
const questionStartedAt = ref(Date.now())
const remainingSec = ref<number | null>(null)
const error = ref('')
let timerId: any = null

const auth = useAuthStore()
const lastPointsDelta = ref<number | null>(null)
const previousPoints = ref<number>(auth.user?.points ?? 0)
const bookmarked = ref<Set<number>>(new Set())

const currentItem = computed<QuestionItem | null>(() => {
  return questions.value.find(q => q.position === currentPosition.value) ?? null
})

const isExam = computed(() => attemptInfo.value?.mode === 'exam')
const canNavigate = computed(() => !!attemptInfo.value)
const showExplanation = computed(() => !!lastAnswer.value && !isExam.value)

function optionLetter(i: number) { return String.fromCharCode(65 + i) }
function explanationText() {
  if (!lastAnswer.value) return ''
  return i18n.locale.value === 'uz_cyrl' ? lastAnswer.value.explanation_kr : lastAnswer.value.explanation_uz
}

function isBookmarked(id: number) { return bookmarked.value.has(id) }
async function toggleBookmark(id: number) {
  const had = bookmarked.value.has(id)
  // optimistic toggle
  if (had) bookmarked.value.delete(id); else bookmarked.value.add(id)
  bookmarked.value = new Set(bookmarked.value)
  try {
    const res = await apiFetch<{ bookmarked: boolean }>(`/questions/${id}/bookmark`, { method: 'POST' })
    if (res.bookmarked) bookmarked.value.add(id); else bookmarked.value.delete(id)
  } catch {
    // revert on failure
    if (had) bookmarked.value.add(id); else bookmarked.value.delete(id)
  }
  bookmarked.value = new Set(bookmarked.value)
}

function hydrateFromAnswer(item: QuestionItem) {
  if (item.answer?.is_answered) {
    selectedOptionId.value = item.answer.selected_option_id
    lastAnswer.value = {
      is_correct: item.answer.is_correct,
      correct_option_id: item.answer.correct_option_id,
      explanation_uz: item.answer.explanation_uz,
      explanation_kr: item.answer.explanation_kr,
    }
  } else {
    selectedOptionId.value = null
    lastAnswer.value = null
  }
  questionStartedAt.value = Date.now()
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
    attemptInfo.value = res.current?.attempt ?? null
    questions.value = res.questions ?? []
    bookmarked.value = new Set(
      (questions.value as QuestionItem[]).filter(q => q.is_bookmarked).map(q => q.question.id),
    )
    progress.value = res.progress ?? []
    currentPosition.value = res.current?.position ?? 1
    remainingSec.value = attemptInfo.value?.remaining_sec ?? null
    if (currentItem.value) hydrateFromAnswer(currentItem.value)
    startTimer()
  } catch (e: any) {
    error.value = e?.data?.message || 'Xatolik'
  } finally {
    loading.value = false
  }
}

function jumpTo(position: number) {
  if (position === currentPosition.value) return
  if (position < 1 || position > (attemptInfo.value?.total ?? 0)) return
  if (autoAdvanceTimer) { clearTimeout(autoAdvanceTimer); autoAdvanceTimer = null }
  currentPosition.value = position
  const item = currentItem.value
  if (item) hydrateFromAnswer(item)
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

const EXAM_MAX_WRONG = 2 // 3rd wrong fails immediately

function onOptionClick(optionId: number) {
  if (submitting.value) return
  // Both modes: once answered, the question is locked
  if (lastAnswer.value) return
  selectedOptionId.value = optionId
  submitAnswer()
}

function submitAnswer() {
  const item = currentItem.value
  if (!item) return

  const elapsed = Math.floor((Date.now() - questionStartedAt.value) / 1000)
  const correctId = item.question.correct_option_id
  const chosenId = selectedOptionId.value
  if (chosenId === null) return

  localAnswers.value[item.question.id] = {
    question_id: item.question.id,
    option_id: chosenId,
    time_spent_sec: elapsed,
  }

  const isCorrect = chosenId === correctId

  lastAnswer.value = {
    is_correct: isCorrect,
    correct_option_id: correctId,
    explanation_uz: item.question.explanation_uz,
    explanation_kr: item.question.explanation_kr,
  }

  const pIdx = progress.value.findIndex(p => p.position === currentPosition.value)
  if (pIdx !== -1) {
    progress.value[pIdx] = {
      position: progress.value[pIdx].position,
      status: isCorrect ? 'correct' : 'wrong',
    }
  }

  const qIdx = questions.value.findIndex(q => q.position === currentPosition.value)
  if (qIdx !== -1) {
    questions.value[qIdx] = {
      ...questions.value[qIdx],
      answer: {
        is_answered: true,
        is_correct: isCorrect,
        is_skipped: false,
        selected_option_id: chosenId,
        correct_option_id: correctId,
        explanation_uz: item.question.explanation_uz,
        explanation_kr: item.question.explanation_kr,
      },
    }
  }

  // Exam mode: 3rd wrong answer fails the test — show modal
  if (isExam.value) {
    const wrongCount = progress.value.filter(p => p.status === 'wrong').length
    if (wrongCount > EXAM_MAX_WRONG) {
      if (autoAdvanceTimer) clearTimeout(autoAdvanceTimer)
      stopTimer()
      examFailModal.value = true
      return
    }
  }

  const allAnswered = progress.value.every(p => p.status !== 'unseen')
  if (allAnswered) {
    if (autoAdvanceTimer) clearTimeout(autoAdvanceTimer)
    autoAdvanceTimer = setTimeout(() => finalizeAndExit(), 1500)
    return
  }

  // Topic mode: auto-advance only on correct
  // Exam mode: never auto-advance — user navigates manually
  if (!isExam.value && isCorrect) {
    if (autoAdvanceTimer) clearTimeout(autoAdvanceTimer)
    autoAdvanceTimer = setTimeout(() => goNext(), 1500)
  }
}

async function finalizeAndExit() {
  if (submitting.value) return
  submitting.value = true
  stopTimer()
  try {
    const payload = { answers: Object.values(localAnswers.value) }
    const res = await apiFetch<any>(`/test/${attemptId}/submit-all`, {
      method: 'POST',
      body: payload,
    })
    if (typeof res.user_points === 'number' && auth.user) {
      auth.user.points = res.user_points
    }
    // Hand newly-unlocked achievements to the result page to celebrate
    try {
      if (res.newly_unlocked?.length) {
        sessionStorage.setItem('testRewards:' + attemptId, JSON.stringify(res.newly_unlocked))
      }
    } catch {}
    finished.value = true
    await navigateTo(`/test/result/${attemptId}`, { replace: true })
  } catch (e: any) {
    error.value = e?.data?.message || 'Xatolik'
    submitting.value = false
  }
}

function goNext() {
  const cur = currentPosition.value
  const total = attemptInfo.value?.total ?? 0
  const nextUnseen = progress.value.find(p => p.position > cur && p.status === 'unseen')
                  || progress.value.find(p => p.status === 'unseen')
  if (nextUnseen) jumpTo(nextUnseen.position)
  else if (cur < total) jumpTo(cur + 1)
}

async function finishAttempt() {
  const buffered = Object.values(localAnswers.value)
  try {
    if (buffered.length > 0) {
      await apiFetch(`/test/${attemptId}/submit-all`, { method: 'POST', body: { answers: buffered } })
    } else {
      await apiFetch(`/test/${attemptId}/finish`, { method: 'POST' })
    }
  } catch {}
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
  const total = attemptInfo.value?.total ?? 0
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
    case 'correct':  return { background: '#10b981', color: '#fff', borderColor: '#10b981', ring: 'none' }
    case 'wrong':    return { background: '#f43f5e', color: '#fff', borderColor: '#f43f5e', ring: 'none' }
    case 'skipped':  return { background: 'rgba(251,191,36,0.18)', color: '#b45309', borderColor: 'rgba(251,191,36,0.4)', ring: 'none' }
    case 'answered': return { background: 'rgba(63,88,148,0.18)', color: '#1e3a8a', borderColor: 'rgba(63,88,148,0.4)', ring: 'none' }
    default:         return { background: 'var(--surface)', color: 'var(--text-3)', borderColor: 'var(--border-1)', ring: 'none' }
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

        <div v-if="attemptInfo" class="flex items-center gap-3">
          <div class="text-sm font-medium tabular-nums" style="color: var(--text-2);">
            <span class="font-semibold" style="color: var(--text-1);">{{ currentPosition }}</span>
            <span class="mx-1" style="color: var(--text-4);">/</span>
            <span>{{ attemptInfo.total }}</span>
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
      <section v-if="attemptInfo && progress.length" class="card p-5 lg:p-6">
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
              background: tileStyleFor(p, p.position === currentPosition).background,
              color: tileStyleFor(p, p.position === currentPosition).color,
              borderColor: tileStyleFor(p, p.position === currentPosition).borderColor,
              boxShadow: tileStyleFor(p, p.position === currentPosition).ring,
            }">
            {{ p.position }}
          </button>
        </div>
        <!-- legend -->
        <div class="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-ink-500">
          <span class="flex items-center gap-1.5"><span class="w-3.5 h-3.5 rounded border border-ink-900 bg-ink-900"></span>{{ i18n.t({ uz: 'Joriy', kr: 'Жорий' }) }}</span>
          <span class="flex items-center gap-1.5"><span class="w-3.5 h-3.5 rounded bg-emerald-500"></span>{{ i18n.t({ uz: 'To\'g\'ri', kr: 'Тўғри' }) }}</span>
          <span class="flex items-center gap-1.5"><span class="w-3.5 h-3.5 rounded bg-rose-500"></span>{{ i18n.t({ uz: 'Xato', kr: 'Хато' }) }}</span>
          <span class="flex items-center gap-1.5"><span class="w-3.5 h-3.5 rounded border border-ink-200 bg-white"></span>{{ i18n.t({ uz: 'Tegilmagan', kr: 'Тегилмаган' }) }}</span>
          <span v-if="isExam" class="flex items-center gap-1.5 text-rose-600 font-medium">
            {{ i18n.t({ uz: 'Imtihon: 3 xato — yiqilish', kr: 'Имтиҳон: 3 хато — йиқилиш' }) }}
          </span>
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
          <div v-else-if="currentItem" class="space-y-5 anim-in" :key="currentItem.question.id">
            <div class="flex items-center justify-between gap-3">
              <div v-if="currentItem.question.topic" class="eyebrow">{{ currentItem.question.topic }}</div>
              <button type="button" @click="toggleBookmark(currentItem.question.id)"
                      class="ml-auto inline-flex items-center gap-1.5 px-2.5 h-8 rounded-lg text-2xs font-medium transition-colors flex-shrink-0"
                      :class="isBookmarked(currentItem.question.id) ? 'bg-amber-100 text-amber-700' : 'text-ink-500 hover:bg-ink-100'">
                <AppIcon :name="isBookmarked(currentItem.question.id) ? 'bookmark-check' : 'bookmark'" :size="14" />
                {{ isBookmarked(currentItem.question.id) ? i18n.t({ uz: 'Saqlangan', kr: 'Сақланган' }) : i18n.t({ uz: 'Saqlash', kr: 'Сақлаш' }) }}
              </button>
            </div>

            <!-- Question text (top, full width) -->
            <div class="card p-6 lg:p-7">
              <div class="text-lg lg:text-xl font-medium text-ink-900 leading-relaxed">{{ currentItem.question.text }}</div>
            </div>

            <!-- Below: image on left, options on right (stacked on mobile) -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-5 items-start">
              <div class="card p-3 md:sticky md:top-20">
                <div class="relative group cursor-zoom-in" @click="zoomedImage = currentItem.question.image || '/default-pic.png'">
                  <img :src="currentItem.question.image || '/default-pic.png'"
                       class="w-full rounded-lg border border-ink-200 max-h-[420px] object-contain bg-ink-50 transition-opacity group-hover:opacity-90">
                  <div class="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                       style="background: rgba(15, 23, 42, 0.7); color: #fff;">
                    <AppIcon name="plus" :size="16" />
                  </div>
                </div>
              </div>

              <div class="space-y-2">
                <button v-for="(o, i) in currentItem.question.options" :key="o.id"
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

    <!-- Image zoom lightbox -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0">
      <div v-if="zoomedImage"
           class="fixed inset-0 z-50 flex items-center justify-center p-4 cursor-zoom-out"
           style="background: rgba(15, 23, 42, 0.92); backdrop-filter: blur(6px);"
           @click="zoomedImage = null">
        <button @click.stop="zoomedImage = null"
                class="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center transition-colors hover:bg-white/20"
                style="background: rgba(255,255,255,0.1); color: #fff;">
          <AppIcon name="x" :size="22" />
        </button>
        <img :src="zoomedImage"
             class="max-w-full max-h-full object-contain rounded-lg shadow-2xl anim-in"
             @click.stop>
      </div>
    </Transition>

    <!-- Exam fail modal -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0">
      <div v-if="examFailModal"
           class="fixed inset-0 z-50 flex items-center justify-center p-4"
           style="background: rgba(15, 23, 42, 0.55); backdrop-filter: blur(4px);">
        <div class="card p-8 max-w-md w-full text-center anim-in" style="background: var(--surface);">
          <div class="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-5"
               style="background: rgba(244,63,94,0.12);">
            <AppIcon name="x" :size="36" class="text-rose-500" />
          </div>
          <div class="text-2xl font-bold text-ink-900 mb-2">
            {{ i18n.t({ uz: 'Yiqildingiz', kr: 'Йиқилдингиз' }) }}
          </div>
          <div class="text-sm text-ink-500 mb-6 leading-relaxed">
            {{ i18n.t({
              uz: 'Imtihonda 3 ta xato javob berdingiz. Test tugatildi.',
              kr: 'Имтиҳонда 3 та хато жавоб бердингиз. Тест тугатилди.'
            }) }}
          </div>
          <button @click="finalizeAndExit"
                  :disabled="submitting"
                  class="btn-primary btn-lg w-full">
            <span v-if="submitting" class="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            <span v-else>{{ i18n.t({ uz: 'Tushundim', kr: 'Тушундим' }) }}</span>
          </button>
        </div>
      </div>
    </Transition>
  </div>

  <template #fallback>
    <div class="min-h-screen flex items-center justify-center" style="background: var(--canvas);">
      <div class="inline-block w-6 h-6 border-2 border-ink-300 border-t-ink-900 rounded-full animate-spin"></div>
    </div>
  </template>
  </ClientOnly>
</template>
