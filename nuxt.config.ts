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
      title: 'AutoTest · Yo\'l harakati qoidalari',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'description', content: 'Yo\'l harakati qoidalari testlari — onlayn imtihon, biletlar, statistika' },
        { name: 'theme-color', content: '#f97316' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
        { name: 'apple-mobile-web-app-title', content: 'AutoTest' },
      ],
      link: [
        { rel: 'manifest', href: '/manifest.webmanifest' },
        { rel: 'icon', type: 'image/svg+xml', href: '/icon-192.svg' },
        { rel: 'apple-touch-icon', href: '/icon-192.svg' },
      ],
    },
  },

  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://127.0.0.1:8000',
    },
  },

  routeRules: {
    '/test/play/**': { ssr: false },
    '/test/result/**': { ssr: false },
  },

  tailwindcss: {
    cssPath: '~/assets/css/main.css',
  },

  vite: {
    optimizeDeps: {
      include: [
        'three',
        'three/examples/jsm/controls/OrbitControls.js',
        'three/examples/jsm/geometries/RoundedBoxGeometry.js',
        'three/examples/jsm/environments/RoomEnvironment.js',
        'three/examples/jsm/loaders/GLTFLoader.js',
      ],
    },
  },
})
