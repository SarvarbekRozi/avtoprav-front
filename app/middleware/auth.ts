// Visitors don't need to register: if there's no session, an anonymous
// guest account is created on the fly (client-side only, so bots hitting
// SSR don't create DB rows). Registration is only pitched when they want
// to buy Premium.
export default defineNuxtRouteMiddleware(async () => {
  const auth = useAuthStore()

  if (import.meta.server) {
    if (auth.token && !auth.user) await auth.fetchMe()
    return
  }

  if (!auth.token) await auth.startGuest()
  if (auth.token && !auth.user) await auth.fetchMe() // fetchMe clears a stale token
  if (!auth.user) {
    await auth.startGuest()
    if (!auth.user) return navigateTo('/login') // API unreachable — last resort
  }
})
