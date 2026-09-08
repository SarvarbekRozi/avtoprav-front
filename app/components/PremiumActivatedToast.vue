<script setup lang="ts">
/**
 * "Premium yoqildi" xabari — karta to'lovi admin tomonidan tasdiqlanganda
 * ekranda darhol chiqadi.
 *
 * NEGA ALOHIDA KOMPONENT: qo'ng'iroqdagi bildirishnoma o'zi yetarli emas —
 * u kichik nishon, foydalanuvchi uni sezmasligi mumkin. Pul to'lagan odam
 * natijani DARHOL ko'rishi kerak.
 *
 * Holatni `plugins/premium-watch.client.ts` yoqadi.
 */
const i18n = useI18n()
const auth = useAuthStore()

const activated = useState<boolean>('premium-just-activated', () => false)

/** Muddat — `auth.user` allaqachon yangilangan bo'ladi. */
const until = computed(() => {
  const raw = auth.user?.premium_until
  if (!raw) return null
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return null
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()}`
})

let hideTimer: ReturnType<typeof setTimeout> | null = null

// O'zi yopiladi, lekin yetarlicha uzoq turadi: xabar boshqa sahifaga
// o'tayotgan odamning ham ko'ziga tushsin.
watch(activated, (on) => {
  if (hideTimer !== null) {
    clearTimeout(hideTimer)
    hideTimer = null
  }
  if (on) hideTimer = setTimeout(() => { activated.value = false }, 15000)
})

onBeforeUnmount(() => {
  if (hideTimer !== null) clearTimeout(hideTimer)
})

function close() {
  activated.value = false
}
</script>

<template>
  <Transition
    enter-active-class="transition duration-300 ease-out"
    enter-from-class="opacity-0 translate-y-4"
    enter-to-class="opacity-100 translate-y-0"
    leave-active-class="transition duration-200 ease-in"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0">
    <div v-if="activated" class="pa-toast" role="status" aria-live="polite">
      <span class="pa-icon"><AppIcon name="crown" :size="22" /></span>

      <div class="min-w-0 flex-1">
        <div class="pa-title">
          {{ i18n.t({ uz: 'Premium yoqildi! 🎉', kr: 'Премиум ёқилди! 🎉' }) }}
        </div>
        <p class="pa-body">
          {{ until
            ? i18n.t({ uz: `Barcha imkoniyatlar ochildi — ${until} gacha.`, kr: `Барча имкониятлар очилди — ${until} гача.` })
            : i18n.t({ uz: 'Barcha imkoniyatlar ochildi.', kr: 'Барча имкониятлар очилди.' }) }}
        </p>
      </div>

      <button type="button" class="pa-close" :aria-label="i18n.t({ uz: 'Yopish', kr: 'Ёпиш' })" @click="close">
        <AppIcon name="x" :size="16" />
      </button>
    </div>
  </Transition>
</template>

<style scoped>
/* Desktopda o'ng pastda; mobilda butun kenglikda — u yerda o'ng past burchak
   "Taklif va izohlar" tugmasi bilan band. */
.pa-toast {
  position: fixed;
  z-index: 60;
  right: 1rem;
  bottom: 1rem;
  left: 1rem;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.9rem 1rem;
  border-radius: 1rem;
  border: 1px solid var(--border-soft);
  background: var(--surface);
  box-shadow: var(--shadow-lift);
}
@media (min-width: 640px) {
  .pa-toast {
    left: auto;
    bottom: 5.5rem;
    max-width: 22rem;
  }
}
.pa-icon {
  display: grid;
  place-items: center;
  width: 2.5rem;
  height: 2.5rem;
  flex-shrink: 0;
  border-radius: 0.75rem;
  color: var(--warn-ink);
  background: var(--warn-soft);
}
.pa-title {
  font-size: 0.9375rem;
  font-weight: 700;
  color: var(--text-1);
}
.pa-body {
  margin-top: 0.15rem;
  font-size: 0.8125rem;
  line-height: 1.45;
  color: var(--text-3);
}
.pa-close {
  flex-shrink: 0;
  padding: 0.25rem;
  border-radius: 0.5rem;
  color: var(--text-4);
}
.pa-close:hover {
  color: var(--text-2);
}
</style>
