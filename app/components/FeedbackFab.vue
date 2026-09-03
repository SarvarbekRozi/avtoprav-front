<script setup lang="ts">
/**
 * "Taklif va izohlar" — o'ng pastda turadigan suzuvchi tugma va u ochadigan
 * forma. Yuborilgan fikr backendda `feedback` jadvaliga yoziladi, admin esa
 * darhol botда xabar oladi.
 *
 * Tugmani KO'RSATISHNI layout hal qiladi (`mobileChrome`) — test yechish
 * ekranida chiqmaydi, u yerda odam imtihonda bo'ladi.
 */
const i18n = useI18n()
const route = useRoute()

type FeedbackType = 'suggestion' | 'problem' | 'other'

const MIN = 5
const MAX = 1000

const open = ref(false)
const sent = ref(false)
const loading = ref(false)
const error = ref('')

const type = ref<FeedbackType>('suggestion')
const message = ref('')
const contact = ref('')

const types = computed(() => [
  { id: 'suggestion' as FeedbackType, icon: 'bulb', label: i18n.t({ uz: 'Taklif', kr: 'Таклиф' }) },
  { id: 'problem' as FeedbackType, icon: 'alert', label: i18n.t({ uz: 'Muammo', kr: 'Муаммо' }) },
  { id: 'other' as FeedbackType, icon: 'info', label: i18n.t({ uz: 'Boshqa', kr: 'Бошқа' }) },
])

const trimmed = computed(() => message.value.trim())
const canSend = computed(() => trimmed.value.length >= MIN && message.value.length <= MAX && !loading.value)

const fabLabel = computed(() => i18n.t({ uz: 'Taklif va izohlar', kr: 'Таклиф ва изоҳлар' }))

function openSheet() {
  error.value = ''
  sent.value = false
  open.value = true
}

function close() {
  if (loading.value) return
  open.value = false
}

/** Yuborilgandan keyin "yana yozish" — formani boshiga qaytaradi. */
function writeAgain() {
  sent.value = false
  error.value = ''
}

async function submit() {
  if (!canSend.value) return
  loading.value = true
  error.value = ''
  try {
    await apiFetch('/feedback', {
      method: 'POST',
      body: {
        type: type.value,
        message: trimmed.value,
        contact: contact.value.trim() || null,
        // Fikr qaysi sahifada yozilgani — muammoni takrorlash uchun kerak.
        page: route.fullPath.slice(0, 200),
      },
    })
    sent.value = true
    message.value = ''
    contact.value = ''
    type.value = 'suggestion'
  }
  catch (e: any) {
    error.value = messageOf(e)
  }
  finally {
    loading.value = false
  }
}

function messageOf(e: any): string {
  // 429 — route'dagi throttle. Umumiy "xatolik" matni bu yerda chalg'itadi:
  // odam yozganini yo'qotdim deb o'ylaydi, aslida shunchaki kutish kerak.
  if (e?.response?.status === 429) {
    return i18n.t({
      uz: 'Juda ko\'p xabar yubordingiz. Biroz kutib, qayta urining.',
      kr: 'Жуда кўп хабар юбордингиз. Бироз кутиб, қайта уриниг.',
    })
  }

  return e?.data?.message
    || i18n.t({ uz: 'Xatolik yuz berdi, qayta urining.', kr: 'Хатолик юз берди, қайта уриниг.' })
}

// Oyna ochiq turganda sahifa orqadan siljimasin (PaymentSheet bilan bir xil).
watch(open, (isOpen) => {
  if (typeof document === 'undefined') return
  document.body.style.overflow = isOpen ? 'hidden' : ''
})

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape' && open.value && !loading.value) open.value = false
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  if (typeof document !== 'undefined') document.body.style.overflow = ''
})
</script>

