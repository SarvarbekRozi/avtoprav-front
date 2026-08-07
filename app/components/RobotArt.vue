<script setup lang="ts">
/**
 * AI tavsiya kartasi uchun robot — inline SVG, "3D render" ko'rinishida:
 * oq tanа, ko'k/binafsha yorug'lik, to'q ekran-yuz va yaltiroq ko'zlar.
 *
 * Nega inline SVG (rasm fayl emas): Telegram Mini App'da tashqi rasm sekin
 * keladi yoki umuman bloklanadi, SVG esa HTML bilan birga darrov chiziladi,
 * har qanday o'lchamda tiniq va dark rejimda ham buzilmaydi.
 *
 * Gradient id'lari useId() bilan prefikslanadi — bitta sahifada bir nechta
 * nusxa tursa ham ranglar bir-biriga aralashib ketmaydi.
 */
const uid = useId()
const g = (n: string) => `${uid}-${n}`
</script>

<template>
  <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
    <defs>
      <!-- Oq korpus: chapdan yuqoridan yorug', o'ngda pastda ko'k soya -->
      <linearGradient :id="g('shell')" x1="46" y1="34" x2="158" y2="150" gradientUnits="userSpaceOnUse">
        <stop stop-color="#ffffff" />
        <stop offset="0.52" stop-color="#f1f4fb" />
        <stop offset="1" stop-color="#c8d3ea" />
      </linearGradient>
      <linearGradient :id="g('shellBody')" x1="60" y1="140" x2="150" y2="188" gradientUnits="userSpaceOnUse">
        <stop stop-color="#f6f8fd" />
        <stop offset="1" stop-color="#bdc9e4" />
      </linearGradient>
      <linearGradient :id="g('limb')" x1="0" y1="0" x2="1" y2="1">
        <stop stop-color="#eef2fa" />
        <stop offset="1" stop-color="#aebbdb" />
      </linearGradient>
      <!-- To'q ekran-yuz -->
      <linearGradient :id="g('visor')" x1="54" y1="56" x2="146" y2="122" gradientUnits="userSpaceOnUse">
        <stop stop-color="#26304d" />
        <stop offset="0.45" stop-color="#161d33" />
        <stop offset="1" stop-color="#0d142a" />
      </linearGradient>
      <linearGradient :id="g('eye')" x1="0" y1="0" x2="0" y2="1">
        <stop stop-color="#bff0ff" />
        <stop offset="0.45" stop-color="#5ac8fa" />
        <stop offset="1" stop-color="#4f6ef0" />
      </linearGradient>
      <!-- Yon "quloq"lar va ko'krak chirog'i -->
      <linearGradient :id="g('accent')" x1="0" y1="0" x2="1" y2="1">
        <stop stop-color="#8b5cf6" />
        <stop offset="1" stop-color="#4f6ef0" />
      </linearGradient>
      <radialGradient :id="g('halo')" cx="0.5" cy="0.5" r="0.5">
        <stop stop-color="#7c8cf8" stop-opacity="0.45" />
        <stop offset="0.6" stop-color="#8b5cf6" stop-opacity="0.16" />
        <stop offset="1" stop-color="#8b5cf6" stop-opacity="0" />
      </radialGradient>
      <!-- Korpus ichidagi yuqori nur (rim light) -->
      <linearGradient :id="g('rim')" x1="0" y1="0" x2="0" y2="1">
        <stop stop-color="#ffffff" stop-opacity="0.95" />
        <stop offset="1" stop-color="#ffffff" stop-opacity="0" />
      </linearGradient>

      <filter :id="g('cast')" x="-45%" y="-45%" width="190%" height="190%">
        <feDropShadow dx="0" dy="10" stdDeviation="10" flood-color="#1e2a52" flood-opacity="0.26" />
      </filter>
      <filter :id="g('glow')" x="-80%" y="-80%" width="260%" height="260%">
        <feGaussianBlur stdDeviation="3.2" result="b" />
        <feMerge>
          <feMergeNode in="b" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <filter :id="g('softGlow')" x="-80%" y="-80%" width="260%" height="260%">
        <feGaussianBlur stdDeviation="6" />
      </filter>
    </defs>

    <!-- Orqa yorug'lik + yerdagi soya -->
    <circle cx="100" cy="104" r="82" :fill="`url(#${g('halo')})`" />
    <ellipse cx="100" cy="186" rx="56" ry="9" fill="#1e2a52" opacity="0.16" />

    <!-- Antenna -->
    <path d="M100 32V17" stroke="#b9c5e2" stroke-width="5" stroke-linecap="round" />
    <g :filter="`url(#${g('glow')})`">
      <circle cx="100" cy="12" r="7.5" :fill="`url(#${g('accent')})`" />
      <circle cx="98" cy="10" r="2.4" fill="#ffffff" opacity="0.85" />
    </g>

    <g :filter="`url(#${g('cast')})`">
      <!-- Qo'llar -->
      <rect x="24" y="142" width="21" height="36" rx="10.5" :fill="`url(#${g('limb')})`" />
      <rect x="155" y="142" width="21" height="36" rx="10.5" :fill="`url(#${g('limb')})`" />

      <!-- Tana -->
      <path d="M70 132h60a30 30 0 0 1 30 30v10a12 12 0 0 1-12 12H52a12 12 0 0 1-12-12v-10a30 30 0 0 1 30-30z"
            :fill="`url(#${g('shellBody')})`" />
      <path d="M70 132h60a30 30 0 0 1 30 30v10a12 12 0 0 1-12 12H52a12 12 0 0 1-12-12v-10a30 30 0 0 1 30-30z"
            fill="none" stroke="#ffffff" stroke-width="1.5" stroke-opacity="0.85" />
      <!-- Ko'krak chirog'i -->
      <circle cx="100" cy="162" r="9" fill="#e8edf9" />
      <circle cx="100" cy="162" r="6" :fill="`url(#${g('accent')})`" :filter="`url(#${g('glow')})`" />

      <!-- Yon quloqlar -->
      <rect x="16" y="70" width="19" height="42" rx="9.5" :fill="`url(#${g('limb')})`" />
      <rect x="165" y="70" width="19" height="42" rx="9.5" :fill="`url(#${g('limb')})`" />
      <rect x="20.5" y="80" width="10" height="22" rx="5" :fill="`url(#${g('accent')})`" opacity="0.9" />
      <rect x="169.5" y="80" width="10" height="22" rx="5" :fill="`url(#${g('accent')})`" opacity="0.9" />

      <!-- Bosh -->
      <rect x="34" y="32" width="132" height="118" rx="40" :fill="`url(#${g('shell')})`" />
      <!-- yuqori rim light -->
      <path d="M74 32h52a40 40 0 0 1 40 40v6a40 40 0 0 0-40-40H74a40 40 0 0 0-40 40v-6a40 40 0 0 1 40-40z"
            :fill="`url(#${g('rim')})`" opacity="0.9" />
      <rect x="34" y="32" width="132" height="118" rx="40" fill="none" stroke="#ffffff" stroke-width="1.5" stroke-opacity="0.7" />

      <!-- Ekran-yuz -->
      <rect x="50" y="54" width="100" height="70" rx="32" :fill="`url(#${g('visor')})`" />
      <rect x="50" y="54" width="100" height="70" rx="32" fill="none" stroke="#4a5883" stroke-width="1.5" stroke-opacity="0.8" />
      <!-- ekran yaltirashi -->
      <path d="M62 66q14-10 34-10 12 0 20 4-24 2-38 12-12 8-14 20-4-16-2-26z" fill="#ffffff" opacity="0.07" />

      <!-- Ko'zlar -->
      <g class="robot-eyes">
        <g :filter="`url(#${g('softGlow')})`" opacity="0.75">
          <ellipse cx="78" cy="86" rx="10" ry="12" fill="#5ac8fa" />
          <ellipse cx="122" cy="86" rx="10" ry="12" fill="#5ac8fa" />
        </g>
        <ellipse cx="78" cy="86" rx="9.5" ry="11.5" :fill="`url(#${g('eye')})`" />
        <ellipse cx="122" cy="86" rx="9.5" ry="11.5" :fill="`url(#${g('eye')})`" />
        <circle cx="81" cy="81" r="3" fill="#ffffff" opacity="0.95" />
        <circle cx="125" cy="81" r="3" fill="#ffffff" opacity="0.95" />
        <circle cx="75" cy="92" r="1.6" fill="#ffffff" opacity="0.6" />
        <circle cx="119" cy="92" r="1.6" fill="#ffffff" opacity="0.6" />
      </g>

      <!-- Tabassum -->
      <path d="M88 105q12 8 24 0" stroke="#5ac8fa" stroke-width="3.2" stroke-linecap="round" opacity="0.8" />
    </g>
  </svg>
</template>

<style scoped>
.robot-eyes {
  animation: robot-blink 6s infinite;
  transform-origin: center 86px;
}
@keyframes robot-blink {
  0%, 93%, 100% { transform: scaleY(1); }
  96%           { transform: scaleY(0.1); }
}
@media (prefers-reduced-motion: reduce) {
  .robot-eyes { animation: none; }
}
</style>
