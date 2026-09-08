/**
 * Tasdiqlanishini kutayotgan QO'LDA to'lov buyurtmasi.
 *
 * NEGA KERAK: karta orqali to'lovda admin "To'landi" bosgunicha bir necha
 * daqiqa, ba'zan soatlar o'tadi. `PaymentSheet` faqat oyna ochiq turganda va
 * ~2 daqiqa so'rab turadi — undan keyin foydalanuvchi Premium yoqilganini
 * sahifani YANGILAMAGUNCHA bilmasdi.
 *
 * Buyurtma raqami `localStorage` da saqlanadi, ya'ni oyna yopilsa ham,
 * sahifa qayta yuklansa ham kuzatuv davom etadi
 * (`plugins/premium-watch.client.ts`).
 */

const KEY = 'pending-order'

/** Shundan keyin kuzatishni to'xtatamiz — buyurtma unutilgan deb hisoblanadi. */
const MAX_AGE_MS = 24 * 60 * 60 * 1000

export interface PendingOrder {
  id: number
  /** Yaratilgan payt (ms) — eskirganini shu bo'yicha aniqlaymiz. */
  at: number
}

export function setPendingOrder(id: number): void {
  if (!import.meta.client) return
  try {
    localStorage.setItem(KEY, JSON.stringify({ id, at: Date.now() } satisfies PendingOrder))
  }
  catch { /* private rejim / to'lgan xotira — kuzatuvsiz ham ishlayveradi */ }
}

export function getPendingOrder(): PendingOrder | null {
  if (!import.meta.client) return null
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw) as Partial<PendingOrder>
    if (typeof parsed?.id !== 'number' || typeof parsed?.at !== 'number') {
      clearPendingOrder()
      return null
    }

    if (Date.now() - parsed.at > MAX_AGE_MS) {
      clearPendingOrder()
      return null
    }

    return { id: parsed.id, at: parsed.at }
  }
  catch {
    clearPendingOrder()
    return null
  }
}

export function clearPendingOrder(): void {
  if (!import.meta.client) return
  try {
    localStorage.removeItem(KEY)
  }
  catch { /* ignore */ }
}
