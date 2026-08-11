<script setup lang="ts">
/**
 * Auth sahifalarining CHAP USTUNI — login va register ikkalasi ULASHADI.
 *
 * Nega alohida komponent: ikki sahifada bir xil brend bloki takrorlanmasin.
 * Matnlar props orqali emas, shu yerda — chunki ikkala sahifada AYNAN bir xil
 * (maketda ham shunday). Faqat sarlavha props bilan almashtirilishi mumkin,
 * chunki register'da mehmon hisobini saqlash konteksti boshqacha bo'lishi
 * mumkin.
 *
 * Illyustratsiya (public/auth-road.webp) — yuqori qirrasi CSS mask bilan
 * shaffofga o'tadi: rasm foni sahifa fonidan bir oz to'qroq, mask bo'lmasa
 * gorizontal chok ko'rinib qolardi.
 *
 * FON bu komponentda EMAS — u sahifa ildizida (.auth-page) va ikki ustunga
 * bir butun bo'lib yotadi, aks holda ustunlar orasida tik chok chiqadi.
 */
const i18n = useI18n()

const props = withDefaults(defineProps<{
  /** Sarlavha almashtirilsa (register'da mehmon progressini saqlash konteksti) */
  title?: string
  subtitle?: string
}>(), { title: '', subtitle: '' })

/**
 * Sarlavhaning OXIRGI SO'ZI aksent rangda chiqadi (maketdagidek).
 *
 * Qattiq yozilgan HTML emas, ohirgi bo'sh joy bo'yicha ajratiladi — shunda
 * lotin ham, kirill ham, register'dagi boshqa sarlavha ham to'g'ri ishlaydi
 * va tarjima matnini HTML bilan bulg'ash kerak bo'lmaydi.
 */
const titleParts = computed(() => {
  const full = props.title || i18n.t({
    uz: 'Haydovchilik imtihoniga ishonch bilan tayyorlaning',
    kr: 'Ҳайдовчилик имтиҳонига ишонч билан тайёрланинг',
  })
  const i = full.trimEnd().lastIndexOf(' ')
  if (i < 0) return { head: '', tail: full }
  // Bo'sh joy `head` NING O'ZIDA qoldiriladi (`i + 1`), shablonda alohida
  // yozilmaydi. Sabab: shablondagi yakka bo'sh joyni Vue kompilyatori
  // "whitespace condense" bilan yo'q qilib tashlaydi va so'zlar bir-biriga
  // yopishib qolardi ("ishonch bilantayyorlaning" — aynan shu xato bo'lgan).
  // Satr ichidagi bo'sh joy esa matn qiymatining bir qismi, u saqlanadi.
  return { head: full.slice(0, i + 1), tail: full.slice(i + 1) }
})

const features = computed(() => [
  {
    icon: 'exam',
    tone: 'violet' as const,
    title: i18n.t({ uz: 'Rasmiy ma\'lumotlar asosida', kr: 'Расмий маълумотлар асосида' }),
    text: i18n.t({
      uz: 'Savollar rasmiy yo\'l harakati qoidalariga asoslangan.',
      kr: 'Саволлар расмий йўл ҳаракати қоидаларига асосланган.',
    }),
  },
  {
    icon: 'bolt',
    tone: 'amber' as const,
    title: i18n.t({ uz: 'Interaktiv va samarali', kr: 'Интерактив ва самарали' }),
    text: i18n.t({
      uz: 'Testlar, statistikalar va xatoliklar tahlili bilan natijangizni oshiring.',
      kr: 'Тестлар, статистикалар ва хатоликлар таҳлили билан натижангизни оширинг.',
    }),
  },
  {
    icon: 'stat',
    tone: 'sky' as const,
    title: i18n.t({ uz: 'Natijangizni kuzatib boring', kr: 'Натижангизни кузатиб боринг' }),
    text: i18n.t({
      uz: 'Progress, reyting va yutuqlaringizni doimiy kuzating.',
      kr: 'Прогресс, рейтинг ва ютуқларингизни доимий кузатинг.',
    }),
  },
  {
    icon: 'shield',
    tone: 'emerald' as const,
    title: i18n.t({ uz: 'Istalgan vaqtda, istalgan joyda', kr: 'Исталган вақтда, исталган жойда' }),
    text: i18n.t({
      uz: 'Kompyuter, planshet yoki telefonda qulay tayyorlaning.',
      kr: 'Компьютер, планшет ёки телефонда қулай тайёрланинг.',
    }),
  },
])
</script>

