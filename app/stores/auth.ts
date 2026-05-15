import { defineStore } from 'pinia'

export interface AuthUser {
  id: number
  login: string
  full_name: string | null
  email: string | null
  phone: string | null
  role: 'user' | 'admin'
  locale: 'uz_latn' | 'uz_cyrl'
  is_premium: boolean
  premium_until: string | null
  avatar: string | null
  daily_goal: number
  streak_current: number
  streak_longest: number
  points: number
  exam_date: string | null
  exam_days_left: number | null
}

export const useAuthStore = defineStore('auth', () => {
  const tokenCookie = useCookie<string | null>('auth_token', { default: () => null, sameSite: 'lax', maxAge: 60 * 60 * 24 * 30 })
  const user = ref<AuthUser | null>(null)
  const loading = ref(false)

  const token = computed(() => tokenCookie.value)
  const isAuthenticated = computed(() => !!tokenCookie.value)

  async function login(credentials: { login: string, password: string }) {
    loading.value = true
    try {
      const res = await apiFetch<{ token: string, user: AuthUser }>('/auth/login', {
        method: 'POST',
        body: credentials,
      })
      tokenCookie.value = res.token
      user.value = res.user
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
      return res.user
    }
    catch {
      clear()
      return null
    }
  }

  async function logout() {
    try {
      if (tokenCookie.value) await apiFetch('/auth/logout', { method: 'POST' })
    }
    catch { /* ignore */ }
    clear()
  }

  function clear() {
    tokenCookie.value = null
    user.value = null
  }

  return { user, token, isAuthenticated, loading, login, register, fetchMe, logout, clear }
})
