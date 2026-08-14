<script setup lang="ts">
// Test ekrani endi dashboard qobig'i ichida turadi (chap panel + o'ng axborot
// ustuni). Ilgari yalang'och `test` layout ishlatilardi.
// `mobileChrome: false` — mobilda hamburger va bildirishnoma tugmasi CHIQMAYDI.
// Ikkisi ham `fixed top-3` va bu sahifada yuqori qatorning ustiga chiqib
// qolardi: hamburger "Chiqish" tugmasini, qo'ng'iroq esa XP chipini bosib
// turardi ("220 X…" deb qirqilib ko'rinardi). Test paytida yon menyu ham,
// bildirishnoma ham kerak emas — chiqish uchun "Chiqish" tugmasi bor.
definePageMeta({ middleware: 'auth', layout: 'default', mobileChrome: false })

const route = useRoute()
const i18n = useI18n()
const attemptId = Number(route.params.attemptId)

interface AnswerInfo {
  is_answered: boolean
  is_correct: boolean
  is_skipped: boolean
  selected_option_id: number | null
  correct_option_id: number | null
  explanation_uz: string | null
  explanation_kr: string | null
}

interface QuestionItem {
  position: number
  is_bookmarked?: boolean
  // To'g'ri javob va izoh SAVOL BILAN BIRGA keladi: `GET /test/{id}` bitta
  // so'rovda hammasini beradi va javob shu asosda BRAUZERDA tekshiriladi.
  // Shuning uchun har savol uchun alohida `POST /answer` yuborilmaydi
  // (o'lchandi: har so'rov ~300 ms, 20 savolda ~6 s kutish).
  question: {
    id: number
    text: string
    image: string | null
    topic: string | null
    options: Array<{ id: number, text: string }>
    correct_option_id: number | null
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
const exitModal = ref(false)
const zoomedImage = ref<string | null>(null)
const selectedOptionId = ref<number | null>(null)
const lastAnswer = ref<{ is_correct: boolean, correct_option_id: number | null, explanation_uz: string | null, explanation_kr: string | null } | null>(null)
const loading = ref(true)
const submitting = ref(false)
const finished = ref(false)
const finalizing = ref(false) // natija yuborilyapti — overlay ko'rsatamiz
const questionStartedAt = ref(Date.now())
const remainingSec = ref<number | null>(null)
const error = ref('')
let timerId: any = null
// Taймerни HAQIQIY vaqtga (deadline) bog'laymiz. setInterval fon tab'da
// sekinlashadi/to'xtaydi — agar har soniyada "-1" qilsak, boshqa tabga o'tganda
// vaqt to'xtab qolardi (imtihonni pauza qilib bo'lardi). deadline bilan har
// tik va tab qaytganda haqiqiy qolgan vaqt qayta hisoblanadi.
let deadlineAt: number | null = null

const auth = useAuthStore()
// AI tushuntirish faqat Premium'da. Backend ham izohni bepul foydalanuvchiga
// yubormaydi — bu yerdagi tekshiruv faqat ko'rinish uchun.
const isPremium = computed(() => auth.user?.is_premium ?? false)
const theme = useTheme()
const bookmarked = ref<Set<number>>(new Set())
const stripRef = ref<HTMLElement | null>(null)

const currentItem = computed<QuestionItem | null>(() => {
  return questions.value.find(q => q.position === currentPosition.value) ?? null
})

// Keep the active number centered in the horizontal strip as you navigate
watch(currentPosition, (pos) => {
  nextTick(() => {
    const el = stripRef.value?.querySelector(`[data-pos="${pos}"]`) as HTMLElement | null
    el?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  })
})

const isExam = computed(() => attemptInfo.value?.mode === 'exam')
const isBlitz = computed(() => attemptInfo.value?.mode === 'blitz')
const canNavigate = computed(() => !!attemptInfo.value)
const showExplanation = computed(() => !!lastAnswer.value && !isExam.value && !isBlitz.value)

function optionLetter(i: number) { return String.fromCharCode(65 + i) }
function explanationText() {
  if (!lastAnswer.value) return ''
  return i18n.locale.value === 'uz_cyrl' ? lastAnswer.value.explanation_kr : lastAnswer.value.explanation_uz
}

/* ── AI tushuntirish ──────────────────────────────────────────────────────
   Ilgari oddiy rejimlarda javob bergandan keyin izoh AVTOMATIK ochilardi.
   Endi o'sha izoh yo'q — o'rniga "AI tushuntirish" tugmasi: bosilganda AI
   javob berayotgandek yozilib chiqadi.

   Matn javob bilan BIRGA keladi (`lastAnswer.explanation_*`), ya'ni bu faqat
   lokal animatsiya — qo'shimcha so'rov yo'q. Holat savol id'i bo'yicha
   saqlanadi, shuning uchun savol almashganda o'zi tozalanadi.
   Imtihon va blitsda tushuntirish umuman yo'q (`showExplanation` false). */
const aiOchildi = ref<Record<number, boolean>>({})
const aiFikr = ref<Record<number, boolean>>({})
const aiYozilmoqda = ref<Record<number, boolean>>({})
const aiMatn = ref<Record<number, string>>({})
const aiTaymer: Record<number, ReturnType<typeof setTimeout>> = {}

function aiKorsat(qid: number) {
  if (aiOchildi.value[qid]) return
  aiOchildi.value[qid] = true
  const toliq = explanationText()
  if (!toliq) return

  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    aiMatn.value[qid] = toliq
    return
  }
  aiFikr.value[qid] = true
  aiTaymer[qid] = setTimeout(() => {
    aiFikr.value[qid] = false
    aiYozilmoqda.value[qid] = true
    aiMatn.value[qid] = ''
    let i = 0
    const qadam = () => {
      i = Math.min(toliq.length, i + 3)
      aiMatn.value[qid] = toliq.slice(0, i)
      if (i < toliq.length) aiTaymer[qid] = setTimeout(qadam, 24)
      else aiYozilmoqda.value[qid] = false
    }
    qadam()
  }, 550)
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

/**
 * Javob buferi `localStorage`da.
 *
 * SHART: javoblar endi tarmoqqa faqat urinish oxirida yuboriladi, ya'ni oraliq
 * holatning yagona nusxasi shu bufer. Usiz sahifani yangilash (yoki tasodifan
 * yopib qaytish) barcha javoblarni yo'q qilardi — ilgari buni har javobdagi
 * `POST /answer` ta'minlab turgan edi.
 */
const BUFER_KALIT = `testBuffer:${attemptId}`

function saveBuffer() {
  try { localStorage.setItem(BUFER_KALIT, JSON.stringify(localAnswers.value)) } catch {}
}
function loadBuffer() {
  try {
    const raw = localStorage.getItem(BUFER_KALIT)
    if (raw) localAnswers.value = JSON.parse(raw) || {}
  } catch { localAnswers.value = {} }
}
function clearBuffer() {
  try { localStorage.removeItem(BUFER_KALIT) } catch {}
}

/**
 * Buferdagi javoblarni savol/progress ro'yxatiga qo'llaydi — sahifa
 * yangilangandan keyin belgilangan javoblar joyida turishi uchun.
 * Server javobi (`item.answer`) ustun: u allaqachon yozilgan holat.
 */
function applyBuffer() {
  const bufer = localAnswers.value
  if (!Object.keys(bufer).length) return

  questions.value = (questions.value as QuestionItem[]).map((q) => {
    if (q.answer?.is_answered) return q
    const b = bufer[q.question.id]
    if (!b || b.option_id === null) return q
    const correctId = q.question.correct_option_id
    const isCorrect = correctId !== null && b.option_id === correctId
    return {
      ...q,
      answer: {
        is_answered: true,
        is_correct: isCorrect,
        is_skipped: false,
        selected_option_id: b.option_id,
        correct_option_id: correctId,
        explanation_uz: q.question.explanation_uz,
        explanation_kr: q.question.explanation_kr,
      },
    }
  })

  progress.value = progress.value.map((p) => {
    if (p.status !== 'unseen') return p
    const q = (questions.value as QuestionItem[]).find(x => x.position === p.position)
    if (!q?.answer?.is_answered) return p
    return { position: p.position, status: q.answer.is_correct ? 'correct' : 'wrong' }
  })

  // Seriya buferdan qayta hisoblanadi: oxirgi uzluksiz to'g'ri javoblar zanjiri
  let seriya = 0
  for (const p of progress.value) {
    if (p.status === 'correct') seriya++
    else if (p.status === 'wrong' || p.status === 'skipped') seriya = 0
  }
  correctStreak.value = seriya
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
    // Yuborilmagan javoblar buferi — sahifa yangilangan bo'lsa tiklanadi
    loadBuffer()
    applyBuffer()
    // Birinchi javobsiz savolga o'tamiz: buferdagi javoblardan keyin server
    // bergan `position` allaqachon javob berilgan savolni ko'rsatishi mumkin.
    const birinchiJavobsiz = progress.value.find(p => p.status === 'unseen')
    currentPosition.value = birinchiJavobsiz?.position ?? res.current?.position ?? 1
    remainingSec.value = attemptInfo.value?.remaining_sec ?? null
    // Server bergan qolgan vaqtdan qat'iy tugash momentini belgilaymiz
    deadlineAt = remainingSec.value !== null ? Date.now() + remainingSec.value * 1000 : null
    if (currentItem.value) hydrateFromAnswer(currentItem.value)
    startTimer()
  } catch (e: any) {
    error.value = e?.data?.message || i18n.t({ uz: 'Xatolik', kr: 'Хатолик' })
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

/** Qolgan vaqtni deadline'dan qayta hisoblaydi; tugagan bo'lsa yakunlaydi. */
function syncRemaining() {
  if (deadlineAt === null) return
  remainingSec.value = Math.max(0, Math.ceil((deadlineAt - Date.now()) / 1000))
  if (remainingSec.value === 0 && !finalizing.value) {
    stopTimer()
    finishAttempt()
  }
}

function startTimer() {
  stopTimer()
  if (deadlineAt === null) return
  syncRemaining() // darhol to'g'irlaymiz
  timerId = setInterval(syncRemaining, 1000)
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

/**
 * Javob BRAUZERDA tekshiriladi — tarmoqqa chiqmaydi, ya'ni hech qanday kutish
 * yo'q. To'g'ri javob va izoh `GET /test/{id}` bilan savol qatorida keladi.
 *
 * Nega: har javobda `POST /answer` yuborilardi va u ~300 ms olardi (o'lchandi;
 * narx backend mantiqida emas, so'rovning o'zida — `GET /me` ham 235 ms).
 * 20 savolli imtihonda bu ~6 sekund sof kutish edi.
 *
 * Javoblar `localAnswers` buferida yig'iladi va urinish oxirida BITTA
 * `POST /submit-all` bilan yoziladi (`finalizeAndExit` / `finishAttempt`).
 * Bufer `localStorage`ga ham yoziladi — sahifa yangilansa yoki foydalanuvchi
 * qaytib kelsa javoblar yo'qolmaydi (ilgari buni har javobdagi so'rov
 * ta'minlardi).
 */
function submitAnswer() {
  const item = currentItem.value
  if (!item) return

  const elapsed = Math.floor((Date.now() - questionStartedAt.value) / 1000)
  const chosenId = selectedOptionId.value
  if (chosenId === null) return

  localAnswers.value[item.question.id] = {
    question_id: item.question.id,
    option_id: chosenId,
    time_spent_sec: elapsed,
  }
  saveBuffer()
  error.value = ''

  const correctId = item.question.correct_option_id
  // `correctId === null` bo'lsa (ma'lumot to'liq emas) javobni TO'G'RI deb
  // hisoblamaymiz — server oxirida haqiqiy natijani o'zi qayta hisoblaydi.
  const isCorrect = correctId !== null && chosenId === correctId

  correctStreak.value = isCorrect ? correctStreak.value + 1 : 0

  lastAnswer.value = {
    is_correct: isCorrect,
    correct_option_id: correctId,
    explanation_uz: item.question.explanation_uz,
    explanation_kr: item.question.explanation_kr,
  }

  const pIdx = progress.value.findIndex(p => p.position === currentPosition.value)
  const pEntry = pIdx !== -1 ? progress.value[pIdx] : undefined
  if (pEntry) {
    progress.value[pIdx] = {
      position: pEntry.position,
      status: isCorrect ? 'correct' : 'wrong',
    }
  }

  const qIdx = questions.value.findIndex(q => q.position === currentPosition.value)
  const qEntry = qIdx !== -1 ? questions.value[qIdx] : undefined
  if (qEntry) {
    questions.value[qIdx] = {
      ...qEntry,
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

  // Blitz: race the clock — jump to the next question after any answer.
  // Topic/etc: auto-advance only on a correct answer. Exam: manual navigation.
  if (isBlitz.value) {
    if (autoAdvanceTimer) clearTimeout(autoAdvanceTimer)
    autoAdvanceTimer = setTimeout(() => goNext(), 450)
  } else if (!isExam.value && isCorrect) {
    if (autoAdvanceTimer) clearTimeout(autoAdvanceTimer)
    autoAdvanceTimer = setTimeout(() => goNext(), 1500)
  }
}

async function finalizeAndExit() {
  if (submitting.value) return
  submitting.value = true
  finalizing.value = true
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
    // Javoblar serverda — bufer endi kerak emas (aks holda urinish qayta
    // ochilsa eski javoblar yana qo'llanib ketardi)
    clearBuffer()
    finished.value = true
    await navigateTo(`/test/result/${attemptId}`, { replace: true })
  } catch (e: any) {
    error.value = e?.data?.message || i18n.t({ uz: 'Xatolik', kr: 'Хатолик' })
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

/* Pastdagi "Oldingi / Keyingi savol" tugmalari — `goNext` dan farqli, bular
   qat'iy qo'shni pozitsiyaga o'tadi (foydalanuvchi qayerda ekanini bilib
   tursin). Oxirgi savolda "Keyingi" o'rniga yakunlash chiqadi. */
const isFirstQuestion = computed(() => currentPosition.value <= 1)
const isLastQuestion = computed(() => currentPosition.value >= (attemptInfo.value?.total ?? 0))

function goPrevQuestion() {
  if (!isFirstQuestion.value) jumpTo(currentPosition.value - 1)
}
function goNextQuestion() {
  if (isLastQuestion.value) finalizeAndExit()
  else jumpTo(currentPosition.value + 1)
}

async function finishAttempt() {
  finalizing.value = true
  const buffered = Object.values(localAnswers.value)
  try {
    if (buffered.length > 0) {
      await apiFetch(`/test/${attemptId}/submit-all`, { method: 'POST', body: { answers: buffered } })
    } else {
      await apiFetch(`/test/${attemptId}/finish`, { method: 'POST' })
    }
    clearBuffer()
  } catch {
    // Yuborilmadi — bufer QOLADI: foydalanuvchi qaytib kelsa javoblari
    // tiklanadi va qayta yuborishga urinish mumkin bo'ladi.
  }
  await navigateTo(`/test/result/${attemptId}`, { replace: true })
}

function exitConfirm() {
  exitModal.value = true
}

async function confirmExit() {
  if (submitting.value) return
  submitting.value = true
  await finishAttempt()
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

/** Rejim uchun ajratilgan to'liq vaqt — "Taxminiy vaqt: 25:00" qatori uchun. */
const totalTimeLabel = computed(() => {
  const sec = attemptInfo.value?.time_limit_sec ?? 0
  if (!sec) return ''
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${s.toString().padStart(2, '0')}`
})

/** O'tgan vaqt ulushi — taymer kartasidagi chiziq shuni ko'rsatadi. */
const timeElapsedPercent = computed(() => {
  const total = attemptInfo.value?.time_limit_sec ?? 0
  if (!total || remainingSec.value === null) return 0
  return Math.min(100, Math.max(0, Math.round(((total - remainingSec.value) / total) * 100)))
})

/* Ketma-ket to'g'ri javoblar. `progress` bo'yicha hisoblab bo'lmaydi —
   foydalanuvchi savollar bo'ylab sakrab yuradi, ya'ni "pozitsiya tartibi"
   javob berish tartibi emas. Shuning uchun javob berilgan paytda yuritamiz. */
const correctStreak = ref(0)

const currentTopic = computed(() => currentItem.value?.question.topic || '')

/** Savol rasmi serverda yo'q bo'lsa (404) — o'rin egallovchi rasmga tushamiz. */
function onQuestionImageError(e: Event) {
  const img = e.target as HTMLImageElement | null
  if (!img || img.src.endsWith('/default-pic.png')) return
  img.src = '/default-pic.png'
}

/* ── Xatolik haqida xabar ────────────────────────────────────────────────
   Faqat foydalanuvchiga BERILGAN savol uchun ishlaydi (server ham shuni
   tekshiradi), shuning uchun tugma javob berilgandan keyin ham, oldin ham
   ko'rinaveradi — savol allaqachon urinishga kirgan. */
const reportModal = ref(false)
const reportReason = ref<'wrong_answer' | 'bad_image' | 'typo' | 'other'>('wrong_answer')
const reportComment = ref('')
const reportSending = ref(false)
const reportError = ref('')
const reportedIds = ref<Set<number>>(new Set())

const reportReasons = computed(() => [
  { value: 'wrong_answer', label: i18n.t({ uz: 'Javob noto\'g\'ri', kr: 'Жавоб нотўғри' }) },
  { value: 'bad_image', label: i18n.t({ uz: 'Rasm muammosi', kr: 'Расм муаммоси' }) },
  { value: 'typo', label: i18n.t({ uz: 'Matnda xato', kr: 'Матнда хато' }) },
  { value: 'other', label: i18n.t({ uz: 'Boshqa', kr: 'Бошқа' }) },
] as const)

function openReport() {
  reportReason.value = 'wrong_answer'
  reportComment.value = ''
  reportError.value = ''
  reportModal.value = true
}

async function sendReport() {
  const item = currentItem.value
  if (!item || reportSending.value) return
  reportSending.value = true
  reportError.value = ''
  try {
    await apiFetch(`/questions/${item.question.id}/report`, {
      method: 'POST',
      body: { reason: reportReason.value, comment: reportComment.value || null },
    })
    reportedIds.value.add(item.question.id)
    reportedIds.value = new Set(reportedIds.value)
    reportModal.value = false
  } catch (e: any) {
    reportError.value = e?.data?.message
      || i18n.t({ uz: 'Yuborib bo\'lmadi. Qayta urinib ko\'ring.', kr: 'Юбориб бўлмади. Қайта уриниб кўринг.' })
  } finally {
    reportSending.value = false
  }
}

function optionState(o: any) {
  if (!lastAnswer.value) return selectedOptionId.value === o.id ? 'selected' : 'idle'
  if (o.id === lastAnswer.value.correct_option_id) return 'correct'
  if (o.id === selectedOptionId.value) return 'wrong'
  return 'idle'
}

function tileStyleFor(p: ProgressEntry, isCurrent: boolean) {
  // Maketda joriy savol TO'LDIRILGAN ko'k kvadrat (qora halqa emas)
  if (isCurrent) {
    return {
      background: 'var(--primary)', color: 'var(--primary-contrast)', borderColor: 'var(--primary)',
      ring: 'none',
    }
  }
  switch (p.status) {
    case 'correct':  return { background: '#10b981', color: '#fff', borderColor: '#10b981', ring: 'none' }
    case 'wrong':    return { background: '#f43f5e', color: '#fff', borderColor: '#f43f5e', ring: 'none' }
    case 'skipped':  return { background: 'rgba(251,191,36,0.18)', color: theme.isDark.value ? '#fcd34d' : '#b45309', borderColor: 'rgba(251,191,36,0.4)', ring: 'none' }
    case 'answered': return { background: 'rgba(63,88,148,0.18)', color: theme.isDark.value ? '#9eaecf' : '#1e3a8a', borderColor: 'rgba(63,88,148,0.4)', ring: 'none' }
    default:         return { background: 'var(--surface)', color: 'var(--text-3)', borderColor: 'var(--border-1)', ring: 'none' }
  }
}

// Tab qayta faollashganda vaqtni darhol to'g'irlaymiz — fon'da setInterval
// sekinlashgan bo'lsa ham, qaytganда haqiqiy qolgan vaqt ko'rinadi (va agar
// yo'qligimizda tugagan bo'lsa — imtihon avtomatik yakunlanadi).
function onVisibility() {
  if (document.visibilityState === 'visible') syncRemaining()
}

onMounted(() => {
  load()
  document.addEventListener('visibilitychange', onVisibility)
})
onBeforeUnmount(() => {
  stopTimer()
  if (autoAdvanceTimer) clearTimeout(autoAdvanceTimer)
  document.removeEventListener('visibilitychange', onVisibility)
})
</script>

<template>
  <ClientOnly>
  <div v-if="finalizing" class="fixed inset-0 z-50 grid place-items-center backdrop-blur-sm"
       style="background: color-mix(in srgb, var(--canvas) 82%, transparent);">
    <!-- Natija yuborilyapti (vaqt tugagach submit-all) — ekran qotib qolmasin -->
    <div class="text-center">
      <svg class="w-8 h-8 mx-auto animate-spin" viewBox="0 0 20 20" fill="none" style="color: var(--accent);">
        <circle cx="10" cy="10" r="7.5" stroke="currentColor" stroke-width="2" stroke-opacity="0.25"/>
        <path d="M17.5 10A7.5 7.5 0 0 0 10 2.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
      <div class="mt-3 text-sm font-medium" style="color: var(--text-2);">
        {{ i18n.t({ uz: 'Natija hisoblanmoqda...', kr: 'Натижа ҳисобланмоқда...' }) }}
      </div>
    </div>
  </div>

  <!-- `play-ai` — AI tushuntirish tokenlari shu ildizda aniqlanadi -->
  <div class="play-ai min-h-screen" style="background: var(--canvas);">
    <!-- Konteyner /tickets, /topics, /belgilar va natija sahifasi bilan AYNAN
         bir xil: ilgari `max-w-[1400px]` + kichik padding edi va ikki yonda
         keraksiz bo'sh joy qolardi. -->
    <div class="mx-auto w-full max-w-[1800px] px-4 sm:px-6 lg:px-8 xl:px-10 pt-6 lg:pt-8 pb-16 md:pb-12 flex flex-col gap-3 sm:gap-4">

      <!-- Yuqori qator: chiqish · savol hisobi · XP -->
      <div class="flex items-center gap-2 sm:gap-3">
        <button @click="exitConfirm" class="play-chip play-chip-btn shrink-0">
          <AppIcon name="chev-l" :size="18" />
          <span class="hidden sm:inline">{{ i18n.t({ uz: 'Chiqish', kr: 'Чиқиш' }) }}</span>
        </button>

        <!-- Xatcho'p maketda yuqori qatorda YO'Q — u savol kartasining o'ng
             tepasiga ko'chirildi (funksiya saqlanadi, maket buzilmaydi). -->

        <div v-if="attemptInfo" class="flex-1 text-center text-base font-semibold tabular-nums" style="color: var(--text-1);">
          {{ currentPosition }}<span class="mx-1 font-normal" style="color: var(--text-4);">/</span><span style="color: var(--text-3);">{{ attemptInfo.total }}</span>
        </div>
        <div v-else class="flex-1"></div>

        <!-- Taymer o'ng ustunda turadi; tor ekranda ustun pastga tushgani uchun
             shu yerda ham ko'rsatamiz. -->
        <div v-if="remainingSec !== null" class="play-chip play-chip-narrow shrink-0 tabular-nums"
             :style="timerCritical ? { color: 'var(--danger-ink)', borderColor: 'var(--danger)' } : undefined">
          <AppIcon name="clock" :size="15" />
          {{ timerLabel }}
        </div>

        <div v-if="auth.user" class="play-chip shrink-0">
          <AppIcon name="trophy" :size="14" class="text-amber-500" />
          <span class="font-semibold tabular-nums" style="color: var(--text-1);">
            {{ (auth.user.points ?? 0).toLocaleString() }} XP
          </span>
        </div>
      </div>

      <!-- Savol raqamlari lentasi — maketda OQ KARTA ichida turadi -->
      <div v-if="attemptInfo && progress.length" ref="stripRef" class="card strip-card overflow-x-auto scrollbar-thin">
        <div class="flex gap-2 w-max min-w-full">
          <button v-for="p in progress" :key="p.position" :data-pos="p.position"
            :disabled="!canNavigate" @click="jumpTo(p.position)"
            class="strip-tile shrink-0"
            :class="canNavigate ? 'cursor-pointer' : 'cursor-not-allowed'"
            :style="{
              background: tileStyleFor(p, p.position === currentPosition).background,
              color: tileStyleFor(p, p.position === currentPosition).color,
              borderColor: tileStyleFor(p, p.position === currentPosition).borderColor,
              boxShadow: tileStyleFor(p, p.position === currentPosition).ring,
            }">
            {{ p.position }}
          </button>
        </div>
      </div>

      <!-- Ikki ustun: savol · axborot paneli -->
      <!-- `grid-cols-1` SHART: usiz mobilda hech qanday ustun shabloni yo'q va
           YASHIRIN `auto` ustun paydo bo'ladi. `auto` trek `max-content`ga
           cho'ziladi va konteyner kengligi bilan CHEKLANMAYDI — o'lchandi:
           375px ekranda savol kartasi 467px bo'lib, sahifa 483px ga toshib
           ketardi (kartalarning o'ng cheti ekrandan chiqib qolardi).
           Tailwind `grid-cols-1` = `repeat(1, minmax(0, 1fr))`, ya'ni trek
           konteynerga qisiladi. -->
      <div class="grid grid-cols-1 gap-3 sm:gap-4 items-start lg:grid-cols-[minmax(0,1fr)_340px]">
        <div class="min-w-0 flex flex-col gap-3 sm:gap-4">
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
            <div class="text-rose-700 font-medium mb-4">{{ error }}</div>
            <NuxtLink to="/" class="btn-primary">{{ i18n.t({ uz: 'Bosh sahifaga', kr: 'Бош саҳифага' }) }}</NuxtLink>
          </div>

          <!-- Question -->
          <div v-else-if="currentItem" class="card p-4 sm:p-6 space-y-4 anim-in" :key="currentItem.question.id">
            <div class="flex items-start gap-3">
              <div v-if="currentItem.question.topic" class="play-eyebrow flex-1 min-w-0">{{ currentItem.question.topic }}</div>
              <div v-else class="flex-1"></div>
              <!-- Xatcho'p: maketning yuqori qatorida yo'q, shuning uchun shu
                   yerda — kartaning bo'sh o'ng tepasida. -->
              <button type="button" class="q-bookmark -mt-1"
                      :aria-label="i18n.t({ uz: 'Saqlash', kr: 'Сақлаш' })"
                      :aria-pressed="isBookmarked(currentItem.question.id)"
                      @click="toggleBookmark(currentItem.question.id)">
                <AppIcon :name="isBookmarked(currentItem.question.id) ? 'bookmark-on' : 'bookmark'" :size="17" />
              </button>
            </div>

            <!-- Question text -->
            <h1 class="text-lg sm:text-xl font-semibold leading-snug" style="color: var(--text-1);">{{ currentItem.question.text }}</h1>

            <!-- Rasm: haqiqiy rasm bo'lsa o'sha, bo'lmasa default o'rin egallovchi
                 rasm. @error — savol rasmi fayli serverda yo'q bo'lsa (404) ham
                 buzuq belgi o'rniga default rasm chiqadi. -->
            <div class="relative cursor-zoom-in"
                 @click="zoomedImage = currentItem.question.image || '/default-pic.png'">
              <img :src="currentItem.question.image || '/default-pic.png'"
                   @error="onQuestionImageError"
                   :alt="i18n.t({ uz: 'Savol rasmi', kr: 'Савол расми' })"
                   class="w-full rounded-xl border max-h-[40vh] sm:max-h-[340px] object-contain"
                   style="background: var(--surface-inset); border-color: var(--border-soft);">
              <!-- Maketda OQ doira + kattalashtirish ikonkasi (to'q doira +
                   "plus" emas) -->
              <div class="q-zoom">
                <AppIcon name="expand" :size="15" />
              </div>
            </div>

            <!-- Options -->
            <div class="space-y-2">
              <button v-for="(o, i) in currentItem.question.options" :key="o.id"
                      :disabled="!!lastAnswer || submitting"
                      @click="onOptionClick(o.id)"
                      class="q-opt disabled:cursor-not-allowed"
                      :class="`q-opt-${optionState(o)}`">
                <!-- Harf plitasi: maketda LAVANDA fon + siyohrang harf (kulrang
                     emas) va kattaroq — 2rem. -->
                <span class="q-letter" :class="`q-letter-${optionState(o)}`">{{ optionLetter(i) }}</span>
                <span class="flex-1 text-sm sm:text-base leading-snug"
                      :class="optionState(o) === 'correct' ? 'text-emerald-900 font-medium' :
                              optionState(o) === 'wrong' ? 'text-rose-900' : 'text-ink-900'">
                  {{ o.text }}
                </span>
                <span v-if="optionState(o) === 'correct'" class="text-emerald-600 flex-shrink-0"><AppIcon name="check" :size="20" /></span>
                <span v-else-if="optionState(o) === 'wrong'" class="text-rose-500 flex-shrink-0"><AppIcon name="x" :size="20" /></span>
              </button>
            </div>

          </div>

          <!-- Pastki navigatsiya -->
          <!-- Maketda tugmalar OQ KARTA ichida (yalang'och emas) -->
          <div v-if="!loading && !error && attemptInfo" class="card nav-card flex items-center gap-3">
            <button type="button" class="play-nav-btn" :disabled="isFirstQuestion" @click="goPrevQuestion">
              <AppIcon name="chev-l" :size="17" />
              {{ i18n.t({ uz: 'Oldingi savol', kr: 'Олдинги савол' }) }}
            </button>
            <div class="flex-1"></div>
            <button type="button" class="play-nav-btn play-nav-primary" @click="goNextQuestion">
              {{ isLastQuestion
                ? i18n.t({ uz: 'Testni yakunlash', kr: 'Тестни якунлаш' })
                : i18n.t({ uz: 'Keyingi savol', kr: 'Кейинги савол' }) }}
              <AppIcon :name="isLastQuestion ? 'check' : 'chev-r'" :size="17" />
            </button>
          </div>
        </div>

        <!-- ── O'ng ustun: taymer, savol ma'lumoti, izoh ─────────────────── -->
        <!-- min-w-0: ichida uzun kategoriya nomi bor, usiz ustun min-content
             kengligiga cho'zilib gridni toshirishi mumkin -->
        <aside v-if="attemptInfo" class="min-w-0 flex flex-col gap-3 lg:sticky lg:top-5">
          <!-- Taymer (faqat vaqtli rejimlarda).
               MOBILDA CHIQMAYDI: tor ekranda o'ng ustun savol ostiga tushadi va
               yuqoridagi taymer chipi bilan bir sahifada IKKI marta vaqt
               ko'rsatilardi ("23:41" tepada chip, pastda katta karta). -->
          <div v-if="remainingSec !== null" class="dup-mobile card p-4 sm:p-5">
            <div class="flex items-center gap-2 mb-2.5" style="color: var(--text-3);">
              <AppIcon name="clock" :size="16" />
              <span class="text-[13px] font-medium">{{ i18n.t({ uz: 'Qolgan vaqt', kr: 'Қолган вақт' }) }}</span>
            </div>
            <div class="text-[34px] leading-none font-bold tabular-nums"
                 :style="{ color: timerCritical ? 'var(--danger-ink)' : 'var(--text-1)' }">
              {{ timerLabel }}
            </div>
            <div class="mt-3.5 h-1.5 rounded-full overflow-hidden" style="background: var(--surface-inset);">
              <div class="h-full rounded-full transition-all duration-700"
                   :style="{
                     width: timeElapsedPercent + '%',
                     background: timerCritical ? 'var(--danger)' : 'var(--grad-progress)',
                   }"></div>
            </div>
            <div class="mt-2 text-xs" style="color: var(--text-4);">
              {{ i18n.t({ uz: 'Taxminiy vaqt', kr: 'Тахминий вақт' }) }}: {{ totalTimeLabel }}
            </div>
          </div>

          <!-- Savol ma'lumoti.
               MOBILDA BUTUNLAY CHIQMAYDI: kategoriya savol kartasining
               tepasida, "7 / 20" va XP yuqori qatordagi chiplarda turibdi,
               seriya esa test yechayotganda diqqatni tortadigan ortiqcha
               ma'lumot — u natija sahifasida ko'rinadi. -->
          <div class="card p-2 dup-mobile">
            <div v-if="currentTopic" class="rail-row dup-mobile">
              <span class="rail-tile rail-tile-primary">
                <AppIcon name="clipboard" :size="15" />
              </span>
              <span class="rail-text">
                <span class="rail-label">{{ i18n.t({ uz: 'Kategoriya', kr: 'Категория' }) }}</span>
                <span class="rail-value">{{ currentTopic }}</span>
              </span>
            </div>
            <div class="rail-row dup-mobile">
              <span class="rail-tile rail-tile-violet">
                <AppIcon name="circle-dot" :size="15" />
              </span>
              <span class="rail-text">
                <span class="rail-label">{{ i18n.t({ uz: 'Savol', kr: 'Савол' }) }}</span>
                <span class="rail-value tabular-nums">{{ currentPosition }} / {{ attemptInfo.total }}</span>
              </span>
            </div>
            <div class="rail-row">
              <span class="rail-tile rail-tile-amber">
                <AppIcon name="flame" :size="15" />
              </span>
              <span class="rail-text">
                <span class="rail-label">{{ i18n.t({ uz: 'To\'g\'ri javoblar seriyasi', kr: 'Тўғри жавоблар серияси' }) }}</span>
                <span class="rail-value tabular-nums">{{ correctStreak }}</span>
              </span>
            </div>
            <div v-if="auth.user" class="rail-row dup-mobile">
              <span class="rail-tile rail-tile-emerald">
                <AppIcon name="star" :size="15" />
              </span>
              <span class="rail-text">
                <span class="rail-label">{{ i18n.t({ uz: 'Umumiy XP', kr: 'Умумий XP' }) }}</span>
                <span class="rail-value tabular-nums">{{ (auth.user.points ?? 0).toLocaleString() }} XP</span>
              </span>
            </div>
          </div>

          <!-- Imtihonda — qoidalar; boshqa rejimlarda — AI tushuntirish -->
          <div v-if="isExam" class="rail-note">
            <div class="rail-note-head">
              <AppIcon name="graduation" :size="16" />
              {{ i18n.t({ uz: 'Imtihon haqida', kr: 'Имтиҳон ҳақида' }) }}
            </div>
            <!-- Matn maketdagi aynan uch qator -->
            <p>{{ i18n.t({ uz: 'Rasmiy imtihon formatida tayyorlangan.', kr: 'Расмий имтиҳон форматида тайёрланган.' }) }}</p>
            <p>{{ i18n.t({ uz: 'Har bir savol uchun vaqt cheklovi mavjud.', kr: 'Ҳар бир савол учун вақт чеклови мавжуд.' }) }}</p>
            <p>{{ i18n.t({ uz: 'Diqqat bilan o\'qing va to\'g\'ri javobni tanlang.', kr: 'Диққат билан ўқинг ва тўғри жавобни танланг.' }) }}</p>
          </div>

          <template v-else-if="currentItem">
            <!-- Qulf tekshiruvi BIRINCHI: bepul foydalanuvchiga backend izohni
                 umuman yubormaydi, ya'ni `explanationText()` bo'sh bo'ladi.
                 Tartib teskari bo'lsa qulf o'rniga "javob berganingizdan
                 keyin ochiladi" degan yolg'on va'da chiqib qolardi. -->
            <NuxtLink v-if="!isPremium" to="/pricing"
                      class="ai-btn ai-btn-lock w-full justify-center">
              <AppIcon name="lock" :size="15" />
              {{ i18n.t({ uz: 'AI tushuntirish — Premium', kr: 'AI тушунтириш — Премиум' }) }}
            </NuxtLink>

            <!-- Javob berilgunga qadar tushuntirish yo'q — joy bo'sh qolmasin -->
            <div v-else-if="!showExplanation || !explanationText()" class="rail-note rail-note-muted">
              <div class="rail-note-head">
                <AppIcon name="ai" :size="16" />
                {{ i18n.t({ uz: 'AI tushuntirish', kr: 'AI тушунтириш' }) }}
              </div>
              <p>{{ i18n.t({
                uz: 'Javob berganingizdan keyin tushuntirish shu yerda ochiladi.',
                kr: 'Жавоб берганингиздан кейин тушунтириш шу ерда очилади.'
              }) }}</p>
            </div>

            <button v-else-if="!aiOchildi[currentItem.question.id]"
                    type="button" class="ai-btn w-full justify-center"
                    @click="aiKorsat(currentItem.question.id)">
              <AppIcon name="ai" :size="16" />
              {{ i18n.t({ uz: 'AI tushuntirish', kr: 'AI тушунтириш' }) }}
            </button>

            <div v-else class="ai-box">
              <div class="ai-head">
                <AppIcon name="ai" :size="15" />
                {{ i18n.t({ uz: 'AI tushuntirish', kr: 'AI тушунтириш' }) }}
              </div>
              <div v-if="aiFikr[currentItem.question.id]" class="ai-fikr" role="status">
                <span class="ai-dots"><i /><i /><i /></span>
                {{ i18n.t({ uz: 'AI o\'ylanmoqda…', kr: 'AI ўйланмоқда…' }) }}
              </div>
              <p v-else class="ai-text">{{
                aiYozilmoqda[currentItem.question.id] ? aiMatn[currentItem.question.id] : explanationText()
              }}<span v-if="aiYozilmoqda[currentItem.question.id]" class="ai-caret" /></p>
            </div>
          </template>

          <!-- Xatolik haqida xabar -->
          <button type="button" class="rail-report" :disabled="!currentItem"
                  @click="openReport">
            <AppIcon name="flag" :size="15" />
            <span v-if="currentItem && reportedIds.has(currentItem.question.id)">
              {{ i18n.t({ uz: 'Xabaringiz yuborildi', kr: 'Хабарингиз юборилди' }) }}
            </span>
            <span v-else>{{ i18n.t({ uz: 'Xatolik haqida xabar berish', kr: 'Хатолик ҳақида хабар бериш' }) }}</span>
          </button>
        </aside>
      </div>
    </div>

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
        <button @click.stop="zoomedImage = null" :aria-label="i18n.t({ uz: 'Yopish', kr: 'Ёпиш' })"
                class="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center transition-colors hover:bg-white/20"
                style="background: rgba(255,255,255,0.1); color: #fff;">
          <AppIcon name="x" :size="22" />
        </button>
        <img :src="zoomedImage"
             @error="onQuestionImageError"
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

    <!-- Xatolik haqida xabar berish -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0">
      <div v-if="reportModal"
           class="fixed inset-0 z-50 flex items-center justify-center p-4"
           style="background: rgba(15, 23, 42, 0.55); backdrop-filter: blur(4px);"
           @click.self="reportModal = false">
        <div class="card p-6 max-w-md w-full anim-in" style="background: var(--surface);">
          <div class="flex items-center gap-2.5 mb-1">
            <AppIcon name="flag" :size="18" style="color: var(--text-2);" />
            <div class="text-lg font-semibold" style="color: var(--text-1);">
              {{ i18n.t({ uz: 'Xatolik haqida xabar berish', kr: 'Хатолик ҳақида хабар бериш' }) }}
            </div>
          </div>
          <p class="text-sm mb-4" style="color: var(--text-3);">
            {{ i18n.t({
              uz: 'Nima noto\'g\'ri ekanini belgilang — savolni tekshirib chiqamiz.',
              kr: 'Нима нотўғри эканини белгиланг — саволни текшириб чиқамиз.'
            }) }}
          </p>

          <div class="flex flex-col gap-1.5 mb-4">
            <label v-for="r in reportReasons" :key="r.value" class="report-option"
                   :class="{ 'report-option-on': reportReason === r.value }">
              <input type="radio" name="report-reason" class="sr-only"
                     :value="r.value" v-model="reportReason">
              <span class="report-dot"><span v-if="reportReason === r.value" class="report-dot-fill" /></span>
              {{ r.label }}
            </label>
          </div>

          <textarea v-model="reportComment" rows="3" maxlength="500"
                    class="input w-full resize-none"
                    :placeholder="i18n.t({ uz: 'Qo\'shimcha izoh (ixtiyoriy)', kr: 'Қўшимча изоҳ (ихтиёрий)' })"></textarea>

          <div v-if="reportError" class="text-sm mt-2" style="color: var(--danger-ink);">{{ reportError }}</div>

          <div class="flex gap-3 mt-5">
            <button type="button" class="btn-ghost btn-lg flex-1" :disabled="reportSending"
                    @click="reportModal = false">
              {{ i18n.t({ uz: 'Bekor qilish', kr: 'Бекор қилиш' }) }}
            </button>
            <button type="button" class="btn-primary btn-lg flex-1" :disabled="reportSending"
                    @click="sendReport">
              <span v-if="reportSending" class="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              <span v-else>{{ i18n.t({ uz: 'Yuborish', kr: 'Юбориш' }) }}</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Exit confirmation modal -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0">
      <div v-if="exitModal"
           class="fixed inset-0 z-50 flex items-center justify-center p-4"
           style="background: rgba(15, 23, 42, 0.55); backdrop-filter: blur(4px);"
           @click.self="exitModal = false">
        <div class="card p-8 max-w-md w-full text-center anim-in" style="background: var(--surface);">
          <div class="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-5"
               style="background: var(--surface-inset);">
            <AppIcon name="log-out" :size="32" style="color: var(--text-2);" />
          </div>
          <div class="text-2xl font-bold text-ink-900 mb-2">
            {{ i18n.t({ uz: 'Testdan chiqasizmi?', kr: 'Тестдан чиқасизми?' }) }}
          </div>
          <div class="text-sm text-ink-500 mb-6 leading-relaxed">
            {{ i18n.t({ uz: 'Natija saqlanadi.', kr: 'Натижа сақланади.' }) }}
          </div>
          <div class="flex gap-3">
            <button @click="exitModal = false"
                    :disabled="submitting"
                    class="btn-ghost btn-lg flex-1">
              {{ i18n.t({ uz: 'Bekor qilish', kr: 'Бекор қилиш' }) }}
            </button>
            <button @click="confirmExit"
                    :disabled="submitting"
                    class="btn-primary btn-lg flex-1">
              <span v-if="submitting" class="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              <span v-else>{{ i18n.t({ uz: 'Chiqish', kr: 'Чиқиш' }) }}</span>
            </button>
          </div>
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

<style scoped>
/* ── AI tushuntirish ──────────────────────────────────────────────────────
   Natija sahifasi bilan bir xil ohang (lavanda) — foydalanuvchi ikkala
   joyda ham bir narsani ko'rsin. */
.play-ai {
  --ai-bg: #eef2ff;
  --ai-border: rgba(99, 102, 241, 0.20);
  --ai-ink: #3730a3;
  --ai-accent: #4f46e5;
  /* `--ok-soft` global to'plamda yo'q (faqat --danger-soft/--warn-soft bor).
     Qorong'ida to'ldirish SHAFFOF: to'q sirt ustida qattiq rang "yamoq". */
  --ok-soft2: #d1fae5;
}
.dark .play-ai {
  --ai-bg: rgba(99, 102, 241, 0.12);
  --ai-border: rgba(129, 140, 248, 0.30);
  --ai-ink: #c7d2fe;
  --ai-accent: #a5b4fc;
  --ok-soft2: rgba(16, 185, 129, 0.16);
}

/* ── Yuqori qator ─────────────────────────────────────────────────────── */
.play-chip {
  display: inline-flex; align-items: center; gap: 0.4rem;
  height: 2.75rem; padding: 0 0.9rem;
  border-radius: 0.75rem;
  background: var(--surface); border: 1px solid var(--border-1);
  box-shadow: var(--shadow-soft);
  font-size: 0.875rem; font-weight: 500; color: var(--text-2);
}
.play-chip-btn { transition: border-color 0.15s, color 0.15s; }
.play-chip-btn:hover { border-color: var(--text-4); color: var(--text-1); }

/* Taymer chipi FAQAT tor ekranda — keng ekranda o'ng ustundagi taymer
   kartasi bor, maketda yuqori qatorda taymer yo'q.
   DIQQAT: Tailwind'ning `lg:hidden` bu yerda ISHLAMAYDI — scoped uslub
   Tailwind utilitalaridan KEYIN kiritiladi va `.play-chip { display:
   inline-flex }` uni bosib ketadi. Shuning uchun o'z media so'rovimiz. */
@media (min-width: 1024px) {
  .play-chip-narrow { display: none; }
}

/* Tor ekranda o'ng ustun savol OSTIGA tushadi va yuqori qatordagi chiplar
   bilan bir xil ma'lumotni ikkinchi marta ko'rsatardi (vaqt, savol raqami,
   XP, kategoriya). `.dup-mobile` shu takrorlarni faqat mobilda yashiradi.
   Qoidalar uslub blokining OXIRIDA — `.dup-mobile` ni ham Tailwind
   utilitalari, ham keyinroq e'lon qilingan `.rail-row { display: flex }`
   bosib ketmasligi uchun (o'lchandi: `.rail-row` va `.dup-mobile` aniqligi
   teng, keyingisi g'olib chiqib qatorlar mobilda ham chiqib turardi). */
.dup-mobile,
.rail-row.dup-mobile { display: none; }
@media (min-width: 1024px) {
  .dup-mobile { display: block; }
  .rail-row.dup-mobile { display: flex; }
}

/* ── Savol raqamlari ──────────────────────────────────────────────────── */
.strip-card { padding: 0.75rem; }
.strip-tile {
  width: 2.75rem; height: 2.75rem;
  display: flex; align-items: center; justify-content: center;
  border-radius: 0.75rem; border: 1px solid;
  font-size: 0.875rem; font-weight: 600; font-variant-numeric: tabular-nums;
  transition: transform 0.12s, box-shadow 0.12s;
}
.strip-tile:hover:not(:disabled) { transform: translateY(-1px); }

.play-eyebrow {
  font-size: 0.6875rem; font-weight: 700; letter-spacing: 0.09em;
  text-transform: uppercase; color: var(--primary-ink);
}

/* ── Savol kartasi ─────────────────────────────────────────────────────── */
.q-bookmark {
  flex-shrink: 0; display: grid; place-items: center;
  width: 1.875rem; height: 1.875rem; border-radius: 0.5rem;
  color: var(--text-4);
  transition: background 0.15s, color 0.15s;
}
/* Ko.rinishi 30px qoladi (savol sarlavhasi yonida ixcham), lekin barmoq bilan
   bosish uchun 36px zona kerak — pseudo-element joy egallamaydi. */
.q-bookmark { position: relative; }
.q-bookmark::after { content: ''; position: absolute; inset: -3px; }
.q-bookmark:hover { background: var(--surface-inset); color: var(--text-2); }
.q-bookmark[aria-pressed="true"] { color: var(--primary-ink); }

/* Maketda OQ doira, ichida kattalashtirish ikonkasi */
.q-zoom {
  position: absolute; top: 0.625rem; right: 0.625rem;
  display: grid; place-items: center;
  width: 2.25rem; height: 2.25rem; border-radius: 9999px;
  background: var(--surface); color: var(--text-2);
  box-shadow: var(--shadow-card);
}

/* ── Javob variantlari ─────────────────────────────────────────────────── */
.q-opt {
  display: flex; align-items: center; gap: 0.75rem;
  width: 100%; padding: 0.875rem 1rem;
  border-radius: 0.75rem; border: 1px solid var(--border-1);
  background: var(--surface); text-align: left;
  transition: border-color 0.15s, background 0.15s;
}
.q-opt:hover:not(:disabled) { border-color: var(--primary); }
.q-opt-selected { border-color: var(--text-1); background: var(--surface-hover); }
.q-opt-correct  { border-color: var(--ok);     background: var(--ok-soft2); }
.q-opt-wrong    { border-color: var(--danger); background: var(--danger-soft); }

/* Harf plitasi — maketda lavanda fon + siyohrang harf, 2rem */
.q-letter {
  flex-shrink: 0; display: grid; place-items: center;
  width: 2rem; height: 2rem; border-radius: 0.5rem;
  font-size: 0.875rem; font-weight: 700;
  background: var(--primary-soft); color: var(--primary-ink);
}
.q-letter-selected { background: var(--text-1); color: var(--surface); }
.q-letter-correct  { background: var(--ok-surface-2); color: #fff; }
.q-letter-wrong    { background: var(--danger); color: #fff; }

/* ── Pastki navigatsiya ───────────────────────────────────────────────── */
.nav-card { padding: 0.75rem; }
.play-nav-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem;
  height: 3rem; padding: 0 1.25rem;
  border-radius: 0.75rem;
  background: var(--surface); border: 1px solid var(--border-1);
  box-shadow: var(--shadow-soft);
  font-size: 0.9375rem; font-weight: 600; color: var(--text-2);
  /* Matn ikki qatorga SINMASIN: 375px da kartaga 319px qoladi va "Oldingi
     savol" / "Keyingi savol" 1.25rem padding bilan sig'masdi — "Oldingi"
     va "savol" alohida qatorga tushib tugmalar ikki barobar balandlashardi. */
  white-space: nowrap;
  transition: border-color 0.15s, color 0.15s, filter 0.15s;
}
/* Strelka ikonkasi SIQILMASIN: `flex: 1 1 0` bilan tugma qisilganda ikonka
   ham 0 kenglikka tushib butunlay yo'qolib qolardi (o'lchandi). Matn `nowrap`
   bo'lgani uchun u baribir qisilmaydi. */
.play-nav-btn > * { flex-shrink: 0; }

/* Tor ekranda ikkalasi teng bo'linib butun kenglikni oladi (o'rtadagi bo'sh
   ajratgich mobilda keraksiz). Padding 1.25rem → 0.75rem va shrift 15 → 14:
   375px da kartaga 319px qoladi, standart o'lchamlarda ikki tugma 330px
   talab qilib ikki qatorga sinardi. */
@media (max-width: 420px) {
  .play-nav-btn { flex: 1 1 0; padding: 0 0.75rem; font-size: 0.875rem; }
}
.play-nav-btn:hover:not(:disabled) { border-color: var(--text-4); color: var(--text-1); }
.play-nav-btn:disabled { opacity: 0.45; cursor: not-allowed; }

/* `--primary` EMAS, `--primary-strong`: #4f6ef0 oq matn ostida 4.36:1
   (AA 4.5:1 dan past), #3f5ad8 esa 5.72:1 — ko'rinishi bir xil. */
.play-nav-primary {
  background: var(--primary-strong); border-color: var(--primary-strong);
  color: var(--primary-contrast);
}
.play-nav-primary:hover:not(:disabled) {
  background: var(--primary); border-color: var(--primary);
  color: var(--primary-contrast);
}

/* ── O'ng ustun ───────────────────────────────────────────────────────── */
.rail-row {
  display: flex; align-items: center; gap: 0.7rem;
  padding: 0.6rem 0.65rem; border-radius: 0.65rem;
}
.rail-row + .rail-row { margin-top: 0.1rem; }
/* Maketda DOIRA (yumaloqlangan kvadrat emas) */
.rail-tile {
  width: 2rem; height: 2rem; flex-shrink: 0;
  display: inline-flex; align-items: center; justify-content: center;
  border-radius: 9999px;
}
/* Ohanglar `IconTile` bilan bir xil. Qorong'i rejimda och fon + to'q matn
   ko'rinmay qoladi, shuning uchun ikkalasi ham almashadi. */
.rail-tile-primary  { background: var(--primary-soft); color: var(--primary-ink); }
.rail-tile-violet   { background: #ede9fe; color: #6d28d9; }
.rail-tile-amber    { background: #fef3c7; color: #b45309; }
.rail-tile-emerald  { background: #d1fae5; color: #047857; }
.dark .rail-tile-violet  { background: rgba(139, 92, 246, 0.18); color: #c4b5fd; }
.dark .rail-tile-amber   { background: rgba(251, 191, 36, 0.18); color: #fcd34d; }
.dark .rail-tile-emerald { background: rgba(16, 185, 129, 0.18); color: #6ee7b7; }
.rail-text { display: flex; flex-direction: column; min-width: 0; gap: 0.05rem; }
/* `--text-4` oq fonda 3.40:1 beradi — 11px yorliq uchun AA 4.5:1 dan past */
.rail-label { font-size: 0.6875rem; color: var(--text-3); line-height: 1.2; }
.rail-value {
  font-size: 0.875rem; font-weight: 600; color: var(--text-1); line-height: 1.3;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}

.rail-note {
  padding: 0.95rem 1rem; border-radius: 0.9rem;
  background: var(--primary-soft); border: 1px solid var(--primary-ring);
}
.rail-note-head {
  display: flex; align-items: center; gap: 0.45rem; margin-bottom: 0.5rem;
  font-size: 0.875rem; font-weight: 700; color: var(--primary-ink);
}
.rail-note p { font-size: 0.8125rem; line-height: 1.6; color: var(--text-2); }
.rail-note-muted {
  background: var(--surface-soft); border-color: var(--border-1);
}
.rail-note-muted .rail-note-head { color: var(--text-2); }

/* `--text-4` 3.03:1 berardi — bu bosiladigan matn, AA 4.5:1 kerak */
.rail-report {
  display: flex; align-items: center; gap: 0.5rem;
  padding: 0.6rem 0.4rem; border-radius: 0.6rem;
  font-size: 0.8125rem; color: var(--text-3);
  transition: color 0.15s;
}
.rail-report:hover:not(:disabled) { color: var(--text-2); }
.rail-report:disabled { opacity: 0.5; cursor: not-allowed; }

/* ── Xabar berish oynasi ──────────────────────────────────────────────── */
.report-option {
  display: flex; align-items: center; gap: 0.6rem;
  padding: 0.65rem 0.8rem; border-radius: 0.65rem;
  border: 1px solid var(--border-1); cursor: pointer;
  font-size: 0.875rem; color: var(--text-2);
  transition: border-color 0.15s, background 0.15s;
}
.report-option:hover { border-color: var(--text-4); }
.report-option-on {
  border-color: var(--primary); background: var(--primary-soft); color: var(--primary-ink);
  font-weight: 600;
}
.report-dot {
  width: 1.05rem; height: 1.05rem; flex-shrink: 0;
  border-radius: 9999px; border: 1.5px solid var(--border-1);
  display: inline-flex; align-items: center; justify-content: center;
}
.report-option-on .report-dot { border-color: var(--primary); }
.report-dot-fill {
  width: 0.5rem; height: 0.5rem; border-radius: 9999px; background: var(--primary);
}

.ai-btn {
  display: inline-flex; align-items: center; gap: 0.45rem;
  padding: 0.6rem 0.9rem;
  border-radius: 0.375rem;
  border: 1px solid var(--ai-border); background: var(--surface);
  font-size: 0.875rem; font-weight: 600; color: var(--ai-accent);
  transition: border-color 0.15s;
}
/* Lavanda to'ldirish — oq fonli ramkali tugma qo'shni "Xatolik haqida
   xabar berish" havolasidan ajralib turmasdi va AI ekani bilinmasdi.
   Natija sahifasidagi tugma bilan ham bir xil bo'ldi. */
.ai-btn { background: var(--ai-bg); border-radius: 0.625rem; }
/* Qulflangan variant: sariq (qulf ranglari), lavanda emas — u "ochiq AI"
   degan taassurot berardi. */
.ai-btn-lock {
  background: var(--warn-soft);
  border-color: color-mix(in srgb, var(--warn) 45%, transparent);
  color: var(--warn-ink);
}
.dark .ai-btn-lock { color: var(--warn); }
.ai-btn:hover { border-color: var(--ai-accent); filter: brightness(0.98); }

.ai-box {
  padding: 0.875rem 1rem; border-radius: 0.75rem;
  background: var(--ai-bg); border: 1px solid var(--ai-border);
}
.ai-head {
  display: flex; align-items: center; gap: 0.4rem; margin-bottom: 0.5rem;
  font-size: 0.8125rem; font-weight: 600; color: var(--ai-accent);
}
.ai-text { font-size: 0.875rem; line-height: 1.7; color: var(--ai-ink); white-space: pre-line; }

.ai-caret {
  display: inline-block; width: 2px; height: 0.9em; margin-left: 2px;
  background: var(--ai-accent); vertical-align: middle;
  animation: aiYonish 1s steps(2) infinite;
}
@keyframes aiYonish { 0%, 100% { opacity: 1 } 50% { opacity: 0 } }

.ai-fikr { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; color: var(--ai-accent); }
.ai-dots { display: inline-flex; gap: 0.2rem; }
.ai-dots i { width: 0.35rem; height: 0.35rem; border-radius: 9999px; background: var(--ai-accent); animation: aiSakra 0.9s infinite; }
.ai-dots i:nth-child(2) { animation-delay: 0.15s; }
.ai-dots i:nth-child(3) { animation-delay: 0.3s; }
@keyframes aiSakra { 0%, 60%, 100% { transform: translateY(0) } 30% { transform: translateY(-0.25rem) } }

@media (prefers-reduced-motion: reduce) {
  .ai-caret, .ai-dots i { animation: none; }
}
</style>
