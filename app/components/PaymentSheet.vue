<script setup lang="ts">
// Tarif bosilgach chiqadigan to'lov oynasi: nima uchun to'layotgani + to'lov
// tizimini tanlash. Hozircha faqat Payme ulangan, qolganlari yopiq turadi.

const props = defineProps<{
  open: boolean
  tariff: { id: string, price: string, perDay: string, period: { uz: string, kr: string } } | null
}>()

const emit = defineEmits<{ close: [] }>()

const i18n = useI18n()
const auth = useAuthStore()

const loading = ref(false)
const error = ref('')

const included = computed(() => [
  i18n.t({ uz: 'Cheksiz test — kunlik cheklov yo\'q', kr: 'Чексиз тест — кунлик чеклов йўқ' }),
  i18n.t({ uz: 'Imtihon rejimida cheksiz mashq', kr: 'Имтиҳон режимида чексиз машқ' }),
  i18n.t({ uz: 'Xatolaringiz ustida alohida ishlash', kr: 'Хатоларингиз устида алоҳида ишлаш' }),
  i18n.t({ uz: 'AI qaysi mavzudan boshlashni aytadi', kr: 'AI қайси мавзудан бошлашни айтади' }),
])

async function payWithPayme() {
  if (!props.tariff || loading.value) return

  // Mehmon bo'lsa avval ro'yxatdan o'tadi — progressi saqlanadi.
  if (!auth.user || auth.user.is_guest) {
    emit('close')
    await navigateTo('/register?redirect=/pricing')
    return
  }

  loading.value = true
  error.value = ''
  try {
    const res = await apiFetch<{ pay_url: string }>('/me/subscribe', {
      method: 'POST',
      body: { tariff: props.tariff.id },
    })
    window.location.href = res.pay_url
  }
  catch (e: any) {
    error.value = e?.data?.message
      || i18n.t({ uz: 'Xatolik yuz berdi, qayta urining.', kr: 'Хатолик юз берди, қайта уриниг.' })
    loading.value = false
  }
}

watch(() => props.open, (open) => {
  if (typeof document === 'undefined') return
  document.body.style.overflow = open ? 'hidden' : ''
  if (!open) { error.value = ''; loading.value = false }
})

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.open && !loading.value) emit('close')
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  if (typeof document !== 'undefined') document.body.style.overflow = ''
})
</script>

<template>
  <ClientOnly>
    <Teleport to="body">
      <Transition name="sheet" :duration="{ enter: 220, leave: 200 }">
        <div v-if="open && tariff" class="sheet-backdrop" role="dialog" aria-modal="true"
             @click.self="!loading && emit('close')">
          <div class="sheet">
            <button type="button" class="sheet-close" :disabled="loading"
                    :aria-label="i18n.t({ uz: 'Yopish', kr: 'Ёпиш' })" @click="emit('close')">
              <svg viewBox="0 0 20 20" fill="none" class="w-4 h-4">
                <path d="M6 6l8 8M14 6l-8 8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
              </svg>
            </button>

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

            <ul class="mt-4 space-y-2 text-sm">
              <li v-for="f in included" :key="f" class="flex items-start gap-2.5">
                <span class="sheet-tick"><AppIcon name="check" :size="10" /></span>
                <span style="color: var(--text-2)">{{ f }}</span>
              </li>
            </ul>

            <div class="mt-5 mb-2.5 text-xs font-semibold uppercase tracking-[0.14em]" style="color: var(--text-4)">
              {{ i18n.t({ uz: 'To\'lov usulini tanlang', kr: 'Тўлов усулини танланг' }) }}
            </div>

            <div v-if="error" class="mb-3 px-3.5 py-2.5 rounded-lg text-xs"
                 style="background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c;">
              {{ error }}
            </div>

            <!-- Payme — yagona ulangan usul -->
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

            <!-- Hali ulanmagan usullar — ochiq ko'rsatib, yopiq turadi -->
            <button v-for="m in [{ n: 'Click', c: '#0098EB' }, { n: 'Uzum Bank', c: '#7F4DFF' }]" :key="m.n"
                    type="button" class="pay-option pay-locked" disabled>
              <span class="pay-logo" :style="{ background: m.c + '1f', color: m.c }">
                <AppIcon name="card" :size="16" />
              </span>
              <span class="flex-1 text-left">
                <span class="block text-sm font-medium" style="color: var(--text-4)">{{ m.n }}</span>
                <span class="block text-2xs" style="color: var(--text-4)">
                  {{ i18n.t({ uz: 'Tez orada', kr: 'Тез орада' }) }}
                </span>
              </span>
              <AppIcon name="lock" :size="14" />
            </button>

            <p class="mt-4 text-center text-2xs leading-relaxed" style="color: var(--text-4)">
              🔒 {{ i18n.t({
                uz: 'Bir martalik to\'lov • Avtomatik yechim yo\'q • Yashirin to\'lovlar yo\'q',
                kr: 'Бир марталик тўлов • Автоматик ечим йўқ • Яширин тўловлар йўқ'
              }) }}
            </p>
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
.pay-active { border-color: rgba(0, 178, 178, 0.45); }
.pay-active:hover:not(:disabled) {
  border-color: #00b2b2;
  box-shadow: 0 6px 18px -8px rgba(0, 178, 178, 0.55);
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
  border: 2px solid rgba(0, 178, 178, 0.25); border-top-color: #00b2b2;
  animation: pay-spin .7s linear infinite;
}
@keyframes pay-spin { to { transform: rotate(360deg) } }

.sheet-enter-active, .sheet-leave-active { transition: opacity .18s ease; }
.sheet-enter-active .sheet, .sheet-leave-active .sheet { transition: transform .22s cubic-bezier(.16,1,.3,1); }
.sheet-enter-from, .sheet-leave-to { opacity: 0; }
.sheet-enter-from .sheet, .sheet-leave-to .sheet { transform: translateY(18px); }
@media (prefers-reduced-motion: reduce) {
  .sheet-enter-active, .sheet-leave-active,
  .sheet-enter-active .sheet, .sheet-leave-active .sheet { transition: none; }
}
</style>
