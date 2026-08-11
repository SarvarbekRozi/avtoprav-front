<script setup lang="ts">
// Google va Telegram orqali kirish. login.vue va register.vue ikkalasida
// ishlatiladi. Barcha skriptlar faqat onMounted'da yuklanadi — SSR'da
// hech qanday `window` chaqirilmaydi va hidratsiya buzilmaydi.

const props = defineProps<{
  /** Mehmon hisobini to'liq hisobga aylantirish sahifasi (register.vue). */
  upgrade?: boolean
}>()

const emit = defineEmits<{ success: [] }>()

const i18n = useI18n()
const route = useRoute()
const auth = useAuthStore()
const google = useGoogleAuth()
const telegram = useTelegramAuth()

// runtimeConfig'dan olinadi — serverda ham, clientda ham bir xil qiymat.
const anyEnabled = google.enabled || telegram.enabled

const error = ref('')
const busy = ref<'google' | 'telegram' | null>(null)
const googleReady = ref(false)
const telegramMode = ref<'popup' | 'widget' | null>(null)
const settled = ref(false)

// Skriptlar bloklangan bo'lsa (internet yo'q, reklama bloker) bo'sh ajratkich
// osilib qolmasin — hech narsa ko'rsatmaymiz.
const hasVisibleProvider = computed(() =>
  (google.enabled && googleReady.value) || (telegram.enabled && telegramMode.value !== null))

const googleEl = ref<HTMLElement | null>(null)
const telegramWidgetEl = ref<HTMLElement | null>(null)

let unmountWidget: (() => void) | null = null

const telegramLabel = computed(() => props.upgrade
  ? i18n.t({ uz: 'Telegram bilan bog\'lash', kr: 'Телеграм билан боғлаш' })
  : i18n.t({ uz: 'Telegram orqali kirish', kr: 'Телеграм орқали кириш' }))

function messageOf(e: any): string {
  return e?.data?.message || e?.response?._data?.message
    || i18n.t({ uz: 'Kirishda xatolik yuz berdi. Qaytadan urinib ko\'ring.', kr: 'Киришда хатолик юз берди. Қайтадан уриниб кўринг.' })
}

async function done() {
  emit('success')
  // `safeRedirect` SHART: xom `redirect` bilan tashqi manzil (`https://…`,
  // `//soxta.uz`) kelsa, kirish ALLAQACHON muvaffaqiyatli bo'lgan holda
  // `navigateTo` istisno otadi, u pastdagi catch'ga tushadi va ekranda
  // "Kirishda xatolik yuz berdi" chiqadi. Parolsiz (Telegram/Google)
  // foydalanuvchi uchun bu YAKKA kirish yo'li — u yerda yolg'on xato
  // ko'rsatish uni butunlay to'sib qo'yadi. login.vue va register.vue
  // allaqachon shu himoyadan foydalanadi.
  await navigateTo(safeRedirect(route.query.redirect))
}

async function onGoogleCredential(idToken: string) {
  if (busy.value) return
  error.value = ''
  busy.value = 'google'
  try {
    await auth.loginWithGoogle(idToken)
    await done()
  }
  catch (e: any) {
    error.value = messageOf(e)
  }
  finally {
    busy.value = null
  }
}

async function onTelegramPayload(payload: Record<string, any>) {
  if (busy.value) return
  error.value = ''
  busy.value = 'telegram'
  try {
    await auth.loginWithTelegram(payload)
    await done()
  }
  catch (e: any) {
    error.value = messageOf(e)
  }
  finally {
    busy.value = null
  }
}

async function onTelegramClick() {
  if (busy.value || telegramMode.value !== 'popup') return
  error.value = ''
  try {
    const payload = await telegram.loginViaPopup()
    // Foydalanuvchi oynani yopdi — bu xato emas, jimgina qaytamiz.
    if (!payload) return
    await onTelegramPayload(payload)
  }
  catch (e: any) {
    error.value = messageOf(e)
  }
}

/**
 * <ClientOnly> o'z kontentini mount bo'lgandan keyin chizadi, shuning uchun
 * bu komponentning onMounted'ida element hali DOM'da bo'lmasligi mumkin.
 */
async function waitForEl(target: Ref<HTMLElement | null>, tries = 5) {
  for (let i = 0; i < tries && !target.value; i++) await nextTick()
  return target.value
}

async function renderGoogle() {
  const el = await waitForEl(googleEl)
  if (!el) return
  try {
    await google.renderGoogleButton(el, { onCredential: onGoogleCredential })
    googleReady.value = true
  }
  catch {
    // Skript bloklangan / internet yo'q — tugmani ko'rsatmaymiz, xato chiqarmaymiz.
    googleReady.value = false
  }
}

// Sayt mavzusi YOKI tili o'zgarsa Google tugmasini qayta chizamiz — u o'z
// mavzusi va tilini mount paytida bir marta oladi, keyin o'zi yangilanmaydi.
watch([() => google.isDark.value, () => google.locale.value], () => {
  if (googleReady.value) void renderGoogle()
})

onMounted(async () => {
  if (google.enabled) await renderGoogle()

  if (telegram.enabled) {
    try {
      telegramMode.value = await telegram.prepare()
      if (telegramMode.value === 'widget') {
        const el = await waitForEl(telegramWidgetEl)
        if (el) unmountWidget = telegram.mountWidget(el, onTelegramPayload)
      }
    }
    catch {
      telegramMode.value = null // skript yuklanmadi — Telegram tugmasi ko'rsatilmaydi
    }
  }

  settled.value = true
})

