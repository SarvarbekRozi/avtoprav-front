<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const i18n = useI18n()

// Oraliq URL'da EMAS, holatda: grafik tabi sahifa manzilini o'zgartirmasin.
const oraliq = ref<'7' | '30' | '90' | 'all'>('30')

const { data: stats, status, refresh } = await useAsyncData(
  'me-stats',
  () => apiFetch<any>(`/me/stats?range=${oraliq.value}`),
  { watch: [oraliq] },
)
/** Qayta so'rovda skelet MILTILLAMASIN — oldingi render shaffofroq turadi. */
const yangilanmoqda = computed(() => status.value === 'pending' && !!stats.value)

const t = computed(() => stats.value?.totals ?? {})
const timeline = computed<{ date: string, accuracy: number | null }[]>(() => stats.value?.timeline ?? [])
const trends = computed(() => stats.value?.trends ?? {})

/** Grafikdagi punktir chiziq — ma'lumot BOR kunlarning o'rtachasi. */
const ortacha = computed(() => {
  const v = timeline.value.filter(p => p.accuracy !== null).map(p => p.accuracy as number)
  if (!v.length) return null
  return Math.round((v.reduce((a, b) => a + b, 0) / v.length) * 10) / 10
})

const aniqlikSeriya = computed(() => timeline.value.map(p => p.accuracy))
const urinishSeriya = computed<(number | null)[]>(() => trends.value?.attempts_series ?? [])
/** Qamrov uchun kunlik seriya yo'q — kunlik javob soni shaklini ko'rsatamiz
    (karta ostidagi son aniq: 45 / 1260). */
const qamrovSeriya = computed<(number | null)[]>(() => (stats.value?.timeline ?? []).map((p: any) => p.answered))

// ── Donut ─────────────────────────────────────────────────────────────────
const donutBolaklar = computed(() => {
  const bank = t.value.bank_total ?? 0
  const mastered = t.value.mastered ?? 0
  const seen = Math.max(0, (t.value.distinct_seen ?? 0) - mastered)
  return [
    { key: 'ok', tone: 'ok' as const, value: mastered, label: i18n.t({ uz: 'O\'zlashtirilgan', kr: 'Ўзлаштирилган' }) },
    { key: 'seen', tone: 'seen' as const, value: seen, label: i18n.t({ uz: 'Ko\'rib chiqilgan', kr: 'Кўриб чиқилган' }) },
    { key: 'rest', tone: 'rest' as const, value: Math.max(0, bank - (t.value.distinct_seen ?? 0)), label: i18n.t({ uz: 'Qolgan', kr: 'Қолган' }) },
  ]
})

// ── AI tavsiya: eng zaif mavzular ─────────────────────────────────────────
const { data: topicStats } = useTopicStats()
const zaifMavzular = computed(() => {
  const list = topicStats.value?.topics ?? []
  return [...list]
    .filter(x => x.answered > 0)
    .sort((a, b) => (a.accuracy ?? 0) - (b.accuracy ?? 0))
    .slice(0, 3)
})

const MAVZU_IK = ['alert', 'car', 'light-signal']

// ── Xato mavzular jadvali ─────────────────────────────────────────────────
const xatoMavzular = computed<any[]>(() => stats.value?.topic_mistakes ?? [])
/** Chiziq uzunligi = XATO ulushi (karta sarlavhasi "eng ko'p xato qilingan"),
    matn esa aniqlikni ko'rsatadi. Rang ham xuddi shu qiymatdan — semantik
    issiqlik (qizil = yomon), va aniq foiz har qatorda yozilgan. */
function xatoUlush(a: number) { return Math.max(4, 100 - a) }
function ohang(a: number) {
  if (a < 20) return 'bad'
  if (a < 25) return 'warn'
  if (a < 35) return 'mid'
  return 'ok'
}

// ── Yangilanish vaqti ─────────────────────────────────────────────────────
/** FAQAT brauzerda: server va mijoz vaqt mintaqasi farq qilsa gidratsiya
    nomuvofiqligi chiqadi. */
const mijoz = ref(false)
const yangilangan = ref('')
function vaqtBelgila() {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  yangilangan.value = `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`
}
onMounted(() => { mijoz.value = true; vaqtBelgila() })
watch(status, (s) => { if (s === 'success' && mijoz.value) vaqtBelgila() })

