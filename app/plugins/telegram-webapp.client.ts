// Telegram Mini App — INTERFEYS sozlamalari (ready/expand/mavzu).
//
// DIQQAT: avto-KIRISH bu yerda EMAS — u middleware/auth.ts da.
// Sabab: plagin bosqichida yozilgan cookie'ni Nuxt gidratsiya paytida SSR
// yukidan tiklab bekor qiladi, so'ng middleware token yo'q deb mehmon
// yaratadi. Ikkalasi ikki joyda bo'lgani uchun POYGA chiqardi va bot orqali
// ro'yxatdan o'tgan odam Mini App'da ba'zan MEHMON bo'lib qolardi.
// Endi kirish ham, mehmon yaratish ham bitta ketma-ketlikda (middleware).

const UI_TIMEOUT_MS = 5000

export default defineNuxtPlugin(async () => {
  if (!import.meta.client) return

  // ENG BIRINCHI ISH: initData'ni ushlab qolamiz.
  //
  // Pastda yuklanadigan rasmiy telegram-web-app.js URL hash'ini TOZALAB
  // yuboradi (history.replaceState). middleware/auth.ts esa keyinroq
  // (gidratsiya tugagach) ishlaydi va o'sha paytda hash yo'q bo'ladi —
  // natijada avto-kirish bajarilmay, bot orqali ro'yxatdan o'tgan odam
  // Mini App'da MEHMON bo'lib qolardi. Aynan shu xato edi.
  const captured = readTelegramInitData()
  if (captured) window.__tgInitData = captured

  // Telegram konteksti emas — oddiy veb foydalanuvchi. Narxi nol.
  if (!captured && !isTelegramWebAppContext()) return

  const theme = useTheme()

  // Interfeys ikkinchi darajali: skript sekin/bloklangan bo'lsa ham kirish
  // middleware'da allaqachon bo'lgan. Bu qism xato bersa e'tiborsiz qoldiramiz.
  try {
    await withTimeout(setupUi(), UI_TIMEOUT_MS, 'Telegram WebApp UI: vaqt tugadi')
  }
  catch (e) {
    console.warn('[telegram-webapp]', e)
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

