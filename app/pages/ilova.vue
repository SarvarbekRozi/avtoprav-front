<script setup lang="ts">
/**
 * Mobil ilovaning App Link manzili.
 *
 * Botdagi "Ilovaga qaytish" tugmasi shu yerga ishora qiladi. Telefonda ilova
 * o'rnatilgan bo'lsa Android havolani ushlab qoladi va bu sahifa umuman
 * ochilmaydi — u faqat ZAXIRA: ilova yo'q, App Link tekshiruvi o'tmagan yoki
 * havola kompyuterda ochilgan holatlar uchun.
 *
 * `auth` middleware ATAYIN yo'q: bu sahifa mehmon hisobi yaratishi shart emas,
 * u shunchaki tushuntirish beradi.
 */
const i18n = useI18n()

useHead({
  title: 'Avtoprav ilovasi',
  meta: [{ name: 'robots', content: 'noindex' }],
})
</script>

<template>
  <div class="min-h-[70vh] flex items-center justify-center px-4">
    <div class="card p-7 max-w-md w-full text-center">
      <h1 class="text-2xl font-semibold tracking-tightish text-ink-900">
        {{ i18n.t({ uz: 'Avtoprav ilovasi', kr: 'Автоправ иловаси' }) }}
      </h1>

      <p class="text-ink-600 mt-3 leading-relaxed">
        {{ i18n.t({
          uz: 'Telefoningizda Avtoprav ilovasi o‘rnatilgan bo‘lsa, bu havola uni o‘zi ochadi. Ochilmadimi — ilovaga qo‘lda qayting, kirish allaqachon tasdiqlangan.',
          kr: 'Телефонингизда Автоправ иловаси ўрнатилган бўлса, бу ҳавола уни ўзи очади. Очилмадими — иловага қўлда қайтинг, кириш аллақачон тасдиқланган.',
        }) }}
      </p>

      <NuxtLink to="/" class="btn-primary mt-6 inline-flex">
        {{ i18n.t({ uz: 'Saytda davom etish', kr: 'Сайтда давом этиш' }) }}
      </NuxtLink>
    </div>
  </div>
</template>
