// Telegram Mini App initData'sini ENG BIRINCHI bo'lib ushlab qoladi.
//
// Nomdagi "aaa-" — Nuxt plaginlarni fayl nomi bo'yicha alifbo tartibida
// uchun bu boshqa hamma narsadan oldin ishlaydi.
//
// NEGA KERAK: rasmiy telegram-web-app.js yuklangach URL hash'ini TOZALAB
// yuboradi (history.replaceState). Interfeys plagini o'sha skriptni yuklaydi,
// middleware/auth.ts esa keyinroq (gidratsiya tugagach) ishlaydi — va o'sha
// paytda hash allaqachon yo'q bo'ladi. Natijada avto-kirish bajarilmay, bot
// orqali ro'yxatdan o'tgan odam Mini App'da MEHMON bo'lib qolardi.
//
// DIQQAT: ajratish mantiqi shu yerda TO'LIQ yozilgan — boshqa moduldan
// import qilinmaydi. Sabab: avto-import ishlamay qolsa, xato try/catch ichida
// jimgina yutilib, qiymat hech qachon olinmasdi (aynan shunday bo'lgan).

declare global {
  interface Window { __tgInitData?: string }
}

export default defineNuxtPlugin(() => {
  if (!import.meta.client) return
  if (window.__tgInitData) return

  try {
    const hash = (window.location.hash || '').replace(/^#/, '')
    if (!hash) return

    let value = ''

    // 1) Kodlangan (odatiy) ko'rinish: tgWebAppData=<urlencoded>
    const m = hash.match(/(?:^|&)tgWebAppData=([^&]*)/)
    if (m?.[1]) {
      try { value = decodeURIComponent(m[1]) }
      catch { value = m[1] }
    }

    // 2) Dekodlangan ko'rinish: butun hash aslida initData
    //    (URLSearchParams uni birinchi "&" da kesib yuboradi).
    if (!value.includes('hash=') && hash.includes('hash=') && hash.includes('auth_date=')) {
      value = hash
        .replace(/^tgWebAppData=/, '')
        .split('&')
        .filter(p => !/^tgWebApp[A-Za-z]*=/.test(p))
        .join('&')
    }

    // To'liq initData'da imzo bo'lishi shart.
    if (value.includes('hash=')) window.__tgInitData = value
  }
  catch { /* xatoni yutamiz — mehmon oqimi ishlaydi */ }
})
