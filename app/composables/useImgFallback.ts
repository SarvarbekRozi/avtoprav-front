// Savol rasmi yuklanmasa (fayl serverda yo'q — 404), default o'rin egallovchi
// rasmга o'tadi. Aks holda brauzer buzuq rasm belgisi + "Savol rasmi" alt
// matnini ko'rsatardi. Nuxt bu funksiyani avtomatik import qiladi.
export function onQuestionImageError(e: Event) {
  const img = e.target as HTMLImageElement | null
  if (!img || img.dataset.fellBack) return
  img.dataset.fellBack = '1'
  img.src = '/default-pic.png'
}
