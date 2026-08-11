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
    // TELEGRAM KIRISHI ENG BIRINCHI — mehmon yaratishdan ham OLDIN.
    //
    // initData o'zi to'liq huquqli, imzolangan hisob ma'lumoti. Agar u bo'lsa,
    // undan foydalanmasdan mehmon yaratish xato bo'ladi: Mini App'da bot
    // orqali ro'yxatdan o'tgan odam o'z hisobiga kirmasdan mehmon bo'lib
    // qolardi. Token yo'qolishi ODATIY hodisa: qurilma limiti (2 ta) eski
    // tokenni siqib chiqaradi, muddati tugaydi yoki webview cookie'ni
    // tozalaydi — shuning uchun bu tartib har safar ishlaydi.
    await tryTelegramLogin()

    // Sessiya yo'qolganda /login ga QAYTARMAYMIZ. Ilgari shunday edi
    // (`lostRegisteredSession` → /login?expired=1) va maqsad to'g'ri edi:
    // ro'yxatdan o'tgan odam sezmasdan mehmonga aylanib, yangi natijalari
    // boshqa hisobga yozilmasin. Amalda esa bu foydalanuvchini login
    // sahifasida QAMAB qo'yardi: bosh sahifaga ham, boshqa sahifaga ham
    // o'tolmaydi, paroli bo'lmasa (bot orqali kirgan) esa umuman kira
    // olmaydi. Sayt ishlamay qolgani — sezdirmay mehmon bo'lishdan yomonroq.
    // Shuning uchun endi oddiy mehmon oqimi: token yo'q → mehmon yaraladi.
    // Eski hisob va undagi natijalar serverda turadi, foydalanuvchi xohlagan
    // paytda "Kirish" orqali qaytadi.
    if (!auth.token) await auth.startGuest()
    if (auth.token && !auth.user) await auth.fetchMe() // 401 bo'lsa tokenni tozalaydi

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
