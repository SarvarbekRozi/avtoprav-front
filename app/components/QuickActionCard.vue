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
}>(), {
  tone: 'brand',
  subtitle: '',
  badge: null,
})

const t = useTone(() => props.tone)
</script>

<template>
  <NuxtLink :to="to"
    class="qa-card group relative flex flex-col rounded-[18px] p-4 sm:p-[18px] transition-all duration-200 active:scale-[0.98]">
    <IconTile :icon="icon" :tone="tone" :size="44" />

    <div class="mt-3.5 font-semibold text-[15px] leading-tight truncate" style="color: var(--text-1);">
      {{ title }}
    </div>
    <!-- --text-3, --text-4 emas: kichik matn uchun --text-4 (#888b96)
         oq fonda atigi 3.4:1 beradi (AA 4.5:1 talab qiladi). -->
    <div v-if="subtitle" class="mt-1.5 text-xs leading-[1.4] line-clamp-2" style="color: var(--text-3);">
      {{ subtitle }}
    </div>

    <div class="mt-auto pt-3 flex justify-end">
      <span class="w-7 h-7 rounded-full grid place-items-center transition-transform duration-200 group-hover:translate-x-0.5"
            :style="{ background: t.arrowBg, color: t.fg }">
        <AppIcon name="arrow" :size="14" />
      </span>
    </div>

    <span v-if="badge"
          class="absolute top-3 right-3 min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold grid place-items-center tabular-nums text-white"
          style="background: #f43f5e; box-shadow: 0 2px 6px -1px rgba(244,63,94,0.5);">
      {{ badge > 99 ? '99+' : badge }}
    </span>
  </NuxtLink>
</template>

<style scoped>
.qa-card {
  min-height: 168px;
  background: var(--surface);
  border: 1px solid var(--border-soft);
  box-shadow: var(--shadow-card);
}
.qa-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lift);
  border-color: var(--border-1);
}
@media (prefers-reduced-motion: reduce) {
  .qa-card, .qa-card:hover { transition: none; transform: none; }
}
</style>
