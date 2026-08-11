<script setup lang="ts">
/**
 * Auth sahifalaridagi "bosh sahifaga" elementi (orqaga tugmasi, brend logotipi).
 *
 * Nima uchun oddiy `<NuxtLink to="/">` yetarli emas: ro'yxatdan o'tgan hisob
 * sessiyasi yo'qolganda (token muddati tugadi, qurilma limiti eski tokenni
 * siqib chiqardi, webview cookie'ni tozaladi) `acct=user` cookie'si qoladi.
 * Auth middleware buni `lostRegisteredSession` deb o'qib, HAR QANDAY himoyalangan
 * sahifadan /login?expired=1 ga qaytaradi — ya'ni `/` ga havola ko'r yo'l:
 * foydalanuvchi bosadi, lekin bir zumda o'sha login sahifasiga qaytariladi va
 * saytga umuman kira olmay qamalib qoladi.
 *
 * O'sha himoyaning maqsadi — odam SEZMASDAN mehmonga aylanib, yechgan testlari,
 * XP'si va to'lagan Premium'i begona hisobda yetim qolmasligi. Shuning uchun
 * `acct` xotirasini tozalash faqat ATAYLAB bo'lishi kerak, va bu shart uch
 * holatga bo'linadi:
 *
 *   1. sessiya joyida        → oddiy `<NuxtLink to="/">`
 *   2. sessiya yo'q + `explicit` → `<button>`: `acct` tozalanadi, mehmon bo'lib
 *      bosh sahifaga o'tadi. FAQAT matnli "Bosh sahifaga" tugmasi uchun —
 *      yonida nima bo'lishini aytadigan eslatma turadi.
 *   3. sessiya yo'q, `explicit` emas → jonsiz `<span>`. Logotip bosish "bosh
 *      sahifaga o'tish" degan ma'noni beradi, hisob almashtirishni emas.
 *      Uni tugma qilib qo'ysak, kafolat buziladi; havola qoldirsak — ko'r yo'l.
 *      Shuning uchun umuman bosilmaydi.
 */
const props = withDefaults(defineProps<{
  /** Oqibati yonida yozilgan, ataylab bosiladigan boshqaruv (matnli tugma). */
  explicit?: boolean
}>(), { explicit: false })

const auth = useAuthStore()
const i18n = useI18n()

/** Sessiya yo'qolgan — oddiy havola ishlamaydi. */
const stuck = computed(() => auth.lostRegisteredSession)

async function goHomeAsGuest() {
  auth.forgetAccountKind()
  // `redirect` query'si ATAYLAB e'tiborsiz: u ko'pincha eski hisobning
  // sahifasi bo'ladi (masalan /test/play/<id>) va yangi mehmon uni ochib
  // 403/404 oladi. Tugma matni ham "Bosh sahifaga" deydi.
  await navigateTo('/')
}
</script>

<template>
  <!-- v-if/v-else-if/v-else Vue uchun BITTA ildiz hisoblanadi, shuning uchun
       ota-onadan kelgan `class` va scoped stil hamma shoxga normal tushadi. -->
  <button
    v-if="stuck && props.explicit"
    type="button"
    :title="i18n.t({
      uz: 'Mehmon sifatida davom etadi — yangi natijalar alohida hisobga yoziladi',
      kr: 'Меҳмон сифатида давом этади — янги натижалар алоҳида ҳисобга ёзилади',
    })"
    @click="goHomeAsGuest"
  >
    <slot />
  </button>
  <span v-else-if="stuck">
    <slot />
  </span>
  <NuxtLink v-else to="/">
    <slot />
  </NuxtLink>
</template>
