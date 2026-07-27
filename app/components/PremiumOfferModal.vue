<script setup lang="ts">
// Tarif tanlangach DARROV Paymega yubormaymiz — avval shu oyna chiqadi.
// Odam nima uchun to'layotganini ko'radi va saytni birdan tark etmaydi.

const props = defineProps<{
  open: boolean
  tariff: { id: string, price: string, perDay: string, period: { uz: string, kr: string } } | null
}>()

const emit = defineEmits<{ close: [], paid: [] }>()

const i18n = useI18n()
const auth = useAuthStore()

const loading = ref(false)
const error = ref('')

const included = computed(() => [
  i18n.t({ uz: 'Cheksiz test — kunlik cheklov yo\'q', kr: 'Чексиз тест — кунлик чеклов йўқ' }),
  i18n.t({ uz: 'Imtihon rejimida cheksiz mashq', kr: 'Имтиҳон режимида чексиз машқ' }),
  i18n.t({ uz: 'Xatolaringiz ustida alohida ishlash', kr: 'Хатоларингиз устида алоҳида ишлаш' }),
  i18n.t({ uz: 'AI eng ko\'p xato qilayotgan mavzuni aniqlaydi', kr: 'AI энг кўп хато қилаётган мавзуни аниқлайди' }),
])

async function pay() {
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
    emit('paid')
    window.location.href = res.pay_url
  }
  catch (e: any) {
    error.value = e?.data?.message
      || i18n.t({ uz: 'Xatolik yuz berdi, qayta urining.', kr: 'Хатолик юз берди, қайта уриниг.' })
    loading.value = false
  }
}

