export default defineNuxtRouteMiddleware(async (to) => {
  const auth = useAuthStore()
  if (!auth.token) {
    return navigateTo('/login?redirect=' + encodeURIComponent(to.fullPath))
  }
  if (!auth.user) {
    await auth.fetchMe()
    if (!auth.user) {
      return navigateTo('/login')
    }
  }
})
