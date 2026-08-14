<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const route = useRoute()
const i18n = useI18n()
const attemptId = Number(route.params.attemptId)

const { data, status } = await useAsyncData(`result-${attemptId}`, () => apiFetch<any>(`/test/${attemptId}/result`))

const a = computed(() => data.value?.attempt)

/* ── Savol holati ────────────────────────────────────────────────────────
   DIQQAT: backend `is_skipped` ni AMALDA hech qachon `true` qilmaydi —
   80 yozuvli blits urinishida ham hammasi `false` bo'lib keladi (o'lchandi).
   Javob berilmaganini FAQAT `chosen_option_id = null` bildiradi; backenddagi
   `skipped_count` esa API'da ko'rsatilmaydigan `answered_at` dan hisoblanadi.
   Shuning uchun `is_skipped` ga suyanib bo'lmaydi, u faqat qo'shimcha belgi.  */
type Holat = 'togri' | 'xato' | 'javobsiz'
function holat(x: any): Holat {
  if (x.is_correct) return 'togri'
  if (!x.chosen_option_id || x.is_skipped) return 'javobsiz'
  return 'xato'
}

/**
 * BLITS ALOHIDA: 60 soniya tugagach yetib BORILMAGAN savollar ham `answers`
 * ichida keladi, lekin foydalanuvchi ularni ko'rmagan ham. Backend ularni
 * `total_questions` ga qo'shmaydi (`total = correct + wrong`), shuning uchun
 * ro'yxatdan ham chiqaramiz — aks holda sahifa o'ziga qarshi gapirardi:
 * xulosada "11 / 41", chipda esa "Barchasi 80" (o'lchandi).
 * Boshqa rejimlarda javobsiz savol — KO'RILGAN, lekin tashlab ketilgani,
 * ya'ni tahlilda kerak.
 */
const answers = computed<any[]>(() => {
  const xs: any[] = data.value?.answers || []
  return a.value?.mode === 'blitz' ? xs.filter(x => holat(x) !== 'javobsiz') : xs
})
const yuklanmoqda = computed(() => status.value === 'idle' || status.value === 'pending')

const HOLAT: Record<Holat, { soz: { uz: string, kr: string }, icon: string }> = {
  togri:    { soz: { uz: 'To\'g\'ri javob', kr: 'Тўғри жавоб' }, icon: 'check' },
  xato:     { soz: { uz: 'Xato javob', kr: 'Хато жавоб' }, icon: 'x' },
  javobsiz: { soz: { uz: 'Javob berilmagan', kr: 'Жавоб берилмаган' }, icon: 'circle' },
}

const sonlar = computed(() => {
  const s = { all: answers.value.length, togri: 0, xato: 0, javobsiz: 0 }
  for (const x of answers.value) s[holat(x)]++
  return s
})

/* ── Filtrlar ──────────────────────────────────────────────────────────── */
const filtr = ref<'all' | Holat>('all')
const chiplar = computed(() => [
  { id: 'all' as const, label: i18n.t({ uz: 'Barchasi', kr: 'Барчаси' }), son: sonlar.value.all },
  { id: 'togri' as const, label: i18n.t({ uz: 'To\'g\'ri', kr: 'Тўғри' }), son: sonlar.value.togri },
  { id: 'xato' as const, label: i18n.t({ uz: 'Xato', kr: 'Хато' }), son: sonlar.value.xato },
  { id: 'javobsiz' as const, label: i18n.t({ uz: 'Javobsiz', kr: 'Жавобсиз' }), son: sonlar.value.javobsiz },
])

/* Uzun testlar (marafon) uchun 20 talik oraliqlar. Maketda ham shu tanlagich
   bor; savol 20 ta bo'lsa bitta oraliq qoladi. */
const ORALIQ = 20
const oraliqlar = computed(() => {
  // `Math.max(1, ...)` EMAS: savol bo'lmasa (60 soniyada birorta ham javob
  // bermagan blits) yorliq "1–0 savollar" bo'lib chiqardi. Bo'sh massiv →
  // tanlagich umuman ko'rsatilmaydi.
  const n = Math.ceil(answers.value.length / ORALIQ)
  return Array.from({ length: n }, (_, i) => ({
    id: i,
    label: `${i * ORALIQ + 1}–${Math.min((i + 1) * ORALIQ, answers.value.length)} ${i18n.t({ uz: 'savollar', kr: 'саволлар' })}`,
  }))
})
const oraliq = ref(0)
watch(oraliqlar, (v) => { if (oraliq.value >= v.length) oraliq.value = 0 })

const korinadigan = computed(() => answers.value.filter((x, i) => {
  if (Math.floor(i / ORALIQ) !== oraliq.value) return false
  return filtr.value === 'all' || holat(x) === filtr.value
}))

/* ── Xulosa kartasi ────────────────────────────────────────────────────── */
const otdi = computed(() => !!a.value?.is_passed)
const foiz = computed(() => {
  if (!a.value?.total_questions) return 0
  return Math.round((a.value.correct_count / a.value.total_questions) * 100)
})
const ulush = (n: number) => a.value?.total_questions ? Math.round((n / a.value.total_questions) * 100) : 0

/* O'tish chegarasi backenddan keladi (rejimga qarab 90/80/100%). Bu yerda
   qotirib qo'yilsa, chegara o'zgarganda sayt yolg'on son ko'rsatardi. */
const chegara = computed(() => a.value?.pass_threshold_percent ?? 100)
/* Chegara o'ngga yaqin bo'lsa (imtihon 90%, bilet 100%) yorliq chiziqdan
   CHAPGA o'giriladi — aks holda kartadan chiqib ketardi. */
const chegaraChapda = computed(() => chegara.value > 60)

function vaqt(sek: number) {
  const m = Math.floor(sek / 60); const s = sek % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}
function vaqtSoz(sek: number) {
  const m = Math.floor(sek / 60); const s = sek % 60
  return `${m} ${i18n.t({ uz: 'daq', kr: 'дақ' })} ${s} ${i18n.t({ uz: 'son', kr: 'сон' })}`
}

const OYLAR = {
  uz: ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'],
  kr: ['январ', 'феврал', 'март', 'апрел', 'май', 'июн', 'июл', 'август', 'сентабр', 'октабр', 'ноябр', 'декабр'],
}
/* Sana FAQAT brauzerda hisoblanadi: "Bugun" serverning vaqt mintaqasiga
   bog'liq, ya'ni SSR va mijoz turli natija berib gidratsiya ogohlantirishiga
   olib kelardi. Oddiy `ref` EMAS, `computed`: aks holda til almashtirilganda
   "Bugun"/"Бугун" va oy nomi eski alifboda muzlab qolardi. */
const mijoz = ref(false)
function sanaMatn(iso: string) {
  const d = new Date(iso)
  const kun = (x: Date) => `${x.getFullYear()}-${x.getMonth()}-${x.getDate()}`
  const hozir = new Date()
  const kecha = new Date(hozir.getTime() - 86400000)
  const soat = `${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`
  if (kun(d) === kun(hozir)) return `${i18n.t({ uz: 'Bugun', kr: 'Бугун' })}, ${soat}`
  if (kun(d) === kun(kecha)) return `${i18n.t({ uz: 'Kecha', kr: 'Кеча' })}, ${soat}`
  const oy = i18n.locale.value === 'uz_cyrl' ? OYLAR.kr[d.getMonth()] : OYLAR.uz[d.getMonth()]
  return `${d.getDate()}-${oy}, ${soat}`
}
const sana = computed(() => (mijoz.value && a.value?.finished_at) ? sanaMatn(a.value.finished_at) : '')

const REJIM: Record<string, { uz: string, kr: string }> = {
  exam:     { uz: 'Imtihon rejimi', kr: 'Имтиҳон режими' },
  topic:    { uz: 'Mavzu', kr: 'Мавзу' },
  ticket:   { uz: 'Bilet', kr: 'Билет' },
  random:   { uz: 'Tasodifiy', kr: 'Тасодифий' },
  mistakes: { uz: 'Xatolar ustida ish', kr: 'Хатолар устида иш' },
  marathon: { uz: 'Marafon', kr: 'Марафон' },
  memorize: { uz: 'Yodlash', kr: 'Ёдлаш' },
  daily:    { uz: 'Kunlik challenge', kr: 'Кунлик челлендж' },
  blitz:    { uz: 'Blits · 60 soniya', kr: 'Блиц · 60 сония' },
}
const rejim = computed(() => a.value ? i18n.t(REJIM[a.value.mode] ?? { uz: a.value.mode, kr: a.value.mode }) : '')

