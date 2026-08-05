export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    '@vueuse/nuxt',
    '@nuxt/icon',
  ],

  icon: {
    serverBundle: { collections: ['lucide', 'heroicons'] },
    class: 'iconify',
    mode: 'svg',
  },

  css: ['~/assets/css/main.css'],

  app: {
    head: {
      htmlAttrs: { lang: 'uz' },
      // Brend "Avtoprav" sarlavha/tavsifda bo'lishi shart — Google'da "avtoprav"
      // qidiruvida chiqishi uchun. Sahifa o'z sarlavhasini bersa, brend ortiga qo'shiladi.
      title: 'Avtoprav — Yo\'l harakati qoidalari (YHQ) testlari onlayn',
      titleTemplate: (t?: string) =>
        t && !t.startsWith('Avtoprav') ? `${t} · Avtoprav` : (t || 'Avtoprav — Yo\'l harakati qoidalari (YHQ) testlari onlayn'),
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'description', content: 'Avtoprav — O\'zbekiston yo\'l harakati qoidalari (YHQ) bo\'yicha onlayn testlar: imtihon rejimi, biletlar, AI tushuntirish va statistika. Haydovchilik guvohnomasi (prava) imtihoniga bepul tayyorlaning.' },
        { name: 'keywords', content: 'avtoprav, avtoprav uz, yhq test, yo\'l harakati qoidalari, prava test, haydovchilik testi, imtihon, biletlar, avtomaktab, YHQ 2026' },
        { name: 'author', content: 'Avtoprav' },
        { name: 'application-name', content: 'Avtoprav' },
        { name: 'theme-color', content: '#eef2fb' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
        { name: 'apple-mobile-web-app-title', content: 'Avtoprav' },
        // Open Graph (Telegram/Facebook/ijtimoiy ulashishda chiroyli ko'rinish)
        { property: 'og:type', content: 'website' },
        { property: 'og:site_name', content: 'Avtoprav' },
        { property: 'og:title', content: 'Avtoprav — Yo\'l harakati qoidalari (YHQ) testlari onlayn' },
        { property: 'og:description', content: 'O\'zbekiston YHQ bo\'yicha onlayn testlar, imtihon rejimi, biletlar va AI tushuntirish. Prava imtihoniga bepul tayyorlaning.' },
        { property: 'og:url', content: 'https://avtoprav.uz' },
        { property: 'og:image', content: 'https://avtoprav.uz/icon-512.png' },
        { property: 'og:locale', content: 'uz_UZ' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: 'Avtoprav — YHQ testlari onlayn' },
        { name: 'twitter:description', content: 'O\'zbekiston yo\'l harakati qoidalari bo\'yicha onlayn testlar va imtihon.' },
        { name: 'twitter:image', content: 'https://avtoprav.uz/icon-512.png' },
      ],
      link: [
        { rel: 'manifest', href: '/manifest.webmanifest' },
        { rel: 'icon', type: 'image/svg+xml', href: '/logo-mark.svg?v=2' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32.png?v=2' },
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico?v=2' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png?v=2' },
      ],
      script: [
        {
          // Telegram Mini App initData'sini ENG BIRINCHI bo'lib ushlab qoladi.
          //
          // NEGA INLINE: rasmiy telegram-web-app.js yuklangach URL hash'ini
          // tozalab yuboradi, Nuxt bundle'i esa undan keyin ishlaydi. Natijada
          // avto-kirish bajarilmay, bot orqali ro'yxatdan o'tgan odam Mini
          // App'da MEHMON bo'lib qolardi. Bu skript <head> ichida, hamma
          // narsadan oldin ishlaydi — qiymat kafolatlangan.
          //
          // Ikkala ko'rinish qo'llab-quvvatlanadi: kodlangan (odatiy) va
          // dekodlangan (brauzer/router dekodlab qo'ygan holat).
          innerHTML: 'try{var h=(location.hash||"").replace(/^#/,"");if(h){var m=h.match(/(?:^|&)tgWebAppData=([^&]*)/),v="";'
            + 'if(m&&m[1]){try{v=decodeURIComponent(m[1])}catch(e){v=m[1]}}'
            + 'if(v.indexOf("hash=")<0&&h.indexOf("hash=")>-1&&h.indexOf("auth_date=")>-1){'
            + 'v=h.replace(/^tgWebAppData=/,"").split("&").filter(function(p){return !/^tgWebApp[A-Za-z]*=/.test(p)}).join("&")}'
            + 'if(v.indexOf("hash=")>-1){window.__tgInitData=v}}}catch(e){}',
          tagPosition: 'head',
          tagPriority: -100,
        },
      ],
    },
  },

  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'https://admin.avtoprav.uz',
      // Ijtimoiy kirish (Google / Telegram). Skriptlar sahifa ochilganda EMAS,
      // faqat kerak bo'lganda yuklanadi — shuning uchun app.head'da hech narsa yo'q.
      // Google Client ID MAXFIY EMAS — u har bir sahifa kodida ochiq turadi
      // (maxfiysi "client secret", u umuman ishlatilmaydi: ID-token server
      // ichida Google'ning ochiq kalitlari bilan tekshiriladi).
      // Shuning uchun default sifatida shu yerda turadi — aks holda .env
      // gitignore'da bo'lgani uchun serverda bo'sh qolib, tugma chiqmaydi.
      googleClientId: process.env.NUXT_PUBLIC_GOOGLE_CLIENT_ID
        || '537094352809-6hlgb6evcph2vj89arfkvat2958epcs7.apps.googleusercontent.com',
      telegramBotName: process.env.NUXT_PUBLIC_TELEGRAM_BOT_NAME || 'avtoprav_auto_bot',
      telegramBotId: process.env.NUXT_PUBLIC_TELEGRAM_BOT_ID || '8707751023',
    },
  },

  routeRules: {
    '/test/play/**': { ssr: false },
    '/test/result/**': { ssr: false },
    '/pricing': { ssr: false },
  },

  tailwindcss: {
    cssPath: '~/assets/css/main.css',
  },
})
