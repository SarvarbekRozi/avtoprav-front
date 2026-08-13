<script setup lang="ts">
/**
 * "Haftalik XP challenge" — 5 bosqichli XP zinapoyasi.
 *
 * MA'LUMOT MANBASI (to'qib chiqarilmagan):
 *   GET /leaderboard?period=week&limit=5  →  me.points
 *   = SUM(daily_progress.points_earned) so'nggi 7 kun uchun (bugun ham kiradi).
 * Bu API'dagi yagona davriy XP ko'rsatkichi — /me/stats.timeline ham,
 * /me/streak.week ham XP ustuniga ega emas.
 *
 * Oyna SIRPANUVCHI (bugundan orqaga 7 kun), dushanba–yakshanba emas —
 * shuning uchun sarlavha ostida "so'nggi 7 kun" deb aniq yozilgan.
 *
 * Bosqich chegaralari (100…300) — XP iqtisodiga moslangan mahalliy jadval:
 * bitta faol kun ≈ 50 XP (kunlik maqsad +5, o'zlashtirilgan savol +3,
 * imtihondan o'tish +30). Ya'ni zinapoya ~2–6 faol kunni qamraydi.
 */
const props = withDefaults(defineProps<{
  /** so'nggi 7 kunlik XP; null = hali yuklanmadi (0 XP dan farqli) */
  weekXp: number | null
  /** joriy kunlik seriya (auth.user.streak_current) */
  streakCurrent?: number
}>(), { streakCurrent: 0 })

const i18n = useI18n()

const STEPS = [100, 150, 200, 250, 300]
// Maketdagi yorliqlar: har bosqich taxminan shuncha FAOL KUNga to'g'ri keladi
// (bitta faol kun ≈ 50 XP — yuqoridagi izohga qarang).
const DAYS = [1, 2, 3, 5, 7]

/** Ma'lumot keldimi? Kelmagan bo'lsa "0 XP yig'dingiz" deb da'vo qilmaymiz. */
const loaded = computed(() => props.weekXp !== null)

// points_earned manfiy bo'lishi mumkin (imtihondan yiqilish −5), umumiy bal esa
// 0 dan pastga tushmaydi — ko'rsatishda 0 ga qisamiz.
const xp = computed(() => Math.max(0, Math.round(props.weekXp ?? 0)))

/** Erishilmagan eng past bosqich; hammasi bajarilgan bo'lsa STEPS.length */
const currentIdx = computed(() => {
  const i = STEPS.findIndex(s => xp.value < s)
  return i === -1 ? STEPS.length : i
})

type State = 'done' | 'current' | 'locked'
function stateOf(i: number): State {
  if (xp.value >= STEPS[i]!) return 'done'
  return i === currentIdx.value ? 'current' : 'locked'
}

const remaining = computed(() => {
  const idx = currentIdx.value
  if (idx >= STEPS.length) return 0
  return Math.max(0, STEPS[idx]! - xp.value)
})

const overallPct = computed(() =>
  Math.min(100, Math.round((xp.value / STEPS[STEPS.length - 1]!) * 100)))

// Sirpanuvchi oynaning sanalari — faqat klientda (SSR vaqt mintaqasi boshqacha)
const MONTH_LATN = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentyabr', 'oktyabr', 'noyabr', 'dekabr']
const MONTH_CYRL = ['январ', 'феврал', 'март', 'апрел', 'май', 'июн', 'июл', 'август', 'сентябр', 'октябр', 'ноябр', 'декабр']

const now = ref<Date | null>(null)
onMounted(() => { now.value = new Date() })

const rangeLabel = computed(() => {
  const end = now.value
  if (!end) return ''
  const start = new Date(end)
  start.setDate(start.getDate() - 6)
  const months = i18n.locale.value === 'uz_cyrl' ? MONTH_CYRL : MONTH_LATN
  return start.getMonth() === end.getMonth()
    ? `${start.getDate()}–${end.getDate()} ${months[end.getMonth()]}`
    : `${start.getDate()} ${months[start.getMonth()]} – ${end.getDate()} ${months[end.getMonth()]}`
})

