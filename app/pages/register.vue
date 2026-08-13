<script setup lang="ts">
// `layout: 'auth'` — sababi login.vue dagi bilan bir xil (mehmon sessiyasida
// default layout sidebar chizib, ikki ustunni siqib qo'yardi).
definePageMeta({ middleware: 'guest', layout: 'auth' })

const auth = useAuthStore()
const i18n = useI18n()
const route = useRoute()

const form = reactive({
  login: '',
  full_name: '',
  phone: '',
  password: '',
  password_confirmation: '',
})
const errors = ref<Record<string, string[]>>({})
const error = ref('')
const showPwd = ref(false)

// Mehmon hisobini yuksaltirish — BUTUN progress saqlanadi (bir xil hisob,
// bir xil token). Sarlavha va matnlar shunga qarab o'zgaradi.
//
// `acct` cookie ZAXIRA sifatida: token bor-u `/me` so'rovi tarmoq xatosi
// bilan yiqilgan bo'lsa `auth.user` null qoladi va `is_guest` ni bilib
// bo'lmaydi. O'shanda `isUpgrade` jimgina `false` bo'lib YANGI hisob
// yaratilardi — mehmonning XP'si, seriyasi va natijalari eski hisobda tashlab
// ketilardi. Hisob turi allaqachon shu cookie'da saqlanadi (stores/auth.ts).
const acct = useCookie<'user' | 'guest' | null>('acct')
const isUpgrade = computed(() => {
  if (auth.user) return auth.user.is_guest
  return !!auth.token && acct.value === 'guest'
})

/**
 * Bu qurilmada ro'yxatdan o'tgan hisob bor edi, lekin sessiyasi yo'qolgan.
 * login.vue dagi "Ro'yxatdan o'tish" havolasi query'ni saqlab o'tadi
 * (`?expired=1`), lekin holatning o'zini `lostRegisteredSession` bo'yicha ham
 * tekshiramiz — foydalanuvchi bu sahifaga to'g'ridan-to'g'ri ham kelishi mumkin.
 *
 * Bu holatda ogohlantirish MAJBURIY: `isUpgrade` false (token yo'q), ya'ni
 * forma YANGI hisob yaratadi. Ogohlantirishsiz odam ikkinchi hisob ochib,
 * eski hisobdagi XP, seriya, natijalar va TO'LANGAN Premium'ini yetim
 * qoldiradi — buni sezmaydi ham.
 */
const lostSession = computed(() =>
  !isUpgrade.value && (route.query.expired === '1' || auth.lostRegisteredSession))

const SHOWN_FIELDS = ['login', 'full_name', 'phone', 'password', 'password_confirmation']

async function submit() {
  // Ikki marta tez bosishdan qo'riqchi — tugmada `disabled` emas
  // `aria-disabled` ishlatiladi (fokus yo'qolmasligi uchun).
  if (auth.loading) return

  errors.value = {}
  error.value = ''
  try {
    const payload = { ...form, locale: i18n.locale.value }
    if (isUpgrade.value) await auth.completeRegistration(payload)
    else await auth.register(payload)
    await navigateTo(safeRedirect(route.query.redirect))
  }
  catch (e: any) {
    const fromServer = e?.data?.errors as Record<string, string[]> | undefined
    if (fromServer) {
      errors.value = fromServer
      // JIMGINA YIQILISHDAN himoya: server formada CHIZILMAGAN maydon uchun
      // xato qaytarsa (masalan `locale`), foydalanuvchi hech narsa ko'rmasdi —
      // tugma bosiladi, sahifa jim turadi. Shunday kalitlarni umumiy
      // bannerga chiqaramiz.
      const orphan = Object.keys(fromServer).filter(k => !SHOWN_FIELDS.includes(k))
      if (orphan.length) error.value = orphan.map(k => fromServer[k]?.[0]).filter(Boolean).join(' ')
    }
    else {
      error.value = e?.data?.message || i18n.t({ uz: 'Xatolik yuz berdi', kr: 'Хатолик юз берди' })
    }
  }
}

