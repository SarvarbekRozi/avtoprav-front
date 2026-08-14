<script setup lang="ts">
/**
 * Bosh sahifadagi ixcham chiplar qatori.
 *
 * Ilgari bu yerda "Bugun N ta bepul test" chipi turardi — kunlik urinishlar
 * cheklovi OLIB TASHLANDI (endi cheklov kontentda: 5 bilet, 1 mavzu, imtihon
 * cheksiz), shuning uchun u chip ham ketdi.
 *
 * Alohida komponent, chunki mobil va ish stoli tartibida BOSHQA JOYDA turadi
 * (mobilda banner'lardan keyin, ish stolida salomlashuv ostida).
 */
const props = defineProps<{
  isGuest: boolean
  current: { id: number, answered: number, total: number } | null
  /** premium emas — "Premium bilan hammasi ochiq" taklifi chiqadi */
  showPremiumHint?: boolean
}>()

const i18n = useI18n()

/** Chiplar butunlay bo'sh bo'lsa qator ham chiqmasin (bo'sh bo'shliq qolmaydi) */
const bor = computed(() => props.isGuest || !!props.current || !!props.showPremiumHint)
</script>

<template>
  <div v-if="bor" class="flex flex-wrap items-center gap-2">
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

    <NuxtLink v-if="showPremiumHint" to="/pricing"
              class="inline-flex items-center gap-1.5 h-9 px-3 rounded-full text-xs font-medium text-amber-700"
              style="background: rgba(251,191,36,0.16);">
      <AppIcon name="crown" :size="13" />
      {{ i18n.t({ uz: 'Premium: barcha bilet va mavzular', kr: 'Премиум: барча билет ва мавзулар' }) }}
    </NuxtLink>

    <NuxtLink v-if="isGuest" to="/register"
              class="text-xs underline underline-offset-4" style="color: var(--text-3);">
      {{ i18n.t({ uz: 'Natijani saqlash uchun ro\'yxatdan o\'ting', kr: 'Натижани сақлаш учун рўйхатдан ўтинг' }) }}
    </NuxtLink>
  </div>
</template>
