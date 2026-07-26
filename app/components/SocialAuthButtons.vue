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
  await navigateTo((route.query.redirect as string) || '/')
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

// Sayt mavzusi o'zgarsa Google tugmasini qayta chizamiz (o'z mavzusi bor).
watch(() => google.isDark.value, () => {
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

        <div v-if="error" class="mb-4 px-3.5 py-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-sm flex items-start gap-2">
          <svg class="w-4 h-4 flex-shrink-0 mt-0.5" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5" />
            <path d="M8 5v3.5M8 10.75v.25" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
          </svg>
          {{ error }}
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

        <p v-if="busy" class="mt-3 text-center text-xs" style="color: var(--text-4);">
          {{ i18n.t({ uz: 'Kirilmoqda…', kr: 'Кирилмоқда…' }) }}
        </p>
      </div>
    </ClientOnly>
  </div>
</template>

<style scoped>
.social-divider {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
}
.social-divider-line {
  flex: 1 1 0%;
  height: 1px;
  background: var(--border-soft);
}
.social-divider-text {
  font-size: 0.75rem;
  color: var(--text-4);
}

/* Google tugmasi eng ko'pi bilan 400px — ikkalasi bir xil kenglikda tursin */
.social-actions {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  max-width: 400px;
  margin: 0 auto;
  transition: opacity .15s;
}

.social-skeleton {
  height: 40px;
  border-radius: 9999px;
  background: var(--surface-inset);
  animation: social-pulse 1.6s ease-in-out infinite;
}
@keyframes social-pulse {
  0%, 100% { opacity: 1 }
  50%      { opacity: .55 }
}

/* Telegram tugmasi — brend rangi, Google tugmasi bilan bir o'lchamda (40px, pill) */
.tg-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  height: 40px;
  padding: 0 1rem;
  border-radius: 9999px;
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
