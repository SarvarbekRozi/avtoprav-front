/**
 * `definePageMeta()` uchun loyihaga xos maydonlar.
 *
 * Usiz `route.meta.mobileChrome` da TypeScript "Property does not exist"
 * xatosini beradi (vite build tur tekshiruvini o'tkazmaydi, lekin IDE va
 * `nuxt typecheck` beradi).
 */
declare module '#app' {
  interface PageMeta {
    /**
     * `false` — mobilda suzuvchi boshqaruvlar (hamburger, bildirishnoma
     * qo'ng'irog'i) chiqmaydi. Test o'ynash ekranida ular `fixed top-3`
     * bo'lgani uchun sahifaning yuqori qatori ustiga chiqib qolardi.
     * Berilmasa `true` deb qabul qilinadi.
     */
    mobileChrome?: boolean
  }
}

export {}
