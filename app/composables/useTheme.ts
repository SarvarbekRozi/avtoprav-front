export type ThemeMode = 'light' | 'dark' | 'auto'

// Shared across every useTheme() call. Stays false on the server AND during the
// first client render, so `isDark` never reads the (client-only) system
// preference at hydration time — otherwise a dark-system user on `auto` mode
// gets a server/client mismatch (server renders light, client renders dark),
// which corrupts hydration and can blank the page. Flipped true on app:mounted.
const hydrated = ref(false)

export function markThemeHydrated() {
  hydrated.value = true
}

export function useTheme() {
  const cookie = useCookie<ThemeMode>('theme', {
    default: () => 'auto',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365,
  })

  const mode = computed<ThemeMode>({
    get: () => cookie.value || 'auto',
    set: (v) => { cookie.value = v },
  })

  function systemPrefersDark(): boolean {
    if (typeof window === 'undefined') return false
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
  }

  const isDark = computed(() => {
    if (mode.value === 'dark')  return true
    if (mode.value === 'light') return false
    // auto: only trust the system preference after hydration (SSR-safe)
    return hydrated.value ? systemPrefersDark() : false
  })

  function apply() {
    if (typeof document === 'undefined') return
    document.documentElement.classList.toggle('dark', isDark.value)
  }

  function setMode(v: ThemeMode) {
    mode.value = v
    apply()
  }

  function toggle() {
    setMode(isDark.value ? 'light' : 'dark')
  }

  return { mode, isDark, setMode, toggle, apply }
}