onBeforeUnmount(() => {
  unmountWidget?.()
  unmountWidget = null
})
</script>

<template>
  <div v-if="anyEnabled" class="mt-6">
    <ClientOnly>
      <template #fallback>
        <div class="social-box">
          <div class="social-divider">
            <span class="social-divider-line" />
            <span class="social-divider-text">{{ i18n.t({ uz: 'yoki', kr: 'ёки' }) }}</span>
            <span class="social-divider-line" />
          </div>
          <div class="social-actions">
            <div v-if="google.enabled" class="social-skeleton" />
            <div v-if="telegram.enabled" class="social-skeleton" />
          </div>
        </div>
      </template>

      <div v-if="!settled || hasVisibleProvider" class="social-box">
        <div class="social-divider">
          <span class="social-divider-line" />
          <span class="social-divider-text">{{ i18n.t({ uz: 'yoki', kr: 'ёки' }) }}</span>
          <span class="social-divider-line" />
        </div>

        <!-- Tokenlar bilan: ilgari `bg-rose-50 text-rose-700` qattiq klasslari
             turgan edi, ular qorong'i rejimda oq-pushti yamoq berardi. -->
        <div v-if="error" class="social-error" role="alert">
          <AppIcon name="info" :size="16" class="shrink-0 mt-px" />
          <span>{{ error }}</span>
        </div>

        <div class="social-actions" :class="busy ? 'pointer-events-none opacity-60' : ''">
          <!-- Google o'z tugmasini shu konteyner ichiga chizadi -->
          <div v-if="google.enabled" ref="googleEl" class="flex justify-center" />

          <!-- Asosiy yo'l: o'zimizning tugma Telegram oynasini ochadi -->
          <button
            v-if="telegram.enabled && telegramMode === 'popup'"
            type="button"
            class="tg-btn"
            :disabled="!!busy"
            @click="onTelegramClick"
          >
            <span v-if="busy === 'telegram'" class="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <svg v-else class="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M9.42 15.18l-.4 5.58c.57 0 .82-.24 1.11-.53l2.66-2.55 5.52 4.04c1.01.56 1.73.27 2-.93L23.93 3.82c.32-1.5-.54-2.08-1.53-1.71L1.11 10.26c-1.45.56-1.43 1.37-.25 1.74l5.44 1.69L18.95 5.65c.6-.39 1.14-.18.69.22z" />
            </svg>
            <span>{{ telegramLabel }}</span>
          </button>

          <!-- Zaxira yo'l: Telegram'ning rasmiy tugmasi -->
          <div
            v-else-if="telegram.enabled && telegramMode === 'widget'"
            ref="telegramWidgetEl"
            class="flex justify-center min-h-[40px]"
          />
        </div>

        <!-- Konteyner DOIM mavjud, faqat matni to'ladi: `v-if` bilan butun
             `role="status"` tuguni paydo bo'lsa, ba'zi ekran o'quvchilar yangi
             live region'ni kuzatishga ulguray olmaydi va jarayon jim ketadi.
             `--text-3`, `--text-4` EMAS: 12px matn uchun --text-4 yorug'da
             AA dan o'tmaydi. -->
        <p class="mt-3 text-center text-xs min-h-[1rem]" role="status"
           style="color: var(--text-3);">
          {{ busy ? i18n.t({ uz: 'Kirilmoqda…', kr: 'Кирилмоқда…' }) : '' }}
        </p>
      </div>
    </ClientOnly>
  </div>
</template>

<style scoped>
.social-divider {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  margin-bottom: 1.125rem;
}
.social-divider-line {
  flex: 1 1 0%;
  height: 1px;
  background: var(--border-1);
}
.social-divider-text {
  font-size: 0.8125rem;
  color: var(--text-4);
}

/* Auth kartasi ichida to'liq kenglik — `max-width: 400px; margin: auto` bo'lsa
   tugmalar kartaning maydonlaridan torroq bo'lib, chetlari to'g'ri kelmaydi. */
.social-actions {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  transition: opacity .15s;
}

.social-skeleton {
  height: 40px;
  border-radius: 10px;
  background: var(--surface-inset);
  animation: social-pulse 1.6s ease-in-out infinite;
}

.social-error {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  margin-bottom: 1rem;
  padding: 0.75rem 0.875rem;
  border-radius: 12px;
  font-size: 13.5px;
  line-height: 1.45;
  background: var(--danger-soft);
  color: var(--danger-ink);
}
@keyframes social-pulse {
  0%, 100% { opacity: 1 }
  50%      { opacity: .55 }
}

/* Telegram tugmasi — brend rangi. Balandlik 40px: Google tugmasi bilan TENG
   bo'lishi kerak, uning balandligi esa Google tomonidan qat'iy (size: 'large'),
   o'zgartirib bo'lmaydi. */
.tg-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  height: 40px;
  padding: 0 1rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  color: #fff;
  background: #2aabee;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.08);
  transition: background .15s, filter .15s, box-shadow .15s;
}
.tg-btn:hover:not(:disabled) { background: #229ed9; }
.tg-btn:active:not(:disabled) { background: #1e91c7; }
.tg-btn:focus-visible { outline: none; box-shadow: 0 0 0 4px rgba(42, 171, 238, 0.28); }
.tg-btn:disabled { opacity: .5; cursor: not-allowed; }
</style>