/**
 * Xatolardan keyin BIRINCHI xato maydoniga fokusni ko'chiradi.
 *
 * Usiz ko'zi ojiz foydalanuvchi "Hisob yaratish"ni bosib HECH NARSA
 * eshitmasdi: maydon xatolari oddiy <p> bo'lib chizilardi, live region emas,
 * inputga bog'lanmagan, umumiy banner ham (faqat "orphan" kalitlar uchun
 * to'lgani sababli) bo'sh qolardi — mutlaq jimlik (WCAG 3.3.1).
 */
watch(errors, (next) => {
  const first = SHOWN_FIELDS.find(f => next[f]?.length)
  if (!first) return
  nextTick(() => {
    const el = document.getElementById(first)
    el?.focus()
  })
})
</script>

<template>
  <div class="auth-page flex-1 grid xl:grid-cols-[minmax(0,52fr)_minmax(0,48fr)]">
    <!-- Mehmon yuksalayotganda chap ustun sarlavhasi ham shu kontekstni aytadi:
         odam nima yo'qotmasligini bilib turishi kerak.
         Sarlavha QISQA ataylab: uzun variant ("… — hisobingizni saqlang")
         43px shriftda uch qatorga bo'linib, "yo'qotmang" pastga tushib
         ketardi. Bundan tashqari "Hisobingizni saqlang" allaqachon kartaning
         h1 sarlavhasi — panelda takrorlanishi ortiqcha edi. -->
    <AuthShowcase
      class="hidden xl:flex"
      :title="isUpgrade ? i18n.t({
        uz: 'Progressingizni yo\'qotmang',
        kr: 'Прогрессингизни йўқотманг',
      }) : ''"
      :subtitle="isUpgrade ? i18n.t({
        uz: 'Barcha ballaringiz, seriyangiz va natijalaringiz shu hisobda qoladi — faqat login va parol qo\'shamiz.',
        kr: 'Барча балларингиз, сериянгиз ва натижаларингиз шу ҳисобда қолади — фақат логин ва парол қўшамиз.',
      }) : ''" />

    <div class="auth-side flex flex-col justify-center px-5 py-10 sm:px-8 xl:px-10">
      <NuxtLink to="/" class="xl:hidden inline-flex items-center gap-2.5 self-center mb-8">
        <img src="/logo-mark.svg" alt="" aria-hidden="true" width="36" height="36" class="w-9 h-9 rounded-[10px]" />
        <span class="wordmark">Avtoprav</span>
      </NuxtLink>

      <div class="w-full max-w-[430px] mx-auto">
        <!-- Bosh sahifaga qaytish — login.vue dagi bilan bir xil (sabab u yerda). -->
        <NuxtLink to="/" class="back-link">
          <AppIcon name="arrow-left" :size="16" />
          {{ i18n.t({ uz: 'Bosh sahifaga', kr: 'Бош саҳифага' }) }}
        </NuxtLink>

        <section class="auth-card">
          <h1 class="auth-title">
            {{ isUpgrade
              ? i18n.t({ uz: 'Hisobingizni saqlang', kr: 'Ҳисобингизни сақланг' })
              : i18n.t({ uz: 'Ro\'yxatdan o\'tish', kr: 'Рўйхатдан ўтиш' }) }}
          </h1>
          <p class="mt-2 text-sm" style="color: var(--text-3);">
            {{ isUpgrade
              ? i18n.t({
                uz: 'Barcha progressingiz (ballar, seriya, natijalar) saqlanib qoladi',
                kr: 'Барча прогрессингиз (баллар, серия, натижалар) сақланиб қолади',
              })
              : i18n.t({
                uz: 'Bepul hisob yarating va testlarni boshlang',
                kr: 'Бепул ҳисоб яратинг ва тестларни бошланг',
              }) }}
          </p>

          <!-- Sessiyasi yo'qolgan odam bu sahifaga login'dagi "Ro'yxatdan
               o'tish" havolasi orqali keladi. Bu forma YANGI hisob yaratadi —
               ogohlantirmasak, u eski hisobidagi hammasini tashlab ketadi. -->
          <div v-if="lostSession" class="note note-warn" role="status">
            <span>
              {{ i18n.t({
                uz: 'Bu qurilmada allaqachon hisobingiz bor edi. Yangi hisob yaratsangiz, eski natijalaringiz va Premium o\'sha hisobda qoladi.',
                kr: 'Бу қурилмада аллақачон ҳисобингиз бор эди. Янги ҳисоб яратсангиз, эски натижаларингиз ва Премиум ўша ҳисобда қолади.',
              }) }}
              <NuxtLink to="/login" class="note-link">
                {{ i18n.t({ uz: 'Avval kirishni sinab ko\'ring', kr: 'Аввал киришни синаб кўринг' }) }}
              </NuxtLink>
            </span>
          </div>

          <div v-if="error" class="note note-error" role="alert">
            <AppIcon name="info" :size="16" class="shrink-0 mt-px" />
            <span>{{ error }}</span>
          </div>

          <form class="mt-7 flex flex-col gap-4" @submit.prevent="submit">
            <div>
              <label for="login" class="field-label">
                {{ i18n.t({ uz: 'Login', kr: 'Логин' }) }} <span class="req">*</span>
              </label>
              <div class="relative">
                <AppIcon name="user" :size="17" class="field-icon" aria-hidden="true" />
                <input id="login" v-model="form.login" required autofocus autocomplete="username"
                       :aria-describedby="errors.login ? 'login-err' : undefined"
                       placeholder="ali2024" class="field field-user"
                       :aria-invalid="!!errors.login" />
              </div>
              <p v-if="errors.login" id="login-err" class="field-err" role="alert">{{ errors.login[0] }}</p>
            </div>

            <div>
              <label for="full_name" class="field-label">
                {{ i18n.t({ uz: 'F.I.Sh.', kr: 'Ф.И.Ш.' }) }}
              </label>
              <input id="full_name" v-model="form.full_name" autocomplete="name" class="field"
                     :aria-invalid="!!errors.full_name"
                     :aria-describedby="errors.full_name ? 'full_name-err' : undefined"
                     :placeholder="i18n.t({ uz: 'Aliyev Ali Akbarovich', kr: 'Алиев Али Акбарович' })" />
              <p v-if="errors.full_name" id="full_name-err" class="field-err" role="alert">{{ errors.full_name[0] }}</p>
            </div>

            <div>
              <label for="phone" class="field-label">
                {{ i18n.t({ uz: 'Telefon', kr: 'Телефон' }) }}
              </label>
              <input id="phone" v-model="form.phone" autocomplete="tel" inputmode="tel"
                     :aria-invalid="!!errors.phone"
                     :aria-describedby="errors.phone ? 'phone-err' : undefined"
                     placeholder="+998 90 123 45 67" class="field" />
              <p v-if="errors.phone" id="phone-err" class="field-err" role="alert">{{ errors.phone[0] }}</p>
            </div>

            <div>
              <div class="flex items-baseline justify-between gap-3">
                <label for="password" class="field-label">
                  {{ i18n.t({ uz: 'Parol', kr: 'Парол' }) }} <span class="req">*</span>
                </label>
                <button type="button" class="reveal-text" tabindex="-1" aria-hidden="true" @click="showPwd = !showPwd">
                  {{ showPwd
                    ? i18n.t({ uz: 'Yashirish', kr: 'Яшириш' })
                    : i18n.t({ uz: 'Ko\'rsatish', kr: 'Кўрсатиш' }) }}
                </button>
              </div>
              <div class="relative">
                <input id="password" v-model="form.password" :type="showPwd ? 'text' : 'password'"
                       required autocomplete="new-password" placeholder="••••••••"
                       class="field field-pw" :aria-invalid="!!errors.password"
                       :aria-describedby="errors.password ? 'password-err' : 'password-hint'" />
                <!-- `aria-label` O'ZGARMAYDI, holatni faqat `aria-pressed`
                     bildiradi: ikkisi birga o'zgarsa ekran o'quvchi
                     qarama-qarshi e'lon beradi ("Ko'rsatish, bosilgan"). -->
                <button type="button" class="reveal-icon" :aria-pressed="showPwd"
                        :aria-label="i18n.t({ uz: 'Parolni ko\'rsatish', kr: 'Паролни кўрсатиш' })"
                        @click="showPwd = !showPwd">
                  <AppIcon :name="showPwd ? 'eye-off' : 'eye'" :size="18" />
                </button>
              </div>
              <p v-if="errors.password" id="password-err" class="field-err" role="alert">{{ errors.password[0] }}</p>
              <!-- 6, 8 EMAS: backend qoidasi `min:6` (AuthController). 8 deb
                   yozilgani foydalanuvchiga haqiqatdan qattiqroq shart aytardi. -->
              <p v-else id="password-hint" class="field-hint">{{ i18n.t({ uz: 'Kamida 6 ta belgi', kr: 'Камида 6 та белги' }) }}</p>
            </div>

            <div>
              <label for="password_confirmation" class="field-label">
                {{ i18n.t({ uz: 'Parolni takrorlang', kr: 'Паролни такрорланг' }) }} <span class="req">*</span>
              </label>
              <input id="password_confirmation" v-model="form.password_confirmation"
                     :type="showPwd ? 'text' : 'password'" required autocomplete="new-password"
                     placeholder="••••••••" class="field"
                     :aria-invalid="!!errors.password_confirmation"
                     :aria-describedby="errors.password_confirmation ? 'password_confirmation-err' : undefined" />
              <p v-if="errors.password_confirmation" id="password_confirmation-err" class="field-err" role="alert">{{ errors.password_confirmation[0] }}</p>
            </div>

            <!-- Matn HAR DOIM DOMda: ilgari yuklanishda faqat spinner qolib, tugmaning
                 hisoblangan NOMI bo'sh bo'lardi (WCAG 4.1.2). -->
            <button type="submit" class="submit-btn mt-1"
                    :aria-disabled="auth.loading" :aria-busy="auth.loading">
              <span v-if="auth.loading" class="spinner" aria-hidden="true" />
              <span>{{ isUpgrade
                ? i18n.t({ uz: 'Hisobni saqlash', kr: 'Ҳисобни сақлаш' })
                : i18n.t({ uz: 'Hisob yaratish', kr: 'Ҳисоб яратиш' }) }}</span>
            </button>

            <p class="text-xs text-center leading-relaxed" style="color: var(--text-3);">
              {{ i18n.t({
                uz: 'Ro\'yxatdan o\'tish orqali siz xizmat shartlariga rozilik bildirasiz.',
                kr: 'Рўйхатдан ўтиш орқали сиз хизмат шартларига розилик билдирасиз.',
              }) }}
            </p>
          </form>

          <!-- Mehmon hisobi bo'lsa ham ishlaydi: backend hisobni O'RNIDA
               to'liq hisobga aylantiradi (progress saqlanadi). -->
          <SocialAuthButtons :upgrade="isUpgrade" />
        </section>

        <p class="mt-6 text-center text-sm" style="color: var(--text-3);">
          {{ i18n.t({ uz: 'Hisobingiz bormi?', kr: 'Ҳисобингиз борми?' }) }}
          <NuxtLink :to="{ path: '/login', query: route.query }" class="auth-link ml-1">
            {{ i18n.t({ uz: 'Kirish', kr: 'Кириш' }) }}
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
/* DIQQAT: bu blok login.vue dagi bilan ATAYLAB bir xil. Ikkisini umumiy
   faylga chiqarish mumkin edi, lekin `scoped` uslublar komponentlar orasida
   ulashilmaydi — global CSS'ga chiqarish esa auth sahifalariga tegishli
   klasslarni butun saytga tarqatardi. */
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
  /* 0.375rem bilan balandlik 32px edi — mobil bosish nishoni uchun 36px */
  padding: 0.5rem 0.625rem 0.5rem 0.5rem;
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
.dark .auth-card { box-shadow: 0 18px 48px -28px rgba(0, 0, 0, 0.7); }

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
.req { color: var(--danger); }

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
/* --text-muted EMAS: yorug'da oq fonda 1.98:1 — AA (4.5:1) dan juda past. */
.field::placeholder { color: var(--text-3); opacity: 1; }
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
.field:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 4px var(--primary-ring);
}
.field[aria-invalid='true'] { border-color: var(--danger); }