/** Segment rangi: i-chi tugundan (i+1)-chiga */
function segState(rightIdx: number): State {
  return stateOf(rightIdx)
}

const note = computed(() => {
  // Yuklanmagan bo'lsa hech qanday da'vo qilmaymiz — 0 XP deb ko'rsatish yolg'on bo'lardi
  if (!loaded.value) return i18n.t({ uz: 'Natijalar yuklanmoqda…', kr: 'Натижалар юкланмоқда…' })

  const s = props.streakCurrent
  if (s >= 2) {
    return i18n.t({
      uz: `${s} kun ketma-ket muvaffaqiyatli. Davom eting!`,
      kr: `${s} кун кетма-кет муваффақиятли. Давом этинг!`,
    })
  }
  if (currentIdx.value >= STEPS.length) {
    return i18n.t({ uz: 'Barcha bosqichlar bajarildi. Zo\'r natija!', kr: 'Барча босқичлар бажарилди. Зўр натижа!' })
  }
  if (xp.value > 0) {
    return i18n.t({
      uz: `Keyingi bosqichgacha ${remaining.value} XP qoldi`,
      kr: `Кейинги босқичгача ${remaining.value} XP қолди`,
    })
  }
  return i18n.t({
    uz: 'Birinchi testni yeching va XP yig\'ishni boshlang',
    kr: 'Биринчи тестни ечинг ва XP йиғишни бошланг',
  })
})
</script>

