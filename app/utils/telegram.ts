// Telegram Mini App initData'sini o'qish.
//
// Alohida fayl: buni HAM plagin (UI uchun), HAM middleware/auth.ts (kirish
// uchun) ishlatadi. Kirish aynan middleware'da bo'lishi shart — mehmon
// yaratishdan oldin, bir xil kod yo'lida. Ilgari u plaginda edi va mehmon
// yaratish bilan POYGAGA tushardi: ba'zan foydalanuvchi kirgan bo'lsa ham
// mehmon bo'lib qolardi.

/**
 * initData'ni oladi:
 *  1) 00.telegram-capture plagini ushlab qolgan qiymat (eng ishonchli —
 *     rasmiy skript hash'ni tozalashidan OLDIN olingan);
 *  2) rasmiy skript yuklangan bo'lsa — window.Telegram.WebApp.initData;
 *  3) hozirgi hash (mijoz tomonida yangi o'tish bo'lgan bo'lsa).
 */
export function readTelegramInitData(): string {
  if (typeof window === 'undefined') return ''
  try {
    const captured = (window as any).__tgInitData
    if (typeof captured === 'string' && captured) return captured

    const fromApi = (window as any).Telegram?.WebApp?.initData
    if (typeof fromApi === 'string' && fromApi) return fromApi

    const hash = window.location.hash.replace(/^#/, '')
    if (hash) return extractInitData(hash)
  }
  catch { /* xatoni yutamiz — mehmon oqimi ishlaydi */ }
  return ''
}

/**
 * Hash'dan initData'ni ajratadi — IKKI ko'rinishni ham qo'llab-quvvatlaydi.
 *
 * Telegram hash'ni kodlangan holda beradi:
 *     #tgWebAppData=auth_date%3D123%26user%3D...%26hash%3D...
 * lekin router/brauzer uni bir marta DEKODLAB qo'yishi mumkin:
 *     #tgWebAppData=auth_date=123&user=...&hash=...
 *
 * Ikkinchi holatda URLSearchParams qiymatni birinchi "&" da kesadi va
 * "auth_date=123" qaytaradi — server imzoni tekshira olmaydi va foydalanuvchi
 * MEHMON bo'lib qoladi.
 */
export function extractInitData(hash: string): string {
  const clean = hash.replace(/^#/, '')
  if (!clean) return ''

  // 1) Kodlangan (odatiy) ko'rinish — qiymat ichida "&" bo'lmaydi.
  const m = clean.match(/(?:^|&)tgWebAppData=([^&]*)/)
  if (m?.[1]) {
    let value = m[1]
    try { value = decodeURIComponent(value) }
    catch { /* allaqachon dekodlangan */ }
    if (value.includes('hash=')) return value
  }

  // 2) Dekodlangan ko'rinish — butun hash aslida initData.
  //    Telegram qo'shadigan yordamchi kalitlarni olib tashlaymiz, aks holda
  //    imzo tekshiruvi buziladi.
  if (clean.includes('hash=') && clean.includes('auth_date=')) {
    return clean
      .replace(/^tgWebAppData=/, '')
      .split('&')
      .filter(p => !/^tgWebApp[A-Za-z]*=/.test(p))
      .join('&')
  }

  return ''
}

declare global {
  interface Window { __tgInitData?: string }
}
