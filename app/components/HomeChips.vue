<script setup lang="ts">
/**
 * Bosh sahifadagi ixcham chiplar qatori: kunlik bepul test qoldig'i,
 * mehmon uchun ro'yxatdan o'tish taklifi va tugallanmagan urinish.
 *
 * Alohida komponent, chunki mobil va ish stoli tartibida BOSHQA JOYDA turadi
 * (mobilda banner'lardan keyin, ish stolida salomlashuv ostida) — markup esa
 * bir xil. Ilgari index.vue ichida yozilgan edi.
 */
const props = defineProps<{
  dailyTests: { limit: number | null, used_today: number } | null
  isGuest: boolean
  current: { id: number, answered: number, total: number } | null
}>()

const i18n = useI18n()

const freeTestsLeft = computed(() => {
  const d = props.dailyTests
  if (!d || d.limit === null) return 0
  return Math.max(0, d.limit - d.used_today)
})

/** Chiplar butunlay bo'sh bo'lsa qator ham chiqmasin (bo'sh bo'shliq qolmaydi) */
const bor = computed(() =>
  (props.dailyTests && props.dailyTests.limit !== null) || props.isGuest || !!props.current)
</script>

<template>
  <div v-if="bor" class="flex flex-wrap items-center gap-2">
    <template v-if="dailyTests && dailyTests.limit !== null">
      <span v-if="freeTestsLeft > 0"
            class="inline-flex items-center gap-2 h-8 px-3 rounded-full text-xs font-medium"
            style="background: var(--primary-soft); color: var(--primary);">
        <span class="flex gap-1" aria-hidden="true">
          <span v-for="n in dailyTests.limit" :key="n" class="w-1.5 h-1.5 rounded-full"
                :style="{ background: n <= freeTestsLeft ? 'var(--primary)' : 'var(--border-1)' }"></span>
        </span>
        {{ i18n.t({ uz: `Bugun ${freeTestsLeft} ta bepul test`, kr: `Бугун ${freeTestsLeft} та бепул тест` }) }}
      </span>
      <NuxtLink v-else to="/pricing"
                class="inline-flex items-center gap-1.5 h-9 px-3 rounded-full text-xs font-medium text-amber-700"
                style="background: rgba(251,191,36,0.16);">
        <AppIcon name="spark" :size="12" />
        {{ i18n.t({ uz: 'Limit tugadi — Premium: cheksiz', kr: 'Лимит тугади — Премиум: чексиз' }) }}
      </NuxtLink>
    </template>

    <NuxtLink v-if="isGuest" to="/register"
              class="text-xs underline underline-offset-4" style="color: var(--text-3);">
      {{ i18n.t({ uz: 'Natijani saqlash uchun ro\'yxatdan o\'ting', kr: 'Натижани сақлаш учун рўйхатдан ўтинг' }) }}
    </NuxtLink>

    <!-- Tugallanmagan urinish — namunada alohida karta YO'Q, shuning uchun
         u shu yerda ixcham chip ko'rinishida (funksiya saqlanadi, tartib buzilmaydi). -->
    <NuxtLink v-if="current" :to="`/test/play/${current.id}`"
              class="inline-flex items-center gap-2 h-9 pl-2.5 pr-3 rounded-full text-xs font-semibold text-white transition-transform hover:-translate-y-0.5"
              style="background: linear-gradient(118deg, var(--ok-surface), var(--ok-surface-2)); box-shadow: 0 6px 16px -8px rgba(16,185,129,0.8);">
      <span class="w-4 h-4 rounded-full grid place-items-center shrink-0" style="background: rgba(255,255,255,0.25);">
        <svg width="8" height="8" viewBox="0 0 20 20" fill="currentColor"><path d="M6 4l11 6-11 6z" /></svg>
      </span>
      {{ i18n.t({ uz: 'Davom etish', kr: 'Давом этиш' }) }}
      <span class="font-medium text-white/85 tabular-nums">{{ current.answered }}/{{ current.total }}</span>
    </NuxtLink>
  </div>
</template>
