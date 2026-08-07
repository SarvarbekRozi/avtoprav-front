<script setup lang="ts">
/**
 * "AI tavsiya" kartasi uchun robot — inline SVG, 3D render ko'rinishida:
 * oq yumaloq korpus, to'q ekran-yuz, ko'k yaltiroq ko'zlar, qo'llari va
 * yumshoq soya.
 *
 * Nega inline SVG (rasm fayl emas): Telegram Mini App'da tashqi rasm sekin
 * keladi yoki bloklanadi; SVG HTML bilan birga darrov chiziladi, har qanday
 * o'lchamda tiniq va dark rejimda buzilmaydi.
 *
 * Idle animatsiya juda yumshoq: korpus sekin suzadi, qo'llar ozgina tebranadi,
 * antenna va ko'zlar yengil pulsatsiya qiladi, pastdagi soya nafas oladi.
 * Sakrash/aylanish yo'q; prefers-reduced-motion'da hammasi to'xtaydi.
 */
const uid = useId()
const g = (n: string) => `${uid}-${n}`
</script>

<template>
  <svg viewBox="0 0 220 210" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
    <defs>
      <!-- Oq korpus: chapdan yuqoridan yorug', o'ngda pastda ko'kish soya -->
      <linearGradient :id="g('shell')" x1="52" y1="34" x2="176" y2="160" gradientUnits="userSpaceOnUse">
        <stop stop-color="#ffffff" />
        <stop offset="0.5" stop-color="#f2f5fc" />
        <stop offset="1" stop-color="#c6d1e9" />
      </linearGradient>
      <linearGradient :id="g('body')" x1="70" y1="140" x2="160" y2="200" gradientUnits="userSpaceOnUse">
        <stop stop-color="#fbfcff" />
        <stop offset="1" stop-color="#bcc8e4" />
      </linearGradient>
      <linearGradient :id="g('limb')" x1="0" y1="0" x2="1" y2="1">
        <stop stop-color="#f4f7fd" />
        <stop offset="1" stop-color="#b3c0de" />
      </linearGradient>
      <!-- To'q ekran-yuz -->
      <linearGradient :id="g('visor')" x1="66" y1="60" x2="156" y2="126" gradientUnits="userSpaceOnUse">
        <stop stop-color="#2a3450" />
        <stop offset="0.45" stop-color="#161d33" />
        <stop offset="1" stop-color="#0c1226" />
      </linearGradient>
      <linearGradient :id="g('eye')" x1="0" y1="0" x2="0" y2="1">
        <stop stop-color="#cbf3ff" />
        <stop offset="0.4" stop-color="#5cc8fb" />
        <stop offset="1" stop-color="#4f6ef0" />
      </linearGradient>
      <linearGradient :id="g('accent')" x1="0" y1="0" x2="1" y2="1">
        <stop stop-color="#8b5cf6" />
        <stop offset="1" stop-color="#4f6ef0" />
      </linearGradient>
      <radialGradient :id="g('halo')" cx="0.5" cy="0.5" r="0.5">
        <stop stop-color="#7c8cf8" stop-opacity="0.42" />
        <stop offset="0.62" stop-color="#8b5cf6" stop-opacity="0.14" />
        <stop offset="1" stop-color="#8b5cf6" stop-opacity="0" />
      </radialGradient>
      <linearGradient :id="g('rim')" x1="0" y1="0" x2="0" y2="1">
        <stop stop-color="#ffffff" stop-opacity="0.95" />
        <stop offset="1" stop-color="#ffffff" stop-opacity="0" />
      </linearGradient>

      <filter :id="g('cast')" x="-45%" y="-45%" width="190%" height="190%">
        <feDropShadow dx="0" dy="12" stdDeviation="11" flood-color="#1e2a52" flood-opacity="0.26" />
      </filter>
      <filter :id="g('glow')" x="-90%" y="-90%" width="280%" height="280%">
        <feGaussianBlur stdDeviation="3.4" result="b" />
        <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
      <filter :id="g('softGlow')" x="-90%" y="-90%" width="280%" height="280%">
        <feGaussianBlur stdDeviation="6" />
      </filter>
    </defs>

    <!-- Orqa nur -->
    <circle cx="110" cy="104" r="86" :fill="`url(#${g('halo')})`" class="rb-halo" />
    <!-- Yerdagi soya (korpus suzganda "nafas oladi") -->
    <ellipse cx="110" cy="196" rx="56" ry="9" fill="#1e2a52" opacity="0.17" class="rb-shadow" />

    <!-- Butun robot birgalikda sekin suzadi -->
    <g class="rb-float">
      <!-- Antenna -->
      <path d="M110 36V20" stroke="#b9c5e2" stroke-width="5" stroke-linecap="round" />
      <g class="rb-antenna" :filter="`url(#${g('glow')})`">
        <circle cx="110" cy="14" r="8" :fill="`url(#${g('accent')})`" />
        <circle cx="107.5" cy="11.5" r="2.6" fill="#ffffff" opacity="0.85" />
      </g>

      <g :filter="`url(#${g('cast')})`">
        <!-- Qo'llar — yengil tebranadi -->
        <g class="rb-arm-l">
          <rect x="26" y="140" width="22" height="42" rx="11" :fill="`url(#${g('limb')})`" />
        </g>
        <g class="rb-arm-r">
          <rect x="172" y="140" width="22" height="42" rx="11" :fill="`url(#${g('limb')})`" />
        </g>

        <!-- Tana -->
        <path d="M78 132h64a34 34 0 0 1 34 34v8a14 14 0 0 1-14 14H58a14 14 0 0 1-14-14v-8a34 34 0 0 1 34-34z"
              :fill="`url(#${g('body')})`" />
        <path d="M78 132h64a34 34 0 0 1 34 34v8a14 14 0 0 1-14 14H58a14 14 0 0 1-14-14v-8a34 34 0 0 1 34-34z"
              fill="none" stroke="#ffffff" stroke-width="1.6" stroke-opacity="0.9" />
        <!-- Ko'krak chirog'i -->
        <circle cx="110" cy="166" r="11" fill="#e9edf9" />
        <circle cx="110" cy="166" r="7.5" :fill="`url(#${g('accent')})`" class="rb-core" :filter="`url(#${g('glow')})`" />

        <!-- Yon quloqlar -->
        <rect x="20" y="74" width="21" height="46" rx="10.5" :fill="`url(#${g('limb')})`" />
        <rect x="179" y="74" width="21" height="46" rx="10.5" :fill="`url(#${g('limb')})`" />
        <rect x="25" y="85" width="11" height="24" rx="5.5" :fill="`url(#${g('accent')})`" opacity="0.9" />
        <rect x="184" y="85" width="11" height="24" rx="5.5" :fill="`url(#${g('accent')})`" opacity="0.9" />

        <!-- Bosh -->
        <rect x="42" y="34" width="136" height="120" rx="46" :fill="`url(#${g('shell')})`" />
        <path d="M88 34h44a46 46 0 0 1 46 46v7a46 46 0 0 0-46-46H88a46 46 0 0 0-46 46v-7a46 46 0 0 1 46-46z"
              :fill="`url(#${g('rim')})`" opacity="0.9" />
        <rect x="42" y="34" width="136" height="120" rx="46" fill="none" stroke="#ffffff" stroke-width="1.6" stroke-opacity="0.75" />

        <!-- Ekran-yuz -->
        <rect x="62" y="58" width="96" height="72" rx="34" :fill="`url(#${g('visor')})`" />
        <rect x="62" y="58" width="96" height="72" rx="34" fill="none" stroke="#46557f" stroke-width="1.6" stroke-opacity="0.85" />
        <path d="M76 72q16-12 38-12 14 0 24 5-28 2-44 14-14 10-16 24-5-19-2-31z" fill="#ffffff" opacity="0.07" />

        <!-- Ko'zlar -->
        <g class="rb-eyes">
          <g :filter="`url(#${g('softGlow')})`" class="rb-eyeglow">
            <ellipse cx="90" cy="90" rx="11" ry="13.5" fill="#5cc8fb" />
            <ellipse cx="130" cy="90" rx="11" ry="13.5" fill="#5cc8fb" />
          </g>
          <ellipse cx="90" cy="90" rx="10.5" ry="13" :fill="`url(#${g('eye')})`" />
          <ellipse cx="130" cy="90" rx="10.5" ry="13" :fill="`url(#${g('eye')})`" />
          <circle cx="93.5" cy="84.5" r="3.4" fill="#ffffff" opacity="0.95" />
          <circle cx="133.5" cy="84.5" r="3.4" fill="#ffffff" opacity="0.95" />
          <circle cx="86.5" cy="97" r="1.8" fill="#ffffff" opacity="0.6" />
          <circle cx="126.5" cy="97" r="1.8" fill="#ffffff" opacity="0.6" />
        </g>

        <!-- Tabassum -->
        <path d="M99 111q11 8 22 0" stroke="#5cc8fb" stroke-width="3.4" stroke-linecap="round" opacity="0.8" />
      </g>
    </g>
  </svg>
