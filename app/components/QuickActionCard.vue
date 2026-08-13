<script setup lang="ts">
import type { Tone } from '~/composables/useTone'

const props = withDefaults(defineProps<{
  icon: string
  title: string
  subtitle?: string
  to: string
  tone?: Tone
  /** o'ng yuqorida chiqadigan qizil hisoblagich (masalan xatolar soni) */
  badge?: number | null
  /** kichik matnli belgi (masalan "Yangi", "60s") — mobil maketda o'ng yuqorida */
  tag?: string | null
}>(), {
  tone: 'brand',
  subtitle: '',
  badge: null,
  tag: null,
})

const t = useTone(() => props.tone)
</script>

<template>
  <NuxtLink :to="to"
    class="qa-card group relative rounded-[18px] transition-all duration-200 active:scale-[0.98]">
    <!-- MOBIL (< md): ikonka chapda, yozuv o'ngda. Izoh va strelka YO'Q —
         maketda ikki ustunli ixcham ro'yxat, 375px da ikki qatorli izoh
         kartani ikki barobar cho'zib yuborardi. -->
    <span class="md:hidden flex items-center gap-2.5 p-3">
      <IconTile :icon="icon" :tone="tone" :size="42" />
      <!-- `truncate` EMAS: 375px da yorliqqa ~90px qoladi va "Saqlangan",
           "Statistika" qirqilib "Saqlan…" bo'lib chiqardi (o'lchangan).
           Endi shrift kengligiga moslashadi, zarur bo'lsa ikki qatorga o'tadi. -->
      <!-- `font-bold` EMAS: 700 og'irlikda "Kunlik", "Blits" kabi qisqa
           yorliqlar juda qalin ko'rinardi. 600 — ish stoli kartasi bilan ham
           bir xil og'irlik. -->
      <span class="qa-title min-w-0 flex-1 font-semibold leading-tight" style="color: var(--text-1);">
        {{ title }}
      </span>
    </span>

    <!-- ISH STOLI (≥ md): tik tartib, izoh va strelka bilan -->
    <span class="hidden md:flex flex-col h-full p-3.5">
      <IconTile :icon="icon" :tone="tone" :size="36" />

      <span class="block mt-2.5 font-semibold text-[15px] leading-tight truncate" style="color: var(--text-1);">
        {{ title }}
      </span>
      <!-- --text-3, --text-4 emas: kichik matn uchun --text-4 (#888b96)
           oq fonda atigi 3.4:1 beradi (AA 4.5:1 talab qiladi). -->
      <span v-if="subtitle" class="block mt-1 text-xs leading-[1.35] line-clamp-2" style="color: var(--text-3);">
        {{ subtitle }}
      </span>

      <span class="block mt-auto pt-2 text-right">
        <span class="inline-grid w-[26px] h-[26px] rounded-full place-items-center transition-transform duration-200 group-hover:translate-x-0.5"
              :style="{ background: t.arrowBg, color: t.fg }">
          <AppIcon name="arrow" :size="13" />
        </span>
      </span>
    </span>

    <span v-if="badge"
          class="absolute top-3 right-3 min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold grid place-items-center tabular-nums text-white"
          style="background: #f43f5e; box-shadow: 0 2px 6px -1px rgba(244,63,94,0.5);">
      {{ badge > 99 ? '99+' : badge }}
    </span>
    <!-- Matnli belgi faqat mobilda: ish stoli kartasida uning o'rnida izoh turadi -->
    <span v-else-if="tag" class="qa-tag md:hidden">{{ tag }}</span>
  </NuxtLink>
</template>

<style scoped>
.qa-card {
  display: block;
  background: var(--surface);
  border: 1px solid var(--border-soft);
  box-shadow: var(--shadow-card);
}
/* Mobilda bir qatorli ixcham karta: ikonka 46 + 14px padding x2 */
.qa-card { min-height: 74px; }
@media (min-width: 768px) {
  /* Ikki qatorli izoh sig'adigan eng ixcham balandlik: ikonka 36 + sarlavha 19
     + izoh 2 qator 32 + strelka 26 + bo'shliqlar. Grid barcha kartochkalarni
     eng balandiga tenglashtiradi, shuning uchun bu faqat pol. */
  .qa-card { min-height: 130px; }
}
.qa-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lift);
  border-color: var(--border-1);
}
@media (prefers-reduced-motion: reduce) {
  .qa-card, .qa-card:hover { transition: none; transform: none; }
}

/* Tor telefonlarda (≤ 400px) yorliq kichikroq — 42px ikonka va 12px padding
   bilan matnga ~90px qoladi. Kengroq telefonlarda 16px. */
.qa-title { font-size: 15.5px; }
@media (min-width: 400px) { .qa-title { font-size: 16px; } }

.qa-tag {
  position: absolute;
  top: 0.625rem;
  right: 0.625rem;
  padding: 0.125rem 0.4rem;
  border-radius: 0.375rem;
  background: var(--surface-inset);
  font-size: 10.5px;
  font-weight: 700;
  color: var(--text-3);
}
</style>