const ORALIQLAR = [
  { id: '7' as const, soz: { uz: '7 kun', kr: '7 кун' } },
  { id: '30' as const, soz: { uz: '30 kun', kr: '30 кун' } },
  { id: '90' as const, soz: { uz: '90 kun', kr: '90 кун' } },
  { id: 'all' as const, soz: { uz: 'Barchasi', kr: 'Барчаси' } },
]

function delta(v: number | null | undefined) {
  if (v === null || v === undefined || v === 0) return null
  return { yuqori: v > 0, matn: `${v > 0 ? '+' : ''}${v}` }
}
</script>

<template>
  <div class="stats mx-auto w-full max-w-[1800px] px-4 sm:px-6 lg:px-8 xl:px-10 pt-6 lg:pt-8 pb-16 md:pb-12">
    <!-- ── Sarlavha ────────────────────────────────────────────────────────
         Maketda o'ng tepada XP chip bor edi, lekin u yon menyuda ("XP
         darajangiz") allaqachon turibdi — biletlar va natija sahifalaridagi
         qaror bilan bir xil. -->
    <header class="head">
      <div class="eyebrow">{{ i18n.t({ uz: 'Tahlil', kr: 'Таҳлил' }) }}</div>
      <h1 class="page-title">{{ i18n.t({ uz: 'Statistika', kr: 'Статистика' }) }}</h1>
      <p class="page-sub">
        {{ i18n.t({
          uz: 'O\'rganish jarayoni bo\'yicha batafsil tahlil va progressingiz.',
          kr: 'Ўрганиш жараёни бўйича батафсил таҳлил ва прогрессингиз.'
        }) }}
      </p>
    </header>

    <template v-if="stats">
      <!-- ── KPI qatori ────────────────────────────────────────────────── -->
      <div class="kpis" :class="{ stale: yangilanmoqda }">
        <div class="kpi">
          <div class="kpi-top">
            <span class="kpi-ic ki-acc"><AppIcon name="star" :size="17" /></span>
            <span class="kpi-lbl">{{ i18n.t({ uz: 'Aniqlik', kr: 'Аниқлик' }) }}</span>
          </div>
          <div class="kpi-row">
            <div class="kpi-num">
              {{ t.accuracy_percent }}%
              <span v-if="delta(trends.accuracy_delta)" class="kpi-delta" :class="delta(trends.accuracy_delta)!.yuqori ? 'up' : 'down'">
                <AppIcon :name="delta(trends.accuracy_delta)!.yuqori ? 'chev-u' : 'chev-d'" :size="12" />
                {{ delta(trends.accuracy_delta)!.matn }}%
              </span>
            </div>
            <div class="kpi-spark"><StatSpark :values="aniqlikSeriya" tone="primary" /></div>
          </div>
          <div class="kpi-sub">{{ i18n.t({ uz: 'O\'tgan haftaga nisbatan', kr: 'Ўтган ҳафтага нисбатан' }) }}</div>
        </div>

        <div class="kpi">
          <div class="kpi-top">
            <span class="kpi-ic ki-att"><AppIcon name="clipboard" :size="17" /></span>
            <span class="kpi-lbl">{{ i18n.t({ uz: 'Urinish', kr: 'Уриниш' }) }}</span>
          </div>
          <div class="kpi-row">
            <div class="kpi-num">
              {{ t.attempts }}
              <span v-if="delta(trends.attempts_delta)" class="kpi-delta" :class="delta(trends.attempts_delta)!.yuqori ? 'up' : 'down'">
                <AppIcon :name="delta(trends.attempts_delta)!.yuqori ? 'chev-u' : 'chev-d'" :size="12" />
                {{ delta(trends.attempts_delta)!.matn }}
              </span>
            </div>
            <div class="kpi-spark"><StatSpark :values="urinishSeriya" tone="blue" /></div>
          </div>
          <div class="kpi-sub">
            <span class="tabular-nums">{{ t.attempts_passed }}</span> {{ i18n.t({ uz: 'muvaffaqiyatli', kr: 'муваффақиятли' }) }}
          </div>
        </div>

        <div class="kpi">
          <div class="kpi-top">
            <span class="kpi-ic ki-cov"><AppIcon name="target" :size="17" /></span>
            <span class="kpi-lbl">{{ i18n.t({ uz: 'Qamrov', kr: 'Қамров' }) }}</span>
          </div>
          <div class="kpi-row">
            <div class="kpi-num">{{ t.coverage_percent }}%</div>
            <div class="kpi-spark"><StatSpark :values="qamrovSeriya" tone="amber" /></div>
          </div>
          <div class="kpi-sub tabular-nums">
            {{ t.distinct_seen }} / {{ t.bank_total }} {{ i18n.t({ uz: 'savol', kr: 'савол' }) }}
          </div>
        </div>

        <!-- To'q karta — maketdagidek -->
        <div class="kpi kpi-dark">
          <div class="kpi-top">
            <span class="kpi-ic ki-ready"><AppIcon name="check-circle" :size="17" /></span>
            <span class="kpi-lbl">{{ i18n.t({ uz: 'Imtihonga tayyorlik', kr: 'Имтиҳонга тайёрлик' }) }}</span>
          </div>
          <div class="kpi-num">{{ t.readiness_percent }}%</div>
          <div class="ready-bar"><span :style="{ width: Math.max(1, t.readiness_percent ?? 0) + '%' }" /></div>
          <div class="kpi-sub">
            <span class="tabular-nums">{{ t.mastered }} / {{ t.bank_total }}</span>
            {{ i18n.t({ uz: 'o\'zlashtirildi', kr: 'ўзлаштирилди' }) }}
          </div>
        </div>
      </div>

      <!-- ── Grafik + donut ────────────────────────────────────────────── -->
      <div class="row-2">
        <section class="panel-card chart-card" :class="{ stale: yangilanmoqda }">
          <div class="card-head">
            <div>
              <h2 class="card-title">{{ i18n.t({ uz: 'Vaqt davomida o\'sish', kr: 'Вақт давомида ўсиш' }) }}</h2>
              <p class="card-sub">{{ i18n.t({ uz: 'Aniqlik ko\'rsatkichi dinamikasi', kr: 'Аниқлик кўрсаткичи динамикаси' }) }}</p>
            </div>
            <div class="segs" role="group" :aria-label="i18n.t({ uz: 'Davr', kr: 'Давр' })">
              <button
                v-for="o in ORALIQLAR" :key="o.id" type="button" class="seg"
                :class="{ on: oraliq === o.id }" :aria-pressed="oraliq === o.id"
                @click="oraliq = o.id"
              >{{ i18n.t(o.soz) }}</button>
            </div>
          </div>
          <StatLineChart :points="timeline" :avg="ortacha" :height="216" />
        </section>

        <section class="panel-card donut-card">
          <div class="card-head">
            <div>
              <h2 class="card-title">{{ i18n.t({ uz: 'Umumiy qamrov', kr: 'Умумий қамров' }) }}</h2>
              <p class="card-sub">{{ i18n.t({ uz: 'Barcha savollar banki bo\'yicha', kr: 'Барча саволлар банки бўйича' }) }}</p>
            </div>
          </div>
          <StatDonut
            :parts="donutBolaklar" :percent="t.coverage_percent ?? 0"
            :center-top="`${t.distinct_seen} / ${t.bank_total}`"
            :center-sub="i18n.t({ uz: 'savol qamrovda', kr: 'савол қамровда' })"
          />
          <NuxtLink to="/topics" class="card-link">
            {{ i18n.t({ uz: 'Barcha savollarni ko\'rish', kr: 'Барча саволларни кўриш' }) }}
            <AppIcon name="arrow" :size="15" />
          </NuxtLink>
        </section>
      </div>

      <!-- ── AI tavsiya + xato mavzular ────────────────────────────────── -->
      <div class="row-3">
        <section class="panel-card ai-card">
          <div class="ai-head">
            <span class="ai-tile"><AppIcon name="spark" :size="20" /></span>
            <div class="ai-chips">
              <span class="ai-chip"><AppIcon name="spark" :size="12" />{{ i18n.t({ uz: 'AI tavsiya', kr: 'AI тавсия' }) }}</span>
              <span class="ai-chip ai-chip-solid"><AppIcon name="star" :size="12" />AI</span>
            </div>
          </div>
          <h2 class="ai-title">{{ i18n.t({ uz: 'Siz uchun tavsiya qilingan', kr: 'Сиз учун тавсия қилинган' }) }}</h2>
          <p class="ai-sub">
            {{ i18n.t({
              uz: 'Aniqligingizni oshirish uchun quyidagi mavzularga e\'tibor qarating.',
              kr: 'Аниқлигингизни ошириш учун қуйидаги мавзуларга эътибор қаратинг.'
            }) }}
          </p>

          <div v-if="zaifMavzular.length" class="ai-topics">
            <NuxtLink
              v-for="(m, k) in zaifMavzular" :key="m.topic_id"
              :to="`/test/start/topic?topic_id=${m.topic_id}`" class="ai-topic"
            >
              <span class="ai-topic-ic"><AppIcon :name="MAVZU_IK[k] || 'sign'" :size="17" /></span>
              <span class="ai-topic-txt">
                <span class="ai-topic-nom">{{ m.name }}</span>
                <span class="ai-topic-meta tabular-nums">
                  {{ i18n.t({ uz: 'Aniqlik', kr: 'Аниқлик' }) }}: {{ m.accuracy ?? 0 }}% · {{ m.total }} {{ i18n.t({ uz: 'ta savol', kr: 'та савол' }) }}
                </span>
              </span>
              <AppIcon name="chev-r" :size="15" class="ai-topic-go" />
            </NuxtLink>
          </div>
          <p v-else class="ai-empty">
            {{ i18n.t({
              uz: 'Tavsiya berish uchun avval bir nechta mavzudan test yechib ko\'ring.',
              kr: 'Тавсия бериш учун аввал бир нечта мавзудан тест ечиб кўринг.'
            }) }}
          </p>

          <div class="ai-acts">
            <NuxtLink to="/topics" class="ai-btn-main">
              {{ i18n.t({ uz: 'Mavzularni o\'rganish', kr: 'Мавзуларни ўрганиш' }) }}
              <AppIcon name="arrow" :size="15" />
            </NuxtLink>
            <NuxtLink to="/test/start/random" class="ai-btn-ghost">
              <AppIcon name="target" :size="15" />
              {{ i18n.t({ uz: 'Amaliy test yechish', kr: 'Амалий тест ечиш' }) }}
            </NuxtLink>
          </div>
        </section>

        <section class="panel-card miss-card">
          <div class="card-head">
            <div>
              <h2 class="card-title">{{ i18n.t({ uz: 'Eng ko\'p xato qilingan mavzular', kr: 'Энг кўп хато қилинган мавзулар' }) }}</h2>
              <p class="card-sub">{{ i18n.t({ uz: 'Savollar soni va aniqlik darajasi', kr: 'Саволлар сони ва аниқлик даражаси' }) }}</p>
            </div>
            <NuxtLink to="/me/mistakes" class="head-link">{{ i18n.t({ uz: 'Barchasini ko\'rish', kr: 'Барчасини кўриш' }) }}</NuxtLink>
          </div>

          <table v-if="xatoMavzular.length" class="miss">
            <thead>
              <tr>
                <th class="mc-r"><span class="sr-only">#</span></th>
                <th class="mc-n">{{ i18n.t({ uz: 'Mavzu', kr: 'Мавзу' }) }}</th>
                <th class="mc-b"><span class="sr-only">{{ i18n.t({ uz: 'Xato ulushi', kr: 'Хато улуши' }) }}</span></th>
                <th class="mc-q">{{ i18n.t({ uz: 'Savollar', kr: 'Саволлар' }) }}</th>
                <th class="mc-a">{{ i18n.t({ uz: 'Aniqlik', kr: 'Аниқлик' }) }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(m, k) in xatoMavzular" :key="m.topic_id">
                <td class="mc-r"><span class="rk" :class="`rk-${ohang(m.accuracy)}`">{{ k + 1 }}</span></td>
                <td class="mc-n"><span class="m-nom" :title="m.name">{{ m.name }}</span></td>
                <td class="mc-b">
                  <span class="bar"><span class="bar-in" :class="`b-${ohang(m.accuracy)}`" :style="{ width: xatoUlush(m.accuracy) + '%' }" /></span>
                </td>
                <td class="mc-q tabular-nums">{{ m.questions }}</td>
                <td class="mc-a tabular-nums" :class="`t-${ohang(m.accuracy)}`">{{ m.accuracy }}%</td>
              </tr>
            </tbody>
          </table>
          <p v-else class="miss-empty">
            {{ i18n.t({ uz: 'Hozircha xato qilingan mavzu yo\'q.', kr: 'Ҳозирча хато қилинган мавзу йўқ.' }) }}
          </p>
        </section>
      </div>

      <!-- ── Yangilanish qatori ────────────────────────────────────────── -->
      <div class="panel-card upd">
        <span class="upd-txt">
          <AppIcon name="info" :size="15" />
          {{ i18n.t({ uz: 'Ma\'lumotlar', kr: 'Маълумотлар' }) }}
          <span v-if="yangilangan" class="tabular-nums">{{ yangilangan }}</span>
          {{ i18n.t({ uz: 'holatiga yangilangan', kr: 'ҳолатига янгиланган' }) }}
        </span>
        <button type="button" class="upd-btn" :disabled="status === 'pending'" @click="refresh()">
          <AppIcon name="refresh" :size="15" />
          {{ status === 'pending' ? i18n.t({ uz: 'Yangilanmoqda…', kr: 'Янгиланмоқда…' }) : i18n.t({ uz: 'Yangilash', kr: 'Янгилаш' }) }}
        </button>
      </div>

      <!-- ── Kunlik challenge + blits reytinglari ──────────────────────── -->
      <div class="row-lb">
        <ScoreLeaderboard
          endpoint="/leaderboard/daily"
          :title="{ uz: 'Bugungi challenge — TOP 10', kr: 'Бугунги челлендж — ТОП 10' }"
          :subtitle="{ uz: 'Bugun eng ko\'p savol to\'g\'ri yechganlar', kr: 'Бугун энг кўп савол тўғри ечганлар' }"
          icon="star" tone="violet" more-to="/test/start/daily"
        />
        <ScoreLeaderboard
          endpoint="/leaderboard/blitz"
          :title="{ uz: 'Blits rekordlar — TOP 10', kr: 'Блиц рекордлар — ТОП 10' }"
          :subtitle="{ uz: 'Eng tez vaqt ichida eng ko\'p to\'g\'ri javob', kr: 'Энг тез вақт ичида энг кўп тўғри жавоб' }"
          icon="bolt" tone="amber" more-to="/test/start/blitz"
        />
      </div>

      <!-- ── Umumiy reyting ────────────────────────────────────────────── -->
      <LeaderboardCard />
    </template>

    <!-- Yuklanish skeleti (birinchi kirish) -->
    <div v-else class="skel-wrap">
      <div class="skel skel-kpi" />
      <div class="skel skel-chart" />
    </div>
  </div>
</template>

<style scoped>
/* ── Sahifaga xos tokenlar ────────────────────────────────────────────────
   Global to'plamda AI (siyohrang) va yumshoq yashil to'ldirish yo'q.
   Qorong'ida to'ldirishlar SHAFFOF: to'q sirt ustida qattiq rang "yamoq"
   bo'lib ko'rinadi. */
.stats {
  container-type: inline-size;
  --ai-ink2:    #6a5cf0;
  --ai-soft:    #eef0fe;
  --ai-bg2:     #f4f3ff;
  --ai-border2: rgba(106, 92, 240, 0.22);
  --ok-soft2:   #d1fae5;
}
.dark .stats {
  --ai-ink2:    #a89bfa;
  --ai-soft:    rgba(106, 92, 240, 0.18);
  --ai-bg2:     rgba(106, 92, 240, 0.10);
  --ai-border2: rgba(168, 155, 250, 0.28);
  --ok-soft2:   rgba(16, 185, 129, 0.16);
}

.panel-card {
  background: var(--surface);
  border: 1px solid var(--border-1);
  border-radius: 1rem;
  box-shadow: var(--shadow-card);
}

/* Qayta so'rovda skelet miltillamasin — oldingi render shaffofroq turadi */
.stale { opacity: 0.6; transition: opacity 0.2s; }

/* ── Sarlavha ────────────────────────────────────────────────────────── */
.head { max-width: 62rem; }
.page-title {
  margin-top: 0.35rem;
  font-size: 1.875rem; font-weight: 700; letter-spacing: -0.025em; line-height: 1.15;
  color: var(--text-1);
}
@media (min-width: 640px) { .page-title { font-size: 2.375rem; } }
.page-sub { margin-top: 0.5rem; font-size: 0.9375rem; line-height: 1.6; color: var(--text-3); }

/* ── KPI ─────────────────────────────────────────────────────────────── */
.kpis { display: grid; gap: 1rem; margin-top: 1.75rem; grid-template-columns: repeat(2, minmax(0, 1fr)); }
@container (min-width: 60rem) { .kpis { grid-template-columns: repeat(4, minmax(0, 1fr)); } }

.kpi {
  padding: 1.125rem 1.25rem;
  background: var(--surface); border: 1px solid var(--border-1);
  border-radius: 1rem; box-shadow: var(--shadow-card);
}
.kpi-top { display: flex; align-items: center; gap: 0.55rem; }
.kpi-ic { flex-shrink: 0; display: grid; place-items: center; width: 2.125rem; height: 2.125rem; border-radius: 0.625rem; }
.ki-acc   { background: var(--ai-soft);     color: var(--ai-ink2); }
.ki-att   { background: var(--primary-soft); color: var(--primary-ink); }
.ki-cov   { background: var(--warn-soft);   color: var(--warn-ink); }
.ki-ready { background: rgba(16, 185, 129, 0.16); color: #6ee7b7; }
.kpi-lbl {
  font-size: 0.6875rem; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase;
  color: var(--text-3); line-height: 1.2;
}

.kpi-row { display: flex; align-items: flex-end; justify-content: space-between; gap: 0.75rem; margin-top: 0.75rem; }
/* `tabular-nums` YO'Q: katta yakka sonda teng kenglikdagi raqamlar bo'sh ko'rinadi */
.kpi-num {
  display: flex; align-items: baseline; gap: 0.5rem;
  font-size: 1.75rem; font-weight: 700; letter-spacing: -0.02em; color: var(--text-1);
}
.kpi-delta { display: inline-flex; align-items: center; gap: 0.1rem; font-size: 0.8125rem; font-weight: 600; }
.kpi-delta.up   { color: var(--ok-ink); }
.kpi-delta.down { color: var(--danger-ink); }
.kpi-spark { flex: 0 0 auto; width: 6.5rem; height: 2.5rem; }
.kpi-sub { margin-top: 0.4rem; font-size: 0.75rem; color: var(--text-3); }

.kpi-dark { background: #0e1016; border-color: #0e1016; }
.kpi-dark .kpi-lbl { color: rgba(255, 255, 255, 0.62); }
.kpi-dark .kpi-num { color: #fff; margin-top: 0.75rem; }
.kpi-dark .kpi-sub { color: rgba(255, 255, 255, 0.6); }
.ready-bar { margin-top: 0.75rem; height: 0.375rem; border-radius: 9999px; background: rgba(255, 255, 255, 0.14); overflow: hidden; }
.ready-bar span { display: block; height: 100%; border-radius: 9999px; background: linear-gradient(90deg, #34d399, #059669); transition: width 0.5s ease; }

/* ── Qatorlar ────────────────────────────────────────────────────────── */
.row-2, .row-3, .row-lb { display: grid; gap: 1rem; margin-top: 1rem; grid-template-columns: minmax(0, 1fr); }
@container (min-width: 64rem) {
  .row-2 { grid-template-columns: minmax(0, 1.55fr) minmax(0, 1fr); }
  .row-3 { grid-template-columns: minmax(0, 1fr) minmax(0, 1.15fr); }
  .row-lb { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

.card-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
.card-title { font-size: 1rem; font-weight: 600; color: var(--text-1); }
.card-sub { margin-top: 0.15rem; font-size: 0.8125rem; color: var(--text-3); }
.head-link { font-size: 0.8125rem; font-weight: 500; color: var(--text-3); }
.head-link:hover { color: var(--primary-ink); }

.chart-card, .donut-card, .miss-card { padding: 1.25rem 1.5rem 1.5rem; }
.donut-card { display: flex; flex-direction: column; container-type: inline-size; }
.donut-card :deep(.dn) { flex: 1 1 auto; margin: 1.25rem 0; }
.card-link {
  display: flex; align-items: center; justify-content: space-between; gap: 0.5rem;
  padding-top: 0.875rem; border-top: 1px solid var(--border-soft);
  font-size: 0.875rem; font-weight: 500; color: var(--primary-ink);
}
.card-link:hover { color: var(--primary-strong); }

/* Davr tablari */
.segs { display: inline-flex; gap: 0.125rem; padding: 0.1875rem; border-radius: 0.5rem; background: var(--surface-inset); }
.seg {
  height: 1.875rem; padding: 0 0.6rem; border-radius: 0.375rem;
  font-size: 0.8125rem; font-weight: 500; color: var(--text-3);
  transition: background 0.15s, color 0.15s;
}
.seg:hover { color: var(--text-1); }
.seg.on { background: var(--surface); color: var(--text-1); box-shadow: var(--shadow-soft); font-weight: 600; }

/* ── AI tavsiya kartasi ──────────────────────────────────────────────── */
.ai-card { padding: 1.25rem 1.5rem 1.5rem; background: var(--ai-bg2); border-color: var(--ai-border2); }
.ai-head { display: flex; align-items: center; gap: 0.75rem; }
.ai-tile {
  flex-shrink: 0; display: grid; place-items: center;
  width: 2.75rem; height: 2.75rem; border-radius: 0.75rem;
  background: linear-gradient(135deg, #6a5cf0, #8b5cf6); color: #fff;
}
.ai-chips { display: flex; flex-wrap: wrap; gap: 0.375rem; }
.ai-chip {
  display: inline-flex; align-items: center; gap: 0.25rem;
  height: 1.5rem; padding: 0 0.5rem; border-radius: 9999px;
  background: var(--surface); border: 1px solid var(--ai-border2);
  font-size: 0.6875rem; font-weight: 600; color: var(--ai-ink2);
}
.ai-chip-solid { background: var(--ai-ink2); border-color: var(--ai-ink2); color: #fff; }
.ai-title { margin-top: 0.875rem; font-size: 1.0625rem; font-weight: 600; color: var(--text-1); }
.ai-sub { margin-top: 0.25rem; font-size: 0.8125rem; line-height: 1.55; color: var(--text-3); }

.ai-topics { display: grid; gap: 0.5rem; margin-top: 1rem; }
.ai-topic {
  display: flex; align-items: center; gap: 0.625rem;
  padding: 0.625rem 0.75rem; border-radius: 0.625rem;
  background: var(--surface); border: 1px solid var(--ai-border2);
  transition: border-color 0.15s;
}
.ai-topic:hover { border-color: var(--ai-ink2); }
.ai-topic-ic { flex-shrink: 0; display: grid; place-items: center; width: 2rem; height: 2rem; border-radius: 0.5rem; background: var(--ai-soft); color: var(--ai-ink2); }
.ai-topic-txt { flex: 1 1 auto; min-width: 0; }
.ai-topic-nom { display: block; font-size: 0.8125rem; font-weight: 600; color: var(--text-1); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ai-topic-meta { display: block; margin-top: 0.1rem; font-size: 0.6875rem; color: var(--text-3); }
.ai-topic-go { flex-shrink: 0; color: var(--text-4); }
.ai-empty { margin-top: 1rem; font-size: 0.8125rem; color: var(--text-3); }

.ai-acts { display: flex; flex-wrap: wrap; gap: 0.625rem; margin-top: 1.25rem; }
.ai-btn-main, .ai-btn-ghost {
  display: inline-flex; align-items: center; gap: 0.45rem;
  height: 2.625rem; padding: 0 1.125rem; border-radius: 0.625rem;
  font-size: 0.875rem; font-weight: 600;
}
.ai-btn-main { background: var(--ai-ink2); color: #fff; }
.ai-btn-main:hover { filter: brightness(1.08); }
/* Qorong'ida `--ai-ink2` OCHADI (#a89bfa) — oq matn 2.4:1 beradi, shuning
   uchun matn to'q bo'ladi (ilovadagi `--primary-contrast` bilan bir mantiq). */
.dark .ai-btn-main, .dark .ai-chip-solid { color: #0b0e15; }
.ai-btn-ghost { background: var(--surface); border: 1px solid var(--border-1); color: var(--text-2); }
.ai-btn-ghost:hover { border-color: var(--ai-ink2); color: var(--ai-ink2); }

/* ── Xato mavzular jadvali ──────────────────────────────────────────── */
.miss { width: 100%; margin-top: 1rem; border-collapse: collapse; }
.miss th {
  padding-bottom: 0.5rem; text-align: left;
  font-size: 0.6875rem; font-weight: 600; color: var(--text-3);
  border-bottom: 1px solid var(--border-soft);
}
.miss td { padding: 0.625rem 0; border-bottom: 1px solid var(--divider); vertical-align: middle; }
.miss tr:last-child td { border-bottom: none; }
.mc-r { width: 2rem; }
.mc-b { width: 34%; padding-left: 0.75rem; padding-right: 0.75rem; }
.mc-q, .mc-a { width: 4.5rem; text-align: right; font-size: 0.8125rem; }
.miss th.mc-q, .miss th.mc-a { text-align: right; }

.rk {
  display: grid; place-items: center; width: 1.5rem; height: 1.5rem;
  border-radius: 0.375rem; font-size: 0.6875rem; font-weight: 700;
}
.rk-bad  { background: var(--danger-soft); color: var(--danger-ink); }
.rk-warn { background: var(--warn-soft);   color: var(--warn-ink); }
.rk-mid  { background: var(--warn-soft);   color: var(--warn-ink); }
.rk-ok   { background: var(--ok-soft2);    color: var(--ok-ink); }

.m-nom { display: block; font-size: 0.8125rem; color: var(--text-1); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 15rem; }

/* Chiziq: 4px yumaloq uch, asosga bog'langan; rang aniqlikdan (semantik
   issiqlik), aniq foiz esa yonida yozilgan — ma'no rang bilan cheklanmaydi */
.bar { display: block; height: 0.375rem; border-radius: 9999px; background: var(--surface-inset); overflow: hidden; }
.bar-in { display: block; height: 100%; border-radius: 4px; }
.b-bad  { background: var(--danger); }
.b-warn { background: #f97316; }
.b-mid  { background: var(--warn); }
.b-ok   { background: var(--ok-surface-2); }
.t-bad  { color: var(--danger-ink); }
.t-warn { color: #c2410c; }
.t-mid  { color: var(--warn-ink); }
.t-ok   { color: var(--ok-ink); }
.dark .t-warn { color: #fdba74; }

.miss-empty { margin-top: 1.25rem; font-size: 0.875rem; color: var(--text-3); }

/* ── Yangilanish qatori ─────────────────────────────────────────────── */
.upd {
  display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 0.75rem;
  margin-top: 1rem; padding: 0.75rem 1.25rem;
}
.upd-txt { display: inline-flex; align-items: center; gap: 0.4rem; font-size: 0.8125rem; color: var(--text-3); }
.upd-btn {
  display: inline-flex; align-items: center; gap: 0.4rem;
  height: 2.25rem; padding: 0 0.875rem; border-radius: 0.5rem;
  border: 1px solid var(--border-1); background: var(--surface);
  font-size: 0.8125rem; font-weight: 500; color: var(--text-2);
}
.upd-btn:hover:not(:disabled) { border-color: var(--primary); color: var(--primary-ink); }
.upd-btn:disabled { opacity: 0.6; }

/* ── Skelet ─────────────────────────────────────────────────────────── */
.skel-wrap { display: grid; gap: 1rem; margin-top: 1.75rem; }
.skel { border-radius: 1rem; background: var(--surface-soft); border: 1px solid var(--border-soft); animation: st-puls 1.4s ease-in-out infinite; }
.skel-kpi { height: 8rem; }
.skel-chart { height: 20rem; }
@keyframes st-puls { 0%, 100% { opacity: 1 } 50% { opacity: 0.55 } }
@media (prefers-reduced-motion: reduce) {
  .skel { animation: none; }
  .ready-bar span { transition: none; }
}

/* ── Mobil ───────────────────────────────────────────────────────────── */
@media (max-width: 767px) {
  .stats { padding-top: 3.75rem; }
  .page-title { font-size: 1.625rem; }
  .kpis { grid-template-columns: minmax(0, 1fr); }
  .kpi-spark { display: none; }
  .chart-card, .donut-card, .miss-card, .ai-card { padding: 1.125rem; }
  .segs { width: 100%; }
  .seg { flex: 1 1 auto; }
  .mc-b { display: none; }
  .m-nom { max-width: 10rem; }
  .ai-acts > * { flex: 1 1 100%; justify-content: center; }
}
</style>
