<script setup lang="ts">
// Tarif bosilgach chiqadigan to'lov oynasi. To'lov usullari:
//  - Payme (avtomatik) — asosiy
//  - Karta orqali (qo'lda) — karta raqamiga o'tkazib "To'lov qildim" bosiladi,
//    admin botда tasdiqlaydi
//  - Click / Uzum — hozircha yopiq

const props = defineProps<{
  open: boolean
  tariff: { id: string, price: string, perDay: string, period: { uz: string, kr: string } } | null
}>()

const emit = defineEmits<{ close: [], paid: [] }>()

const i18n = useI18n()
const auth = useAuthStore()

type View = 'methods' | 'card' | 'sent'
const view = ref<View>('methods')
const loading = ref(false)
const error = ref('')

// Karta ma'lumoti (backenddan). null = sozlanmagan → usul ko'rsatilmaydi.
const card = ref<{ number: string, holder: string | null } | null>(null)
const cardLoaded = ref(false)
const copied = ref(false)

const included = computed(() => [
  i18n.t({ uz: 'Cheksiz test — kunlik cheklov yo\'q', kr: 'Чексиз тест — кунлик чеклов йўқ' }),
  i18n.t({ uz: 'Imtihon rejimi — vaqt bilan mashq', kr: 'Имтиҳон режими — вақт билан машқ' }),
  i18n.t({ uz: 'Xatolaringiz ustida alohida ishlash', kr: 'Хатоларингиз устида алоҳида ишлаш' }),
  i18n.t({ uz: 'AI shaxsiy tavsiyalar', kr: 'AI шахсий тавсиялар' }),
])

async function loadCard() {
  if (cardLoaded.value) return
  try {
    card.value = await apiFetch<{ number: string, holder: string | null }>('/me/manual-card')
  }
  catch {
    card.value = null // 404 = sozlanmagan
  }
  finally {
    cardLoaded.value = true
  }
}

function needsRegister(): boolean {
  return !auth.user || !!auth.user.is_guest
}

async function payWithPayme() {
  if (!props.tariff || loading.value) return
  if (needsRegister()) { emit('close'); await navigateTo('/register?redirect=/pricing'); return }

  loading.value = true
  error.value = ''
  try {
    const res = await apiFetch<{ pay_url: string }>('/me/subscribe', {
      method: 'POST', body: { tariff: props.tariff.id, method: 'payme' },
    })
    emit('paid')
    window.location.href = res.pay_url
  }
  catch (e: any) {
    error.value = messageOf(e)
    loading.value = false
  }
}

async function chooseManual() {
  if (needsRegister()) { emit('close'); await navigateTo('/register?redirect=/pricing'); return }
  error.value = ''
  view.value = 'card'
}

async function copyCard() {
  if (!card.value) return
  try {
    await navigator.clipboard.writeText(card.value.number.replace(/\s/g, ''))
    copied.value = true
    setTimeout(() => { copied.value = false }, 1600)
  }
  catch { /* clipboard yopiq bo'lishi mumkin — muammo emas */ }
}

async function confirmManual() {
  if (!props.tariff || loading.value) return
  loading.value = true
  error.value = ''
  try {
    const res = await apiFetch<{ order_id: number }>('/me/subscribe', {
      method: 'POST', body: { tariff: props.tariff.id, method: 'manual' },
    })
    activated.value = false
    view.value = 'sent'
    pollOrder(res.order_id, ++pollToken)
  }
  catch (e: any) {
    error.value = messageOf(e)
  }
  finally {
    loading.value = false
  }
}

// Admin tez tasdiqlasa — foydalanuvchi kutmasin. ~2 daqiqa yengil so'rab turamiz.
// pollToken har yangi so'rovda/yopilganda oshadi — eski poll darrov to'xtaydi,
// shunda eski poll yangi buyurtmaning holatini buzib qo'ymaydi.
const activated = ref(false)
let pollToken = 0
async function pollOrder(orderId: number, token: number) {
  for (let i = 0; i < 40; i++) {
    if (token !== pollToken) return // yangi so'rov keldi yoki oyna yopildi
    await new Promise(r => setTimeout(r, 3000))
    if (token !== pollToken) return
    try {
      const s = await apiFetch<{ is_paid: boolean }>(`/me/orders/${orderId}`)
      if (s.is_paid) {
        if (token !== pollToken) return
        await auth.fetchMe()
        activated.value = true
        return
      }
    }
    catch { /* qayta urinamiz */ }
  }
}

