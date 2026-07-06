// Keep fully-registered users away from login/register; anonymous guests
// are allowed in (register = upgrade their account, login = switch account).
export default defineNuxtRouteMiddleware(async () => {
  const auth = useAuthStore()
  if (!auth.token) return
  if (!auth.user) await auth.fetchMe()
  if (auth.user && !auth.user.is_guest) return navigateTo('/')
})
