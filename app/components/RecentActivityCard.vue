<script setup lang="ts">
import type { Tone } from '~/composables/useTone'

/**
 * "So'nggi faollik".
 *
 * Manba: GET /me/stats → recent[] (oxirgi 10 urinish, created_at bo'yicha DESC).
 * Boshqa hodisa turlari ataylab qo'shilmadi:
 *   · /me/bookmarks   — vaqt tamg'asi umuman yo'q,
 *   · /me/mistakes    — last_wrong_at diffForHumans() matni, ISO emas (saralab bo'lmaydi),
 *   · /me/achievements — unlocked_at null bo'lishi mumkin ("on" true bo'lsa ham).
 * Ya'ni ular vaqt bo'yicha saralanadigan lentaga to'g'ri tushmaydi.
 */
const props = defineProps<{
  recent: any[] | null | undefined
}>()

const i18n = useI18n()

const MONTH_LATN = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentyabr', 'oktyabr', 'noyabr', 'dekabr']
const MONTH_CYRL = ['январ', 'феврал', 'март', 'апрел', 'май', 'июн', 'июл', 'август', 'сентябр', 'октябр', 'ноябр', 'декабр']

const MODES: Record<string, { label: { uz: string, kr: string }, icon: string, tone: Tone }> = {
  exam:     { label: { uz: 'Imtihon',    kr: 'Имтиҳон' },   icon: 'exam',     tone: 'brand' },
  topic:    { label: { uz: 'Mavzu',      kr: 'Мавзу' },     icon: 'book',     tone: 'emerald' },
  ticket:   { label: { uz: 'Bilet',      kr: 'Билет' },     icon: 'ticket',   tone: 'sky' },
  random:   { label: { uz: 'Tasodifiy',  kr: 'Тасодифий' }, icon: 'shuffle',  tone: 'ink' },
  mistakes: { label: { uz: 'Xatolar',    kr: 'Хатолар' },   icon: 'refresh',  tone: 'rose' },
  marathon: { label: { uz: 'Marafon',    kr: 'Марафон' },   icon: 'bolt',     tone: 'violet' },
  memorize: { label: { uz: 'Yodlash',    kr: 'Ёдлаш' },     icon: 'bulb',     tone: 'sky' },
  daily:    { label: { uz: 'Kunlik',     kr: 'Кунлик' },    icon: 'star',     tone: 'violet' },
  blitz:    { label: { uz: 'Blits',      kr: 'Блиц' },      icon: 'bolt',     tone: 'amber' },
}

function meta(mode: string) {
  return MODES[mode] ?? { label: { uz: mode, kr: mode }, icon: 'exam', tone: 'brand' as Tone }
}

function pct(a: any) {
  return a.total_questions ? Math.round((a.correct_count / a.total_questions) * 100) : 0
}

/** "Bugun, 10:24" / "Kecha, 21:13" / "12-avgust, 20:05" */
function when(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`

  const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0)
  const startOfDay = new Date(d); startOfDay.setHours(0, 0, 0, 0)
  const diffDays = Math.round((startOfToday.getTime() - startOfDay.getTime()) / 86_400_000)

  if (diffDays === 0) return `${i18n.t({ uz: 'Bugun', kr: 'Бугун' })}, ${time}`
  if (diffDays === 1) return `${i18n.t({ uz: 'Kecha', kr: 'Кеча' })}, ${time}`
  const months = i18n.locale.value === 'uz_cyrl' ? MONTH_CYRL : MONTH_LATN
  return `${d.getDate()}-${months[d.getMonth()]}, ${time}`
}

// 4 ta — yonidagi "Mavzular bo'yicha ustaligingiz" va AI kartasi bilan bir
// sathda tursin (uchalasi bitta gridda, balandligi eng balandiga tenglashadi).
const rows = computed(() => (props.recent ?? []).slice(0, 4))
</script>

<template>
  <section class="card h-full flex flex-col">
    <div class="px-5 sm:px-6 pt-5 pb-4 flex items-center justify-between gap-3">
      <h2 class="text-[17px] font-semibold truncate" style="color: var(--text-1);">
        {{ i18n.t({ uz: 'So\'nggi faollik', kr: 'Сўнгги фаоллик' }) }}
      </h2>
      <NuxtLink to="/me/stats" class="link-all text-[13px] font-medium shrink-0">
        {{ i18n.t({ uz: 'Barchasi', kr: 'Ҳаммаси' }) }}
      </NuxtLink>
    </div>

    <div v-if="!rows.length"
         class="flex-1 grid place-items-center px-5 pb-8 text-center text-sm" style="color: var(--text-4);">
      {{ i18n.t({ uz: 'Hozircha faollik yo\'q', kr: 'Ҳозирча фаоллик йўқ' }) }}
    </div>

    <ul v-else class="px-5 sm:px-6 pb-5 flex flex-col gap-[18px]">
      <li v-for="a in rows" :key="a.id">
        <NuxtLink :to="`/test/result/${a.id}`" class="group flex items-start gap-3.5">
          <IconTile :icon="meta(a.mode).icon" :tone="meta(a.mode).tone" :size="36" :radius="18" />

          <div class="min-w-0 flex-1">
            <div class="text-[13.5px] font-medium leading-snug truncate transition-opacity group-hover:opacity-75"
                 style="color: var(--text-1);">
              {{ i18n.t(meta(a.mode).label) }} {{ i18n.t({ uz: 'urinishini yakunladingiz', kr: 'уринишини якунладингиз' }) }}
            </div>
            <div class="text-2xs mt-0.5 tabular-nums" style="color: var(--text-4);">
              {{ i18n.t({ uz: 'Natija', kr: 'Натижа' }) }}: {{ a.correct_count }}/{{ a.total_questions }}
              <span class="font-semibold" :style="{ color: a.is_passed ? 'var(--ok-ink)' : 'var(--danger-ink)' }">
                ({{ pct(a) }}%)
              </span>
            </div>
          </div>

          <time class="text-2xs shrink-0 tabular-nums whitespace-nowrap mt-0.5"
                :datetime="a.created_at" style="color: var(--text-4);">
            {{ when(a.created_at) }}
          </time>
        </NuxtLink>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.link-all { color: var(--primary); }
.link-all:hover { text-decoration: underline; text-underline-offset: 4px; }
</style>
