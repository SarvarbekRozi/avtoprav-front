/**
 * Savol rasmi yuklanmaganda nima bo'lishi (kichik rasmlar — xatolar ro'yxati,
 * natija sahifasi). Test o'ynash ekranida bundan boy variant bor: u yerda
 * skelet, qo'lda qayta urinish tugmasi va oldindan yuklash ham ishlaydi.
 *
 * ILGARI bu funksiya darhol `/default-pic.png` ga o'tardi. Ikkita jiddiy
 * kamchiligi bor edi:
 *   1) `public/default-pic.png` — 1.1 MB. Ya'ni "rasm yuklanmadi" holatida
 *      brauzer yana 1.1 MB yuklardi. Aynan sekin internetda — vaziyatni
 *      yaxshilash o'rniga battar qilardi.
 *   2) Qayta urinish yo'q edi: `dataset.fellBack` bir marta qo'yilgach, tarmoq
 *      tiklangan bo'lsa ham rasm qaytib kelmasdi. 3G da uzilish odatiy hol.
 *
 * ENDI: ortib boruvchi kechikish bilan 2 marta qayta uriniladi, so'ng blok
 * yashiriladi.
 */

const MAX_RETRIES = 2
const RETRY_BASE_MS = 1200

/** `?r=N` belgisini olib tashlab, asl manzilni qaytaradi. */
function baseUrl(src: string): string {
  const [urlPart, hash] = src.split('#')
  const cleaned = (urlPart ?? '')
    .replace(/([?&])r=\d+(&|$)/, '$1')
    .replace(/[?&]$/, '')

  return hash ? `${cleaned}#${hash}` : cleaned
}

export function onQuestionImageError(e: Event) {
  const img = e.target as HTMLImageElement | null
  if (!img) return

  const base = baseUrl(img.src)

  // Vue ro'yxatlarda (`v-for`) BIR XIL <img> elementini BOSHQA rasm uchun
  // qayta ishlatishi mumkin. Hisoblagich va yashirilgan holat eskisidan qolib
  // ketsa, yangi rasm umuman urinib ko'rilmay yashiringancha qolardi.
  if (img.dataset.imgKey !== base) {
    img.dataset.imgKey = base
    img.dataset.imgRetries = '0'
    img.style.display = ''
    const prevWrap = img.closest('.qimg-wrap') as HTMLElement | null
    if (prevWrap) prevWrap.style.display = ''
    img.closest('.qrow')?.classList.remove('no-img')
  }

  const tried = Number(img.dataset.imgRetries || 0)

  if (tried < MAX_RETRIES) {
    img.dataset.imgRetries = String(tried + 1)

    setTimeout(() => {
      // Sahifa almashgan bo'lsa element DOM'da bo'lmaydi — bekorga so'rov yubormaymiz.
      if (!img.isConnected) return
      // `?r=N` xatodan KEYIN qo'shiladi: brauzer yarim yuklangan/uzilgan javobni
      // qayta ishlatmasin. Muvaffaqiyatli yuklashlarda URL toza qoladi, ya'ni
      // odatdagi keshlash buzilmaydi.
      img.src = `${base}${base.includes('?') ? '&' : '?'}r=${tried + 1}`
    }, RETRY_BASE_MS * (tried + 1))

    return
  }

  // Natija sahifasida faqat <img> ni yashirish BO'SH USTUN qoldirardi: `.qbody`
  // ikki ustunli grid va uni bir ustunga tushiradigan `.no-img` klassi faqat
  // "rasm umuman yo'q" holatini biladi, "yuklanmadi" ni emas. Shuning uchun
  // o'sha klassni shu yerda ham qo'yamiz va o'ramni yig'amiz.
  const wrap = img.closest('.qimg-wrap') as HTMLElement | null
  if (wrap) {
    wrap.style.display = 'none'
    img.closest('.qrow')?.classList.add('no-img')
  }
  else {
    img.style.display = 'none'
  }
}
