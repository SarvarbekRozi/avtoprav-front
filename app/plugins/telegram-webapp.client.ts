// Telegram Mini App — bot ichida ochilganda foydalanuvchi HECH NARSA bosmasdan
// avtomatik ro'yxatdan o'tadi / kiradi.
//
// MUHIM: avto-kirish telegram-web-app.js SKRIPTIGA BOG'LIQ EMAS. initData
// URL-hash'da (#tgWebAppData=...) keladi va biz uni to'g'ridan-to'g'ri o'qiymiz.
// Ilgari kirish skript yuklanishini kutardi — Telegram CDN sekin/bloklangan
// bo'lsa (O'zbekistonda tez-tez), kirish umuman bo'lmasdi va foydalanuvchi
// mehmon bo'lib qolardi.
//
// Plagin `async` — Nuxt uni middleware/auth.ts dagi mehmon yaratishdan OLDIN
// kutadi, shuning uchun token o'rnatilгач mehmon yaratilmaydi.

const UI_TIMEOUT_MS = 5000

export default defineNuxtPlugin(async (nuxtApp) => {
  if (!import.meta.client) return

  // initData'ni ENG AVVAL o'qiymiz — router URL hash'ini o'zgartirmasidan oldin.
  const initData = readInitData()

  // Telegram konteksti emas (initData ham yo'q, signal ham yo'q) — oddiy veb
  // foydalanuvchi. Hech narsa qilmaymiz, narxi nol.
  if (!initData && !isTelegramWebAppContext()) return

  const auth = useAuthStore()
  const theme = useTheme()

  // 1) AVTO-KIRISH — skript yuklanishini KUTMAYDI. Eng ishonchli yo'l.
  if (initData) {
    await tryLogin(initData)
  }

  // 2) Interfeys (ready/expand/mavzu) — ikkinchi darajali. Skript sekin bo'lsa
  //    ham kirish allaqachon bo'lgan; bu qism xato bersa e'tiborsiz qoldiramiz.
  try {
    await withTimeout(setupUi(), UI_TIMEOUT_MS, 'Telegram WebApp UI: vaqt tugadi')
  }
  catch (e) {
    console.warn('[telegram-webapp]', e)
  }

  async function tryLogin(data: string) {
    // Allaqachon to'liq hisob bilan kirgan bo'lsa — qayta kirmaymiz
    // (aks holda Mini App har ochilganda keraksiz token yaratilardi).
    if (auth.isAuthenticated && auth.user && !auth.user.is_guest) return
    try {
      // `await`dan keyin Nuxt konteksti yo'qoladi — useCookie/useRuntimeConfig
      // ishlashi uchun runWithContext ichida bajaramiz.
      await nuxtApp.runWithContext(() => auth.loginWithTelegramWebApp(data))
    }
    catch (e) {
      // Xato bo'lsa oddiy mehmon oqimi o'z ishini qiladi.
      console.warn('[telegram-webapp] login', e)
    }
  }

  async function setupUi() {
    await loadScript(TELEGRAM_WEBAPP_SRC)

    const tg = window.Telegram?.WebApp
    if (!tg) return

    try { tg.ready() } catch { /* eski klientlar */ }
    try { tg.expand?.() } catch { /* ixtiyoriy */ }

    syncTheme(tg)
    watch(theme.isDark, () => syncTheme(tg))
    try {
      tg.onEvent?.('themeChanged', () => syncTheme(tg))
    }
    catch { /* eski klientlarda onEvent yo'q */ }

    // Zaxira: agar hash'da initData bo'lmasa-yu (masalan "Direct Link" Mini App),
    // rasmiy skript uni bergan bo'lsa — shu yerda ham kirishga urinamiz.
    if (!initData) {
      const late = typeof tg.initData === 'string' ? tg.initData : ''
      if (late) await tryLogin(late)
    }
  }

  // DIQQAT: theme.setMode() CHAQIRILMAYDI — u mavzuni bir yillik cookie'ga
  // yozadi, ya'ni Telegram qorong'i bo'lsa foydalanuvchining oddiy brauzerdagi
  // tanlovi ham o'zgarib qolardi. Faqat Telegram panelini sayt rangiga moslaymiz.
  function syncTheme(tg: TelegramWebApp) {
    const canvas = theme.isDark.value ? '#0b0e15' : '#eef2fb'
    try { tg.setHeaderColor?.(canvas) } catch { /* WebAppHeaderColorInvalid */ }
    try { tg.setBackgroundColor?.(canvas) } catch { /* qo'llab-quvvatlanmaydi */ }
  }
})

/**
 * initData'ni SKRIPTSIZ oladi:
 *  1) rasmiy skript allaqachon yuklangan bo'lsa — window.Telegram.WebApp.initData;
 *  2) aks holda URL-hash'dan (#tgWebAppData=...) to'g'ridan-to'g'ri.
 */
function readInitData(): string {
  if (typeof window === 'undefined') return ''
  try {
    const fromApi = window.Telegram?.WebApp?.initData
    if (typeof fromApi === 'string' && fromApi) return fromApi

    const hash = window.location.hash.replace(/^#/, '')
    if (hash) {
      const data = new URLSearchParams(hash).get('tgWebAppData')
      if (data) return data
    }
  }
  catch { /* xatoni yutamiz — mehmon oqimi ishlaydi */ }
  return ''
}
