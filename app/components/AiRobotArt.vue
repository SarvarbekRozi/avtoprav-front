<script setup lang="ts">
/**
 * AI yordamchi robot — dizayn maketiga mos illyustratsiya.
 *
 * NEGA SVG (Three.js EMAS): oldingi WebGL robot GPU/yorug'likka qarab har
 * qurilmada boshqacha (ko'pincha qop-qora) chiqardi va maketdagi oq, kulgichli
 * robotga o'xshamasdi. SVG deterministik — hamma joyda bir xil, SSR'da ham
 * chiziladi, `three` (~580KB) yuklanmaydi.
 *
 * Harakat: suzish (float), pirpirash (blink), ko'krak chirog'i pulsi — CSS.
 * prefers-reduced-motion hurmat qilinadi.
 */
type RobotState = 'idle' | 'thinking' | 'happy' | 'studying' | 'success' | 'warning'

const props = withDefaults(defineProps<{ state?: RobotState }>(), { state: 'idle' })

const uid = useId()
const g = (n: string) => `${uid}-${n}`

const happy = computed(() => props.state === 'happy' || props.state === 'success')
const warning = computed(() => props.state === 'warning')

// Kulgich: odatiy holatda yumshoq tabassum, xursand holatda kengroq ochiq kulgi
const smilePath = computed(() => happy.value
  ? 'M96 94 Q110 108 124 94'
  : 'M99 95 Q110 103 121 95')

const eyeFill = computed(() => warning.value ? `url(#${g('eyeWarn')})` : `url(#${g('eye')})`)
</script>

<template>
  <div class="ai-bot" :class="{ 'is-happy': happy }" aria-hidden="true">
    <svg viewBox="0 0 220 260" fill="none" xmlns="http://www.w3.org/2000/svg"
         preserveAspectRatio="xMidYMax meet">
      <defs>
        <!-- Oq korpus: tepasi yorug', pasti sovuq soyali -->
        <linearGradient :id="g('shell')" x1="0" y1="0" x2="0" y2="1">
          <stop stop-color="#ffffff" />
          <stop offset="0.62" stop-color="#f3f6fd" />
          <stop offset="1" stop-color="#dbe3f4" />
        </linearGradient>
        <linearGradient :id="g('shellDeep')" x1="0" y1="0" x2="0" y2="1">
          <stop stop-color="#f6f8fe" />
          <stop offset="1" stop-color="#cdd8ee" />
        </linearGradient>
        <!-- Yuz ekrani: to'q kok-siyoh -->
        <linearGradient :id="g('face')" x1="0" y1="0" x2="0" y2="1">
          <stop stop-color="#233a66" />
          <stop offset="1" stop-color="#0b1a38" />
        </linearGradient>
        <!-- Ko'zlar: yaltiroq siyan -->
        <radialGradient :id="g('eye')" cx="0.38" cy="0.32" r="0.85">
          <stop stop-color="#dffaff" />
          <stop offset="0.35" stop-color="#7fe0ff" />
          <stop offset="1" stop-color="#1aa6ec" />
        </radialGradient>
        <radialGradient :id="g('eyeWarn')" cx="0.38" cy="0.32" r="0.85">
          <stop stop-color="#fff3d9" />
          <stop offset="0.35" stop-color="#ffc866" />
          <stop offset="1" stop-color="#f08c1a" />
        </radialGradient>
        <!-- Ko'k detallar: quloq, antenna, ko'krak -->
        <linearGradient :id="g('blue')" x1="0" y1="0" x2="0" y2="1">
          <stop stop-color="#7cc2ff" />
          <stop offset="1" stop-color="#3b82f6" />
        </linearGradient>
        <radialGradient :id="g('chest')" cx="0.5" cy="0.4" r="0.75">
          <stop stop-color="#b4e2ff" />
          <stop offset="0.55" stop-color="#57b1ff" />
          <stop offset="1" stop-color="#2f6ef0" />
        </radialGradient>
        <radialGradient :id="g('shadow')" cx="0.5" cy="0.5" r="0.5">
          <stop stop-color="#5967c7" stop-opacity="0.32" />
          <stop offset="0.7" stop-color="#5967c7" stop-opacity="0.12" />
          <stop offset="1" stop-color="#5967c7" stop-opacity="0" />
        </radialGradient>
      </defs>

      <!-- Yer soyasi (suzishga teskari puls) -->
      <ellipse class="bot-shadow" cx="110" cy="243" rx="56" ry="10" :fill="`url(#${g('shadow')})`" />

      <g class="bot-float">
        <!-- Antenna -->
        <rect x="106.5" y="10" width="7" height="16" rx="3.5" :fill="`url(#${g('shellDeep')})`" />
        <circle class="bot-glow" cx="110" cy="9" r="7" :fill="`url(#${g('blue')})`" />
        <circle cx="107.6" cy="6.4" r="2" fill="#ffffff" opacity="0.75" />

        <!-- Quloq g'ilofchalari -->
        <circle cx="31" cy="80" r="13" :fill="`url(#${g('blue')})`" />
        <circle cx="189" cy="80" r="13" :fill="`url(#${g('blue')})`" />
        <circle cx="27.5" cy="75.5" r="3.4" fill="#ffffff" opacity="0.55" />
        <circle cx="185.5" cy="75.5" r="3.4" fill="#ffffff" opacity="0.55" />

        <!-- Bosh -->
        <rect x="38" y="24" width="144" height="110" rx="52" :fill="`url(#${g('shell')})`" />
        <!-- tepa yaltirashi -->
        <path d="M60 40 Q110 22 160 40 Q120 32 60 40z" fill="#ffffff" opacity="0.8" />

        <!-- Yuz ekrani -->
        <rect x="57" y="46" width="106" height="66" rx="28" :fill="`url(#${g('face')})`" />
        <rect x="57" y="46" width="106" height="66" rx="28" fill="none"
              stroke="#3d5a94" stroke-opacity="0.5" stroke-width="1.5" />

        <!-- Ko'zlar (pirpiraydi) -->
        <g class="bot-eye">
          <circle cx="89" cy="76" r="12.5" :fill="eyeFill" />
          <circle cx="84.6" cy="71" r="4" fill="#ffffff" opacity="0.9" />
          <circle cx="92.8" cy="81.5" r="1.8" fill="#ffffff" opacity="0.45" />
        </g>
        <g class="bot-eye">
          <circle cx="131" cy="76" r="12.5" :fill="eyeFill" />
          <circle cx="126.6" cy="71" r="4" fill="#ffffff" opacity="0.9" />
          <circle cx="134.8" cy="81.5" r="1.8" fill="#ffffff" opacity="0.45" />
        </g>

        <!-- Kulgich -->
        <path :d="smilePath" stroke="#6fd8ff" stroke-width="3.6"
              stroke-linecap="round" fill="none" />

        <!-- Qo'llar -->
        <g class="bot-arm bot-arm-l">
          <rect x="52" y="138" width="19" height="46" rx="9.5" :fill="`url(#${g('shellDeep')})`"
                transform="rotate(20 61 142)" />
        </g>
        <g class="bot-arm bot-arm-r">
          <rect x="149" y="138" width="19" height="46" rx="9.5" :fill="`url(#${g('shellDeep')})`"
                transform="rotate(-20 159 142)" />
        </g>

        <!-- Tana -->
        <rect x="71" y="132" width="78" height="66" rx="30" :fill="`url(#${g('shell')})`" />
        <!-- ko'krak paneli -->
        <rect x="88" y="144" width="44" height="34" rx="14" fill="#ffffff" opacity="0.65" />
        <circle class="bot-glow" cx="110" cy="161" r="9" :fill="`url(#${g('chest')})`" />

        <!-- Oyoqlar -->
        <ellipse cx="93" cy="206" rx="15" ry="11" :fill="`url(#${g('shellDeep')})`" />
        <ellipse cx="127" cy="206" rx="15" ry="11" :fill="`url(#${g('shellDeep')})`" />
      </g>
    </svg>
  </div>