</template>

<style scoped>
/* Hamma animatsiya juda yumshoq: sakrash, aylanish yoki kadrdan chiqish yo'q. */

.rb-float  { animation: rb-float 6s ease-in-out infinite; transform-origin: 110px 120px; }
.rb-shadow { animation: rb-shadow 6s ease-in-out infinite; transform-origin: 110px 196px; }
.rb-halo   { animation: rb-halo 7s ease-in-out infinite; transform-origin: 110px 104px; }
.rb-arm-l  { animation: rb-arm-l 5.5s ease-in-out infinite; transform-origin: 37px 148px; }
.rb-arm-r  { animation: rb-arm-r 5.5s ease-in-out infinite; transform-origin: 183px 148px; }
.rb-antenna{ animation: rb-antenna 2.6s ease-in-out infinite; transform-origin: 110px 14px; }
.rb-core   { animation: rb-core 3.2s ease-in-out infinite; }
.rb-eyeglow{ animation: rb-eyeglow 3.6s ease-in-out infinite; }
.rb-eyes   { animation: rb-blink 7s infinite; transform-origin: center 90px; }

/* Korpus atigi 4px suzadi */
@keyframes rb-float {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-4px); }
}
/* Soya korpus ko'tarilganda kichrayadi */
@keyframes rb-shadow {
  0%, 100% { transform: scaleX(1);    opacity: 0.17; }
  50%      { transform: scaleX(0.92); opacity: 0.11; }
}
@keyframes rb-halo {
  0%, 100% { opacity: 0.85; transform: scale(1); }
  50%      { opacity: 1;    transform: scale(1.04); }
}
/* Qo'llar 2 gradusdan kam tebranadi */
@keyframes rb-arm-l {
  0%, 100% { transform: rotate(0deg); }
  50%      { transform: rotate(-2deg); }
}
@keyframes rb-arm-r {
  0%, 100% { transform: rotate(0deg); }
  50%      { transform: rotate(2deg); }
}
@keyframes rb-antenna {
  0%, 100% { opacity: 0.85; transform: scale(1); }
  50%      { opacity: 1;    transform: scale(1.1); }
}
@keyframes rb-core {
  0%, 100% { opacity: 0.9; }
  50%      { opacity: 1; }
}
@keyframes rb-eyeglow {
  0%, 100% { opacity: 0.55; }
  50%      { opacity: 0.9; }
}
@keyframes rb-blink {
  0%, 94%, 100% { transform: scaleY(1); }
  97%           { transform: scaleY(0.1); }
}

@media (prefers-reduced-motion: reduce) {
  .rb-float, .rb-shadow, .rb-halo, .rb-arm-l, .rb-arm-r,
  .rb-antenna, .rb-core, .rb-eyeglow, .rb-eyes { animation: none; }
}
</style>
