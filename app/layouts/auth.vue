<script setup lang="ts">
/**
 * Login / register uchun TOZA to'liq ekranli qobiq.
 *
 * NEGA ALOHIDA LAYOUT: `layouts/default.vue` `v-if="auth.user"` bo'yicha
 * dashboard tarmog'ini (sidebar bilan) chizadi. Mehmon sessiyasi ham
 * `auth.user` ga ega — ya'ni saytga bir marta kirgan har qanday odam
 * /login sahifasini SIDEBAR bilan ko'rardi va ikki ustunli dizayn 280px
 * siqilib qolardi. `guest` middleware faqat TO'LIQ ro'yxatdan o'tganlarni
 * qaytaradi, mehmonlarni kiritadi — shuning uchun muammo doimiy.
 *
 * DIQQAT: shablon ILDIZI bitta tugun bo'lishi shart, aks holda SSR/klient
 * hidratsiyasi mos kelmay sahifa oq qoladi (default.vue dagi bilan bir xil
 * sabab). Shuning uchun izohlar ham div ICHIDA.
 */
const i18n = useI18n()
const theme = useTheme()

async function changeLocale(value: 'uz_latn' | 'uz_cyrl') {
  await i18n.setLocale(value)
}

// Ikonkali tugmaning ko'rinadigan matni yo'q — aks holda ekran o'quvchi uchun
// nomsiz bo'lib qoladi (WCAG 4.1.2).
const themeLabel = computed(() => theme.isDark.value
  ? i18n.t({ uz: 'Yorug\' rejimga o\'tish', kr: 'Ёруғ режимга ўтиш' })
  : i18n.t({ uz: 'Qorong\'i rejimga o\'tish', kr: 'Қоронғи режимга ўтиш' }))
</script>

<template>
  <!-- `relative` SHART: pastdagi til/mavzu klasteri `absolute`, joylashgan
       ajdodsiz u eng yaqin joylashgan blokka yoki viewportga bog'lanib,
       scroll paytida joyidan siljib ketardi. -->
  <div class="relative min-h-screen flex flex-col" style="background: var(--canvas);">
    <!-- Til va mavzu — maketda ko'rinmaydi, lekin kirish sahifasida SHART:
         kirill foydalanuvchisi tilni almashtira olmasa sahifani o'qiy olmaydi.
         Shuning uchun eng chetga, sezdirmaydigan joyga qo'yilgan. -->
    <div class="absolute top-3 right-3 z-30 flex items-center gap-2">
      <!-- `hidden sm:flex` EMAS: 640px dan tor ekranda til almashtirgich
           yashirilsa, kirill foydalanuvchisi kirish sahifasida tilni umuman
           o'zgartira olmaydi (default.vue da aynan shu kamchilik bor). -->
      <!-- `aria-pressed` — tanlangan alifboni faqat RANG bildirsa, ekran
           o'quvchi ikki bir xil tugmani o'qib, qaysi biri faol ekanini
           aytmaydi. `role="group"` ikkisini bitta boshqaruv sifatida bog'laydi. -->
      <div class="flex items-center rounded-md p-0.5 text-xs font-medium"
           role="group" :aria-label="i18n.t({ uz: 'Alifbo', kr: 'Алифбо' })"
           style="background: var(--surface-inset);">
        <button type="button" class="px-2 py-1 rounded transition-colors"
                :aria-pressed="i18n.locale.value === 'uz_latn'"
                :style="i18n.locale.value === 'uz_latn'
                  ? { background: 'var(--surface)', boxShadow: 'var(--shadow-soft)', color: 'var(--text-1)' }
                  : { color: 'var(--text-3)' }"
                @click="changeLocale('uz_latn')">Lotin</button>
        <button type="button" class="px-2 py-1 rounded transition-colors"
                :aria-pressed="i18n.locale.value === 'uz_cyrl'"
                :style="i18n.locale.value === 'uz_cyrl'
                  ? { background: 'var(--surface)', boxShadow: 'var(--shadow-soft)', color: 'var(--text-1)' }
                  : { color: 'var(--text-3)' }"
                @click="changeLocale('uz_cyrl')">Кирилл</button>
      </div>
      <button type="button" class="h-8 w-8 rounded-md grid place-items-center transition-colors"
              style="color: var(--text-3); background: var(--surface-inset);"
              :title="themeLabel" :aria-label="themeLabel" @click="theme.toggle()">
        <AppIcon :name="theme.isDark.value ? 'sun' : 'moon'" :size="17" />
      </button>
    </div>

    <main class="flex-1 flex flex-col">
      <slot />
    </main>
  </div>
</template>
