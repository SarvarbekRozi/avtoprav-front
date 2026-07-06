<script setup lang="ts">
const i18n = useI18n()
const { data } = await useAsyncData('topic-stats', () => apiFetch<any>('/me/topic-stats'))

const strengthColors: Record<string, string> = {
  mastered:   'bg-emerald-500',
  strong:     'bg-brand-500',
  practicing: 'bg-amber-500',
  weak:       'bg-rose-500',
  unknown:    'bg-ink-300',
}
const strengthLabels: Record<string, { uz: string, kr: string }> = {
  mastered:   { uz: 'Mukammal',     kr: 'Мукаммал' },
  strong:     { uz: 'Yaxshi',       kr: 'Яхши' },
  practicing: { uz: 'Mashq kerak',  kr: 'Машқ керак' },
  weak:       { uz: 'Zaif',         kr: 'Заиф' },
  unknown:    { uz: 'Kam ma\'lumot', kr: 'Кам маълумот' },
}
const strengthBadge: Record<string, string> = {
  mastered:   'bg-emerald-50 text-emerald-700',
  strong:     'bg-brand-50 text-brand-700',
  practicing: 'bg-amber-50 text-amber-700',
  weak:       'bg-rose-50 text-rose-700',
  unknown:    'bg-ink-100 text-ink-500',
}
</script>

