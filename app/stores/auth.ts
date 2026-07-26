import { defineStore } from 'pinia'

export interface AuthUser {
  id: number
  login: string
  full_name: string | null
  email: string | null
  phone: string | null
  role: 'user' | 'admin'
  locale: 'uz_latn' | 'uz_cyrl'
  is_guest: boolean
  is_premium: boolean
  premium_until: string | null
  daily_tests: { limit: number | null, used_today: number } | null
  avatar: string | null
  daily_goal: number
  streak_current: number
  streak_longest: number
  points: number
  exam_date: string | null
  exam_days_left: number | null
}

/** Google / Telegram kirish javobi — /auth/login bilan bir xil + `is_new`. */
export interface SocialAuthResponse {
  token: string
  user: AuthUser
  is_new?: boolean
}

export const useAuthStore = defineStore('auth', () => {
  const tokenCookie = useCookie<string | null>('auth_token', { default: () => null, sameSite: 'lax', maxAge: 60 * 60 * 24 * 30 })

  // Hisob turi alohida eslab qolinadi: sessiya yo'qolganda ro'yxatdan o'tgan
  // foydalanuvchini JIMGINA mehmonga aylantirmaslik uchun kerak (aks holda
  // XP va progress yangi mehmon hisobiga yozilib ketadi va bu sezilmaydi).
  const kindCookie = useCookie<'user' | 'guest' | null>('acct', { default: () => null, sameSite: 'lax', maxAge: 60 * 60 * 24 * 30 })

  const user = ref<AuthUser | null>(null)
  const loading = ref(false)

  const token = computed(() => tokenCookie.value)
  const isAuthenticated = computed(() => !!tokenCookie.value)

  /** Ro'yxatdan o'tgan hisob sessiyasi yo'qolgan (token yo'q, lekin mehmon emas edi). */
  const lostRegisteredSession = computed(() => !tokenCookie.value && kindCookie.value === 'user')

  function remember(u: AuthUser | null) {
    if (u) {
      kindCookie.value = u.is_guest ? 'guest' : 'user'
    }
  }

  async function login(credentials: { login: string, password: string }) {
    loading.value = true
    try {
      const res = await apiFetch<{ token: string, user: AuthUser }>('/auth/login', {
        method: 'POST',
        body: credentials,
      })
      tokenCookie.value = res.token
      user.value = res.user
      remember(res.user)
      return res
    }
    finally {
      loading.value = false
    }
  }

  async function register(payload: any) {
    loading.value = true
    try {
      const res = await apiFetch<{ token: string, user: AuthUser }>('/auth/register', {
        method: 'POST',
        body: payload,
      })
      tokenCookie.value = res.token
      user.value = res.user
      remember(res.user)
      return res
    }
    finally {
      loading.value = false
    }
  }

  // Anonymous session — visitors start solving without registering.
  async function startGuest() {
    loading.value = true
    try {
      const locale = useCookie<string | null>('locale').value
      const res = await apiFetch<{ token: string, user: AuthUser }>('/auth/guest', {
        method: 'POST',
        body: { locale: locale === 'uz_cyrl' ? 'uz_cyrl' : 'uz_latn' },
      })
      tokenCookie.value = res.token
      user.value = res.user
      remember(res.user)
      return res
    }
    catch {
      return null
    }
    finally {
      loading.value = false
    }
  }

  /** Joriy til — social kirish so'rovlariga qo'shiladi (startGuest bilan bir xil). */
  function currentLocale(): 'uz_latn' | 'uz_cyrl' {
    const locale = useCookie<string | null>('locale').value
    return locale === 'uz_cyrl' ? 'uz_cyrl' : 'uz_latn'
  }

  // ─── Ijtimoiy kirish ──────────────────────────────────────────────────────
  // Uchala endpoint ham /auth/login bilan BIR XIL javob qaytaradi. Agar joriy
  // sessiya mehmon bo'lsa, backend o'sha hisobni O'RNIDA to'liq hisobga
  // aylantiradi (XP, urinishlar saqlanadi) — apiFetch tokenni avtomatik
  // yuborgani uchun buning uchun qo'shimcha ish qilish shart emas.

  async function loginWithGoogle(idToken: string) {
    loading.value = true
    try {
      const locale = currentLocale()
      const res = await apiFetch<SocialAuthResponse>('/auth/google', {
        method: 'POST',
        body: { id_token: idToken, locale },
      })
      tokenCookie.value = res.token
      user.value = res.user
      remember(res.user)
      return res
    }
    finally {
      loading.value = false
    }
  }

  /** Telegram Login Widget qaytargan xom payload (id, hash, auth_date, ...). */
  async function loginWithTelegram(payload: Record<string, any>) {
    loading.value = true
    try {
      const locale = currentLocale()
      const res = await apiFetch<SocialAuthResponse>('/auth/telegram', {
        method: 'POST',
        body: { ...payload, locale },
      })
      tokenCookie.value = res.token
      user.value = res.user
      remember(res.user)
      return res
    }
    finally {
      loading.value = false
    }
  }

  /** Telegram Mini App: window.Telegram.WebApp.initData xom holda yuboriladi. */
  async function loginWithTelegramWebApp(initData: string) {
    loading.value = true
    try {
      const locale = currentLocale()
      const res = await apiFetch<SocialAuthResponse>('/auth/telegram/webapp', {
        method: 'POST',
        body: { init_data: initData, locale },
      })
      tokenCookie.value = res.token
      user.value = res.user
      remember(res.user)
      return res
    }
    finally {
      loading.value = false
    }
  }

  // Upgrade the guest account to a full one — progress is kept (same user row).
  async function completeRegistration(payload: any) {
    loading.value = true
    try {
      const res = await apiFetch<{ user: AuthUser }>('/auth/complete', {
        method: 'POST',
        body: payload,
      })
      user.value = res.user
      remember(res.user)
      return res
    }
    finally {
      loading.value = false
    }
  }

  async function fetchMe() {
    if (!tokenCookie.value) return null
    try {
      const res = await apiFetch<{ user: AuthUser }>('/me')
      user.value = res.user
      remember(res.user)
      return res.user
    }
    catch (e: any) {
      // FAQAT token haqiqatan yaroqsiz bo'lganda (401) sessiyani tozalaymiz.
      // Ilgari bu yerda har qanday xatoda clear() chaqirilardi — natijada
      // tarmoq uzilishi, server qayta ishga tushishi (deploy) yoki 500 xato
      // foydalanuvchini sezdirmasdan tizimdan chiqarib yuborardi.
      if (e?.response?.status === 401 || e?.status === 401) {
        clear()
      }

      return null
    }
  }

  async function logout() {
    try {
      if (tokenCookie.value) await apiFetch('/auth/logout', { method: 'POST' })
    }
    catch { /* ignore */ }
    clear()
    kindCookie.value = null // ataylab chiqdi — hisob turini ham unutamiz
  }

  /** Sessiyani tozalaydi. Hisob turi (`acct`) ataylab saqlanadi. */
  function clear() {
    tokenCookie.value = null
    user.value = null
  }

  return {
    user, token, isAuthenticated, loading, lostRegisteredSession,
    login, register, startGuest, completeRegistration, fetchMe, logout, clear,
    loginWithGoogle, loginWithTelegram, loginWithTelegramWebApp,
  }
})