<template>
  <!-- `<aside>` — bu yordamchi (complementary) mazmun: sahifaning asosiy
       vazifasi o'ngdagi forma. Ekran o'quvchi shu blokni o'tkazib yuborishi
       mumkin bo'ladi. -->
  <aside class="showcase relative flex flex-col overflow-hidden">
    <!-- Gorizontal padding SHU blokda, `.showcase` da EMAS: yo'l rasmi
         ustunning butun kengligiga (chetdan chetga) cho'zilishi kerak, padding
         `.showcase` da bo'lsa rasm ikki tomondan 64px ichkarida qolardi. -->
    <div class="showcase-pad relative z-10">
      <!-- Brend -->
      <NuxtLink to="/" class="inline-flex items-center gap-3">
        <img src="/logo-mark.svg" alt="" aria-hidden="true" width="40" height="40"
             class="w-10 h-10 rounded-xl" />
        <span class="wordmark">Avtoprav</span>
      </NuxtLink>

      <!-- 620px, 540px EMAS: register'ning "Progressingizni yo'qotmang"
           sarlavhasi 43px shriftda 567px (kirill 605px) joy oladi — 540px
           cheklovida u ikki qatorga bo'linib, "yo'qotmang" pastga tushib
           ketardi. Ustunda 727px joy bor, shuning uchun 620px sig'adi.
           Login sarlavhasi 1023px — u baribir ikki qatorda qoladi (shunday
           mo'ljallangan). Tavsif paragrafi esa o'z 540px chekloviga ega:
           620px kenglikda satr o'qishga noqulay uzun bo'lardi. -->
      <div class="mt-7 lg:mt-9 max-w-[620px]">
        <!-- Ishonch chipi -->
        <span class="trust-chip">
          <AppIcon name="shield" :size="14" />
          {{ i18n.t({ uz: 'Ishonch bilan tayyorlaning', kr: 'Ишонч билан тайёрланинг' }) }}
        </span>

        <!-- `<p>`, `<h1>` EMAS: sahifaning YAKKA h1 si — kartadagi "Hisobingizga
             kiring" (sahifaning haqiqiy vazifasi). Bu blok reklama matni va
             `lg` dan pastda butunlay yashiriladi; agar u h1 bo'lsa, desktopda
             ikkita h1 bo'lardi, mobilda esa h1 umuman qolmasdi. -->
        <p class="showcase-title">{{ titleParts.head
        }}<span class="title-accent">{{ titleParts.tail }}</span></p>

        <p class="mt-4 max-w-[540px] text-[15px] leading-[1.65]" style="color: var(--text-3);">
          {{ subtitle || i18n.t({
            uz: 'Avtoprav bilan bilimni mustahkamlang, xatolaringiz ustida ishlang va imtihondan muvaffaqiyatli o\'ting.',
            kr: 'Avtoprav билан билимни мустаҳкамланг, хатоларингиз устида ишланг ва имтиҳондан муваффақиятли ўтинг.',
          }) }}
        </p>

        <!-- Xususiyatlar -->
        <ul class="mt-6 lg:mt-7 flex flex-col gap-4">
          <li v-for="f in features" :key="f.title" class="flex items-start gap-3.5">
            <IconTile :icon="f.icon" :tone="f.tone" :size="44" :radius="14" class="shrink-0" />
            <div class="min-w-0">
              <div class="text-[15px] font-semibold leading-snug" style="color: var(--text-1);">
                {{ f.title }}
              </div>
              <p class="text-[13px] leading-[1.5] mt-1" style="color: var(--text-3);">
                {{ f.text }}
              </p>
            </div>
          </li>
        </ul>
      </div>
    </div>

    <!-- Yo'l illyustratsiyasi: ustunning butun kengligiga (chetdan chetga)
         cho'ziladi va pastiga tegib turadi. `mt-auto` — matn bilan orasidagi
         bo'shliqni ekran balandligi o'zi taqsimlaydi.
         `<img>` EMAS, CSS FON: yorug' va qorong'i uchun ikki xil rasm bor
         (kunduzgi / kechki). `<img :src>` bilan bog'lansa `isDark` SSR'da
         doim `false` bo'lgani uchun server yorug' rasmni chizib, gidratsiyadan
         keyin klient qorong'isiga almashtirardi — ko'zga tashlanadigan sakrash
         va bekorga yuklangan rasm. CSS foni `.dark` klassiga darhol ergashadi
         va brauzer FAQAT mos kelgan qoidaning rasmini yuklaydi. -->
    <div class="road relative z-0 mt-auto w-full select-none pointer-events-none"
         role="presentation" />
  </aside>
</template>

<style scoped>
/* FON YO'Q — u sahifa ildizida (`.auth-page`) va ikki ustunga BIR BUTUN
   bo'lib yotadi. Ilgari chap panel o'z gradientini, o'ng panel `--canvas` ni
   olardi: ikki rang tutashgan joyda tik CHOK ko'rinib, sahifa ikkiga
   bo'lingandek tuyulardi (qorong'i rejimda ayniqsa keskin). */
.showcase {
  /* Gorizontal padding YO'Q — u `.showcase-pad` da. Rasm chetdan chetga
     cho'zilishi uchun shunday. */
  padding: 32px 0 0;

  /* EKRAN BALANDLIGIGA QOTIRILGAN — o'ng ustunga CHO'ZILMAYDI.
     Nega: register kartasi baland (5 maydon), grid qatori 1140px bo'lib
     ketardi va chap ustun ham shuncha cho'zilardi. `margin-top: auto` tufayli
     rasm eng pastga tushib, matn bilan orasida 246px BO'SH BAND qolardi
     (brauzerda o'lchandi) — rasm esa ekrandan pastda, faqat scroll bilan
     ko'rinardi.
     `sticky` — uzun formani aylantirganda brend bloki joyida turadi. */
  align-self: start;
  position: sticky;
  top: 0;
  height: 100vh;
}
/* Yuqori padding ATAYLAB kichik: rasm yo'l tagigacha kesilgani uchun
   balandroq (2.349 nisbat), va 1660x940 da ustun 16px oshib scroll berardi.
   Rasmni qirqish o'rniga logotip ustidagi bo'shliq kamaytirildi. */
@media (min-width: 1024px) { .showcase { padding: 24px 0 0; } }
@media (min-width: 1280px) { .showcase { padding: 24px 0 0; } }

.showcase-pad { padding: 0 24px; }
@media (min-width: 1024px) { .showcase-pad { padding: 0 40px; } }
@media (min-width: 1280px) { .showcase-pad { padding: 0 64px; } }

.wordmark {
  font-size: 23px;
  font-weight: 800;
  font-variation-settings: 'wght' 800;
  letter-spacing: -0.025em;
  line-height: 1;
  color: var(--text-1);
}

.trust-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  height: 34px;
  padding: 0 0.875rem;
  border-radius: 9999px;
  font-size: 13px;
  font-weight: 600;
  background: var(--primary-soft);
  color: var(--primary-ink);
}

