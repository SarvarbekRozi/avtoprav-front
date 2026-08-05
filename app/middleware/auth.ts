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

  /**
   * Telegram Mini App ichida ochilgan bo'lsa — MEHMON YARATISHDAN OLDIN
   * avtomatik kiramiz.
   *
   * Ilgari bu plaginda edi va mehmon yaratish bilan POYGAGA tushardi: plagin
   * kirgan bo'lsa ham, Nuxt gidratsiya paytida cookie holatini SSR yukidan
   * tiklab tokenni "yo'qotardi", so'ng bu yerdagi shart mehmon yaratardi.
   * Natijada bot orqali ro'yxatdan o'tgan odam Mini App'da MEHMON bo'lib
   * qolardi. Endi ikkalasi bitta ketma-ketlikda — poyga yo'q.
   */
  const tryTelegramLogin = async () => {
    // BUTUN blok try ichida: bu yerdagi HAR QANDAY xato mehmon yaratishni
    // to'xtatib qo'ymasligi kerak. Aks holda Telegram bilan aloqasi yo'q
    // oddiy foydalanuvchi ham sessiyasiz qolardi.
    try {
      const initData = readTelegramInitData()
      if (!initData) return

      // Allaqachon to'liq hisobda bo'lsa — qayta kirmaymiz (Mini App har
      // ochilganda keraksiz token yaratilmasin).
      if (auth.token && auth.user && !auth.user.is_guest) return

      await auth.loginWithTelegramWebApp(initData)
    }
    catch (e) {
      // Kirish bo'lmasa oddiy mehmon oqimi o'z ishini qiladi.
      console.warn('[auth] telegram mini app', e)
    }
  }

  const ensureSession = async () => {
    // TELEGRAM KIRISHI ENG BIRINCHI — "sessiya yo'qolgan" xulosasidan ham OLDIN.
    //
    // initData o'zi to'liq huquqli, imzolangan hisob ma'lumoti. Agar u bo'lsa,
    // foydalanuvchini /login ga uloqtirishning ma'nosi yo'q: bot orqali
    // ro'yxatdan o'tgan odamning PAROLI YO'Q, u o'sha sahifada kira olmaydi.
    // Bu tartib muhim, chunki token yo'qolishi endi ODATIY hodisa: qurilma
    // limiti (2 ta) eski tokenni siqib chiqaradi, token muddati tugaydi yoki
    // webview cookie'ni tozalaydi. O'shanda `acct=user` cookie'si qolib,
    // quyidagi lostRegisteredSession sharti Mini App foydalanuvchisini
    // avto-kirishga yetkazmasdan /login ga yuborib yuborardi.
    await tryTelegramLogin()

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