.field-err  { font-size: 12px; margin-top: 0.375rem; color: var(--danger-ink); }
/* --text-3: 12px matn uchun --text-4 yorug'da AA dan o'tmaydi (3.3:1). */
.field-hint { font-size: 12px; margin-top: 0.375rem; color: var(--text-3); }

.reveal-text {
  position: relative;
  font-size: 13px;
  color: var(--text-3);
  transition: color .15s;
}
.reveal-text:hover { color: var(--text-1); }
/* Matn 20px balandlikda — bosish zonasini 36px gacha kengaytiradi.
   Pseudo-element joy egallamaydi, maket buzilmaydi. */
.reveal-text::after { content: ''; position: absolute; inset: -8px 0; }

.reveal-icon {
  position: absolute;
  top: 50%;
  right: 0.5rem;
  transform: translateY(-50%);
  display: grid;
  place-items: center;
  /* 34px chegaradan past edi — barmoq uchun 36px */
  width: 36px;
  height: 36px;
  border-radius: 9px;
  color: var(--text-4);
  transition: color .15s, background .15s;
}
.reveal-icon:hover { color: var(--text-1); background: var(--surface-inset); }
.reveal-icon:focus-visible { outline: none; box-shadow: 0 0 0 3px var(--primary-ring); }

/* Rang `--text-1`/`--surface` juftligi — `.btn-primary` bilan bir xil
   mantiq: qorong'i rejimda tugma o'z-o'zidan teskari (yorug' fon, to'q matn)
   bo'ladi. */