function baho(p: number) {
  if (p >= 95) return i18n.t({ uz: 'A\'lo', kr: 'Аъло' })
  if (p >= 85) return i18n.t({ uz: 'Yaxshi', kr: 'Яхши' })
  if (p >= 70) return i18n.t({ uz: 'O\'rtacha', kr: 'Ўртача' })
  return i18n.t({ uz: 'Past', kr: 'Паст' })
}

const qaytaHavola = computed(() => {
  if (!a.value) return '/'
  const base = `/test/start/${a.value.mode}`
  if (a.value.mode === 'topic' && a.value.topic_id) return `${base}?topic_id=${a.value.topic_id}`
  if (a.value.mode === 'ticket' && a.value.ticket_id) return `${base}?ticket_id=${a.value.ticket_id}`
  return base
})

/* ── Javob variantlari ─────────────────────────────────────────────────── */
function harf(ans: any, id: number | null) {
  if (!id) return null
  const i = ans.question.options.findIndex((o: any) => o.id === id)
  return i >= 0 ? String.fromCharCode(65 + i) : null
}
const tanlanganHarf = (ans: any) => harf(ans, ans.chosen_option_id)
const togriHarf = (ans: any) => {
  const i = ans.question.options.findIndex((o: any) => o.is_correct)
  return i >= 0 ? String.fromCharCode(65 + i) : null
}
const togriMatn = (ans: any) => ans.question.options.find((o: any) => o.is_correct)?.text || '—'
/* Variant BORLIGINI tekshiramiz, matni bo'sh-yo'qligini emas: ilgari
   `?.text || 'Javob berilmagan'` edi va joriy tilda tarjimasi kiritilmagan
   variant tanlangan bo'lsa, javob bergan foydalanuvchiga "Javob berilmagan"
   deb yozilardi. */
const tanlanganMatn = (ans: any) => {
  const o = ans.question.options.find((x: any) => x.id === ans.chosen_option_id)
  if (o) return o.text || '—'
  return i18n.t({ uz: 'Javob berilmagan', kr: 'Жавоб берилмаган' })
}

/* ── AI izoh ───────────────────────────────────────────────────────────────
   Keshlangan izoh maketdagidek DARROV ko'rinadi. Izohi yo'q savolda esa
   `POST /questions/{id}/explain` TUGMASI YO'Q — ataylab. U endpoint hech nima
   generatsiya qilmaydi, faqat bazadagi izohni qaytaradi va
   `blank(uz) || blank(kr)` bo'lsa 404 `explanation_not_ready` beradi
   (QuestionController.php:39). Natija endpoint'i esa ikkala izohni allaqachon
   yuboradi, ya'ni tugma bosilganda YANGI hech nima kelmaydi — faqat 404.
   Izohlar admin panelidan to'planadi, shuning uchun izohi yo'q savolda
   rostini yozamiz.                                                          */

/** Joriy tildagi izoh; yo'q bo'lsa — ikkinchi tildagisi.
    `izohBor()` "yoki-yoki" tekshirgani uchun zaxira SHART: aks holda faqat
    lotincha izohi bor savol kirill rejimida BO'SH panel bo'lib chiqardi. */
function izoh(q: any): string {
  const kr = i18n.locale.value === 'uz_cyrl'
  return (kr ? (q.explanation_kr || q.explanation_uz) : (q.explanation_uz || q.explanation_kr)) || ''
}
function izohBor(q: any) {
  return !!izoh(q)
}

/* AI izoh — SUKUT BO'YICHA tugma. Bosilganda AI javob berayotgandek matn
   yozilib chiqadi. Izohlar natija bilan birga ALLAQACHON kelgan, ya'ni bu
   shunchaki lokal animatsiya — hech qanday so'rov yo'q (eski /explain
   endpoint'i o'lik edi: hech nima generatsiya qilmay 404 qaytarardi). */
const aiOchildi = ref<Record<number, boolean>>({})   // tugma bosildi
const aiFikr = ref<Record<number, boolean>>({})      // "o'ylanmoqda" fazasi
const aiYozilmoqda = ref<Record<number, boolean>>({}) // matn yozilyapti
const aiMatn = ref<Record<number, string>>({})       // hozir ko'rinayotgan qism
const aiTaymer: Record<number, ReturnType<typeof setTimeout>> = {}

function aiKorsat(q: any) {
  const id = q.id
  if (aiOchildi.value[id]) return
  aiOchildi.value[id] = true

  const toliq = izoh(q)
  if (!toliq) return   // izoh yo'q → panel "tayyor emas" ni ko'rsatadi

  const kamaytir = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  if (kamaytir) { aiMatn.value[id] = toliq; return }   // animatsiyasiz

  // Qisqa "o'ylanmoqda" fazasi — AI ishlayotgandek tuyulsin
  aiFikr.value[id] = true
  aiTaymer[id] = setTimeout(() => {
    aiFikr.value[id] = false
    aiYozilmoqda.value[id] = true
    aiMatn.value[id] = ''
    let i = 0
    const qadam = () => {
      i = Math.min(toliq.length, i + 3)
      aiMatn.value[id] = toliq.slice(0, i)
      if (i < toliq.length) aiTaymer[id] = setTimeout(qadam, 24)
      else aiYozilmoqda.value[id] = false
    }
    qadam()
  }, 550)
}

// Sahifadan chiqilganda ishlab turgan taymerlar setTimeout'ni bo'sh
// komponentga chaqirmasin.
onUnmounted(() => { for (const k in aiTaymer) clearTimeout(aiTaymer[k]) })

/* ── Ekran o'quvchi uchun e'lonlar ─────────────────────────────────────────
   Bitta DOIMIY live region. Matni bilan BIRGA paydo bo'ladigan
   `role="status"` bloki e'lon qilinmaydi — brauzer region'ni allaqachon
   matn bilan ko'radi va o'zgarish sanamaydi.                              */
const elon = ref('')
function elonQil(matn: string) {
  elon.value = ''
  nextTick(() => { elon.value = matn })
}

/* ── Shikoyat ──────────────────────────────────────────────────────────────
   Backend qismi hali yo'q (jadval ham, endpoint ham). Tugma maketdagidek
   turadi, lekin soxta "yuborildi" demaydi — rostini aytadi.               */
const shikoyat = ref<Record<number, boolean>>({})
function shikoyatBos(x: any) {
  shikoyat.value[x.question.id] = true
  elonQil(i18n.t({
    uz: 'Shikoyat funksiyasi hali ishga tushmagan.',
    kr: 'Шикоят функцияси ҳали ишга тушмаган.',
  }))
}

/* ── Savolga o'tish ────────────────────────────────────────────────────── */
function savolgaOt(pos: number) {
  const x = answers.value.find(v => v.position === pos)
  if (x && filtr.value !== 'all' && holat(x) !== filtr.value) filtr.value = 'all'
  nextTick(() => {
    const el = document.getElementById(`savol-${pos}`)
    if (!el) return
    // CSS `scroll-behavior` dan farqli, JS'dagi `behavior: 'smooth'` foydalanuvchi
    // "animatsiyani kamaytir" deb qo'yganini O'ZI hisobga olmaydi — qo'lda so'raymiz.
    const kamaytir = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    el.scrollIntoView({ behavior: kamaytir ? 'auto' : 'smooth', block: 'start' })
    // Faqat surish yetarli emas: klaviatura fokusi plitkada qolsa, keyingi Tab
    // xaritaga qaytarib yuboradi va ekran o'quvchi ham hech nima aytmaydi.
    el.focus({ preventScroll: true })
  })
}

/* ── Shu urinishda ochilgan yutuqlar (play sahifasidan uzatiladi) ──────── */
const yutuqlar = ref<any[]>([])
onMounted(() => {
  mijoz.value = true
  try {
    const raw = sessionStorage.getItem('testRewards:' + attemptId)
    if (raw) {
      yutuqlar.value = JSON.parse(raw)
      sessionStorage.removeItem('testRewards:' + attemptId)
    }
  }
  catch {}
  // Bosh sahifadagi ball va kunlik bepul test qoldig'ini yangilaymiz
  useAuthStore().fetchMe().catch(() => {})
})
</script>

