<script setup lang="ts">
/**
 * "Sizga tavsiya" — AI tanlagan eng zaif mavzu.
 *
 * Ma'lumot: GET /me/topic-stats → recommendation { topic_id, mastery, message }.
 * `message` serverda tayyorlanadi va til bo'yicha allaqachon hal qilingan —
 * uni qayta tarjima qilmaymiz.
 *
 * So'rov `useTopicStats()` orqali — TopicStrengthCard bilan bitta kalitni va
 * bitta handler havolasini bo'lishadi, shuning uchun so'rov faqat bir marta ketadi.
 */
const i18n = useI18n()
const { data } = await useTopicStats()

const rec = computed(() => data.value?.recommendation ?? null)

const message = computed(() => rec.value?.message ?? i18n.t({
  uz: 'Bir nechta test yeching — AI sizga eng mos mavzuni o\'zi tanlab beradi.',
  kr: 'Бир нечта тест ечинг — AI сизга энг мос мавзуни ўзи танлаб беради.',
}))

const primary = computed(() => rec.value
  ? {
      to: `/test/start/topic?topic_id=${rec.value.topic_id}`,
      label: i18n.t({ uz: 'Mavzuni o\'rganish', kr: 'Мавзуни ўрганиш' }),
    }
  : {
      to: '/test/start/daily',
      label: i18n.t({ uz: 'Kunlik testni boshlash', kr: 'Кунлик тестни бошлаш' }),
    })
</script>

<template>
  <section class="ai-recommend relative overflow-hidden rounded-[22px] p-5 sm:p-6 h-full flex flex-col">
    <div aria-hidden="true"
         class="ai-glow absolute -top-24 -right-16 w-56 h-56 rounded-full blur-3xl pointer-events-none"
         style="background: radial-gradient(circle, rgba(139,92,246,0.34), transparent 70%);"></div>

    <div class="relative flex items-start gap-4 sm:gap-5">
      <!-- Robot namunadagidek yirik va chapda alohida joy egallaydi.
           Butun bo'yli personaj bo'lgani uchun kvadrat maydon kerak. -->
      <RobotArt class="w-[128px] sm:w-[148px] lg:w-[158px] shrink-0 -mt-3 -ml-2" />

      <div class="min-w-0 flex-1 pt-1">
        <span class="ai-badge inline-flex items-center gap-1.5 px-2.5 h-[24px] rounded-lg text-[10px] font-bold tracking-wider uppercase text-white">
          <AppIcon name="spark" :size="11" />
          {{ i18n.t({ uz: 'AI tavsiya', kr: 'AI тавсия' }) }}
        </span>

        <h2 class="text-[17px] font-bold leading-snug mt-2.5" style="color: var(--text-1);">
          {{ i18n.t({ uz: 'Siz uchun tavsiya qilingan', kr: 'Сиз учун тавсия қилинган' }) }}
          <span aria-hidden="true">✨</span>
        </h2>

        <!-- line-clamp-4: tavsiya matni uzun bo'lsa ham karta yonidagilardan
             baland bo'lib ketmasin (qatorlar bir sathda tursin) -->
        <p class="text-[13.5px] leading-[1.6] mt-2 line-clamp-4" style="color: var(--text-2);">
          {{ message }}
        </p>
      </div>
    </div>

    <div class="relative mt-auto pt-5 flex flex-wrap items-center gap-2.5">
      <NuxtLink :to="primary.to"
        class="ai-cta inline-flex items-center gap-2 h-11 px-5 rounded-xl text-[13.5px] font-semibold text-white">
        {{ primary.label }}
        <AppIcon name="arrow" :size="15" />
      </NuxtLink>
      <NuxtLink to="/topics"
        class="ai-alt inline-flex items-center h-11 px-5 rounded-xl text-[13.5px] font-medium">
        {{ i18n.t({ uz: 'Barcha mavzular', kr: 'Барча мавзулар' }) }}
      </NuxtLink>
    </div>
  </section>
</template>

<style scoped>
/* Gradient oxiri #06b6d4 dan #0e7490 ga to'qlashtirildi: oq 10px matn
   och siyan ustida 2.43:1 beradi, bu AA (4.5:1) dan ancha past edi. */
.ai-badge {
  background: linear-gradient(90deg, #7c3aed, #0e7490);
  box-shadow: 0 2px 6px rgba(139, 92, 246, 0.35);
}
.ai-cta {
  background: linear-gradient(135deg, #8b5cf6, #6366f1);
  box-shadow: 0 8px 20px -8px rgba(139, 92, 246, 0.7);
  transition: transform .2s, box-shadow .2s;
}
.ai-cta:hover { transform: translateY(-2px); box-shadow: 0 12px 24px -8px rgba(139, 92, 246, 0.75); }

.ai-alt {
  background: var(--surface);
  border: 1px solid var(--border-1);
  color: var(--text-2);
  transition: background .15s;
}
.ai-alt:hover { background: var(--surface-inset); }

.ai-glow { animation: ai-pulse 4s ease-in-out infinite; }
@keyframes ai-pulse {
  0%, 100% { opacity: 0.6; transform: scale(1); }
  50%      { opacity: 1;   transform: scale(1.14); }
}
@media (prefers-reduced-motion: reduce) {
  .ai-glow { animation: none; }
  .ai-cta, .ai-cta:hover { transition: none; transform: none; }
}
</style>
