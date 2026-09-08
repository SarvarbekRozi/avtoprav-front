<script setup lang="ts">
/**
 * "To'lovingiz qabul qilindi — Premium yoqildi" oynasi.
 *
 * Karta orqali to'lov admin tomonidan tasdiqlanganda chiqadi. Holatni
 * `plugins/premium-watch.client.ts` yoqadi.
 *
 * NEGA MARKAZDAGI OYNA, burchakdagi kichik xabar emas: odam pul to'lagan va
 * natijani kutib turgan bo'ladi. Burchakdagi kartani sezmay qolish oson —
 * sinovda ham aynan shunday bo'ldi. Bu voqea kuniga bir marta ham
 * takrorlanmaydi, shuning uchun ekranni bir lahza egallashi o'rinli.
 */
const i18n = useI18n()
const auth = useAuthStore()

const activated = useState<boolean>('premium-just-activated', () => false)

/** Muddat — oyna ochilishidan oldin `auth.fetchMe()` chaqirilgan bo'ladi. */
const until = computed(() => {
  const raw = auth.user?.premium_until
  if (!raw) return null
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return null
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()}`
})

function close() {
  activated.value = false
}

// Escape bilan ham yopilsin — boshqa oynalarda ham shunday.
function onEsc(e: KeyboardEvent) {
  if (e.key === 'Escape' && activated.value) close()
}
onMounted(() => document.addEventListener('keydown', onEsc))
onBeforeUnmount(() => document.removeEventListener('keydown', onEsc))

// Ochiq turganda orqadagi sahifa aylanmasin (PaymentSheet ham shunday qiladi).
watch(activated, (open) => {
  if (!import.meta.client) return
  document.body.style.overflow = open ? 'hidden' : ''
})
onBeforeUnmount(() => {
  if (import.meta.client) document.body.style.overflow = ''
})
</script>

<template>
  <Transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition duration-150 ease-in"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0">
    <div v-if="activated" class="pa-backdrop" role="dialog" aria-modal="true" @click="close">
      <div class="pa-card anim-in" @click.stop>
        <span class="pa-icon"><AppIcon name="crown" :size="34" /></span>

        <h2 class="pa-title">
          {{ i18n.t({ uz: 'To\'lovingiz qabul qilindi! 🎉', kr: 'Тўловингиз қабул қилинди! 🎉' }) }}
        </h2>

        <p class="pa-body">
          {{ i18n.t({ uz: 'Premium yoqildi — barcha imkoniyatlar ochildi.', kr: 'Премиум ёқилди — барча имкониятлар очилди.' }) }}
        </p>

        <div v-if="until" class="pa-until">
          {{ i18n.t({ uz: `${until} gacha amal qiladi`, kr: `${until} гача амал қилади` }) }}
        </div>

        <button type="button" class="pa-btn" @click="close">
          {{ i18n.t({ uz: 'Boshladik', kr: 'Бошладик' }) }}
        </button>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.pa-backdrop {
  position: fixed;
  inset: 0;
  /* 110 — loyihadagi ENG YUQORISI. Onboarding oynasi `z-[100]`, to'lov va
     taklif oynalari 60. Sinovda aynan onboarding bu oynani to'liq bosib
     qolgan edi: pul to'lagan odam tasdiqni ko'rmay qolishi mumkin emas. */
  z-index: 110;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(4px);
}
.pa-card {
  width: 100%;
  max-width: 23rem;
  padding: 2rem 1.5rem 1.5rem;
  border-radius: 1.5rem;
  text-align: center;
  background: var(--surface);
  box-shadow: var(--shadow-lift);
}
.pa-icon {
  display: inline-grid;
  place-items: center;
  width: 4.5rem;
  height: 4.5rem;
  border-radius: 1.25rem;
  color: var(--warn-ink);
  background: var(--warn-soft);
}
.pa-title {
  margin-top: 1.1rem;
  font-size: 1.25rem;
  font-weight: 700;
  line-height: 1.3;
  color: var(--text-1);
}
.pa-body {
  margin-top: 0.5rem;
  font-size: 0.9375rem;
  line-height: 1.5;
  color: var(--text-3);
}
.pa-until {
  display: inline-block;
  margin-top: 0.9rem;
  padding: 0.35rem 0.8rem;
  border-radius: 9999px;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--primary-ink);
  background: var(--primary-soft);
}
.pa-btn {
  width: 100%;
  margin-top: 1.5rem;
  height: 2.875rem;
  border-radius: 0.875rem;
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--primary-contrast);
  background: var(--primary);
  transition: filter 0.15s, transform 0.15s;
}
.pa-btn:hover { filter: brightness(1.05); }
.pa-btn:active { transform: translateY(1px); }
</style>