function messageOf(e: any): string {
  return e?.data?.message
    || i18n.t({ uz: 'Xatolik yuz berdi, qayta urining.', kr: 'Хатолик юз берди, қайта уриниг.' })
}

function close() {
  if (loading.value) return
  emit('close')
}

// Oyna ochilganda kartani yuklaymiz; yopilganda holatni tozalaymiz.
watch(() => props.open, (open) => {
  if (typeof document === 'undefined') return
  document.body.style.overflow = open ? 'hidden' : ''
  if (open) {
    view.value = 'methods'
    error.value = ''
    activated.value = false
    loadCard()
  }
  else {
    loading.value = false
    pollToken++ // ochiq pollни to'xtatamiz
  }
})

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.open && !loading.value) emit('close')
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => {
  pollToken++ // ochiq pollни to'xtatamiz
  window.removeEventListener('keydown', onKey)
  if (typeof document !== 'undefined') document.body.style.overflow = ''
})
</script>

<template>
  <ClientOnly>
    <Teleport to="body">
      <Transition name="sheet" :duration="{ enter: 220, leave: 200 }">
        <div v-if="open && tariff" class="sheet-backdrop" role="dialog" aria-modal="true"
             @click.self="close">
          <div class="sheet">
            <button type="button" class="sheet-close" :disabled="loading"
                    :aria-label="i18n.t({ uz: 'Yopish', kr: 'Ёпиш' })" @click="close">
              <svg viewBox="0 0 20 20" fill="none" class="w-4 h-4">
                <path d="M6 6l8 8M14 6l-8 8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
              </svg>
            </button>

            <!-- Sarlavha: tarif + narx (sent holatida yashiriladi) -->
            <template v-if="view !== 'sent'">
              <div class="text-xs font-semibold uppercase tracking-[0.14em]" style="color: var(--text-4)">Premium</div>
              <div class="mt-1 flex items-baseline justify-between gap-3">
                <span class="text-xl font-semibold tracking-tightish text-ink-900">{{ i18n.t(tariff.period) }}</span>
                <span class="flex items-baseline gap-1">
                  <span class="text-2xl font-semibold tabular-nums tracking-tightest text-ink-900">{{ tariff.price }}</span>
                  <span class="text-sm" style="color: var(--text-3)">{{ i18n.t({ uz: 'so\'m', kr: 'сўм' }) }}</span>
                </span>
              </div>
              <div class="text-right text-2xs" style="color: var(--text-4)">
                ≈ {{ tariff.perDay }} {{ i18n.t({ uz: 'so\'m / kun', kr: 'сўм / кун' }) }}
              </div>
            </template>

            <div v-if="error" class="mt-4 mb-1 px-3.5 py-2.5 rounded-lg text-xs"
                 style="background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c;">
              {{ error }}
            </div>

            <!-- 1-EKRAN: to'lov usullari -->
            <template v-if="view === 'methods'">
              <ul class="mt-4 space-y-2 text-sm">
                <li v-for="f in included" :key="f" class="flex items-start gap-2.5">
                  <span class="sheet-tick"><AppIcon name="check" :size="10" /></span>
                  <span style="color: var(--text-2)">{{ f }}</span>
                </li>
              </ul>

              <div class="mt-5 mb-2.5 text-xs font-semibold uppercase tracking-[0.14em]" style="color: var(--text-4)">
                {{ i18n.t({ uz: 'To\'lov usulini tanlang', kr: 'Тўлов усулини танланг' }) }}
              </div>

              <!-- Payme -->
              <button type="button" class="pay-option pay-active" :disabled="loading" @click="payWithPayme">
                <span class="pay-logo pay-logo-payme">
                  <svg viewBox="0 0 24 24" fill="none" class="w-[18px] h-[18px]" aria-hidden="true">
                    <path d="M5 20V6.5A1.5 1.5 0 0 1 6.5 5H13a5 5 0 0 1 0 10H9" stroke="currentColor"
                          stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </span>
                <span class="flex-1 text-left">
                  <span class="block text-sm font-semibold" style="color: var(--text-1)">Payme</span>
                  <span class="block text-2xs" style="color: var(--text-4)">
                    {{ i18n.t({ uz: 'Karta orqali, bir zumda', kr: 'Карта орқали, бир зумда' }) }}
                  </span>
                </span>
                <span v-if="loading" class="pay-spin" />
                <svg v-else viewBox="0 0 20 20" fill="none" class="w-4 h-4" style="color: var(--text-4)">
                  <path d="M7.5 4.5l5.5 5.5-5.5 5.5" stroke="currentColor" stroke-width="1.8"
                        stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </button>

              <!-- Karta orqali (qo'lda) — faqat karta sozlangan bo'lsa -->
              <button v-if="card" type="button" class="pay-option pay-active" @click="chooseManual">
                <span class="pay-logo" style="background: rgba(63,88,148,0.14); color: var(--accent)">
                  <AppIcon name="card" :size="16" />
                </span>
                <span class="flex-1 text-left">
                  <span class="block text-sm font-semibold" style="color: var(--text-1)">
                    {{ i18n.t({ uz: 'Karta orqali o\'tkazma', kr: 'Карта орқали ўтказма' }) }}
                  </span>
                  <span class="block text-2xs" style="color: var(--text-4)">
                    {{ i18n.t({ uz: 'Kartaga o\'tkazib, tasdiqlatasiz', kr: 'Картага ўтказиб, тасдиқлатасиз' }) }}
                  </span>
                </span>
                <svg viewBox="0 0 20 20" fill="none" class="w-4 h-4" style="color: var(--text-4)">
                  <path d="M7.5 4.5l5.5 5.5-5.5 5.5" stroke="currentColor" stroke-width="1.8"
                        stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </button>

              <!-- Yopiq usullar -->
              <button v-for="m in [{ n: 'Click', c: '#0098EB' }, { n: 'Uzum Bank', c: '#7F4DFF' }]" :key="m.n"
                      type="button" class="pay-option pay-locked" disabled>
                <span class="pay-logo" :style="{ background: m.c + '1f', color: m.c }">
                  <AppIcon name="card" :size="16" />
                </span>
                <span class="flex-1 text-left">
                  <span class="block text-sm font-medium" style="color: var(--text-4)">{{ m.n }}</span>
                  <span class="block text-2xs" style="color: var(--text-4)">{{ i18n.t({ uz: 'Tez orada', kr: 'Тез орада' }) }}</span>
                </span>
                <AppIcon name="lock" :size="14" />
              </button>

              <p class="mt-4 text-center text-2xs leading-relaxed" style="color: var(--text-4)">
                🔒 {{ i18n.t({
                  uz: 'Bir martalik to\'lov • Avtomatik yechim yo\'q • Yashirin to\'lovlar yo\'q',
                  kr: 'Бир марталик тўлов • Автоматик ечим йўқ • Яширин тўловлар йўқ'
                }) }}
              </p>
            </template>

            <!-- 2-EKRAN: karta ma'lumoti + "To'lov qildim" -->
            <template v-else-if="view === 'card' && card">
              <p class="mt-4 text-sm" style="color: var(--text-3)">
                {{ i18n.t({
                  uz: 'Quyidagi kartaga aynan shu summani o\'tkazing, so\'ng «To\'lov qildim» tugmasini bosing.',
                  kr: 'Қуйидаги картага айнан шу суммани ўтказинг, сўнг «Тўлов қилдим» тугмасини босинг.'
                }) }}
              </p>

              <div class="card-box">
                <div class="text-2xs uppercase tracking-[0.14em]" style="color: var(--text-4)">
                  {{ i18n.t({ uz: 'Karta raqami', kr: 'Карта рақами' }) }}
                </div>
                <button type="button" class="card-number" @click="copyCard">
                  <span class="tabular-nums">{{ card.number }}</span>
                  <span class="card-copy">
                    <AppIcon :name="copied ? 'check' : 'plus'" :size="13" />
                    {{ copied ? i18n.t({ uz: 'nusxalandi', kr: 'нусхаланди' }) : i18n.t({ uz: 'nusxa', kr: 'нусха' }) }}
                  </span>
                </button>
                <div v-if="card.holder" class="mt-2 text-sm font-medium" style="color: var(--text-2)">{{ card.holder }}</div>
                <div class="mt-3 pt-3 flex items-center justify-between" style="border-top: 1px solid var(--border-soft)">
                  <span class="text-sm" style="color: var(--text-3)">{{ i18n.t({ uz: 'Summa', kr: 'Сумма' }) }}</span>
                  <span class="text-lg font-bold tabular-nums text-ink-900">{{ tariff.price }} {{ i18n.t({ uz: 'so\'m', kr: 'сўм' }) }}</span>
                </div>
              </div>

              <p class="mt-3 text-2xs leading-relaxed" style="color: var(--text-4)">
                {{ i18n.t({
                  uz: 'To\'lov chekini (skrinshot) adminga yuborsangiz, tezroq tasdiqlanadi.',
                  kr: 'Тўлов чекини (скриншот) админга юборсангиз, тезроқ тасдиқланади.'
                }) }}
              </p>

              <button type="button" class="sheet-primary" :disabled="loading" @click="confirmManual">
                <span v-if="loading" class="pay-spin" />
                <template v-else>
                  <AppIcon name="check" :size="16" />
                  {{ i18n.t({ uz: 'To\'lov qildim', kr: 'Тўлов қилдим' }) }}
                </template>
              </button>
              <button type="button" class="sheet-back" :disabled="loading" @click="view = 'methods'">
                {{ i18n.t({ uz: '← Boshqa usul', kr: '← Бошқа усул' }) }}
              </button>
            </template>

            <!-- 3-EKRAN: so'rov yuborildi -->
            <template v-else-if="view === 'sent'">
              <div class="text-center py-2">
                <div class="sent-icon" :class="activated && 'sent-icon-ok'">
                  <AppIcon :name="activated ? 'check' : 'clock'" :size="26" />
                </div>
                <div class="mt-4 text-lg font-semibold text-ink-900">
                  {{ activated
                    ? i18n.t({ uz: 'Premium yoqildi! 🎉', kr: 'Премиум ёқилди! 🎉' })
                    : i18n.t({ uz: 'So\'rovingiz yuborildi', kr: 'Сўровингиз юборилди' }) }}
                </div>
                <p class="mt-2 text-sm leading-relaxed" style="color: var(--text-3)">
                  {{ activated
                    ? i18n.t({ uz: 'Endi cheksiz mashq qilishingiz mumkin.', kr: 'Энди чексиз машқ қилишингиз мумкин.' })
                    : i18n.t({
                      uz: 'Admin to\'lovni tekshirib, Premiumni yoqadi. Tasdiqlangach, shu yerda va (Telegram ulangan bo\'lsa) botда xabar olasiz.',
                      kr: 'Админ тўловни текшириб, Премиумни ёқади. Тасдиқлангач, шу ерда ва (Телеграм уланган бўлса) ботда хабар оласиз.'
                    }) }}
                </p>
                <button type="button" class="sheet-primary mt-6" @click="close">
                  {{ i18n.t({ uz: 'Yopish', kr: 'Ёпиш' }) }}
                </button>
              </div>
            </template>
          </div>
        </div>
      </Transition>
    </Teleport>
  </ClientOnly>
</template>

<style scoped>
.sheet-backdrop {
  position: fixed; inset: 0; z-index: 60;
  display: flex; align-items: flex-end; justify-content: center;
  background: rgba(10, 14, 24, 0.55);
  backdrop-filter: blur(6px);
}
@media (min-width: 640px) { .sheet-backdrop { align-items: center; padding: 1.5rem; } }

.sheet {
  position: relative;
  width: 100%; max-width: 25rem;
  padding: 1.5rem;
  background: var(--surface);
  border: 1px solid var(--border-soft);
  border-radius: 1.5rem 1.5rem 0 0;
  box-shadow: 0 28px 72px -24px rgba(10, 14, 24, 0.55);
  max-height: 92vh; overflow-y: auto;
}
@media (min-width: 640px) { .sheet { border-radius: 1.5rem; } }

.sheet-close {
  position: absolute; top: 0.875rem; right: 0.875rem;
  width: 2rem; height: 2rem; display: grid; place-items: center;
  border-radius: 0.625rem; color: var(--text-4);
  transition: background .15s, color .15s;
}
.sheet-close:hover:not(:disabled) { background: var(--surface-inset); color: var(--text-2); }
.sheet-close:disabled { opacity: .4; cursor: not-allowed; }

.sheet-tick {
  width: 1rem; height: 1rem; border-radius: 9999px;
  display: grid; place-items: center; flex-shrink: 0; margin-top: 0.125rem;
  background: #d1fae5; color: #047857;
}

.pay-option {
  width: 100%;
  display: flex; align-items: center; gap: 0.75rem;
  padding: 0.75rem 0.9rem;
  border-radius: 0.875rem;
  border: 1px solid var(--border-soft);
  background: var(--surface);
  margin-bottom: 0.5rem;
  transition: border-color .15s, box-shadow .15s, transform .15s;
}
.pay-active:hover:not(:disabled) {
  border-color: var(--accent);
  box-shadow: 0 6px 18px -8px rgba(63, 88, 148, 0.4);
  transform: translateY(-1px);
}
.pay-active:disabled { opacity: .7; cursor: wait; }
.pay-locked { opacity: .5; cursor: not-allowed; }

.pay-logo {
  width: 2.25rem; height: 2.25rem; border-radius: 0.625rem;
  display: grid; place-items: center; flex-shrink: 0;
}
.pay-logo-payme { background: rgba(0, 178, 178, 0.14); color: #00b2b2; }

.pay-spin {
  width: 1.05rem; height: 1.05rem; border-radius: 9999px;
  border: 2px solid rgba(63, 88, 148, 0.25); border-top-color: var(--accent);
  animation: pay-spin .7s linear infinite;
}
@keyframes pay-spin { to { transform: rotate(360deg) } }

/* Karta ma'lumoti bloki */
.card-box {
  margin-top: 1rem;
  padding: 1rem 1.15rem;
  border-radius: 1rem;
  background: var(--surface-soft);
  border: 1px solid var(--border-soft);
}
.card-number {
  width: 100%;
  margin-top: 0.35rem;
  display: flex; align-items: center; justify-content: space-between; gap: 0.75rem;
  font-size: 1.15rem; font-weight: 700; letter-spacing: 0.04em;
  color: var(--text-1);
}
.card-copy {
  display: inline-flex; align-items: center; gap: 0.25rem;
  font-size: 0.7rem; font-weight: 600; letter-spacing: 0;
  padding: 0.25rem 0.55rem; border-radius: 9999px;
  color: var(--accent); background: var(--accent-soft);
  flex-shrink: 0;
}

.sheet-primary {
  width: 100%;
  height: 3rem;
  margin-top: 1.15rem;
  display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem;
  border-radius: 0.875rem;
  font-weight: 600; font-size: 1rem;
  color: #3d2c00;
  background: linear-gradient(180deg, #fcd34d, #f0b429);
  box-shadow: 0 10px 24px -10px rgba(240, 180, 41, 0.8);
  transition: filter .15s, transform .15s;
}
.sheet-primary:hover:not(:disabled) { filter: brightness(1.04); transform: translateY(-1px); }
.sheet-primary:disabled { opacity: .65; cursor: not-allowed; }

.sheet-back {
  width: 100%; margin-top: 0.6rem; padding: 0.5rem;
  font-size: 0.8125rem; color: var(--text-3);
  border-radius: 0.625rem; transition: background .15s;
}
.sheet-back:hover:not(:disabled) { background: var(--surface-inset); }

.sent-icon {
  width: 3.5rem; height: 3.5rem; margin: 0.5rem auto 0;
  display: grid; place-items: center; border-radius: 9999px;
  background: var(--surface-inset); color: var(--text-3);
}
.sent-icon-ok { background: #d1fae5; color: #047857; }

.sheet-enter-active, .sheet-leave-active { transition: opacity .18s ease; }
.sheet-enter-active .sheet, .sheet-leave-active .sheet { transition: transform .22s cubic-bezier(.16,1,.3,1); }
.sheet-enter-from, .sheet-leave-to { opacity: 0; }
.sheet-enter-from .sheet, .sheet-leave-to .sheet { transform: translateY(18px); }
@media (prefers-reduced-motion: reduce) {
  .sheet-enter-active, .sheet-leave-active,
  .sheet-enter-active .sheet, .sheet-leave-active .sheet { transition: none; }
}
</style>
