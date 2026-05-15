export type ThemeMode = 'light' | 'dark' | 'auto'

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
    return systemPrefersDark()
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
