<script setup lang="ts">
/**
 * Imtihon CTA kartasi uchun illyustratsiya: checklist planshet + sekundomer.
 * Kompozitsiya dizayn maketiga mos: planshet o'ngga engil qiyshaygan,
 * taglik indigo (gradient fonga hamohang), belgilar KO'K, sekundomer
 * planshetning chap-past tomonida, atrofda mayda uchqunlar.
 * Inline SVG — tashqi rasm yuklanmaydi, har o'lchamda tiniq, dark'da buzilmaydi.
 * Gradient id'lari useId() bilan prefikslanadi.
 */
const uid = useId()
const g = (n: string) => `${uid}-${n}`
</script>

<template>
  <svg viewBox="0 0 280 240" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
    <defs>
      <!-- Planshet -->
      <linearGradient :id="g('sheet')" x1="88" y1="32" x2="218" y2="208" gradientUnits="userSpaceOnUse">
        <stop stop-color="#ffffff" />
        <stop offset="0.55" stop-color="#f4f7fd" />
        <stop offset="1" stop-color="#dde5f5" />
      </linearGradient>
      <linearGradient :id="g('backPlate')" x1="100" y1="42" x2="232" y2="218" gradientUnits="userSpaceOnUse">
        <stop stop-color="#8a95f6" />
        <stop offset="1" stop-color="#5058dd" />
      </linearGradient>
      <linearGradient :id="g('clip')" x1="132" y1="12" x2="180" y2="50" gradientUnits="userSpaceOnUse">
        <stop stop-color="#c7d2ea" />
        <stop offset="1" stop-color="#8195c2" />
      </linearGradient>
      <linearGradient :id="g('tick')" x1="0" y1="0" x2="1" y2="1">
        <stop stop-color="#6db4ff" />
        <stop offset="1" stop-color="#2563eb" />
      </linearGradient>

      <!-- Sekundomer: metall korpus -->
      <linearGradient :id="g('bezel')" x1="17" y1="126" x2="111" y2="224" gradientUnits="userSpaceOnUse">
        <stop stop-color="#ffffff" />
        <stop offset="0.35" stop-color="#dbe3f3" />
        <stop offset="0.7" stop-color="#9dadd0" />
        <stop offset="1" stop-color="#c7d2e8" />
      </linearGradient>
      <linearGradient :id="g('bezelInner')" x1="27" y1="136" x2="101" y2="214" gradientUnits="userSpaceOnUse">
        <stop stop-color="#8fa1c8" />
        <stop offset="1" stop-color="#c9d4ea" />
      </linearGradient>
      <linearGradient :id="g('face')" x1="31" y1="140" x2="97" y2="210" gradientUnits="userSpaceOnUse">
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
    <ellipse cx="140" cy="228" rx="112" ry="12" fill="#0a1430" opacity="0.18" />

    <!-- ── Planshet (maketdagidek o'ngga qiyshaygan) ── -->
    <g transform="rotate(7 155 122)" :filter="`url(#${g('cast')})`">
      <!-- orqa taglik: indigo, qalinlik effekti -->
      <rect x="98" y="40" width="134" height="172" rx="17" :fill="`url(#${g('backPlate')})`" />
      <!-- oq varaq -->
      <rect x="88" y="30" width="134" height="172" rx="16" :fill="`url(#${g('sheet')})`" />
      <rect x="88" y="30" width="134" height="172" rx="16" fill="none" stroke="#ffffff" stroke-width="1.5" stroke-opacity="0.9" />

      <!-- yuqoridagi qisqich -->
      <rect x="132" y="18" width="46" height="28" rx="10" :fill="`url(#${g('clip')})`" />
      <rect x="141" y="11" width="28" height="15" rx="7.5" fill="#56699c" />
      <rect x="141" y="11" width="28" height="6" rx="3" fill="#ffffff" opacity="0.28" />

      <!-- checklist: 2 ta bajarilgan (ko'k), 1 ta navbatda -->
      <g>
        <rect x="106" y="72" width="24" height="24" rx="8" :fill="`url(#${g('tick')})`" />
        <path d="M112 84.2l3.9 3.9 7.6-8" stroke="#ffffff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" />
        <rect x="140" y="75" width="62" height="7" rx="3.5" fill="#bcc8e2" />
        <rect x="140" y="87" width="40" height="7" rx="3.5" fill="#d6dded" />

        <rect x="106" y="112" width="24" height="24" rx="8" :fill="`url(#${g('tick')})`" />
        <path d="M112 124.2l3.9 3.9 7.6-8" stroke="#ffffff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" />
        <rect x="140" y="115" width="56" height="7" rx="3.5" fill="#bcc8e2" />
        <rect x="140" y="127" width="34" height="7" rx="3.5" fill="#d6dded" />

        <rect x="106" y="152" width="24" height="24" rx="8" fill="#e7eeff" stroke="#9db8ea" stroke-width="2" />
        <rect x="140" y="155" width="48" height="7" rx="3.5" fill="#ccd6ea" />
        <rect x="140" y="167" width="28" height="7" rx="3.5" fill="#e2e8f4" />
      </g>
    </g>

    <!-- ── Sekundomer (chap-pastda, planshet oldida) ── -->
    <g :filter="`url(#${g('cast')})`">
      <!-- toj (yuqoridagi tugma) -->
      <g transform="rotate(-14 64 116)">
        <rect x="56" y="106" width="16" height="16" rx="5" :fill="`url(#${g('crown')})`" />
        <rect x="52" y="96" width="24" height="12" rx="6" :fill="`url(#${g('crown')})`" />
        <rect x="52" y="96" width="24" height="4.5" rx="2.2" fill="#ffffff" opacity="0.45" />
      </g>
      <!-- yon tugma -->
      <g transform="rotate(-45 22 140)">
        <rect x="14" y="132" width="17" height="11" rx="5.5" :fill="`url(#${g('crown')})`" />
      </g>

      <!-- korpus -->
      <circle cx="64" cy="176" r="54" :fill="`url(#${g('bezel')})`" />
      <circle cx="64" cy="176" r="47" :fill="`url(#${g('bezelInner')})`" />
      <circle cx="64" cy="176" r="43" :fill="`url(#${g('face')})`" />
      <circle cx="64" cy="176" r="43" fill="none" stroke="#ffffff" stroke-width="2" stroke-opacity="0.9" />

      <!-- bo'linmalar -->
      <g stroke="#8fa0c6" stroke-width="2.6" stroke-linecap="round">
        <path d="M64 139v7" />
        <path d="M64 206v7" />
        <path d="M27 176h7" />
        <path d="M94 176h7" />
      </g>
      <g stroke="#c2cde4" stroke-width="2" stroke-linecap="round">
        <path d="M90.2 149.8l-4.2 4.2" />
        <path d="M42.2 197.8l-4.2 4.2" />
        <path d="M37.8 149.8l4.2 4.2" />
        <path d="M85.8 197.8l4.2 4.2" />
      </g>

      <!-- millar -->
      <path d="M64 176V146" stroke="#2d4276" stroke-width="5" stroke-linecap="round" />
      <path d="M64 176l19 13" stroke="#2d4276" stroke-width="4.2" stroke-linecap="round" />
      <path d="M64 176l-9 16" stroke="#ef4444" stroke-width="2.4" stroke-linecap="round" />
      <circle cx="64" cy="176" r="5.5" fill="#2d4276" />
      <circle cx="64" cy="176" r="2.2" fill="#ffffff" />

      <!-- shisha yaltirashi -->
      <path d="M64 133a43 43 0 0 0-38 63c-2-30 14-52 38-56 24-4 41 12 43 26a43 43 0 0 0-43-33z"
            :fill="`url(#${g('gloss')})`" opacity="0.7" />
    </g>

    <!-- ── Uchqunlar (maketdagidek mayda bezak) ── -->
    <g fill="#ffffff">
      <path d="M252 44l2.2 5.8 5.8 2.2-5.8 2.2-2.2 5.8-2.2-5.8-5.8-2.2 5.8-2.2z" opacity="0.9" />
      <path d="M32 62l1.6 4.2 4.2 1.6-4.2 1.6-1.6 4.2-1.6-4.2-4.2-1.6 4.2-1.6z" opacity="0.7" />
      <circle cx="246" cy="128" r="3" opacity="0.55" />
      <circle cx="20" cy="98" r="2.2" opacity="0.45" />
    </g>
  </svg>
</template>