<template>
  <!-- Mobilda ham AYNAN shu zinapoya, faqat ixchamroq: 375px da kartaga 303px
       ichki kenglik qoladi, ya'ni 5 ustunga ~60px. "100 XP" 14px da 52px
       oladi — sig'adi, lekin siqilib turadi, shuning uchun mobilda 12.5px
       (o'lchangan). Balandlik ham 248px dan tushadi. -->
  <section class="card p-4 sm:p-6 h-full sm:min-h-[248px] flex flex-col">
    <!-- Sarlavha -->
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <h2 class="text-[17px] font-semibold leading-tight" style="color: var(--text-1);">
          {{ i18n.t({ uz: 'Haftalik XP challenge', kr: 'Ҳафталик XP challenge' }) }}
        </h2>
        <!-- Sana oralig'i sirpanuvchi 7 kunlik oynani o'zi ko'rsatadi —
             qo'shimcha "so'nggi 7 kun" yozuvi maketda yo'q, olib tashlandi. -->
        <p class="text-[13px] mt-1.5 truncate tabular-nums" style="color: var(--text-4);">
          {{ rangeLabel }}
        </p>
      </div>

      <NuxtLink to="/me/stats"
        class="detail-btn inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl text-[13px] font-medium shrink-0">
        {{ i18n.t({ uz: 'Batafsil', kr: 'Батафсил' }) }}
        <AppIcon name="chev-r" :size="14" />
      </NuxtLink>
    </div>

    <!-- Zinapoya. Namunadagidek: tugun YUQORIDA, ikkala yorliq esa OSTIDA. -->
    <ol class="grid grid-cols-5 mt-5 sm:mt-7" role="list">
      <li v-for="(step, i) in STEPS" :key="step" class="flex flex-col items-center min-w-0">
        <!-- Tugun + ulovchi chiziqlar -->
        <div class="relative w-full h-8 flex items-center justify-center">
          <!-- Ulovchi chiziq har bir tugun katagida ikki yarimga bo'linadi.
               i-tugunga KIRUVCHI segment (uning chap yarmi + oldingi katakning
               o'ng yarmi) o'sha tugun holatiga qarab bo'yaladi. -->
          <span v-if="i > 0" class="seg absolute left-0 right-1/2" :class="`seg-${segState(i)}`"></span>
          <span v-if="i < STEPS.length - 1" class="seg absolute left-1/2 right-0"
                :class="`seg-${segState(i + 1)}`"></span>

          <span class="node relative z-10 grid place-items-center rounded-full"
                :class="[`node-${stateOf(i)}`]">
            <AppIcon v-if="stateOf(i) === 'done'" name="check" :size="15" />
            <AppIcon v-else-if="stateOf(i) === 'locked'" name="lock" :size="12" />
            <span v-else class="node-dot"></span>
          </span>
        </div>

        <!-- XP miqdori -->
        <div class="mt-2.5 sm:mt-3.5 text-[12.5px] sm:text-[14px] font-bold tabular-nums leading-none whitespace-nowrap"
             :style="{ color: stateOf(i) === 'locked' ? 'var(--text-4)' : 'var(--text-1)' }">
          {{ step }} XP
        </div>

        <!-- Kun yorlig'i (maketdagidek: "1 kun", "2 kun", …) -->
        <div class="mt-1 sm:mt-1.5 text-[11px] sm:text-xs font-medium truncate"
             :style="{
               color: stateOf(i) === 'current' ? 'var(--primary-ink)' : 'var(--text-4)',
               fontWeight: stateOf(i) === 'current' ? 700 : 500,
             }">
          {{ DAYS[i] }} {{ i18n.t({ uz: 'kun', kr: 'кун' }) }}
        </div>
      </li>
    </ol>

    <!-- Izoh — namunada ko'kimtir (amber emas) -->
    <div class="mt-auto pt-4 sm:pt-6">
      <div class="flex items-center gap-2.5 rounded-xl px-3 sm:px-3.5 py-2.5 sm:py-3"
           style="background: var(--primary-soft);">
        <AppIcon name="flame" :size="17" class="text-amber-500 shrink-0" />
        <p class="text-[12.5px] sm:text-[13px] font-medium leading-snug" style="color: var(--text-2);">{{ note }}</p>
        <span v-if="loaded" class="ml-auto text-2xs font-semibold tabular-nums shrink-0 whitespace-nowrap"
              style="color: var(--text-4);">
          {{ xp }}/{{ STEPS[STEPS.length - 1] }} XP
        </span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.detail-btn {
  background: var(--surface);
  border: 1px solid var(--border-1);
  color: var(--text-2);
  transition: background .15s, border-color .15s;
}
.detail-btn:hover { background: var(--surface-inset); border-color: var(--text-muted); }

/* ── Ulovchi segmentlar ── */
.seg {
  height: 3px;
  border-radius: 9999px;
  background: var(--surface-inset);
  overflow: hidden;
}
.seg-done { background: var(--ok-surface-2); }
.seg-current { background: var(--primary); }
.seg-locked { background: var(--surface-inset); }

/* ── Tugunlar ── */
.node {
  width: 30px;
  height: 30px;
  transition: box-shadow .25s, background .25s;
}
/* To'ldirish uchun --ok-surface (oq matn ostida ishlaydigan to'q yashil),
   --ok emas: --ok dark rejimda ochib ketadi va oq belgi ko'rinmay qoladi. */
.node-done {
  background: var(--ok-surface);
  color: #fff;
  box-shadow: 0 2px 8px -2px rgba(16, 185, 129, 0.55);
}
/* Namunada joriy bosqich — to'q ko'k to'ldirilgan doira, ichida oq halqa */
.node-current {
  width: 34px;
  height: 34px;
  background: var(--primary);
  box-shadow: 0 0 0 4px var(--primary-ring);
}
.node-dot {
  width: 11px;
  height: 11px;
  border-radius: 9999px;
  background: #fff;
}
.node-locked {
  background: var(--surface-inset);
  color: var(--text-muted);
}

@media (prefers-reduced-motion: reduce) {
  .seg-current > i, .node { transition: none; }
}
</style>
