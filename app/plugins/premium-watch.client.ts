/**
 * Kutilayotgan karta to'lovini fonda kuzatadi va Premium yoqilishi bilan
 * ilovani XABARDOR qiladi.
 *
 * MUAMMO: admin botdan "To'landi" bosganda Premium darhol yoqiladi, lekin
 * brauzerdagi `auth.user` eski qolib ketardi — foydalanuvchi sahifani
 * yangilamaguncha hech narsa o'zgarmasdi va u nima bo'lganini bilmasdi.
 *
 * `PaymentSheet` ham so'rab turadi, lekin faqat oyna OCHIQ turganda va ~2
 * daqiqa. Admin odatda kechroq tasdiqlaydi (pulni bankda tekshirishi kerak),
 * shuning uchun kuzatuv oynadan mustaqil bo'lishi shart.
 *
 * Tejamkorlik: so'rov faqat kutilayotgan buyurtma bo'lganda va faqat tab
 * KO'RINIB turganda ketadi. Buyurtma yo'q bo'lsa plagin hech narsa qilmaydi.
 */

/** Tab ochiq turganda so'rovlar oralig'i. */
const POLL_MS = 15_000

export default defineNuxtPlugin(() => {
  const auth = useAuthStore()
  const activated = useState<boolean>('premium-just-activated', () => false)

  let timer: ReturnType<typeof setInterval> | null = null
  let busy = false

  function stop() {
    if (timer !== null) {
      clearInterval(timer)
      timer = null
    }
  }

  async function check() {
    const pending = getPendingOrder()

    if (!pending || !auth.token) {
      stop()
      return
    }

    // DIQQAT: bu yerda "allaqachon Premium bo'lsa to'xtatamiz" degan shart
    // BO'LMASLIGI kerak edi. U bor paytda sahifa tasdiqlangandan KEYIN
    // yuklansa (foydalanuvchi qaytib kelgan, F5 bosgan), `auth.user.is_premium`
    // allaqachon `true` bo'lar va xabar ko'rsatilmasdan buyurtma o'chirib
    // tashlanardi — premium ochilgan, lekin odam nima bo'lganini bilmasdi.
    //
    // Haqiqat manbai — BUYURTMANING o'zi. Obunani uzaytirayotgan odam ham
    // to'lovdan oldin Premium bo'ladi, ya'ni `is_premium` bu yerda hech narsa
    // aytmaydi.
    if (busy) return
    busy = true

    try {
      const res = await apiFetch<{ is_paid: boolean }>(`/me/orders/${pending.id}`)

      if (res.is_paid) {
        clearPendingOrder()
        stop()
        await auth.fetchMe()
        // Qo'ng'iroq bildirishnomalarni foydalanuvchi bo'yicha bir marta
        // yuklaydi — Premium bildirishnomasi ko'rinishi uchun qayta so'raymiz.
        useState<number | null>('notifications-loaded-for').value = null
        activated.value = true
      }
    }
    catch (e: any) {
      // Buyurtma yo'q bo'lsa (o'chirilgan/boshqa hisob) — kuzatishni to'xtatamiz.
      const status = e?.statusCode || e?.response?.status
      if (status === 404 || status === 403) {
        clearPendingOrder()
        stop()
      }
      // Qolgan xatolarda (tarmoq) keyingi urinishda qayta so'raymiz.
    }
    finally {
      busy = false
    }
  }

  function start() {
    if (timer !== null || !getPendingOrder()) return
    timer = setInterval(() => {
      if (document.visibilityState === 'visible') void check()
    }, POLL_MS)
  }

  // Tabga qaytganda DARHOL tekshiramiz: foydalanuvchi bank ilovasiga yoki
  // Telegramga o'tib qaytadi — aynan shu payt eng ehtimoliy moment.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return
    void check()
    start()
  })

  // Sessiya kech tayyor bo'ladi (auth middleware hidratsiyadan keyin ishlaydi),
  // shuning uchun tokenni kutamiz.
  watch(() => auth.token, (token) => {
    if (token) {
      void check()
      start()
    }
    else {
      stop()
    }
  }, { immediate: true })
})
