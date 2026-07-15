export default defineNuxtPlugin((nuxtApp) => {
  const theme = useTheme()
  theme.apply()

  // After hydration completes, the system preference is safe to use — mark it
  // and re-apply so `auto` mode reflects the real OS theme without a mismatch.
  nuxtApp.hook('app:mounted', () => {
    markThemeHydrated()
    theme.apply()
  })

  // Re-apply when system preference changes (only if mode is auto)
  if (typeof window !== 'undefined' && window.matchMedia) {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    mq.addEventListener?.('change', () => {
      if (theme.mode.value === 'auto') theme.apply()
    })
  }
})