<template>
  <div class="result mx-auto w-full max-w-[1800px] px-4 sm:px-6 lg:px-8 xl:px-10 pt-6 lg:pt-8 pb-16 md:pb-12">
    <!-- ── Yuqori qator ──────────────────────────────────────────────────
         Maketda o'ng tepada XP chip ham bor edi, lekin u yon menyuda
         ("XP darajangiz") allaqachon turibdi — biletlar sahifasidagi kabi
         takrorlanmasin uchun qo'yilmadi. -->
    <div class="topbar">
      <NuxtLink to="/" class="back-btn">
        <AppIcon name="arrow-left" :size="16" />
        {{ i18n.t({ uz: 'Bosh sahifaga qaytish', kr: 'Бош саҳифага қайтиш' }) }}
      </NuxtLink>
    </div>

    <!-- DOIMIY live region: `role="status"` bloki matni bilan BIRGA paydo
         bo'lsa e'lon qilinmaydi, shuning uchun region har doim DOM'da turadi
         va faqat ichidagi matn o'zgaradi. -->
    <p class="sr-only" role="status" aria-live="polite">{{ elon }}</p>

    <!-- Maketda ko'rinadigan sarlavha yo'q, lekin sahifada h1 bo'lishi shart:
         layoutda ham, sidebar'da ham h1 yo'q edi, ya'ni ekran o'quvchi
         sarlavha bo'yicha yura olmasdi. Shuning uchun `sr-only`. -->
    <h1 class="sr-only">
      {{ i18n.t({ uz: 'Test natijasi', kr: 'Тест натижаси' }) }}{{ a ? ' — ' + rejim : '' }}
    </h1>

    <!-- ── Yuklanmoqda ─────────────────────────────────────────────────── -->
    <div v-if="yuklanmoqda" class="skel-wrap">
      <div class="skel skel-hero" />
      <div class="skel skel-nav" />
      <div class="skel skel-q" />
      <span class="sr-only">{{ i18n.t({ uz: 'Natija yuklanmoqda…', kr: 'Натижа юкланмоқда…' }) }}</span>
    </div>

    <!-- ── Xato ────────────────────────────────────────────────────────── -->
    <div v-else-if="!a" class="panel-card empty">
      <p class="empty-text">{{ i18n.t({ uz: 'Natijani yuklab bo\'lmadi.', kr: 'Натижани юклаб бўлмади.' }) }}</p>
      <NuxtLink to="/" class="btn-ghost">{{ i18n.t({ uz: 'Bosh sahifa', kr: 'Бош саҳифа' }) }}</NuxtLink>
    </div>

    <template v-else>
      <!-- ── Xulosa kartasi ────────────────────────────────────────────── -->
      <section class="panel-card hero">
        <div class="hero-left">
          <!-- `hero-top` — MOBILDA ball va chiplar bitta qatorda turadi
               (ish stolida ular hozirgidek ustma-ust qoladi). -->
          <div class="hero-top">
            <div class="badges">
              <span class="verdict" :class="otdi ? 'v-ok' : 'v-fail'">
                <AppIcon :name="otdi ? 'check' : 'x'" :size="12" />
                {{ otdi ? i18n.t({ uz: 'O\'tildi', kr: 'Ўтилди' }) : i18n.t({ uz: 'O\'tilmadi', kr: 'Ўтилмади' }) }}
              </span>
              <span v-if="a.points_earned" class="pts" :class="a.points_earned > 0 ? 'p-plus' : 'p-minus'">
                <AppIcon :name="a.points_earned > 0 ? 'spark' : 'x'" :size="12" />
                {{ a.points_earned > 0 ? '+' : '' }}{{ a.points_earned }} XP
              </span>
            </div>

            <div class="score tabular-nums">
              <span class="score-n" :class="otdi ? 's-ok' : 's-fail'">{{ a.correct_count }}</span>
              <span class="score-d">/ {{ a.total_questions }}</span>
            </div>
          </div>

          <!-- Mobilda ikkisi BITTA qatorga qo'shiladi: `hero-date` inline
               bo'ladi va "O'tkazilgan sana:" yorlig'i yashiriladi (sana o'zi
               "Bugun, 17:06" ko'rinishida tushunarli). -->
          <!-- Vaqt SHU YERDA, alohida kartada emas: "0:19 / 25:00" ko'rinishi
               limitni ham beradi, ya'ni pastdagi "Vaqt" kartasi aynan takror
               bo'lib qolardi (o'sha karta olib tashlandi). -->
          <p class="hero-mode">
            {{ rejim }} <span class="dot">•</span>
            <span class="tabular-nums">{{ vaqt(a.time_spent_sec) }}<span v-if="a.time_limit_sec" class="hero-lim"> / {{ vaqt(a.time_limit_sec) }}</span></span>
          </p>
          <p class="hero-date">
            <span class="hero-date-lbl">{{ i18n.t({ uz: 'O\'tkazilgan sana:', kr: 'Ўтказилган сана:' }) }}</span>
            <span>{{ sana }}</span>
          </p>

          <div class="hero-acts">
            <NuxtLink :to="qaytaHavola" class="act act-primary">
              {{ i18n.t({ uz: 'Qayta urinish', kr: 'Қайта уриниш' }) }}
            </NuxtLink>
            <NuxtLink to="/test/start/mistakes" class="act act-ghost">
              <AppIcon name="wrench" :size="15" />
              {{ i18n.t({ uz: 'Xatolar ustida ishlash', kr: 'Хатолар устида ишлаш' }) }}
            </NuxtLink>
          </div>
        </div>

        <div class="hero-right">
          <div class="stats">
            <div class="stat">
              <div class="stat-top">
                <span class="stat-ic si-ok"><AppIcon name="target" :size="17" /></span>
                <span class="stat-lbl">{{ i18n.t({ uz: 'To\'g\'ri javoblar', kr: 'Тўғри жавоблар' }) }}</span>
              </div>
              <div class="stat-val tabular-nums">{{ a.correct_count }}</div>
              <div class="stat-sub tabular-nums">{{ ulush(a.correct_count) }}%</div>
            </div>

            <div class="stat">
              <div class="stat-top">
                <span class="stat-ic si-bad"><AppIcon name="x-circle" :size="17" /></span>
                <span class="stat-lbl">{{ i18n.t({ uz: 'Xato javoblar', kr: 'Хато жавоблар' }) }}</span>
              </div>
              <div class="stat-val tabular-nums">{{ a.wrong_count }}</div>
              <div class="stat-sub tabular-nums">{{ ulush(a.wrong_count) }}%</div>
            </div>

            <!-- "Vaqt" kartasi OLIB TASHLANDI: aynan shu ma'lumot sarlavha
                 ostidagi qatorda ("Imtihon rejimi • 0:19 / 25:00") bor. -->

            <!-- `stat-pct` — MOBILDA CHIQMAYDI: bu foiz sahifada uch joyda
                 takrorlanardi (to'g'ri javoblar kartasining ostida, shu yerda
                 va natija chizig'ida "Sizning natijangiz"). Tor ekranda uchtasi
                 ham ko'rinib turishi keraksiz. -->
            <div class="stat stat-pct">
              <div class="stat-top">
                <span class="stat-ic si-pct"><AppIcon name="percent" :size="17" /></span>
                <span class="stat-lbl">{{ i18n.t({ uz: 'Foiz ko\'rsatkichi', kr: 'Фоиз кўрсаткичи' }) }}</span>
              </div>
              <div class="stat-val tabular-nums">
                {{ foiz }}%
                <span class="stat-inline">{{ baho(foiz) }}</span>
              </div>
            </div>
          </div>

          <!-- Natija chizig'i + o'tish chegarasi markeri -->
          <div class="bar">
            <div class="bar-you">
              <div class="bar-lbl">{{ i18n.t({ uz: 'Sizning natijangiz', kr: 'Сизнинг натижангиз' }) }}</div>
              <div class="bar-val tabular-nums" :class="otdi ? 's-ok' : 's-fail'">{{ foiz }}%</div>
            </div>
            <div class="bar-goal" :class="{ 'g-left': chegaraChapda }" :style="{ left: chegara + '%' }">
              <div class="bar-lbl">{{ i18n.t({ uz: 'O\'tish chegarasi:', kr: 'Ўтиш чегараси:' }) }} {{ chegara }}%</div>
              <div class="bar-val tabular-nums">{{ chegara }}%</div>
            </div>
            <div class="bar-track">
              <div class="bar-fill" :class="otdi ? 'f-ok' : 'f-fail'" :style="{ width: Math.max(foiz, 1) + '%' }" />
            </div>
            <span class="bar-marker" :style="{ left: chegara + '%' }" aria-hidden="true" />
          </div>
        </div>
      </section>

      <!-- ── Yangi yutuqlar ────────────────────────────────────────────── -->
      <section v-if="yutuqlar.length" class="panel-card ach">
        <div class="ach-head">
          <AppIcon name="trophy" :size="16" />
          {{ i18n.t({ uz: 'Yangi yutuq qo\'lga kiritildi!', kr: 'Янги ютуқ қўлга киритилди!' }) }}
        </div>
        <div class="ach-list">
          <div v-for="y in yutuqlar" :key="y.id" class="ach-item">
            <IconTile :icon="y.icon" :tone="y.tone" :size="36" />
            <div>
              <div class="ach-title">{{ i18n.t(y.title) }}</div>
              <div class="ach-rew">+{{ y.reward }} XP</div>
            </div>
          </div>
        </div>
      </section>

      <!-- ── Kunlik / blits reytingi ───────────────────────────────────── -->
      <div v-if="a.mode === 'daily' || a.mode === 'blitz'" class="board">
        <ScoreLeaderboard
          v-if="a.mode === 'daily'"
          endpoint="/leaderboard/daily"
          :board-key="`daily-result-${attemptId}`"
          :title="{ uz: 'Bugungi challenge · TOP 10', kr: 'Бугунги челлендж · ТОП 10' }"
          :subtitle="{ uz: '20 savoldan nechta to\'g\'ri', kr: '20 саволдан нечта тўғри' }"
          icon="star" tone="violet"
        />
        <ScoreLeaderboard
          v-else
          endpoint="/leaderboard/blitz"
          :board-key="`blitz-result-${attemptId}`"
          :title="{ uz: 'Blits rekordlar · TOP 10', kr: 'Блиц рекордлар · ТОП 10' }"
          :subtitle="{ uz: '60 soniyada eng ko\'p to\'g\'ri', kr: '60 сонияда энг кўп тўғри' }"
          icon="bolt" tone="amber"
        />
      </div>

      <!-- ── Savollar xaritasi ─────────────────────────────────────────── -->
      <section class="panel-card nav-card">
        <div class="nav-head">
          <div class="nav-title-wrap">
            <h2 class="nav-title">{{ i18n.t({ uz: 'Savollar bo\'yicha natijalar', kr: 'Саволлар бўйича натижалар' }) }}</h2>
            <div class="legend">
              <span class="lg lg-ok"><AppIcon name="check" :size="12" />{{ i18n.t({ uz: 'To\'g\'ri', kr: 'Тўғри' }) }}</span>
              <span class="lg lg-bad"><AppIcon name="x" :size="12" />{{ i18n.t({ uz: 'Xato', kr: 'Хато' }) }}</span>
              <span class="lg lg-non"><AppIcon name="circle" :size="12" />{{ i18n.t({ uz: 'Javob berilmagan', kr: 'Жавоб берилмаган' }) }}</span>
            </div>
          </div>

          <div class="nav-tools">
            <div class="chips" role="group" :aria-label="i18n.t({ uz: 'Savollarni filtrlash', kr: 'Саволларни филтрлаш' })">
              <button
                v-for="c in chiplar" :key="c.id" type="button" class="chip"
                :class="[`chip-${c.id}`, { on: filtr === c.id }]"
                :aria-pressed="filtr === c.id"
                @click="filtr = c.id"
              >
                {{ c.label }}<span class="chip-n tabular-nums">{{ c.son }}</span>
              </button>
            </div>

            <!-- `> 1`: bitta variantli tanlov foydasiz — 20 savolli testda
                 "1–20 savollar" degan yagona qator chiqib turardi. -->
            <div v-if="oraliqlar.length > 1" class="range">
              <select v-model.number="oraliq" class="range-sel" :aria-label="i18n.t({ uz: 'Savollar oralig\'i', kr: 'Саволлар оралиғи' })">
                <option v-for="o in oraliqlar" :key="o.id" :value="o.id">{{ o.label }}</option>
              </select>
              <AppIcon name="chev-d" :size="15" class="range-ic" />
            </div>
          </div>
        </div>

        <div class="qgrid">
          <button
            v-for="x in korinadigan" :key="x.position" type="button"
            class="qtile" :class="`q-${holat(x)}`"
            :aria-label="`${i18n.t({ uz: 'Savol', kr: 'Савол' })} ${x.position} — ${i18n.t(HOLAT[holat(x)].soz)}`"
            @click="savolgaOt(x.position)"
          >
            <span class="qtile-n tabular-nums">{{ x.position }}</span>
            <!-- Ikonka mobilda chiqmaydi: u yerda plita 33px ga tushadi va
                 raqam bilan ikonka birga sig'maydi. Holat rang bilan
                 beriladi, matnli tavsif esa `aria-label` da va quyidagi
                 savol kartasida ("Savol 1 · Xato javob") turadi. -->
            <AppIcon :name="HOLAT[holat(x)].icon" :size="11" class="qtile-ic" />
          </button>
        </div>
        <p v-if="!korinadigan.length" class="qgrid-empty">
          {{ answers.length
            ? i18n.t({ uz: 'Bu filtr bo\'yicha savol yo\'q.', kr: 'Бу филтр бўйича савол йўқ.' })
            : i18n.t({ uz: 'Bu testda birorta savolga javob berilmagan.', kr: 'Бу тестда бирорта саволга жавоб берилмаган.' }) }}
        </p>
      </section>

      <!-- ── Savollar tahlili ──────────────────────────────────────────── -->
      <h2 v-if="korinadigan.length" class="sr-only">
        {{ i18n.t({ uz: 'Savollar tahlili', kr: 'Саволлар таҳлили' }) }}
      </h2>
      <!-- Har savol = IKKI ALOHIDA karta yonma-yon: chapda savol tahlili,
           o'ngda AI tushuntirish. `tabindex="-1"` — plitka bosilganda fokus
           shu qatorga ko'chadi. -->
      <div
        v-for="x in korinadigan" :id="`savol-${x.position}`" :key="x.position" tabindex="-1"
        class="qrow" :class="{ 'no-img': !x.question.image }"
        :aria-label="`${i18n.t({ uz: 'Savol', kr: 'Савол' })} ${x.position} — ${i18n.t(HOLAT[holat(x)].soz)}`"
      >
        <section class="panel-card qcard">
          <div class="qhead">
            <!-- Mobilda maketdagidek: chipda HOLAT IKONKASI, matnda esa
                 "Savol 1 · Xato javob". Ish stolida chipda raqam qoladi. -->
            <span class="qnum" :class="`n-${holat(x)}`">
              <span class="qnum-n">{{ x.position }}</span>
              <AppIcon :name="HOLAT[holat(x)].icon" :size="15" class="qnum-ic" />
            </span>
            <span class="qstat" :class="`t-${holat(x)}`">
              <span class="qstat-pre">{{ i18n.t({ uz: 'Savol', kr: 'Савол' }) }} {{ x.position }} · </span>{{ i18n.t(HOLAT[holat(x)].soz) }}
            </span>
            <button
              type="button" class="qflag"
              :aria-label="`${i18n.t({ uz: 'Shikoyat qilish', kr: 'Шикоят қилиш' })} — ${i18n.t({ uz: 'savol', kr: 'савол' })} ${x.position}`"
              @click="shikoyatBos(x)"
            >
              <AppIcon name="flag" :size="14" />
              {{ i18n.t({ uz: 'Shikoyat qilish', kr: 'Шикоят қилиш' }) }}
            </button>
          </div>

          <p v-if="shikoyat[x.question.id]" class="qflag-note">
            {{ i18n.t({
              uz: 'Shikoyat yuborish funksiyasi hali ishga tushmagan — tez orada qo\'shiladi.',
              kr: 'Шикоят юбориш функцияси ҳали ишга тушмаган — тез орада қўшилади.'
            }) }}
          </p>

          <h3 class="qtext">{{ x.question.text }}</h3>

          <div class="qbody">
            <!-- `alt=""` EMAS: yo'l harakati savolining butun vaziyati rasmda,
                 ya'ni u dekorativ emas. O'yin sahifasi ham shu nomni beradi. -->
            <div v-if="x.question.image" class="qimg-wrap">
              <img
                :src="x.question.image" class="qimg"
                :alt="i18n.t({ uz: 'Savol rasmi', kr: 'Савол расми' })"
                @error="onQuestionImageError"
              >
            </div>

            <div class="qans">
              <div class="ans-lbl">{{ i18n.t({ uz: 'Sizning javobingiz', kr: 'Сизнинг жавобингиз' }) }}</div>
              <!-- `ans-lbl-in` — MOBILDA yorliq blokning ICHIDA turadi
                   ("Sizning javobingiz: A · matn"), tashqaridagi alohida qator
                   esa yashiriladi. Tor ekranda har javob uchun ikkita qator
                   (yorliq + blok) keraksiz balandlik berardi. -->
              <div class="ans" :class="`a-${holat(x)}`">
                <span class="ans-lbl-in">{{ i18n.t({ uz: 'Sizning javobingiz:', kr: 'Сизнинг жавобингиз:' }) }}</span>
                <span v-if="tanlanganHarf(x)" class="ans-h">{{ tanlanganHarf(x) }}</span>
                <span class="ans-t">{{ tanlanganMatn(x) }}</span>
                <AppIcon :name="HOLAT[holat(x)].icon" :size="15" class="ans-ic" />
              </div>

              <div class="ans-lbl lbl-ok">{{ i18n.t({ uz: 'To\'g\'ri javob', kr: 'Тўғри жавоб' }) }}</div>
              <div class="ans a-togri">
                <span class="ans-lbl-in">{{ i18n.t({ uz: 'To\'g\'ri javob:', kr: 'Тўғри жавоб:' }) }}</span>
                <span class="ans-h">{{ togriHarf(x) }}</span>
                <span class="ans-t">{{ togriMatn(x) }}</span>
                <AppIcon name="check" :size="15" class="ans-ic" />
              </div>
            </div>
          </div>
        </section>

        <!-- ── Alohida AI tushuntirish kartasi ── -->
        <aside class="panel-card ai-card">
          <div class="ai-head">
            <AppIcon name="ai" :size="16" class="ai-ic" />
            <span class="ai-title">{{ i18n.t({ uz: 'AI tushuntirish', kr: 'AI тушунтириш' }) }}</span>
            <!-- Savol raqami — MOBILDA muhim: u yerda AI karta savol
                 kartasining OSTIDA turadi va qaysi savolga tegishli ekani
                 bilinmasdi. Ish stolida yonma-yon turgani uchun chiqmaydi. -->
            <span class="ai-qnum tabular-nums" aria-hidden="true">{{ x.position }}</span>
            <span class="sr-only">{{ i18n.t({ uz: 'savol', kr: 'савол' }) }} {{ x.position }}</span>
          </div>

          <!-- Izohi yo'q savol -->
          <p v-if="!izohBor(x.question)" class="ai-none">
            {{ i18n.t({
              uz: 'Bu savol uchun izoh hozircha tayyor emas.',
              kr: 'Бу савол учун изоҳ ҳозирча тайёр эмас.'
            }) }}
          </p>

          <!-- Hali bosilmagan: tushuntirishni chiqarish tugmasi -->
          <button
            v-else-if="!aiOchildi[x.question.id]" type="button" class="ai-btn"
            @click="aiKorsat(x.question)"
          >
            <AppIcon name="ai" :size="15" />
            <!-- Mobilda tugma yolg'iz turadi (sarlavha yashiriladi), shuning
                 uchun unda "AI" so'zi bo'lishi kerak — aks holda nima
                 tushuntirilishi noaniq qolardi. -->
            <span class="ai-btn-m">{{ i18n.t({ uz: 'AI tushuntirish', kr: 'AI тушунтириш' }) }}</span>
            <span class="ai-btn-d">{{ i18n.t({ uz: 'Tushuntirib berish', kr: 'Тушунтириб бериш' }) }}</span>
          </button>

          <!-- Bosilgan: AI javob berayotgandek yozib chiqadi -->
          <template v-else>
            <div v-if="aiFikr[x.question.id]" class="ai-fikr" role="status">
              <span class="ai-dots"><i /><i /><i /></span>
              {{ i18n.t({ uz: 'AI o\'ylanmoqda…', kr: 'AI ўйланмоқда…' }) }}
            </div>
            <p v-else class="ai-text">{{
              aiYozilmoqda[x.question.id] ? aiMatn[x.question.id] : izoh(x.question)
            }}<span v-if="aiYozilmoqda[x.question.id]" class="ai-caret" /></p>
          </template>
        </aside>
      </div>
    </template>
  </div>
</template>

<style scoped>
/* ── Sahifaga xos tokenlar ────────────────────────────────────────────────
   `--ok-soft` global to'plamda yo'q (faqat --danger-soft/--warn-soft bor),
   AI paneli rangi ham shu sahifada birinchi marta kerak bo'ldi. Qorong'i
   rejimda to'ldirishlar SHAFFOF: to'q sirt ustida qattiq rang "yamoq"
   bo'lib ko'rinadi.                                                       */
.result {
  --ok-soft:   #d1fae5;
  --ai-bg:     #eef2ff;
  --ai-border: rgba(99, 102, 241, 0.20);
  --ai-ink:    #3730a3;
  --ai-accent: #4f46e5;
}
/* `.dark` <html> da turadi (useTheme.ts documentElement ga qo'yadi), ya'ni
   bu ajdod selektori — scoped CSS uni bemalol ko'radi. */
.dark .result {
  --ok-soft:   rgba(16, 185, 129, 0.16);
  --ai-bg:     rgba(99, 102, 241, 0.12);
  --ai-border: rgba(129, 140, 248, 0.30);
  --ai-ink:    #c7d2fe;
  --ai-accent: #a5b4fc;
}

.panel-card {
  background: var(--surface);
  border: 1px solid var(--border-1);
  border-radius: 1rem;
  box-shadow: var(--shadow-card);
}

/* ── Yuqori qator ────────────────────────────────────────────────────── */
.topbar { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-bottom: 1.25rem; }
.back-btn {
  display: inline-flex; align-items: center; gap: 0.5rem;
  height: 2.5rem; padding: 0 1rem;
  border-radius: 0.625rem;
  border: 1px solid var(--border-1); background: var(--surface);
  font-size: 0.875rem; font-weight: 600; color: var(--text-2);
  box-shadow: var(--shadow-soft);
  transition: border-color 0.15s, color 0.15s;
}
.back-btn:hover { border-color: var(--primary); color: var(--primary-ink); }

/* ── Yuklanish skeleti ───────────────────────────────────────────────── */
.skel-wrap { display: grid; gap: 1rem; }
.skel { border-radius: 1rem; background: var(--surface-soft); border: 1px solid var(--border-soft); animation: puls 1.4s ease-in-out infinite; }
.skel-hero { height: 15rem; }
.skel-nav  { height: 12rem; }
.skel-q    { height: 18rem; }
@keyframes puls { 0%, 100% { opacity: 1 } 50% { opacity: 0.55 } }
@media (prefers-reduced-motion: reduce) { .skel { animation: none } }

.empty { padding: 3rem 1.5rem; text-align: center; }
.empty-text { font-size: 0.9375rem; color: var(--text-3); margin-bottom: 1rem; }

/* ── Xulosa kartasi ──────────────────────────────────────────────────── */
.hero {
  display: grid; gap: 1.5rem; padding: 1.5rem;
  grid-template-columns: minmax(0, 1fr);
  margin-bottom: 1rem;
}
@media (min-width: 1100px) {
  .hero { grid-template-columns: minmax(17rem, 0.42fr) minmax(0, 1fr); gap: 2rem; }
}

.badges { display: flex; flex-wrap: wrap; gap: 0.5rem; }
.verdict, .pts {
  display: inline-flex; align-items: center; gap: 0.35rem;
  height: 1.75rem; padding: 0 0.7rem;
  border-radius: 9999px;
  font-size: 0.6875rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase;
}
.v-ok   { background: var(--ok-soft);     color: var(--ok-ink); }
.v-fail { background: var(--danger-soft); color: var(--danger-ink); }
.p-plus  { background: var(--warn-soft);   color: var(--warn-ink); }
.p-minus { background: var(--danger-soft); color: var(--danger-ink); }

.score { margin-top: 0.75rem; display: flex; align-items: baseline; gap: 0.4rem; letter-spacing: -0.03em; }
.score-n { font-size: 3.25rem; font-weight: 700; line-height: 1; }
.score-d { font-size: 2.5rem; font-weight: 700; line-height: 1; color: var(--text-1); }
.s-ok   { color: var(--ok-ink); }
.s-fail { color: var(--danger-ink); }

.hero-mode { margin-top: 0.6rem; font-size: 0.875rem; color: var(--text-3); }
/* Vaqt limiti — asosiy qiymatdan susroq (u faqat kontekst beradi) */
.hero-lim { color: var(--text-4); }
/* `margin-right` SHART: `<span class="dot">•</span>` dan keyingi element
   bilan orasidagi yangi qatorli bo'shliqni Vue kompilyatori olib tashlaydi
   va "rejimi •0:01" bo'lib qolardi. */
.dot { color: var(--text-muted); margin-right: 0.25em; }
.hero-date { margin-top: 0.2rem; font-size: 0.8125rem; color: var(--text-3); min-height: 1.2em; }
/* Bo'shliq CSS bilan: Vue shablon kompilyatori ikki element orasidagi
   yangi qatorli bo'shliqni olib tashlaydi va "sana:Bugun" bo'lib qolardi.
   Mobilda yorliq `display: none` bo'lgani uchun margin ham yo'qoladi. */
.hero-date-lbl { margin-right: 0.25em; }

.hero-acts { display: flex; flex-wrap: wrap; gap: 0.625rem; margin-top: 1.25rem; }
.act {
  display: inline-flex; align-items: center; justify-content: center; gap: 0.45rem;
  height: 2.75rem; padding: 0 1.25rem;
  border-radius: 0.625rem;
  font-size: 0.9375rem; font-weight: 600;
  transition: background 0.15s, border-color 0.15s;
}
/* `--primary` EMAS, `--primary-strong`: #4f6ef0 oq matn ostida 4.36:1 beradi
   (AA 4.5:1 dan past), #3f5ad8 esa 5.72:1 — ko'rinishi maketdagi ko'k bilan
   deyarli bir xil. */
.act-primary { background: var(--primary-strong); color: var(--primary-contrast); }
.act-primary:hover { background: var(--primary); }
.act-ghost { border: 1px solid var(--border-1); background: var(--surface); color: var(--text-2); }
.act-ghost:hover { border-color: var(--primary); color: var(--primary-ink); }

/* ── Statistika plitalari ────────────────────────────────────────────── */
.hero-right { container-type: inline-size; }
/* `@container` — `@media` DERAZANI o'lchaydi va yon menyu (~280px) ni
   hisobga olmaydi, ya'ni plitalar noto'g'ri kenglikda sinardi. */
.stats { display: grid; gap: 0.75rem; grid-template-columns: repeat(2, minmax(0, 1fr)); }
/* 3 ta karta: To'g'ri, Xato, Foiz ("Vaqt" sarlavha qatoriga ko'chdi) */
@container (min-width: 40rem) { .stats { grid-template-columns: repeat(3, minmax(0, 1fr)); } }

.stat { padding: 0.875rem; border: 1px solid var(--border-1); border-radius: 0.75rem; background: var(--surface); }
.stat-top { display: flex; align-items: center; gap: 0.55rem; }
.stat-ic { flex-shrink: 0; display: grid; place-items: center; width: 2.125rem; height: 2.125rem; border-radius: 0.625rem; }
.si-ok   { background: var(--ok-soft);      color: var(--ok-ink); }
.si-bad  { background: var(--danger-soft);  color: var(--danger-ink); }
.si-time { background: var(--primary-soft); color: var(--primary-ink); }
.si-pct  { background: var(--ai-bg);        color: var(--ai-accent); }
.stat-lbl { font-size: 0.8125rem; color: var(--text-3); line-height: 1.25; }
.stat-val { margin-top: 0.7rem; font-size: 1.375rem; font-weight: 700; color: var(--text-1); letter-spacing: -0.02em; }
.stat-inline { margin-left: 0.3rem; font-size: 0.875rem; font-weight: 500; color: var(--text-3); }
.stat-sub { margin-top: 0.1rem; font-size: 0.8125rem; color: var(--text-3); }

/* ── Natija chizig'i ─────────────────────────────────────────────────── */
.bar { position: relative; margin-top: 1.5rem; padding-top: 2.75rem; }
.bar-you { position: absolute; left: 0; top: 0; }
.bar-goal { position: absolute; top: 0; padding-left: 0.6rem; white-space: nowrap; }
/* Chegara o'ngda bo'lsa (90–100%) yorliq chiziqning chap tomoniga o'tadi */
.bar-goal.g-left { transform: translateX(-100%); padding-left: 0; padding-right: 0.6rem; text-align: right; }
.bar-lbl { font-size: 0.75rem; color: var(--text-3); }
.bar-val { margin-top: 0.1rem; font-size: 0.875rem; font-weight: 700; color: var(--text-2); }
/* `.bar-val` va `.s-ok` bir xil xususiyatga ega (0,2,0), lekin `.bar-val`
   keyin turgani uchun u g'olib chiqib, "Sizning natijangiz" foizi hech qachon
   qizil/yashil bo'lmasdi. Birlashtirilgan selektor (0,3,0) — aniq. */
.bar-val.s-ok   { color: var(--ok-ink); }
.bar-val.s-fail { color: var(--danger-ink); }

.bar-track { height: 0.5rem; border-radius: 9999px; background: var(--surface-inset); overflow: hidden; }
.bar-fill { height: 100%; border-radius: 9999px; transition: width 0.5s ease; }
.f-ok   { background: var(--ok-surface-2); }
.f-fail { background: var(--danger); }
.bar-marker { position: absolute; top: 0; bottom: 0; border-left: 1px dashed var(--text-4); }

/* ── Yutuqlar ────────────────────────────────────────────────────────── */
.ach { padding: 1.25rem; margin-bottom: 1rem; background: var(--warn-soft); border-color: var(--warn); }
.ach-head { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; font-weight: 700; color: var(--warn-ink); margin-bottom: 0.75rem; }
.ach-list { display: flex; flex-wrap: wrap; gap: 0.75rem; }
.ach-item { display: flex; align-items: center; gap: 0.625rem; padding: 0.5rem 0.75rem; border-radius: 0.75rem; background: var(--surface); border: 1px solid var(--border-1); }
.ach-title { font-size: 0.875rem; font-weight: 600; color: var(--text-1); }
.ach-rew { font-size: 0.75rem; font-weight: 700; color: var(--warn-ink); }

.board { margin-bottom: 1rem; }

/* ── Savollar xaritasi ───────────────────────────────────────────────── */
.nav-card { padding: 1.5rem; margin-bottom: 1rem; }
.nav-head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 1rem; margin-bottom: 1.25rem; }
.nav-title-wrap { display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem 1rem; min-width: 0; }
.nav-title { font-size: 1rem; font-weight: 600; color: var(--text-1); }
.legend { display: flex; flex-wrap: wrap; gap: 0.75rem; }
.lg { display: inline-flex; align-items: center; gap: 0.3rem; font-size: 0.8125rem; color: var(--text-3); }
.lg-ok  { color: var(--ok-ink); }
.lg-bad { color: var(--danger-ink); }
.lg-non { color: var(--text-3); }

