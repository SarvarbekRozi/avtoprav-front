<script setup lang="ts">
import type { Tone } from '~/composables/useTone'

/**
 * "Mavzular bo'yicha ustaligingiz" — ixcham progress ro'yxati.
 *
 * Ma'lumot: GET /me/topic-stats → topics[] { topic_id, name, mastery, strength,
 * answered, total, accuracy }. Server allaqachon "eng zaif ishlangani birinchi"
 * tartibida qaytaradi — QAYTA SARALAMAYMIZ.
 *
 * So'rov `useTopicStats()` orqali — AIRecommendationCard bilan bitta kalit va
 * bitta handler havolasi, ya'ni so'rov bir marta ketadi.
 */
const i18n = useI18n()
const { data } = await useTopicStats()

// 4 ta — yonidagi "So'nggi faollik" va AI kartasi bilan bir sathda tursin.
const rows = computed(() => (data.value?.topics ?? []).slice(0, 4))

/** Progress bar rangi — o'zlashtirish darajasiga qarab */
const BAR: Record<string, string> = {
  mastered:   '#10b981',
  strong:     '#4f6ef0',
  practicing: '#f59e0b',
  weak:       '#f43f5e',
  new:        '#c7cbd6',
}

/**
 * Qatordagi ikonka. Mavzu nomi bo'yicha kalit so'z topilsa — mos ikonka,
 * topilmasa navbat bilan takrorlanadigan to'plamdan olinadi.
 */
const KEYWORDS: { re: RegExp, icon: string, tone: Tone }[] = [
  { re: /piyoda|пиёда/i,                         icon: 'user',    tone: 'rose' },
  { re: /belgi|белги|chiziq|чизиқ|razmetka/i,    icon: 'sign',    tone: 'sky' },
  { re: /transport|транспорт|avtomobil/i,        icon: 'car',     tone: 'emerald' },
  { re: /tezlik|тезлик|xavf|хавф|ogohlant|огоҳ/i, icon: 'alert',  tone: 'amber' },
  { re: /haydovchi|ҳайдовчи|vazifa|вазифа/i,     icon: 'exam',    tone: 'brand' },
  { re: /jarima|жарима|javobgar|жавобгар/i,      icon: 'ticket',  tone: 'violet' },
]
const FALLBACK: { icon: string, tone: Tone }[] = [
  { icon: 'book',   tone: 'brand' },
  { icon: 'sign',   tone: 'sky' },
  { icon: 'car',    tone: 'emerald' },
  { icon: 'alert',  tone: 'amber' },
  { icon: 'ticket', tone: 'violet' },
]

function iconFor(name: string, index: number) {
  return KEYWORDS.find(k => k.re.test(name ?? '')) ?? FALLBACK[index % FALLBACK.length]!
}
</script>

<template>
  <section class="card h-full flex flex-col">
    <div class="px-5 sm:px-6 pt-5 pb-4 flex items-center justify-between gap-3">
      <!-- `truncate` EMAS: AI karta to'rda 1.5fr olgach bu karta ~358px ga
           tushdi va sarlavha "Mavzular bo'yicha ustaligin…" bo'lib qirqilardi.
           Endi kerak bo'lsa ikki qatorga o'raladi. -->
      <h2 class="text-[17px] font-semibold leading-tight" style="color: var(--text-1);">
        {{ i18n.t({ uz: 'Mavzular bo\'yicha ustaligingiz', kr: 'Мавзулар бўйича усталигингиз' }) }}
      </h2>
      <NuxtLink to="/topics" class="link-all text-[13px] font-medium shrink-0">
        {{ i18n.t({ uz: 'Barchasi', kr: 'Ҳаммаси' }) }}
      </NuxtLink>
    </div>

    <div v-if="!rows.length"
         class="flex-1 grid place-items-center px-5 pb-8 text-center text-sm" style="color: var(--text-4);">
      {{ i18n.t({
        uz: 'Bir nechta test yeching — mavzular tahlili shu yerda paydo bo\'ladi.',
        kr: 'Бир нечта тест ечинг — мавзулар таҳлили шу ерда пайдо бўлади.'
      }) }}
    </div>

    <ul v-else class="px-5 sm:px-6 pb-5 flex flex-col gap-[18px]">
      <li v-for="(t, i) in rows" :key="t.topic_id">
        <NuxtLink :to="`/test/start/topic?topic_id=${t.topic_id}`" class="group flex items-center gap-3.5">
          <IconTile :icon="iconFor(t.name, i).icon" :tone="iconFor(t.name, i).tone" :size="38" />

          <div class="min-w-0 flex-1">
            <div class="flex items-center justify-between gap-2">
              <span class="text-[13.5px] font-medium truncate transition-opacity group-hover:opacity-75"
                    style="color: var(--text-1);">{{ t.name }}</span>
              <span class="text-[13.5px] font-semibold tabular-nums shrink-0" style="color: var(--text-3);">
                {{ t.mastery }}%
              </span>
            </div>
            <div class="track track-sm mt-2">
              <i :style="{ width: `${Math.max(t.mastery, 1.5)}%`, background: BAR[t.strength] || BAR.new }"></i>
            </div>
          </div>
        </NuxtLink>
      </li>
    </ul>
  </section>
</template>

<style scoped>
/* `--primary` oq fonda 4.36:1 — 13px matn uchun 4.5:1 talab bajarilmaydi. */
.link-all { position: relative; color: var(--primary-strong); }
.link-all:hover { text-decoration: underline; text-underline-offset: 4px; }
/* Bosish zonasi kamida 36px bo'lsin — pseudo-element joy egallamaydi.
   Faqat vertikal: gorizontal chiqsa `scrollWidth` keraksiz oshadi. */
.link-all::after { content: ''; position: absolute; inset: -8px 0; }
</style>