// Oyna ochiq turganda orqa fon aylanmasin + Esc bilan yopilsin.
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
  <!--
    :duration MAJBURIY — usiz Vue animatsiya tugashini `transitionend` orqali
    kutadi. Agar enter uzilib qolsa, element `offer-enter-from` (opacity: 0)
    bilan qotib qoladi: rang o'zgarmagani uchun `transitionend` kelmaydi va
    KO'RINMAS backdrop butun ekranni bosib turadi. Aniq vaqt bu holatni
    butunlay yo'q qiladi.
    Teleport — oyna `position: fixed` bo'lgani uchun ota elementdagi
    transform/overflow uni kesib qo'ymasin. ClientOnly esa Teleport'ni
    SSR'dan chiqarib, hidratsiya nomuvofiqligini oldini oladi.
  -->
  <ClientOnly>
  <Teleport to="body">
    <Transition name="offer" :duration="{ enter: 220, leave: 200 }">
      <div
        v-if="open && tariff"
        class="offer-backdrop"
        role="dialog"
        aria-modal="true"
        @click.self="!loading && emit('close')"
      >
        <div class="offer-sheet">
          <button
            type="button"
            class="offer-close"
            :aria-label="i18n.t({ uz: 'Yopish', kr: 'Ёпиш' })"
            :disabled="loading"
            @click="emit('close')"
          >
            <svg viewBox="0 0 20 20" fill="none" class="w-4 h-4">
              <path d="M6 6l8 8M14 6l-8 8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
            </svg>
          </button>

          <div class="text-xs font-semibold uppercase tracking-[0.12em]" style="color: var(--text-4)">
            Premium
          </div>
          <div class="mt-1 text-xl font-semibold tracking-tightish text-ink-900">
            {{ i18n.t(tariff.period) }}
          </div>

          <ul class="mt-5 space-y-2.5 text-sm">
            <li v-for="f in included" :key="f" class="flex items-start gap-2.5">
              <span class="offer-tick"><AppIcon name="check" :size="10" /></span>
              <span style="color: var(--text-2)">{{ f }}</span>
            </li>
          </ul>

          <div class="mt-5 pt-4" style="border-top: 1px solid var(--border-soft)">
            <div class="flex items-baseline justify-between gap-3">
              <span class="text-sm" style="color: var(--text-3)">
                {{ i18n.t({ uz: 'To\'lov summasi', kr: 'Тўлов суммаси' }) }}
              </span>
              <span class="flex items-baseline gap-1">
                <span class="text-2xl font-semibold tabular-nums tracking-tightest text-ink-900">{{ tariff.price }}</span>
                <span class="text-sm" style="color: var(--text-3)">{{ i18n.t({ uz: 'so\'m', kr: 'сўм' }) }}</span>
              </span>
            </div>
            <div class="mt-0.5 text-right text-2xs" style="color: var(--text-4)">
              ≈ {{ tariff.perDay }} {{ i18n.t({ uz: 'so\'m / kun', kr: 'сўм / кун' }) }}
            </div>
          </div>

          <div v-if="error" class="mt-3 px-3.5 py-2.5 rounded-lg text-xs"
               style="background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c;">
            {{ error }}
          </div>

          <button type="button" class="offer-pay" :disabled="loading" @click="pay">
            <span v-if="loading" class="offer-spin" />
            <template v-else>
              <AppIcon name="lock" :size="14" />
              {{ i18n.t({ uz: 'Payme orqali to\'lash', kr: 'Payme орқали тўлаш' }) }}
            </template>
          </button>

          <p class="mt-3 text-center text-2xs leading-relaxed" style="color: var(--text-4)">
            {{ i18n.t({
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
.offer-backdrop {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 0;
  background: rgba(14, 16, 22, 0.5);
  backdrop-filter: blur(4px);
}
@media (min-width: 640px) {
  .offer-backdrop { align-items: center; padding: 1.5rem; }
}

.offer-sheet {
  position: relative;
  width: 100%;
  max-width: 26rem;
  padding: 1.5rem;
  background: var(--surface);
  border: 1px solid var(--border-soft);
  border-radius: 1.25rem 1.25rem 0 0;
  box-shadow: 0 24px 64px -20px rgba(15, 23, 42, 0.45);
  max-height: 92vh;
  overflow-y: auto;
}
@media (min-width: 640px) {
  .offer-sheet { border-radius: 1.25rem; }
}

.offer-close {
  position: absolute;
  top: 0.875rem;
  right: 0.875rem;
  width: 2rem;
  height: 2rem;
  display: grid;
  place-items: center;
  border-radius: 0.625rem;
  color: var(--text-4);
  transition: background .15s, color .15s;
}
.offer-close:hover:not(:disabled) { background: var(--surface-inset); color: var(--text-2); }
.offer-close:disabled { opacity: .4; cursor: not-allowed; }

.offer-tick {
  width: 1rem;
  height: 1rem;
  border-radius: 9999px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  margin-top: 0.125rem;
  /* Saytning qolgan qismidagi kabi — ikkala mavzuda ham o'qiladi.
     :global(.dark) bu loyihada qurishda tushib qoladi, shuning uchun
     mavzuga bog'liq override ishlatilmaydi. */
  background: #d1fae5;
  color: #047857;
}

/* Asosiy CTA — sariq, sahifadagi eng ko'zga tashlanadigan element */
.offer-pay {
  width: 100%;
  height: 3rem;
  margin-top: 1rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border-radius: 0.75rem;
  font-weight: 600;
  font-size: 1rem;
  color: #3d2c00;
  background: linear-gradient(180deg, #fcd34d, #f5b820);
  box-shadow: 0 8px 20px -8px rgba(245, 184, 32, 0.7);
  transition: filter .15s, transform .15s;
}
.offer-pay:hover:not(:disabled) { filter: brightness(1.04); transform: translateY(-1px); }
.offer-pay:disabled { opacity: .65; cursor: not-allowed; }

.offer-spin {
  width: 1.15rem;
  height: 1.15rem;
  border-radius: 9999px;
  border: 2px solid rgba(61, 44, 0, 0.25);
  border-top-color: #3d2c00;
  animation: offer-spin 0.7s linear infinite;
}
@keyframes offer-spin { to { transform: rotate(360deg) } }

.offer-enter-active, .offer-leave-active { transition: opacity .18s ease; }
.offer-enter-active .offer-sheet, .offer-leave-active .offer-sheet { transition: transform .22s cubic-bezier(.16,1,.3,1); }
.offer-enter-from, .offer-leave-to { opacity: 0; }
.offer-enter-from .offer-sheet, .offer-leave-to .offer-sheet { transform: translateY(16px); }
@media (prefers-reduced-motion: reduce) {
  .offer-enter-active, .offer-leave-active,
  .offer-enter-active .offer-sheet, .offer-leave-active .offer-sheet { transition: none; }
}
</style>
