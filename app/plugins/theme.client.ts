export default defineNuxtPlugin(() => {
  const theme = useTheme()
  theme.apply()
  // Re-apply when system preference changes (only if mode is auto)
  if (typeof window !== 'undefined' && window.matchMedia) {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    mq.addEventListener?.('change', () => {
      if (theme.mode.value === 'auto') theme.apply()
    })
  }
})