.nav-tools { display: flex; flex-wrap: wrap; align-items: center; gap: 0.625rem; }
.chips { display: flex; flex-wrap: wrap; gap: 0.375rem; }
.chip {
  display: inline-flex; align-items: center; gap: 0.4rem;
  /* 2.125rem (34px) mobil bosish nishoni chegarasidan past edi → 36px */
  height: 2.25rem; padding: 0 0.75rem;
  border-radius: 0.5rem; border: 1px solid transparent;
  font-size: 0.8125rem; font-weight: 600; color: var(--text-3);
  transition: background 0.15s, border-color 0.15s, color 0.15s;
}
.chip:hover { background: var(--surface-hover); }
.chip.on { background: var(--surface); border-color: var(--primary); color: var(--primary-ink); box-shadow: var(--shadow-soft); }
.chip-n {
  display: inline-grid; place-items: center; min-width: 1.375rem; height: 1.25rem; padding: 0 0.3rem;
  border-radius: 0.375rem; background: var(--surface-inset);
  font-size: 0.75rem; font-weight: 700; color: var(--text-3);
}
.chip-togri .chip-n    { background: var(--ok-soft);     color: var(--ok-ink); }
.chip-xato .chip-n     { background: var(--danger-soft); color: var(--danger-ink); }
.chip.on .chip-n       { background: var(--primary-soft); color: var(--primary-ink); }
.chip-xato             { color: var(--danger-ink); }