<template>
  <button type="button" class="fab" :title="fabLabel" :aria-label="fabLabel" @click="openSheet">
    <AppIcon name="bulb" :size="20" />
    <!-- Yozuv faqat kengroq ekranda: mobilda joy tor, u yerda dumaloq tugma
         qoladi (aria-label bilan nomi baribir bor). -->
    <span class="fab-text">{{ i18n.t({ uz: 'Taklif', kr: 'Таклиф' }) }}</span>
  </button>

  <ClientOnly>
    <Teleport to="body">
      <Transition name="sheet" :duration="{ enter: 220, leave: 200 }">
        <div v-if="open" class="sheet-backdrop" role="dialog" aria-modal="true"
             :aria-label="fabLabel" @click.self="close">
          <div class="sheet">
            <button type="button" class="sheet-close" :disabled="loading"
                    :aria-label="i18n.t({ uz: 'Yopish', kr: 'Ёпиш' })" @click="close">
              <svg viewBox="0 0 20 20" fill="none" class="w-4 h-4">
                <path d="M6 6l8 8M14 6l-8 8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
              </svg>
            </button>

            <!-- FORMA -->
            <template v-if="!sent">
              <div class="text-lg font-semibold text-ink-900">
                {{ i18n.t({ uz: 'Taklif va izohlar', kr: 'Таклиф ва изоҳлар' }) }}
              </div>
              <p class="mt-1.5 text-sm leading-relaxed" style="color: var(--text-3)">
                {{ i18n.t({
                  uz: 'Nima yoqmadi yoki nimani qo\'shsak yaxshi bo\'ladi? Fikringiz to\'g\'ridan-to\'g\'ri bizga tushadi.',
                  kr: 'Нима ёқмади ёки нимани қўшсак яхши бўлади? Фикрингиз тўғридан-тўғри бизга тушади.'
                }) }}
              </p>

              <div v-if="error" class="mt-4 px-3.5 py-2.5 rounded-lg text-xs"
                   style="background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c;">
                {{ error }}
              </div>

              <!-- Tur -->
              <div class="mt-4 grid grid-cols-3 gap-2">
                <button v-for="t in types" :key="t.id" type="button" class="type-chip"
                        :class="type === t.id && 'type-chip-on'" :aria-pressed="type === t.id"
                        @click="type = t.id">
                  <AppIcon :name="t.icon" :size="16" />
                  <span>{{ t.label }}</span>
                </button>
              </div>

              <!-- Xabar -->
              <label class="fb-label" for="fb-message">
                {{ i18n.t({ uz: 'Xabaringiz', kr: 'Хабарингиз' }) }}
              </label>
              <textarea id="fb-message" v-model="message" class="fb-input" rows="4" :maxlength="MAX"
                        :placeholder="i18n.t({
                          uz: 'Masalan: statistikada haftalik grafik bo\'lsa yaxshi bo\'lardi…',
                          kr: 'Масалан: статистикада ҳафталик график бўлса яхши бўларди…'
                        })" />
              <div class="flex items-center justify-between text-2xs" style="color: var(--text-4)">
                <span>{{ i18n.t({ uz: 'Kamida 5 ta belgi', kr: 'Камида 5 та белги' }) }}</span>
                <span v-if="message.length > 800" class="tabular-nums">{{ message.length }}/{{ MAX }}</span>
              </div>

              <!-- Aloqa (ixtiyoriy) -->
              <label class="fb-label" for="fb-contact">
                {{ i18n.t({ uz: 'Aloqa — ixtiyoriy', kr: 'Алоқа — ихтиёрий' }) }}
              </label>
              <input id="fb-contact" v-model="contact" class="fb-input" type="text" maxlength="120"
                     :placeholder="i18n.t({ uz: 'Telefon yoki Telegram', kr: 'Телефон ёки Телеграм' })">
              <p class="mt-1.5 text-2xs leading-relaxed" style="color: var(--text-4)">
                {{ i18n.t({
                  uz: 'Javob kerak bo\'lsa qoldiring — aks holda bo\'sh qoldirsangiz ham bo\'ladi.',
                  kr: 'Жавоб керак бўлса қолдиринг — акс ҳолда бўш қолдирсангиз ҳам бўлади.'
                }) }}
              </p>

              <button type="button" class="sheet-primary" :disabled="!canSend" @click="submit">
                <span v-if="loading" class="fb-spin" />
                <template v-else>
                  <AppIcon name="send" :size="16" />
                  {{ i18n.t({ uz: 'Yuborish', kr: 'Юбориш' }) }}
                </template>
              </button>
            </template>

            <!-- YUBORILDI -->
            <template v-else>
              <div class="text-center py-2">
                <div class="sent-icon">
                  <AppIcon name="check" :size="26" />
                </div>
                <div class="mt-4 text-lg font-semibold text-ink-900">
                  {{ i18n.t({ uz: 'Rahmat! 🙌', kr: 'Раҳмат! 🙌' }) }}
                </div>
                <p class="mt-2 text-sm leading-relaxed" style="color: var(--text-3)">
                  {{ i18n.t({
                    uz: 'Fikringiz bizga yetib bordi. Har bir xabarni o\'qib chiqamiz.',
                    kr: 'Фикрингиз бизга етиб борди. Ҳар бир хабарни ўқиб чиқамиз.'
                  }) }}
                </p>
                <button type="button" class="sheet-primary mt-6" @click="close">
                  {{ i18n.t({ uz: 'Yopish', kr: 'Ёпиш' }) }}
                </button>
                <button type="button" class="sheet-back" @click="writeAgain">
                  {{ i18n.t({ uz: 'Yana yozish', kr: 'Яна ёзиш' }) }}
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
/* Suzuvchi tugma. Mobil bildirishnoma qo'ng'irog'i o'ng TEPADA, hamburger
   chap tepada turadi — o'ng past bo'sh, shuning uchun shu yerda.
   safe-area — iPhone'dagi pastki chiziq tugmani yopmasligi uchun. */
