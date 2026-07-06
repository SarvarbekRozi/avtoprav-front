// Route guard for premium-only pages. Runs after the `auth` middleware
// (so the user is already loaded); sends non-premium users to the pricing page.
export default defineNuxtRouteMiddleware(async () => {
  const auth = useAuthStore()
  if (!auth.user) await auth.fetchMe()
  if (auth.user && !auth.user.is_premium) {
    return navigateTo('/pricing')
  }
})
