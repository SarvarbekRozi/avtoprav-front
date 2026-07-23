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

  const nuxtApp = useNuxtApp()

  const ensureSession = async () => {
    // Ro'yxatdan o'tgan hisob sessiyasi yo'qolgan bo'lsa — JIMGINA mehmon
    // yaratmaymiz. Aks holda foydalanuvchi sezmasdan mehmonga aylanadi va
    // yechgan testlari, XP'si begona hisobga yozilib ketadi.
    if (auth.lostRegisteredSession) {
      return navigateTo('/login?expired=1')
    }

    if (!auth.token) await auth.startGuest()
    if (auth.token && !auth.user) await auth.fetchMe() // 401 bo'lsa tokenni tozalaydi

    // fetchMe 401 qaytarib tokenni tozalagan bo'lishi mumkin — qayta tekshiramiz
    if (auth.lostRegisteredSession) {
      return navigateTo('/login?expired=1')
    }

    if (!auth.user) {
      await auth.startGuest()
      if (!auth.user) return navigateTo('/login') // API unreachable — last resort
    }
  }

  // Birinchi yuklashda (hidratsiya) auth holatini O'ZGARTIRMAYMIZ. Server
  // sahifani auth.user=null bilan render qilgan; shu yerda mehmon yaratsak,
  // Vue hidratsiya qilayotgan paytda layout/sahifa boshqa tarmoqqa o'tib
  // ketadi va hidratsiya buziladi (ekran oqarib qolishi shundan).
  // Shuning uchun mehmon yaratishni hidratsiya tugagach bajaramiz.
  if (nuxtApp.isHydrating) {
    nuxtApp.hooks.hookOnce('app:suspense:resolve', () => {
      void ensureSession()
    })

    return
  }

  return ensureSession()
})