.range { position: relative; }
.range-sel {
  appearance: none; -webkit-appearance: none;
  /* `.chip` bilan bir xil balandlik (36px) — bir qatorda turadi */
  height: 2.25rem; padding: 0 2rem 0 0.75rem;
  border-radius: 0.5rem; border: 1px solid var(--border-1); background: var(--surface);
  font-size: 0.8125rem; font-weight: 600; color: var(--text-2); cursor: pointer;
}
.range-ic { position: absolute; right: 0.6rem; top: 50%; transform: translateY(-50%); color: var(--text-4); pointer-events: none; }

/* 20 ustun — 19 ta oraliq x 0.5rem = 9.5rem. `100%` KONTEYNERga nisbatan
   hisoblanadi, shuning uchun yon menyu kengligi ahamiyatsiz. */
.qgrid { display: grid; gap: 0.5rem; grid-template-columns: repeat(auto-fill, minmax(max(2.75rem, (100% - 9.5rem) / 20), 1fr)); }
.qtile {
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.15rem;
  height: 3.5rem; border-radius: 0.625rem; border: 1px solid;
  font-weight: 600; transition: transform 0.12s, box-shadow 0.12s;
}
.qtile:hover { transform: translateY(-1px); box-shadow: var(--shadow-card); }
.qtile-n { font-size: 0.875rem; }
.q-togri    { background: var(--ok-soft);     border-color: var(--ok);      color: var(--ok-ink); }
.q-xato     { background: var(--danger-soft); border-color: var(--danger);  color: var(--danger-ink); }
.q-javobsiz { background: var(--surface);     border-color: var(--border-1); color: var(--text-3); }
.qgrid-empty { font-size: 0.875rem; color: var(--text-3); }

