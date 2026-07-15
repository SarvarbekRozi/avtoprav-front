<script setup lang="ts">
const theme = useTheme()

// Apply class on html during SSR + client (no flash)
useHead(() => ({
  htmlAttrs: { class: theme.isDark.value ? 'dark' : '' },
}))

// Structured data — Google "Avtoprav" brendini domen bilan bog'laydi (sitelinks,
// brend paneli imkoniyati). SSR'da ham chiqadi, shuning uchun crawler o'qiy oladi.
useHead({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'Organization',
            '@id': 'https://avtoprav.uz/#org',
            name: 'Avtoprav',
            url: 'https://avtoprav.uz',
            logo: 'https://avtoprav.uz/icon-512.png',
            sameAs: [
              'https://t.me/avtoprav_uz',
              'https://instagram.com/avtoprav_uz',
            ],
          },
          {
            '@type': 'WebSite',
            '@id': 'https://avtoprav.uz/#website',
            url: 'https://avtoprav.uz',
            name: 'Avtoprav',
            description: "O'zbekiston yo'l harakati qoidalari (YHQ) testlari, imtihon va biletlar",
            inLanguage: 'uz',
            publisher: { '@id': 'https://avtoprav.uz/#org' },
          },
        ],
      }),
    },
  ],
})
</script>

<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
