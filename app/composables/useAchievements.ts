export interface Achievement {
  id: string
  icon: string
  tone: 'brand' | 'emerald' | 'amber' | 'rose' | 'violet' | 'sky' | 'ink'
  title: { uz: string, kr: string }
  desc:  { uz: string, kr: string }
  on: boolean
  progress?: { value: number, target: number }
}

export function useAchievements(stats: Ref<any>, recent?: Ref<any[]>) {
  const auth = useAuthStore()

  return computed<Achievement[]>(() => {
    const s = stats.value
    const totals = s?.totals
    const streakCur     = auth.user?.streak_current ?? 0
    const streakBest    = auth.user?.streak_longest ?? 0
    const attempts      = totals?.attempts ?? 0
    const attemptsPassed = totals?.attempts_passed ?? 0
    const questionsSeen = totals?.questions_seen ?? 0
    const accuracy      = totals?.accuracy_percent ?? 0
    const correct       = totals?.correct ?? 0

    // perfect exam? scan recent attempts for is_passed && correct === total === 20
    const recentList = recent?.value ?? s?.recent ?? []
    const perfectExam = recentList.some((a: any) =>
      a?.mode === 'exam' && a?.correct_count === a?.total_questions && a?.total_questions >= 20)

    // marathon high score
    const byMode = s?.by_mode ?? []
    const marathonCount = byMode.find((m: any) => m.mode === 'marathon')?.cnt ?? 0

    return [
      {
        id: 'flame-7',
        icon: 'flame',
        tone: 'amber',
        title: { uz: 'Olov',      kr: 'Олов' },
        desc:  { uz: '7 kunlik seriya', kr: '7 кунлик серия' },
        on: streakCur >= 7 || streakBest >= 7,
        progress: { value: Math.min(7, Math.max(streakCur, streakBest)), target: 7 },
      },
      {
        id: 'first-pass',
        icon: 'trophy',
        tone: 'amber',
        title: { uz: 'Birinchi',  kr: 'Биринчи' },
        desc:  { uz: 'Birinchi A\'lo', kr: 'Биринчи Аъло' },
        on: attemptsPassed >= 1,
        progress: { value: Math.min(1, attemptsPassed), target: 1 },
      },
      {
        id: '100-questions',
        icon: 'spark',
        tone: 'brand',
        title: { uz: '100 savol', kr: '100 савол' },
        desc:  { uz: '100 ta savol javob berildi', kr: '100 та савол жавоб берилди' },
        on: questionsSeen >= 100,
        progress: { value: Math.min(100, questionsSeen), target: 100 },
      },
      {
        id: 'streak-30',
        icon: 'flame',
        tone: 'rose',
        title: { uz: '30 kun',    kr: '30 кун' },
        desc:  { uz: '30 kunlik seriya', kr: '30 кунлик серия' },
        on: streakBest >= 30,
        progress: { value: Math.min(30, streakBest), target: 30 },
      },
      {
        id: 'accuracy-90',
        icon: 'stat',
        tone: 'sky',
        title: { uz: '90% aniqlik', kr: '90% аниқлик' },
        desc:  { uz: 'Umumiy aniqlik 90%+', kr: 'Умумий аниқлик 90%+' },
        on: accuracy >= 90 && questionsSeen >= 50,
        progress: { value: Math.min(90, accuracy), target: 90 },
      },
      {
        id: 'marathon',
        icon: 'bolt',
        tone: 'violet',
        title: { uz: 'Marafon',    kr: 'Марафон' },
        desc:  { uz: 'Marafon rejimida 50+', kr: 'Марафон режимида 50+' },
        on: marathonCount >= 1, // any completed marathon counts
        progress: { value: Math.min(1, marathonCount), target: 1 },
      },
      {
        id: 'perfect-exam',
        icon: 'trophy',
        tone: 'emerald',
        title: { uz: 'Imtihon 20/20', kr: 'Имтиҳон 20/20' },
        desc:  { uz: 'Imtihondan to\'liq baho', kr: 'Имтиҳондан тўлиқ баҳо' },
        on: perfectExam,
      },
      {
        id: 'attempts-25',
        icon: 'exam',
        tone: 'ink',
        title: { uz: '25 ta test',  kr: '25 та тест' },
        desc:  { uz: '25 ta urinish bajarildi', kr: '25 та уриниш бажарилди' },
        on: attempts >= 25,
        progress: { value: Math.min(25, attempts), target: 25 },
      },
    ]
  })
}
