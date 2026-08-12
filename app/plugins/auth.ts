/**
 * Foydalanuvchini ilova ishga tushishida yuklaydi.
 *
 * DIQQAT: bu plagin ATAYLAB universal (`.client` EMAS). Ilgari faqat mijozda
 * ishlagani uchun auth middleware'i YO'Q ochiq sahifalarda (masalan /belgilar)
 * SSR mehmon layoutini, mijoz esa foydalanuvchi layoutini render qilardi.
 * Gidratsiya mos kelmay, ildiz `div` mehmon shoxidagi `flex-col` klassi bilan
 * qolib ketardi va `main` sidebar OSTIGA tushib sahifa bo'sh ko'rinardi.
 *
 * Token cookie'dan olinadi, `useCookie` esa serverda ham so'rov sarlavhasini
 * o'qiydi — shuning uchun SSR ham foydalanuvchini biladi.
 * `fetchMe()` xatolarni o'zi yutadi (faqat 401 da sessiyani tozalaydi),
 * ya'ni backend yiqilsa ham SSR buzilmaydi.
 */
export default defineNuxtPlugin(async () => {
  const auth = useAuthStore()
  if (auth.token && !auth.user) {
    await auth.fetchMe()
  }
})
