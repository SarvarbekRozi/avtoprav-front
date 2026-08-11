<script setup lang="ts">
// `layout: 'auth'` SHART: default.vue `auth.user` bo'yicha dashboard tarmog'ini
// chizadi, mehmon sessiyasi ham `auth.user` ga ega — ya'ni saytga bir marta
// kirgan odam bu sahifani 280px sidebar bilan ko'rardi.
definePageMeta({ middleware: 'guest', layout: 'auth' })

const auth = useAuthStore()
const i18n = useI18n()
const route = useRoute()

const form = reactive({ login: '', password: '' })
const error = ref('')
const showPwd = ref(false)
const sessionExpired = computed(() => route.query.expired === '1')

async function submit() {
  // Ikki marta tez bosishdan qo'riqchi. Tugmada `disabled` EMAS, `aria-disabled`
  // ishlatiladi: disabled bo'lgan tugma fokusni <body>ga tashlaydi va klaviatura
  // foydalanuvchisi sahifada joyini butunlay yo'qotadi.
  if (auth.loading) return

  error.value = ''
  try {
    await auth.login(form)
    await navigateTo(safeRedirect(route.query.redirect))
  }
  catch (e: any) {
    error.value = e?.data?.message || i18n.t({ uz: 'Xatolik yuz berdi', kr: 'Хатолик юз берди' })
  }
}
</script>