/* ── Savol qatori: savol kartasi | AI kartasi ──────────────────────────────
   `.result` konteyner qilinadi (@container derazani emas, KONTENT kengligini
   o'lchaydi — yon menyu kengligi ahamiyatsiz). */
.result { container-type: inline-size; }
.qrow {
  display: grid; gap: 1rem; margin-bottom: 1rem;
  grid-template-columns: minmax(0, 1fr);
  align-items: start; scroll-margin-top: 1rem;
}
@container (min-width: 60rem) {
  /* Chapda savol (kengroq), o'ngda AI tushuntirish kartasi */
  .qrow { grid-template-columns: minmax(0, 1.45fr) minmax(0, 1fr); }
}
/* `tabindex="-1"` tufayli sichqoncha bilan bosilganda ham fokus keladi —
   halqa faqat klaviatura bilan kelganda ko'rinsin. */
.qrow:focus { outline: none; }
.qrow:focus-visible { outline: 2px solid var(--primary); outline-offset: 3px; border-radius: 1.25rem; }

/* ── Savol kartasi ───────────────────────────────────────────────────── */
.qcard { padding: 1.5rem; container-type: inline-size; }
.qhead { display: flex; align-items: center; gap: 0.625rem; }
.qnum {
  flex-shrink: 0; display: grid; place-items: center;
  width: 2rem; height: 2rem; border-radius: 0.5rem;
  font-size: 0.875rem; font-weight: 700;
}
.n-togri    { background: var(--ok-soft);     color: var(--ok-ink); }
.n-xato     { background: var(--danger-soft); color: var(--danger-ink); }
.n-javobsiz { background: var(--surface-inset); color: var(--text-3); }
/* Ikonka va "Savol N ·" faqat mobilda (pastdagi media blokida yoqiladi).
   `!important` — AppIcon `display` ni inline style bilan beradi. */
