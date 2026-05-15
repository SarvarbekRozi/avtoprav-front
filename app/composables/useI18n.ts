export type Locale = 'uz_latn' | 'uz_cyrl'

type Bilingual = { uz: string, kr: string }

export function useI18n() {
  const cookie = useCookie<Locale>('locale', { default: () => 'uz_latn', sameSite: 'lax' })
  const locale = computed({
    get: () => cookie.value || 'uz_latn',
    set: (v) => { cookie.value = v },
  })

  function t(input: Bilingual | string): string {
    if (typeof input === 'string') return input
    return locale.value === 'uz_cyrl' ? input.kr : input.uz
  }

  async function setLocale(v: Locale) {
    cookie.value = v
    const auth = useAuthStore()
    if (auth.token) {
      try {
        await apiFetch('/me/locale', { method: 'PATCH', body: { locale: v } })
        if (auth.user) auth.user.locale = v
      }
      catch { /* ignore */ }
    }
  }

  return { locale, t, setLocale }
}
