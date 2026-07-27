// Telegram Mini App — bot ichida ochilganda foydalanuvchi HECH NARSA bosmasdan
// avtomatik ro'yxatdan o'tadi / kiradi.
//
// Plagin `async` — Nuxt uni middleware/auth.ts dagi mehmon yaratishdan OLDIN
// kutadi. Aks holda har safar Mini App ochilganda keraksiz mehmon hisobi
// yaratilib ketardi.
//
// Butun jarayon try/catch + 5s vaqt chegarasi ichida: Telegram CDN sekin
// bo'lsa yoki bloklansa ham ilova ishga tushishi hech qachon osilmaydi.

const BOOT_TIMEOUT_MS = 5000

export default defineNuxtPlugin(async (nuxtApp) => {
  if (!import.meta.client) return

  // Skript yuklamasdan aniqlaymiz — oddiy veb foydalanuvchilar uchun narxi nol.
  if (!isTelegramWebAppContext()) return

  // Kontekstga bog'liq narsalarni `await`dan OLDIN olamiz.
  const auth = useAuthStore()
  const theme = useTheme()

  try {
    await withTimeout(boot(), BOOT_TIMEOUT_MS, 'Telegram WebApp: vaqt tugadi')
  }
  catch (e) {
    // Muvaffaqiyatsiz bo'lsa — oddiy mehmon oqimi o'z ishini qiladi.
    console.warn('[telegram-webapp]', e)
  }

  async function boot() {
    await loadScript(TELEGRAM_WEBAPP_SRC)

    const tg = window.Telegram?.WebApp
    if (!tg) throw new Error('Telegram.WebApp topilmadi')

    try { tg.ready() } catch { /* eski klientlar */ }
    try { tg.expand?.() } catch { /* ixtiyoriy */ }

    syncTheme(tg)
    // Foydalanuvchi saytda mavzuni almashtirsa — Telegram paneli ham ergashsin.
    watch(theme.isDark, () => syncTheme(tg))
    // Telegram o'z mavzusini almashtirganda panel rangini qayta tiklaydi.
    try {
      tg.onEvent?.('themeChanged', () => syncTheme(tg))
    }
    catch { /* eski klientlarda onEvent yo'q */ }

    const initData = typeof tg.initData === 'string' ? tg.initData : ''
    if (!initData) return

    // Allaqachon to'liq hisob bilan kirgan bo'lsa — qayta kirmaymiz.
    // Aks holda Mini App har ochilganda keraksiz yangi token yaratilardi.
    if (auth.isAuthenticated && auth.user && !auth.user.is_guest) return

    // `await`dan keyin Nuxt konteksti yo'qoladi — useCookie/useRuntimeConfig
    // ishlashi uchun chaqiruvni runWithContext ichida bajaramiz.
    await nuxtApp.runWithContext(() => auth.loginWithTelegramWebApp(initData))
  }

  // DIQQAT: bu yerda theme.setMode() CHAQIRILMAYDI. U mavzuni bir yillik
  // cookie'ga yozadi, ya'ni Telegram qorong'i bo'lsa foydalanuvchining oddiy
  // brauzerdagi tanlovi ham qorong'iga o'zgarib qolardi. Foydalanuvchi tanlovi
  // ustun; biz faqat Telegram panelini SAYT rangiga moslaymiz.
  function syncTheme(tg: TelegramWebApp) {
    const canvas = theme.isDark.value ? '#0b0e15' : '#eef2fb'
    try { tg.setHeaderColor?.(canvas) } catch { /* WebAppHeaderColorInvalid */ }
    try { tg.setBackgroundColor?.(canvas) } catch { /* qo'llab-quvvatlanmaydi */ }
  }
})