.submit-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  height: 52px;
  border-radius: 14px;
  font-size: 15px;
  font-weight: 600;
  background: var(--text-1);
  color: var(--surface);
  box-shadow: var(--shadow-soft);
  transition: background .15s, transform .15s, opacity .15s;
}
.submit-btn:hover:not([aria-disabled='true']) { background: var(--text-2); }
.submit-btn:active:not([aria-disabled='true']) { transform: translateY(1px); }

.submit-btn[aria-disabled='true'] { opacity: .6; cursor: progress; }
.submit-btn[aria-disabled='true']:hover { background: var(--text-1); }
.submit-btn:focus-visible { outline: none; box-shadow: 0 0 0 4px var(--primary-ring); }

/* Yuqori kontrast rejimida box-shadow butunlay o'chiriladi — fokus
   ko'rsatkichi yo'qolmasligi uchun shaffof outline qoldiriladi. */
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
/* Modifikatorlar login.vue bilan BIR XIL: ranglar bazaviy .note ga
   singdirilsa, kelajakda ogohlantirish bloki qo'shilganda xato rangida
   chiqib ketardi. */
.note-error { background: var(--danger-soft); color: var(--danger-ink); }
.note-warn  { background: var(--warn-soft);   color: var(--warn-ink); }

/* Ogohlantirish ichidagi havola. `currentColor` + tagi chizilgan: sariq fonda
   ko'k havola rangi kontrastdan o'tmaydi, matn rangining o'zi esa allaqachon
   tekshirilgan (--warn-ink). Havola ekani chiziq bilan ko'rsatiladi. */
.note-link {
  font-weight: 600;
  color: inherit;
  text-decoration: underline;
  text-underline-offset: 2px;
  white-space: nowrap;
}
.note-link:hover { text-decoration-thickness: 2px; }
.note-link:focus-visible { outline: 2px solid currentColor; outline-offset: 2px; border-radius: 3px; }

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