.showcase-title {
  margin-top: 1rem;
  font-size: 31px;
  line-height: 1.14;
  font-weight: 800;
  font-variation-settings: 'wght' 800;
  letter-spacing: -0.03em;
  color: var(--text-1);
}
@media (min-width: 1024px) { .showcase-title { font-size: 37px; } }
@media (min-width: 1280px) { .showcase-title { font-size: 43px; } }

/* Oxirgi so'z — brend ko'kida gradient. `background-clip: text` qo'llanmasa
   (juda eski brauzer) `color` zaxira sifatida ishlaydi, matn ko'rinmay
   qolmaydi. */
.title-accent {
  color: var(--primary);
  background: linear-gradient(96deg, #4f8cff 0%, #6a5ae0 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
@supports not ((-webkit-background-clip: text) or (background-clip: text)) {
  .title-accent { -webkit-text-fill-color: currentColor; background: none; }
}

/* Rasmning yuqori qirrasi fonga silliq o'tadi — rasm foni sahifa fonidan
   bir oz to'qroq, mask bo'lmasa gorizontal chok ko'rinardi. Chap/o'ng
   chetlari ham yumshatiladi. */
.road {
  /* `margin-top: auto` — Tailwind'ning `mt-auto` klassi YETMAYDI: scoped CSS
     `.road[data-v-…]` yuqori aniqlikda bo'lgani uchun uni bosib ketadi va rasm
     ustunning pastiga tegmay, ostida bo'shliq qolib ketardi. */
  margin-top: auto;

  /* KUNDUZGI rasm. Ikki fayl AYNAN bir nisbatda (1400x538 = 2.60) kesilgan —
     shuning uchun mavzu almashganda balandlik sakramaydi. */
  background-image: url('/auth-road.webp');
  background-size: cover;
  /* `bottom`: agar qirqish kerak bo'lsa, YUQORIDAN (osmon) kesiladi.
     Yo'lning tagi har doim ko'rinishi kerak. */
  background-position: center bottom;
  background-repeat: no-repeat;

  /* `aspect-ratio` — element `<div>` bo'lgani uchun tabiiy o'lchami yo'q.
     Balandlik kenglikdan hisoblanadi, ya'ni CLS bo'lmaydi.
     Rasm 2.349 nisbatda kesilgan (yo'l tagigacha).
     `max-height` ATAYLAB katta: 863px ustunda tabiiy balandlik 367px,
     703px da 299px — ya'ni odatdagi ekranlarda BU CHEGARA ISHGA TUSHMAYDI va
     rasm umuman qirqilmaydi. U faqat juda past ekranlar uchun xavfsizlik
     klapani. Ilgari 46vh edi va 1366x768 da rasmni qirqib tashlardi. */
  aspect-ratio: 1400 / 596;
  max-height: min(560px, 56vh);

  /* Ikki qirra yumshoq so'nadi — rasm to'rtburchak bo'lib tugasa sahifaga
     "yopishtirilgan surat" bo'lib ajralib turadi:
       · YUQORI: rasm foni sahifa fonidan to'qroq, usiz gorizontal chok chiqadi;
       · O'NG: ustun chetida tik chiziq bo'lib uzilardi (siz belgilagan joy).
     O'ng so'nish UZUN — 82% dan boshlanadi. DIQQAT: ilgari u 6% (94%..100%)
     edi va aynan torligi sababli "rasm chetga yetmagan, bo'sh to'rtburchak
     qolgan" bo'lib ko'rinardi. Uzun so'nish esa fonga singib ketadi.
     CHAP qirra so'nMAYDI — u ekranning o'z cheti, orqasida hech narsa yo'q. */
  -webkit-mask-image:
    linear-gradient(to bottom, transparent 0%, #000 22%),
    linear-gradient(to right, #000 82%, transparent 100%);
  -webkit-mask-composite: source-in;
  mask-image:
    linear-gradient(to bottom, transparent 0%, #000 22%),
    linear-gradient(to right, #000 82%, transparent 100%);
  mask-composite: intersect;
}

/* KECHKI rasm — qorong'i rejim uchun alohida chizilgan (yoqilgan chiroqlar,
   ho'l asfalt, shahar chiroqlari). Ilgari shu yerda kunduzgi rasm
   `opacity: 0.4` bilan xiralashtirilardi — u xiralashgan dog' bo'lib
   ko'rinardi, hozir esa mavzuga mos haqiqiy tasvir. */
.dark .road {
  background-image: url('/auth-road-dark.webp');
}

/* PAST LAPTOP EKRANLARI (1366x768, 1440x800 — juda keng tarqalgan). Chap
   ustun mazmuni bunday balandlikda ekrandan oshib, sahifa keraksiz vertikal
   scroll olardi. Bu yerda hamma vertikal o'lchamlar bir joyda qisqartiriladi. */
@media (max-height: 820px) {
  .showcase { padding-top: 14px; }
  .showcase-title { font-size: 30px; margin-top: 0.625rem; }
  .trust-chip { height: 27px; font-size: 12.5px; }
  .showcase-pad ul { gap: 0.5rem; margin-top: 1rem; }
  .showcase-pad ul p { margin-top: 0.125rem; }
  .showcase-pad > div { margin-top: 0.875rem; }
  .road { max-height: 44vh; }   /* qirqmaslik uchun tabiiy balandlikdan yuqori */
}

</style>
