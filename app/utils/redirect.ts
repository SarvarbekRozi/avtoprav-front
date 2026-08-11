/**
 * `?redirect=` qiymatini XAVFSIZ ichki yo'lga aylantiradi.
 *
 * NEGA KERAK (ikki alohida muammo):
 *
 *  1) OCHIQ QAYTA YO'NALTIRISH. `?redirect=https://soxta-sayt.uz` bo'lsa
 *     foydalanuvchi kirgandan keyin begona saytga uloqtirilardi — fishing
 *     uchun tayyor vektor (havola bizning domendan kelgani uchun ishonchli
 *     ko'rinadi).
 *
 *  2) MUVAFFAQIYAT XATO BO'LIB KO'RINISHI. Nuxt `navigateTo()` tashqi URL'ni
 *     `external: true` bo'lmasa RAD ETADI va istisno otadi. U istisno
 *     `submit()` dagi `catch` ga tushib "Xatolik yuz berdi" deb ko'rsatardi —
 *     holbuki kirish MUVAFFAQIYATLI bo'lgan va token allaqachon o'rnatilgan.
 *
 * Faqat bitta `/` bilan boshlanadigan yo'l qabul qilinadi. `//host` (protokolga
 * nisbiy URL) va `/\host` rad etiladi — brauzer ularni tashqi manzil deb
 * talqin qiladi.
 */
export function safeRedirect(value: unknown, fallback = '/'): string {
  if (typeof value !== 'string' || value === '') return fallback

  // Boshidagi bo'sh joy/boshqarish belgilari: "\t/\evil.com" kabi hiylalar
  // brauzerda tozalanib tashqi URL bo'lib qolishi mumkin.
  const path = value.trim()

  if (!path.startsWith('/')) return fallback
  if (path.startsWith('//') || path.startsWith('/\\')) return fallback

  return path
}