<template>
  <div v-if="data" class="space-y-4">
    <!-- AI Recommendation -->
    <div v-if="data.recommendation" class="ai-recommend relative overflow-hidden rounded-2xl p-5"
         style="background: linear-gradient(135deg, #f5f3ff 0%, #eef2ff 50%, #ecfeff 100%);
                border: 1px solid rgba(139, 92, 246, 0.18);
                box-shadow: 0 8px 24px -12px rgba(139, 92, 246, 0.25);">
      <!-- Animated glow blob -->
      <div aria-hidden="true" class="ai-glow absolute -top-12 -right-12 w-40 h-40 rounded-full blur-3xl pointer-events-none"
           style="background: radial-gradient(circle, rgba(139,92,246,0.35), transparent 70%);"></div>

      <div class="relative flex items-start gap-4">
        <!-- AI sparkle avatar -->
        <div class="w-11 h-11 rounded-xl grid place-items-center flex-shrink-0 ai-avatar"
             style="background: linear-gradient(135deg, #8b5cf6, #6366f1, #06b6d4); color: #fff;
                    box-shadow: 0 4px 14px rgba(139,92,246,0.4);">
          <AppIcon name="sparkle" :size="20" />
        </div>

        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1.5">
            <div class="text-sm font-semibold text-ink-900">
              {{ i18n.t({ uz: 'Sizga tavsiya', kr: 'Сизга тавсия' }) }}
            </div>
            <span class="ai-badge inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase"
                  style="background: linear-gradient(90deg, #8b5cf6, #06b6d4); color: #fff;
                         box-shadow: 0 2px 6px rgba(139,92,246,0.35);">
              <svg class="w-2.5 h-2.5" viewBox="0 0 12 12" fill="currentColor">
                <path d="M6 0l1.5 4.5L12 6l-4.5 1.5L6 12l-1.5-4.5L0 6l4.5-1.5z"/>
              </svg>
              AI
            </span>
          </div>
          <div class="text-sm text-ink-700 leading-relaxed">{{ data.recommendation.message }}</div>
          <NuxtLink :to="`/test/start/topic?topic_id=${data.recommendation.topic_id}`"
                    class="inline-flex items-center gap-1.5 mt-3.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:-translate-y-0.5"
                    style="background: linear-gradient(135deg, #8b5cf6, #6366f1); color: #fff;
                           box-shadow: 0 3px 10px rgba(139,92,246,0.3);">
            {{ i18n.t({ uz: 'Shu mavzuni mashq qilish', kr: 'Шу мавзуни машқ қилиш' }) }}
            <AppIcon name="arrow" :size="12" />
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Premium teaser (recommendation locked for non-premium) -->
    <div v-else-if="data.recommendation_locked" class="relative overflow-hidden rounded-2xl p-5"
         style="background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); border: 1px solid rgba(251,191,36,0.3);">
      <div class="flex items-start gap-4">
        <div class="w-11 h-11 rounded-xl grid place-items-center flex-shrink-0 bg-amber-400 text-white">
          <AppIcon name="spark" :size="20" />
        </div>
        <div class="flex-1 min-w-0">
          <div class="text-sm font-semibold text-ink-900 mb-1">
            {{ i18n.t({ uz: 'Shaxsiy AI tavsiyalar', kr: 'Шахсий AI тавсиялар' }) }}
          </div>
          <div class="text-sm text-ink-600 leading-relaxed">
            {{ i18n.t({
              uz: 'Zaif mavzularingiz bo\'yicha shaxsiy tavsiyalar Premium\'da ochiladi.',
              kr: 'Заиф мавзуларингиз бўйича шахсий тавсиялар Премиумда очилади.'
            }) }}
          </div>
          <NuxtLink to="/pricing"
                    class="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 text-white hover:bg-amber-600 transition-colors">
            <AppIcon name="spark" :size="12" /> {{ i18n.t({ uz: 'Premium olish', kr: 'Премиум олиш' }) }}
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Empty -->
    <div v-if="data.topics.length === 0" class="card p-8 text-center text-ink-500 text-sm">
      {{ i18n.t({
        uz: 'Hali yetarli ma\'lumot yo\'q. Bir nechta test yeching — tahlil shu yerda paydo bo\'ladi.',
        kr: 'Ҳали етарли маълумот йўқ. Бир нечта тест ечинг — таҳлил шу ерда пайдо бўлади.'
      }) }}
    </div>

    <!-- Topics list (AI-styled) -->
    <div v-else class="ai-topics relative overflow-hidden rounded-2xl"
         style="background: linear-gradient(135deg, #f5f3ff 0%, #eef2ff 50%, #ecfeff 100%);
                border: 1px solid rgba(139, 92, 246, 0.18);
                box-shadow: 0 8px 24px -12px rgba(139, 92, 246, 0.25);">
      <!-- Animated glow blobs -->
      <div aria-hidden="true" class="ai-glow absolute -top-16 -left-16 w-44 h-44 rounded-full blur-3xl pointer-events-none"
           style="background: radial-gradient(circle, rgba(99,102,241,0.28), transparent 70%);"></div>
      <div aria-hidden="true" class="ai-glow-2 absolute -bottom-16 -right-16 w-44 h-44 rounded-full blur-3xl pointer-events-none"
           style="background: radial-gradient(circle, rgba(6,182,212,0.25), transparent 70%);"></div>

      <div class="relative">
        <!-- Header -->
        <div class="px-5 py-4 border-b flex items-center justify-between gap-3"
             style="border-color: rgba(139, 92, 246, 0.15);">
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-9 h-9 rounded-xl grid place-items-center flex-shrink-0 ai-avatar"
                 style="background: linear-gradient(135deg, #8b5cf6, #6366f1, #06b6d4); color: #fff;
                        box-shadow: 0 4px 14px rgba(139,92,246,0.4);">
              <AppIcon name="stat" :size="16" />
            </div>
            <div class="min-w-0">
              <div class="flex items-center gap-2">
                <div class="text-sm font-semibold text-ink-900">
                  {{ i18n.t({ uz: 'Mavzular bo\'yicha daraja', kr: 'Мавзулар бўйича даража' }) }}
                </div>
                <span class="ai-badge inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase"
                      style="background: linear-gradient(90deg, #8b5cf6, #06b6d4); color: #fff;
                             box-shadow: 0 2px 6px rgba(139,92,246,0.35);">
                  <svg class="w-2.5 h-2.5" viewBox="0 0 12 12" fill="currentColor">
                    <path d="M6 0l1.5 4.5L12 6l-4.5 1.5L6 12l-1.5-4.5L0 6l4.5-1.5z"/>
                  </svg>
                  AI
                </span>
              </div>
              <div class="text-2xs text-ink-500 mt-0.5">
                {{ i18n.t({ uz: 'Aniqlik darajangiz tahlili', kr: 'Аниқлик даражангиз таҳлили' }) }}
              </div>
            </div>
          </div>
        </div>

        <!-- Rows -->
        <div class="divide-y" style="--tw-divide-opacity: 1; border-color: rgba(139, 92, 246, 0.1);">
          <div v-for="t in data.topics" :key="t.topic_id || 'none'"
               class="px-5 py-3.5 transition-colors hover:bg-white/40"
               style="border-top: 1px solid rgba(139, 92, 246, 0.08);">
            <div class="flex items-center justify-between gap-3 mb-2">
              <div class="font-medium text-sm text-ink-900 truncate">{{ t.name }}</div>
              <div class="flex items-center gap-2 flex-shrink-0">
                <span v-if="t.accuracy !== null" class="text-sm font-semibold text-ink-900 tabular-nums">{{ t.accuracy }}%</span>
                <span class="text-2xs text-ink-500 tabular-nums">{{ t.correct }}/{{ t.correct + t.wrong }}</span>
                <span class="badge text-2xs" :class="strengthBadge[t.strength]">
                  {{ i18n.t(strengthLabels[t.strength]) }}
                </span>
              </div>
            </div>
            <div class="h-1.5 rounded-full overflow-hidden" style="background: rgba(139, 92, 246, 0.1);">
              <div class="h-full rounded-full transition-all duration-700"
                   :class="strengthColors[t.strength]"
                   :style="{ width: (t.accuracy ?? 0) + '%' }"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ai-glow {
  animation: ai-pulse 4s ease-in-out infinite;
}
.ai-glow-2 {
  animation: ai-pulse 5s ease-in-out infinite;
  animation-delay: 1s;
}
.ai-avatar {
  animation: ai-shimmer 3s ease-in-out infinite;
}
.ai-badge {
  animation: ai-badge-shine 2.5s ease-in-out infinite;
}

@keyframes ai-pulse {
  0%, 100% { opacity: 0.6; transform: scale(1); }
  50%      { opacity: 1;   transform: scale(1.15); }
}

@keyframes ai-shimmer {
  0%, 100% { box-shadow: 0 4px 14px rgba(139,92,246,0.4); }
  50%      { box-shadow: 0 4px 20px rgba(6,182,212,0.55); }
}

@keyframes ai-badge-shine {
  0%, 100% { box-shadow: 0 2px 6px rgba(139,92,246,0.35); }
  50%      { box-shadow: 0 2px 10px rgba(6,182,212,0.5); }
}
</style>
