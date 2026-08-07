<script setup lang="ts">
/**
 * Imtihon CTA kartasi uchun illyustratsiya: checklist planshet + sekundomer.
 * Inline SVG — tashqi rasm yuklanmaydi (Telegram Mini App'da ham darrov chiziladi),
 * har qanday o'lchamda tiniq, dark rejimda buzilmaydi.
 * Gradient id'lari useId() bilan prefikslanadi.
 */
const uid = useId()
const g = (n: string) => `${uid}-${n}`
</script>

<template>
  <svg viewBox="0 0 280 240" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
    <defs>
      <!-- Planshet -->
      <linearGradient :id="g('sheet')" x1="46" y1="36" x2="176" y2="212" gradientUnits="userSpaceOnUse">
        <stop stop-color="#ffffff" />
        <stop offset="0.55" stop-color="#f4f7fd" />
        <stop offset="1" stop-color="#dde5f5" />
      </linearGradient>
      <linearGradient :id="g('backPlate')" x1="60" y1="46" x2="190" y2="220" gradientUnits="userSpaceOnUse">
        <stop stop-color="#a9b8dc" />
        <stop offset="1" stop-color="#7288b8" />
      </linearGradient>
      <linearGradient :id="g('clip')" x1="98" y1="14" x2="146" y2="52" gradientUnits="userSpaceOnUse">
        <stop stop-color="#aab9dc" />
        <stop offset="1" stop-color="#667cb0" />
      </linearGradient>
      <linearGradient :id="g('tick')" x1="0" y1="0" x2="1" y2="1">
        <stop stop-color="#5ee89a" />
        <stop offset="1" stop-color="#12a24f" />
      </linearGradient>

      <!-- Sekundomer: metall korpus -->
      <linearGradient :id="g('bezel')" x1="162" y1="118" x2="256" y2="216" gradientUnits="userSpaceOnUse">
        <stop stop-color="#ffffff" />
        <stop offset="0.35" stop-color="#dbe3f3" />
        <stop offset="0.7" stop-color="#9dadd0" />
        <stop offset="1" stop-color="#c7d2e8" />
      </linearGradient>
      <linearGradient :id="g('bezelInner')" x1="172" y1="128" x2="246" y2="206" gradientUnits="userSpaceOnUse">
        <stop stop-color="#8fa1c8" />
        <stop offset="1" stop-color="#c9d4ea" />
      </linearGradient>
      <linearGradient :id="g('face')" x1="176" y1="132" x2="242" y2="202" gradientUnits="userSpaceOnUse">
        <stop stop-color="#ffffff" />
        <stop offset="1" stop-color="#e9eef9" />
      </linearGradient>
      <linearGradient :id="g('crown')" x1="0" y1="0" x2="0" y2="1">
        <stop stop-color="#c3cee8" />
        <stop offset="1" stop-color="#7f92bd" />
      </linearGradient>
      <linearGradient :id="g('gloss')" x1="0" y1="0" x2="0.6" y2="1">
        <stop stop-color="#ffffff" stop-opacity="0.85" />
        <stop offset="0.6" stop-color="#ffffff" stop-opacity="0.06" />
        <stop offset="1" stop-color="#ffffff" stop-opacity="0" />
      </linearGradient>

      <filter :id="g('cast')" x="-40%" y="-40%" width="180%" height="180%">
        <feDropShadow dx="0" dy="10" stdDeviation="10" flood-color="#0a1430" flood-opacity="0.30" />
      </filter>
    </defs>

    <!-- Yerdagi soya -->
    <ellipse cx="146" cy="226" rx="104" ry="12" fill="#0a1430" opacity="0.18" />

    <!-- ── Planshet (biroz burilgan) ── -->
    <g transform="rotate(-6 118 128)" :filter="`url(#${g('cast')})`">
      <!-- orqa taglik: qalinlik effekti -->
      <rect x="56" y="44" width="134" height="172" rx="17" :fill="`url(#${g('backPlate')})`" />
      <!-- oq varaq -->
      <rect x="46" y="34" width="134" height="172" rx="16" :fill="`url(#${g('sheet')})`" />
      <rect x="46" y="34" width="134" height="172" rx="16" fill="none" stroke="#ffffff" stroke-width="1.5" stroke-opacity="0.9" />

      <!-- yuqoridagi qisqich -->
      <rect x="90" y="22" width="46" height="28" rx="10" :fill="`url(#${g('clip')})`" />
      <rect x="99" y="15" width="28" height="15" rx="7.5" fill="#56699c" />
      <rect x="99" y="15" width="28" height="6" rx="3" fill="#ffffff" opacity="0.28" />

      <!-- checklist: 2 ta bajarilgan, 1 ta bo'sh -->
      <g>
        <rect x="64" y="76" width="24" height="24" rx="8" :fill="`url(#${g('tick')})`" />
        <path d="M70 88.2l3.9 3.9 7.6-8" stroke="#ffffff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" />
        <rect x="98" y="79" width="62" height="7" rx="3.5" fill="#bcc8e2" />
        <rect x="98" y="91" width="40" height="7" rx="3.5" fill="#d6dded" />

        <rect x="64" y="116" width="24" height="24" rx="8" :fill="`url(#${g('tick')})`" />
        <path d="M70 128.2l3.9 3.9 7.6-8" stroke="#ffffff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" />
        <rect x="98" y="119" width="56" height="7" rx="3.5" fill="#bcc8e2" />
        <rect x="98" y="131" width="34" height="7" rx="3.5" fill="#d6dded" />

        <rect x="64" y="156" width="24" height="24" rx="8" fill="#eef2fa" stroke="#c3cee6" stroke-width="2" />
        <rect x="98" y="159" width="48" height="7" rx="3.5" fill="#ccd6ea" />
        <rect x="98" y="171" width="28" height="7" rx="3.5" fill="#e2e8f4" />
      </g>
    </g>

    <!-- ── Sekundomer ── -->
    <g :filter="`url(#${g('cast')})`">
      <!-- toj (yuqoridagi tugma) -->
      <g transform="rotate(18 209 108)">
        <rect x="201" y="98" width="16" height="16" rx="5" :fill="`url(#${g('crown')})`" />
        <rect x="197" y="88" width="24" height="12" rx="6" :fill="`url(#${g('crown')})`" />
        <rect x="197" y="88" width="24" height="4.5" rx="2.2" fill="#ffffff" opacity="0.45" />
      </g>
      <!-- yon tugma -->
      <g transform="rotate(45 248 132)">
        <rect x="240" y="124" width="17" height="11" rx="5.5" :fill="`url(#${g('crown')})`" />
      </g>

      <!-- korpus -->
      <circle cx="209" cy="168" r="54" :fill="`url(#${g('bezel')})`" />
      <circle cx="209" cy="168" r="47" :fill="`url(#${g('bezelInner')})`" />
      <circle cx="209" cy="168" r="43" :fill="`url(#${g('face')})`" />
      <circle cx="209" cy="168" r="43" fill="none" stroke="#ffffff" stroke-width="2" stroke-opacity="0.9" />

      <!-- bo'linmalar -->
      <g stroke="#8fa0c6" stroke-width="2.6" stroke-linecap="round">
        <path d="M209 131v7" />
        <path d="M209 198v7" />
        <path d="M172 168h7" />
        <path d="M239 168h7" />
      </g>
      <g stroke="#c2cde4" stroke-width="2" stroke-linecap="round">
        <path d="M235.2 141.8l-4.2 4.2" />
        <path d="M187.2 189.8l-4.2 4.2" />
        <path d="M182.8 141.8l4.2 4.2" />
        <path d="M230.8 189.8l4.2 4.2" />
      </g>

      <!-- millar -->
      <path d="M209 168V138" stroke="#2d4276" stroke-width="5" stroke-linecap="round" />
      <path d="M209 168l19 13" stroke="#2d4276" stroke-width="4.2" stroke-linecap="round" />
      <path d="M209 168l-9 16" stroke="#ef4444" stroke-width="2.4" stroke-linecap="round" />
      <circle cx="209" cy="168" r="5.5" fill="#2d4276" />
      <circle cx="209" cy="168" r="2.2" fill="#ffffff" />

      <!-- shisha yaltirashi -->
      <path d="M209 125a43 43 0 0 0-38 63c-2-30 14-52 38-56 24-4 41 12 43 26a43 43 0 0 0-43-33z"
            :fill="`url(#${g('gloss')})`" opacity="0.7" />
    </g>
  </svg>
</template>