.qnum-ic { display: none !important; }
.qstat-pre { display: none; }
.qstat { font-size: 0.9375rem; font-weight: 600; }
.t-togri    { color: var(--ok-ink); }
.t-xato     { color: var(--danger-ink); }
.t-javobsiz { color: var(--text-3); }
.qflag {
  margin-left: auto; flex-shrink: 0;
  display: inline-flex; align-items: center; gap: 0.4rem;
  /* 2.125rem (34px) mobil bosish nishoni chegarasidan past edi → 36px */
  height: 2.25rem; padding: 0 0.75rem;
  border-radius: 0.5rem; border: 1px solid var(--border-1); background: var(--surface);
  font-size: 0.8125rem; font-weight: 500; color: var(--text-3);
  transition: border-color 0.15s, color 0.15s;
}
.qflag:hover { border-color: var(--danger); color: var(--danger-ink); }
.qflag-note { margin-top: 0.625rem; font-size: 0.8125rem; color: var(--text-3); }

.qtext { margin-top: 1rem; font-size: 1rem; font-weight: 600; line-height: 1.5; color: var(--text-1); }

/* Savol kartasi ichida: rasm | javoblar. AI endi ALOHIDA kartada.
   Ostona past (30rem) — savol kartasi qatorda torroq bo'lgani uchun ham
   rasm va javoblar yonma-yon qolsin. */
.qbody { display: grid; gap: 1.25rem; margin-top: 1rem; grid-template-columns: minmax(0, 1fr); }
@container (min-width: 30rem) {
  .qbody { grid-template-columns: minmax(0, 0.95fr) minmax(0, 1fr); }
  .no-img .qbody { grid-template-columns: minmax(0, 1fr); }
}

.qimg-wrap { min-width: 0; }
/* `max-height` shart: `object-fit: contain` element o'lchamini CHEKLAMAYDI,
   faqat uning ichidagi rasmni joylaydi. Bo'yiga uzun savol rasmi (masalan
   4:5) balandlikni belgilamasa kartani cho'zib yuborardi. */
.qimg {
  width: 100%; max-height: 17rem;
  border-radius: 0.75rem; border: 1px solid var(--border-1);
  object-fit: contain; background: var(--surface-soft);
}

.qans { min-width: 0; }
.ans-lbl { font-size: 0.8125rem; color: var(--text-3); margin-bottom: 0.4rem; }
/* Blok ichidagi yorliq faqat mobilda chiqadi (pastdagi media blokida) */
.ans-lbl-in { display: none; }
.ans-lbl.lbl-ok { color: var(--ok-ink); margin-top: 0.875rem; }
.ans {
  display: flex; align-items: center; gap: 0.5rem;
  padding: 0.625rem 0.75rem; border-radius: 0.625rem; border: 1px solid;
  font-size: 0.875rem; line-height: 1.4;
}
.a-togri    { background: var(--ok-soft);      border-color: var(--ok);       color: var(--ok-ink); }
.a-xato     { background: var(--danger-soft);  border-color: var(--danger);   color: var(--danger-ink); }
.a-javobsiz { background: var(--surface-soft); border-color: var(--border-1); color: var(--text-3); }
.ans-h {
  flex-shrink: 0; display: grid; place-items: center;
  width: 1.375rem; height: 1.375rem; border-radius: 0.375rem;
  background: rgba(255, 255, 255, 0.55);
  font-size: 0.75rem; font-weight: 700;
}
.dark .ans-h { background: rgba(255, 255, 255, 0.10); }
.ans-t { flex: 1 1 auto; min-width: 0; }
.ans-ic { flex-shrink: 0; }

/* ── AI tushuntirish kartasi (alohida) ─────────────────────────────────────
   Savol kartasining o'ng yonida turadigan mustaqil karta. Yengil lavanda
   fonli — AI'ligi bir qarashda bilinadi. Bosilganda matn yozilib chiqadi. */
.ai-card {
  padding: 1.25rem 1.5rem;
  background: var(--ai-bg); border-color: var(--ai-border);
}
.ai-head { display: flex; align-items: center; gap: 0.45rem; font-size: 0.9375rem; font-weight: 600; color: var(--ai-accent); margin-bottom: 0.75rem; }
.ai-ic { flex-shrink: 0; }
.ai-title { flex: 1 1 auto; }
/* Savol raqami — faqat mobilda (pastdagi media blokida yoqiladi) */
.ai-qnum {
  display: none;
  flex-shrink: 0;
  min-width: 1.5rem; height: 1.5rem; padding: 0 0.35rem;
  border-radius: 0.4rem;
  background: var(--surface); border: 1px solid var(--ai-border);
  font-size: 0.75rem; font-weight: 700; line-height: 1.4rem; text-align: center;
  color: var(--ai-accent);
}

.ai-btn {
  display: inline-flex; align-items: center; gap: 0.45rem;
  padding: 0.6rem 0.9rem;
  /* `sal qirraliroq` — burchaklari o'tkirroq (0.375rem) */
  border-radius: 0.375rem; border: 1px solid var(--ai-border); background: var(--surface);
  font-size: 0.8438rem; font-weight: 600; color: var(--ai-accent);
  transition: background 0.15s, border-color 0.15s;
}
.ai-btn:hover { border-color: var(--ai-accent); }
/* Tugma matni: mobil variant faqat media blokida yoqiladi */
.ai-btn-m { display: none; }

.ai-text { font-size: 0.875rem; line-height: 1.75; color: var(--ai-ink); white-space: pre-line; }
.ai-none { font-size: 0.875rem; line-height: 1.6; color: var(--text-3); }

/* Yozilyapti — miltillovchi kursor */
.ai-caret {
  display: inline-block; width: 2px; height: 0.9em; margin-left: 2px;
  background: var(--ai-accent); vertical-align: middle;
  animation: aiYonish 1s steps(2) infinite;
}
@keyframes aiYonish { 0%, 100% { opacity: 1 } 50% { opacity: 0 } }

/* "O'ylanmoqda" — sakrab turadigan uch nuqta */
.ai-fikr { display: flex; align-items: center; gap: 0.5rem; font-size: 0.8438rem; color: var(--ai-accent); }
.ai-dots { display: inline-flex; gap: 0.2rem; }
.ai-dots i { width: 0.35rem; height: 0.35rem; border-radius: 9999px; background: var(--ai-accent); animation: aiSakra 0.9s infinite; }
.ai-dots i:nth-child(2) { animation-delay: 0.15s; }
.ai-dots i:nth-child(3) { animation-delay: 0.3s; }
@keyframes aiSakra { 0%, 60%, 100% { transform: translateY(0) } 30% { transform: translateY(-0.25rem) } }

@media (prefers-reduced-motion: reduce) {
  .ai-caret, .ai-dots i { animation: none; }
}