</template>

<style scoped>
.ai-bot { width: 100%; height: 100%; }
.ai-bot svg { display: block; width: 100%; height: 100%; overflow: visible; }

.bot-float { animation: bot-float 3.8s ease-in-out infinite; }
@keyframes bot-float {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-7px); }
}

.bot-shadow { transform-box: fill-box; transform-origin: center; animation: bot-shadow 3.8s ease-in-out infinite; }
@keyframes bot-shadow {
  0%, 100% { transform: scale(1); opacity: 1; }
  50%      { transform: scale(0.86); opacity: 0.65; }
}

/* Pirpirash — ko'z guruhi vertikal siqiladi */
.bot-eye { transform-box: fill-box; transform-origin: center; animation: bot-blink 4.6s infinite; }
@keyframes bot-blink {
  0%, 91%, 100% { transform: scaleY(1); }
  93.5%         { transform: scaleY(0.08); }
  96%           { transform: scaleY(1); }
}

.bot-glow { animation: bot-glow 2.6s ease-in-out infinite; }
@keyframes bot-glow {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.55; }
}

/* Xursand holat: qo'llar yuqoriroq ko'tariladi */
.bot-arm { transform-box: fill-box; transform-origin: top center; transition: transform .35s ease; }
.is-happy .bot-arm-l { transform: rotate(-16deg); }
.is-happy .bot-arm-r { transform: rotate(16deg); }

@media (prefers-reduced-motion: reduce) {
  .bot-float, .bot-shadow, .bot-eye, .bot-glow { animation: none; }
  .bot-arm { transition: none; }
}
</style>