.fab {
  position: fixed;
  right: 1rem;
  bottom: calc(1rem + env(safe-area-inset-bottom, 0px));
  z-index: 30;
  height: 3rem; width: 3rem;
  display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem;
  border-radius: 9999px;
  color: var(--primary-contrast);
  background: var(--primary);
  box-shadow: var(--shadow-lift);
  transition: transform .15s, filter .15s;
}
.fab:hover { transform: translateY(-2px); filter: brightness(1.06); }
.fab:active { transform: translateY(0); }

/* Mobilda dumaloq (yozuvsiz), sm dan boshlab yozuvli "tabletka" — tugmaning
   nima ekani bir qarashda tushunarli bo'ladi. */
.fab-text { display: none; }
@media (min-width: 640px) {
  .fab { width: auto; padding: 0 1.15rem; }
  .fab-text { display: inline; font-size: 0.875rem; font-weight: 600; }
}

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

.type-chip {
  display: flex; flex-direction: column; align-items: center; gap: 0.3rem;
  padding: 0.65rem 0.25rem;
  border-radius: 0.75rem;
  border: 1px solid var(--border-soft);
  background: var(--surface);
  font-size: 0.75rem; font-weight: 600;
  color: var(--text-3);
  transition: border-color .15s, color .15s, background .15s;
}
.type-chip:hover { border-color: var(--primary); }
.type-chip-on {
  border-color: var(--primary);
  background: var(--primary-soft);
  color: var(--primary-ink);
}

.fb-label {
  display: block;
  margin: 1rem 0 0.4rem;
  font-size: 0.7rem; font-weight: 600;
  text-transform: uppercase; letter-spacing: 0.14em;
  color: var(--text-4);
}

.fb-input {
  width: 100%;
  padding: 0.7rem 0.85rem;
  border-radius: 0.75rem;
  border: 1px solid var(--border-soft);
  background: var(--surface-soft);
  color: var(--text-1);
  font-size: 0.9rem; line-height: 1.5;
  resize: vertical;
  transition: border-color .15s, box-shadow .15s;
}
.fb-input::placeholder { color: var(--text-4); }
.fb-input:focus { outline: none; border-color: var(--primary); box-shadow: var(--focus-ring); }

.fb-spin {
  width: 1.05rem; height: 1.05rem; border-radius: 9999px;
  border: 2px solid rgba(255, 255, 255, 0.35); border-top-color: #fff;
  animation: fb-spin .7s linear infinite;
}
@keyframes fb-spin { to { transform: rotate(360deg) } }

.sheet-primary {
  width: 100%;
  height: 3rem;
  margin-top: 1.15rem;
  display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem;
  border-radius: 0.875rem;
  font-weight: 600; font-size: 1rem;
  color: var(--primary-contrast);
  background: var(--primary);
  box-shadow: var(--shadow-soft);
  transition: filter .15s, transform .15s;
}
.sheet-primary:hover:not(:disabled) { filter: brightness(1.06); transform: translateY(-1px); }
.sheet-primary:disabled { opacity: .5; cursor: not-allowed; }

.sheet-back {
  width: 100%; margin-top: 0.6rem; padding: 0.5rem;
  font-size: 0.8125rem; color: var(--text-3);
  border-radius: 0.625rem; transition: background .15s;
}
.sheet-back:hover { background: var(--surface-inset); }

.sent-icon {
  width: 3.5rem; height: 3.5rem; margin: 0.5rem auto 0;
  display: grid; place-items: center; border-radius: 9999px;
  background: var(--ok-surface); color: var(--ok-ink);
}

.sheet-enter-active, .sheet-leave-active { transition: opacity .18s ease; }
.sheet-enter-active .sheet, .sheet-leave-active .sheet { transition: transform .22s cubic-bezier(.16,1,.3,1); }
.sheet-enter-from, .sheet-leave-to { opacity: 0; }
.sheet-enter-from .sheet, .sheet-leave-to .sheet { transform: translateY(18px); }
@media (prefers-reduced-motion: reduce) {
  .fab, .sheet-enter-active, .sheet-leave-active,
  .sheet-enter-active .sheet, .sheet-leave-active .sheet { transition: none; }
}
</style>