@media (prefers-reduced-motion: reduce) {
  /* Chiziq kengligining animatsiyasi ham harakat — o'chiriladi */
  .bar-fill { transition: none; }
  .qtile { transition: none; }
}

/* ── Mobil ───────────────────────────────────────────────────────────────
   Tor ekranda sahifa haddan tashqari baland edi: sarlavha 44px, statistika
   kartalari 4 ta va baland, ustiga bir xil ma'lumot bir necha joyda
   takrorlanardi. Bu blok ixchamlashtiradi va takrorlarni yashiradi. */
@media (max-width: 767px) {
  /* "Bosh sahifaga qaytish" suzuvchi hamburger (40px + 12px chet) YONIDA
     turadi, OSTIDA emas — ilgari `padding-top: 3.75rem` bilan 60px sof
     bo'sh joy ketardi. O'ngdan ham joy: bildirishnoma qo'ng'irog'i bor. */
  .result { padding-top: 0.875rem; }
  .topbar { padding-left: 3.25rem; padding-right: 3rem; }
  /* Tugma emas, HAVOLA ko'rinishi: ramka va fon yo'q */
  .back-btn {
    height: auto; padding: 0.5rem 0; border: 0; background: none;
    box-shadow: none; font-weight: 500;
  }

  /* "O'TILMADI · -5 XP" va "3 / 20" BITTA QATORDA */
  .hero-top { display: flex; align-items: center; gap: 0.625rem; flex-wrap: wrap; }
  .hero-top .badges { order: 2; gap: 0.375rem; }
  .hero-top .score { order: 1; margin: 0; }

  .hero, .nav-card, .qcard, .ai-card { padding: 1.125rem; }
  /* Suzuvchi menyu tugmasi savol qatorining sarlavhasini bosib qolmasin —
     plitka bosilganda qator shundan pastda to'xtaydi. */
  .qrow { scroll-margin-top: 4rem; }

  /* Sarlavha: 44/34 juda katta edi */
  .score-n { font-size: 2.125rem; }
  .score-d { font-size: 1.5rem; }

  /* Rejim va sana bitta qatorda — ikki qator o'rniga bitta */
  .hero-mode, .hero-date { display: inline; font-size: 0.8125rem; }
  .hero-date { min-height: 0; }
  .hero-date-lbl { display: none; }
  .hero-date::before { content: ' • '; color: var(--text-muted); }

  /* Ikki tugma sig'sa BIR QATORDA (ilgari `flex: 1 1 100%` bilan har biri
     alohida qator olardi). `flex-wrap: wrap` saqlangani uchun sig'masa
     o'zi ikki qatorga tushadi — matn qirqilmaydi. */
  .hero-acts { gap: 0.5rem; margin-top: 1rem; }
  .hero-acts .act {
    flex: 1 1 auto; height: 2.5rem; padding: 0 0.875rem;
    font-size: 0.875rem; white-space: nowrap;
  }

  /* Statistika kartalari ixcham: ikonka 34→28, padding va shriftlar kichik */
  .stats { gap: 0.5rem; }
  .stat { padding: 0.7rem; }
  .stat-ic { width: 1.75rem; height: 1.75rem; border-radius: 0.5rem; }
  .stat-lbl { font-size: 0.75rem; }
  /* Asosiy son — kartadagi eng muhim narsa, kattaroq bo'lsin */
  .stat-val { margin-top: 0.5rem; font-size: 1.625rem; }
  .stat-inline { font-size: 0.75rem; }
  /* Foiz TAKRORI: `stat-sub` (to'g'ri/xato ulushi) va butun `stat-pct`
     kartasi olib tashlanadi — foiz natija chizig'ida allaqachon bor.
     Vaqt kartasi bo'shab qolgan ustunni to'ldiradi. */
  .stat-sub { display: none; }
  .stat-pct { display: none; }

  /* `padding-top` yorliq + qiymat uchun joy: 2.25rem (36px) da "15%" progress
     chizig'iga TEGIB turardi (yorliq 17px + qiymat 20px = 37px, o'lchandi).
     2.75rem (44px) bilan 7px havo qoladi. */
  .bar { margin-top: 1.125rem; padding-top: 2.75rem; }

  /* ── Savol plitalari: ixcham panel ──
     3.5rem balandlik + ikonka juda katta joy olardi. Endi 2.25rem, ikonkasiz,
     shuning uchun bir ekranda 20 savol ikki qatorga sig'adi. Ustunlar soni
     qat'iy emas: 375px da 8 ta, 430px da 9 ta chiqadi. */
  .qgrid { gap: 0.375rem; grid-template-columns: repeat(auto-fill, minmax(2rem, 1fr)); }
  .qtile { height: 2.25rem; border-radius: 0.5rem; gap: 0; }
  .qtile-n { font-size: 0.8125rem; }
  /* `!important` SHART: AppIcon o'z ildiziga `display: inline-block` ni
     INLINE style bilan beradi va oddiy klass qoidasi uni yenga olmaydi. */
  .qtile-ic { display: none !important; }

  /* ── Javob bloklari: yorliq blok ICHIDA ──
     "Sizning javobingiz: A · matn" bitta blokda. Tashqi yorliq qatori
     yashiriladi — har javob uchun ikkita qator keraksiz balandlik berardi. */
  .ans-lbl { display: none; }
  /* `display: block` + ichidagilar `inline` — hammasi BITTA matn oqimi:
     "Sizning javobingiz: A · Gidravlik tormoz...". Flex bo'lib qolsa har
     bo'lak alohida element bo'lib, uzun matn o'z qatoriga tushib ketardi va
     harf bilan matn orasida bo'sh joy qolardi. */
  .ans { display: block; }
  .ans-lbl-in { display: inline; font-weight: 700; margin-right: 0.15rem; }
  .ans-t { display: inline; }
  .ans-h {
    display: inline; width: auto; height: auto;
    background: none; font-weight: 700;
  }
  .ans-h::after { content: ' · '; font-weight: 400; opacity: 0.55; }
  .ans-ic { display: none !important; }
  .qbody { gap: 0.875rem; }

  /* ── AI tushuntirish savol kartasiga YOPISHADI ──
     Ilgari orada bo'shliq bor edi va u alohida karta kabi ko'rinib, qaysi
     savolga tegishli ekani bilinmasdi. Endi ikkisi bitta karta: savol —
     ustki qism, AI — pastki qism. Shu sababli raqam chipi ham kerak emas. */
  .qrow { gap: 0; margin-bottom: 0.875rem; }
  .qcard {
    border-bottom-left-radius: 0; border-bottom-right-radius: 0;
    border-bottom: 0; padding-bottom: 0.875rem;
  }
  .ai-card {
    border-top-left-radius: 0; border-top-right-radius: 0;
    padding: 0.875rem 1.125rem 1.125rem;
    /* Maketdagidek oq fonda faqat tugma lavanda bo'lsin */
    background: var(--surface); border-color: var(--border-soft);
  }
  /* Maketda AI bloki = BITTA lavanda tugma. Sarlavha ortiqcha (tugmaning
     o'zida "AI tushuntirish" yozuvi bor) — u faqat izoh yo'q yoki matn
     ochilgan holatda kerak, shuning uchun tugma ko'rinib turganda
     yashiriladi. */
  .ai-head { font-size: 0.8125rem; margin-bottom: 0.5rem; }
  .ai-card:has(.ai-btn) .ai-head { display: none; }
  /* Maketdagidek: mazmun kengligida, chapda, lavanda fon va ramka */
  .ai-btn {
    background: var(--ai-bg); border-color: var(--ai-border);
    padding: 0.65rem 0.9rem; font-size: 0.875rem;
  }
  .ai-btn-m { display: inline; }
  .ai-btn-d { display: none; }
  .ai-qnum { display: none; }

  /* Javob bloklari: maketda ramkasiz, faqat yumshoq fon.
     `margin-top` SHART: bloklar orasidagi bo'shliqni `.ans-lbl.lbl-ok`
     bergan edi, u esa mobilda yashiriladi — ikki blok yopishib qolardi. */
  .ans { border-color: transparent; }
  .ans + .ans-lbl + .ans { margin-top: 0.5rem; }

  /* Savol sarlavhasi maketdagidek: chipda ikonka, matnda "Savol N · holat" */
  .qnum-n { display: none; }
  .qnum-ic { display: inline-block !important; }
  .qstat-pre { display: inline; color: var(--text-1); }

  /* Legend TAKRORI: filtr chiplari ("Barchasi 20 · To'g'ri 3 · Xato 3")
     o'zi rangli va sonli, ya'ni bir xil ma'lumotni ikki marta bermaymiz. */
  .legend { display: none; }

  .nav-tools { width: 100%; }
  .chips { flex: 1 1 auto; }
  .range, .range-sel { width: 100%; }
}
</style>
