/**
 * GET /me/topic-stats — AIRecommendationCard va TopicStrengthCard bo'lishadi.
 *
 * Nima uchun composable: Nuxt bir xil `useAsyncData` kaliti uchun handler
 * FUNKSIYASINI ham solishtiradi. Har bir komponent o'zining strelka
 * funksiyasini bersa, "Incompatible options detected for topic-stats:
 * different handler" ogohlantirishi chiqadi. Shuning uchun handler modul
 * darajasida bir marta yaratiladi va ikkala chaqiruv aynan bitta havolani beradi.
 */
export interface TopicStat {
  topic_id: number
  name: string
  total: number
  answered: number
  mastered: number
  mastery: number
  accuracy: number | null
  strength: 'new' | 'weak' | 'practicing' | 'strong' | 'mastered'
}

export interface TopicStatsResponse {
  topics: TopicStat[]
  recommendation: { topic_id: number, mastery: number, message: string } | null
}

const EMPTY: TopicStatsResponse = { topics: [], recommendation: null }

// Handler modul darajasida — barcha chaqiruvlarda AYNAN bitta havola
// (Nuxt kalit bir xil bo'lsa handler'ni ham solishtiradi).
//
// DIQQAT: bu yerda useAuthStore()/useI18n() kabi kompozabllarni CHAQIRIB
// BO'LMAYDI — funksiya modul darajasida, komponent konteksidan tashqarida
// yaratiladi. Token tekshiruvi ham shart emas: apiFetch 401'da xato tashlaydi,
// biz uni yutamiz va bo'sh natija qaytaramiz (aks holda bitta uzilish butun
// Suspense chegarasini yiqitadi).
const handler = async (): Promise<TopicStatsResponse> => {
  try { return await apiFetch<TopicStatsResponse>('/me/topic-stats') }
  catch { return EMPTY }
}

export function useTopicStats() {
  const auth = useAuthStore()
  return useAsyncData('topic-stats', handler, {
    // SSR'da token yo'q — server tomonda so'rash ma'nosiz va hidratsiyani buzadi
    server: false,
    default: (): TopicStatsResponse => EMPTY,
    // Mehmon → haqiqiy hisobga o'tganda qayta so'ralsin
    watch: [() => auth.user?.id],
  })
}