<template>
  <!-- flex-1: layouts/default.vue'dagi <main> `flex-1 flex flex-col` —
       sahifa ildizi ham cho'zilmasa ikki ustun ekran balandligini to'ldirmaydi. -->
  <div class="auth-page flex-1 grid xl:grid-cols-[minmax(0,52fr)_minmax(0,48fr)]">
    <!-- Chap ustun faqat xl (1280) dan boshlab: kichik ekranda karta butun ekranni
         oladi (mobil foydalanuvchi uchun brend bloki emas, forma muhim). -->
    <AuthShowcase class="hidden xl:flex" />

    <div class="auth-side flex flex-col justify-center px-5 py-10 sm:px-8 xl:px-10">
      <!-- Mobil brend: chap ustun yashiringanda logotip yo'qolib qolmasin -->
      <NuxtLink to="/" class="xl:hidden inline-flex items-center gap-2.5 self-center mb-8">
        <img src="/logo-mark.svg" alt="" aria-hidden="true" width="36" height="36" class="w-9 h-9 rounded-[10px]" />
        <span class="wordmark">Avtoprav</span>
      </NuxtLink>

      <div class="w-full max-w-[430px] mx-auto">
        <!-- Bosh sahifaga qaytish. Chap ustundagi logotip ham `/` ga olib
             boradi, lekin u `xl` dan pastda yashiringan va logotip
             "qaytish" ekani ko'rinib turmaydi — shuning uchun ochiq,
             matnli havola. Karta ustida, uning chap qirrasiga tekislangan. -->
        <NuxtLink to="/" class="back-link">
          <AppIcon name="arrow-left" :size="16" />
          {{ i18n.t({ uz: 'Bosh sahifaga', kr: 'Бош саҳифага' }) }}
        </NuxtLink>

        <section class="auth-card">
          <h1 class="auth-title">
            {{ i18n.t({ uz: 'Hisobingizga kiring', kr: 'Ҳисобингизга киринг' }) }}
          </h1>
          <p class="mt-2 text-sm" style="color: var(--text-3);">
            {{ i18n.t({
              uz: 'Davom etish uchun login va parolingizni kiriting',
              kr: 'Давом этиш учун логин ва паролингизни киритинг',
            }) }}
          </p>

          <!-- Sessiya tugagan bo'lsa sababini aytamiz — foydalanuvchi sezmasdan
               mehmonga aylanib qolmasin. -->
          <div v-if="sessionExpired" class="note note-warn" role="status">
            {{ i18n.t({
              uz: 'Sessiyangiz tugadi. Natijalaringiz saqlangan — davom etish uchun qayta kiring.',
              kr: 'Сессиянгиз тугади. Натижаларингиз сақланган — давом этиш учун қайта киринг.',
            }) }}
          </div>

          <div v-if="error" class="note note-error" role="alert">
            <AppIcon name="info" :size="16" class="shrink-0 mt-px" />
            <span>{{ error }}</span>
          </div>

          <form class="mt-7 flex flex-col gap-4" @submit.prevent="submit">
            <div>
              <label for="login" class="field-label">
                {{ i18n.t({ uz: 'Login', kr: 'Логин' }) }}
              </label>
              <div class="relative">
                <AppIcon name="user" :size="17" class="field-icon" aria-hidden="true" />
                <input id="login" v-model="form.login" required autofocus
                       autocomplete="username" placeholder="ali2024" class="field field-user" />
              </div>
            </div>

            <div>
              <div class="flex items-baseline justify-between gap-3">
                <label for="password" class="field-label">
                  {{ i18n.t({ uz: 'Parol', kr: 'Парол' }) }}
                </label>
                <!-- Maketdagi matnli tugma. Maydon ichidagi ko'z ikonkasi bilan
                     BIR XIL holatni boshqaradi (ikkitasi ham bo'lishi maketda). -->
                <button type="button" class="reveal-text" tabindex="-1" aria-hidden="true" @click="showPwd = !showPwd">
                  {{ showPwd
                    ? i18n.t({ uz: 'Yashirish', kr: 'Яшириш' })
                    : i18n.t({ uz: 'Ko\'rsatish', kr: 'Кўрсатиш' }) }}
                </button>
              </div>
              <div class="relative">
                <!-- `field-pw`, Tailwind `pr-11` EMAS: scoped `.field[data-v-…]`
                     ning aniqligi (0,2,0) Tailwind `.pr-11` (0,1,0) dan yuqori,
                     shuning uchun `padding: 0 .875rem` qisqartmasi o'ng
                     paddingni bosib ketardi — parol matni ko'z tugmasi ostiga
                     kirib ketgan edi (jonli buildda o'lchandi: 14px). -->
                <input id="password" v-model="form.password" :type="showPwd ? 'text' : 'password'"
                       required autocomplete="current-password" placeholder="••••••••"
                       class="field field-pw" />
                <!-- `aria-label` O'ZGARMAYDI, holatni faqat `aria-pressed`
                     bildiradi: ikkisi birga o'zgarsa ekran o'quvchi
                     qarama-qarshi e'lon beradi ("Ko'rsatish, bosilgan"). -->
                <button type="button" class="reveal-icon" :aria-pressed="showPwd"
                        :aria-label="i18n.t({ uz: 'Parolni ko\'rsatish', kr: 'Паролни кўрсатиш' })"
                        @click="showPwd = !showPwd">
                  <AppIcon :name="showPwd ? 'eye-off' : 'eye'" :size="18" />
                </button>
              </div>
            </div>

            <!-- Matn HAR DOIM DOMda: ilgari yuklanish paytida faqat spinner
                 qolardi (`aria-hidden`), ya'ni tugmaning hisoblangan NOMI bo'sh
                 bo'lib, ekran o'quvchi "button, dimmed" deb o'qirdi (WCAG 4.1.2).
                 `disabled` emas `aria-disabled` — fokus tugmada qoladi. -->
            <button type="submit" class="submit-btn mt-1"
                    :aria-disabled="auth.loading" :aria-busy="auth.loading">
              <span v-if="auth.loading" class="spinner" aria-hidden="true" />
              <span>{{ i18n.t({ uz: 'Davom etish', kr: 'Давом этиш' }) }}</span>
              <AppIcon v-if="!auth.loading" name="arrow" :size="17" class="submit-arrow" />
            </button>
          </form>

          <!-- "yoki" ajratkichi SocialAuthButtons ICHIDA — bu yerda takrorlanmaydi -->
          <SocialAuthButtons />
        </section>

        <p class="mt-6 text-center text-sm" style="color: var(--text-3);">
          {{ i18n.t({ uz: 'Hisobingiz yo\'qmi?', kr: 'Ҳисобингиз йўқми?' }) }}
          <!-- `query: route.query` — ?redirect= saqlanadi. Usiz /pricing dan
               kelgan odam ro'yxatdan o'tgach bosh sahifaga tushib qolardi. -->
          <NuxtLink :to="{ path: '/register', query: route.query }" class="auth-link ml-1">
            {{ i18n.t({ uz: 'Ro\'yxatdan o\'tish', kr: 'Рўйхатдан ўтиш' }) }}
          </NuxtLink>
        </p>

        <p class="mt-9 flex items-center justify-center gap-1.5 text-xs" style="color: var(--text-3);">
          <AppIcon name="shield" :size="14" />
          {{ i18n.t({
            uz: 'Avtoprav — sizning imtihonga ishonchli yo\'ldoshingiz',
            kr: 'Avtoprav — сизнинг имтиҳонга ишончли йўлдошингиз',
          }) }}
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* FON IKKI USTUNGA BIR BUTUN: ilgari chap panel o'z gradientini, o'ng
   panel --canvas ni olardi va tutashgan joyda tik CHOK korinardi — sahifa
   ikkiga bolingandek tuyulardi. Endi gradient sahifa ildizida, ustunlar
   shaffof. */
.auth-page {
  background: linear-gradient(150deg, #fbfcff 0%, #f4f7fd 42%, #eaf0fb 100%);
}
.dark .auth-page {
  background: linear-gradient(150deg, #171b23 0%, #101319 55%, #0b0e15 100%);
}

.wordmark {
  font-size: 21px;
  font-weight: 800;
  font-variation-settings: 'wght' 800;
  letter-spacing: -0.025em;
  color: var(--text-1);
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  margin-bottom: 0.875rem;
  padding: 0.375rem 0.625rem 0.375rem 0.5rem;
  margin-left: -0.5rem;      /* matn karta chetiga tekis tursin */
  border-radius: 10px;
  font-size: 13.5px;
  font-weight: 500;
  color: var(--text-3);
  transition: color .15s, background .15s;
}
.back-link:hover { color: var(--text-1); background: var(--surface-inset); }
.back-link:focus-visible { outline: none; box-shadow: 0 0 0 3px var(--primary-ring); }

.auth-card {
  background: var(--surface);
  border: 1px solid var(--border-soft);
  border-radius: 24px;
  box-shadow: 0 18px 48px -28px rgba(15, 23, 42, 0.22), 0 2px 6px -2px rgba(15, 23, 42, 0.05);
  padding: 28px 22px;
}
@media (min-width: 640px) { .auth-card { padding: 36px 34px; } }
.dark .auth-card {
  box-shadow: 0 18px 48px -28px rgba(0, 0, 0, 0.7);
}

/* `color` ochiq yozilgan: main.css'dagi `h1,h2,h3,h4 { color: var(--text-1) }`
   bazaviy qoidasi meros bo'lib kelayotgan rangni bosib ketadi. */
.auth-title {
  font-size: 23px;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.2;
  color: var(--text-1);
}

.field-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-2);
  margin-bottom: 0.5rem;
}

/* Loyihaning `.input` klassi h-11/rounded-lg — maketda maydonlar balandroq va
   yumshoqroq burchakli, shuning uchun shu sahifa uchun alohida. */
.field {
  width: 100%;
  height: 48px;
  padding: 0 0.875rem;
  border-radius: 12px;
  font-size: 15px;
  background: var(--surface);
  border: 1px solid var(--border-1);
  color: var(--text-1);
  transition: border-color .15s, box-shadow .15s;
}
/* `--text-muted` EMAS: yorug' rejimda u oq fonda 1.98:1 beradi — WCAG AA
   (4.5:1) dan juda past, placeholder o'qilmaydi. `--text-3` = 6.4:1. */
.field::placeholder { color: var(--text-3); opacity: 1; }
.field:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 4px var(--primary-ring);
}
/* Ko'z tugmasi uchun joy — Tailwind `pr-11` scoped `.field` dan zaifroq. */
.field-pw { padding-right: 2.75rem; }
/* Login maydonidagi odam ikonkasi uchun joy (maketdagidek) */
.field-user { padding-left: 2.5rem; }
.field-icon {
  position: absolute;
  top: 50%;
  left: 0.875rem;
  transform: translateY(-50%);
  color: var(--text-4);
  pointer-events: none;
}

.reveal-text {
  font-size: 13px;
  color: var(--text-3);
  transition: color .15s;
}
.reveal-text:hover { color: var(--text-1); }

.reveal-icon {
  position: absolute;
  top: 50%;
  right: 0.5rem;
  transform: translateY(-50%);
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 9px;
  color: var(--text-4);
  transition: color .15s, background .15s;
}
.reveal-icon:hover { color: var(--text-1); background: var(--surface-inset); }
.reveal-icon:focus-visible { outline: none; box-shadow: 0 0 0 3px var(--primary-ring); }

/* Maketdagi ko'k GRADIENT tugma. Ilgari `--text-1`/`--surface` juftligi edi
   (qora tugma, qorong'ida teskari oq bo'lardi) — maketda esa u brend ko'kida
   va ikkala mavzuda BIR XIL.
   Oq matn: #3563e8 ustida 5.12:1, #5b4ff0 ustida 5.5:1 — ikkalasi ham AA
   (4.5:1) dan o'tadi. DIQQAT: dastlab #3b6ef5 olingan edi, u brauzerda
   o'lchanganda 4.44:1 chiqdi — chegaradan past, shuning uchun to'qlashtirildi. */
.submit-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  height: 52px;
  border-radius: 14px;
  font-size: 15px;
  font-weight: 600;
  color: #fff;
  background: linear-gradient(96deg, #3563e8 0%, #5b4ff0 100%);
  box-shadow: 0 10px 26px -12px rgba(53, 99, 232, 0.75);
  transition: filter .15s, transform .15s, box-shadow .15s, opacity .15s;
}
.submit-btn:hover:not([aria-disabled='true']) {
  filter: brightness(1.07);
  box-shadow: 0 14px 30px -12px rgba(53, 99, 232, 0.85);
}
.submit-btn:active:not([aria-disabled='true']) { transform: translateY(1px); }

/* Strelka o'ng chetda, matn esa MARKAZDA qoladi — shuning uchun strelka
   oqimdan chiqarilgan (`absolute`). Flex ichida qoldirilsa matnni chapga
   surib yuborardi. */
.submit-btn { position: relative; }
.submit-arrow {
  position: absolute;
  right: 18px;
  top: 50%;
  transform: translateY(-50%);
  transition: transform .18s;
}
.submit-btn:hover .submit-arrow { transform: translateY(-50%) translateX(3px); }
/* `[aria-disabled]`, `:disabled` EMAS — sabab script blokida. */
.submit-btn[aria-disabled='true'] { opacity: .6; cursor: progress; }
.submit-btn[aria-disabled='true']:hover { background: var(--text-1); }
.submit-btn:focus-visible { outline: none; box-shadow: 0 0 0 4px var(--primary-ring); }

/* Yuqori kontrast (forced-colors) rejimida `box-shadow` BUTUNLAY o'chiriladi —
   ya'ni fokus ko'rsatkichi yo'qoladi. Shaffof outline esa tizim rangiga
   aylanadi, shuning uchun uni ochiq qoldiramiz. */
@media (forced-colors: active) {
  .submit-btn:focus-visible,
  .field:focus,
  .reveal-icon:focus-visible,
  .auth-link:focus-visible {
    outline: 2px solid CanvasText;
    outline-offset: 2px;
  }
}

.spinner {
  width: 18px;
  height: 18px;
  border-radius: 9999px;
  border: 2px solid color-mix(in srgb, var(--surface) 35%, transparent);
  border-top-color: var(--surface);
  animation: spin .7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.note {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  margin-top: 1.25rem;
  padding: 0.75rem 0.875rem;
  border-radius: 12px;
  font-size: 13.5px;
  line-height: 1.45;
}
.note-warn {
  background: var(--warn-soft);
  color: var(--warn-ink);
}
.note-error {
  background: var(--danger-soft);
  color: var(--danger-ink);
}

.auth-link {
  font-weight: 600;
  color: var(--primary-ink);
}
.auth-link:hover { text-decoration: underline; text-underline-offset: 4px; }

@media (prefers-reduced-motion: reduce) {
  .submit-btn, .submit-btn:active { transition: none; transform: none; }
  .spinner { animation-duration: 2s; }
}

/* PAST EKRAN (1366x768 va shunga o'xshash laptoplar). Scroll aslida SHU
   ustundan chiqadi (karta + pastdagi havolalar), chap ustundan emas —
   brauzerda o'lchab aniqlangan. */
@media (max-height: 820px) {
  .auth-side { padding-top: 1.5rem; padding-bottom: 1.5rem; }
  .auth-card { padding: 24px 28px; }
  .auth-title { font-size: 21px; }
  .back-link { margin-bottom: 0.5rem; }
}
</style>
