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
  error.value = ''
  try {
    await auth.login(form)
    const redirect = (route.query.redirect as string) || '/'
    await navigateTo(redirect)
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
              <input id="login" v-model="form.login" required autofocus
                     autocomplete="username" placeholder="ali2024" class="field" />
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
                <input id="password" v-model="form.password" :type="showPwd ? 'text' : 'password'"
                       required autocomplete="current-password" placeholder="••••••••"
                       class="field pr-11" />
                <button type="button" class="reveal-icon" :aria-pressed="showPwd"
                        :aria-label="showPwd
                          ? i18n.t({ uz: 'Parolni yashirish', kr: 'Паролни яшириш' })
                          : i18n.t({ uz: 'Parolni ko\'rsatish', kr: 'Паролни кўрсатиш' })"
                        @click="showPwd = !showPwd">
                  <AppIcon :name="showPwd ? 'eye-off' : 'eye'" :size="18" />
                </button>
              </div>
            </div>

            <button type="submit" :disabled="auth.loading" class="submit-btn mt-1">
              <span v-if="auth.loading" class="spinner" aria-hidden="true" />
              <span v-else>{{ i18n.t({ uz: 'Davom etish', kr: 'Давом этиш' }) }}</span>
            </button>
          </form>

          <!-- "yoki" ajratkichi SocialAuthButtons ICHIDA — bu yerda takrorlanmaydi -->
          <SocialAuthButtons />
        </section>

        <p class="mt-6 text-center text-sm" style="color: var(--text-3);">
          {{ i18n.t({ uz: 'Hisobingiz yo\'qmi?', kr: 'Ҳисобингиз йўқми?' }) }}
          <NuxtLink to="/register" class="auth-link ml-1">
            {{ i18n.t({ uz: 'Ro\'yxatdan o\'tish', kr: 'Рўйхатдан ўтиш' }) }}
          </NuxtLink>
        </p>

        <p class="mt-9 flex items-center justify-center gap-1.5 text-xs" style="color: var(--text-4);">
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
.field::placeholder { color: var(--text-muted); }
.field:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 4px var(--primary-ring);
}

.reveal-text {
  font-size: 13px;
  color: var(--text-4);
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

/* Rang `--text-1`/`--surface` juftligi — `.btn-primary` bilan bir xil mantiq:
   qorong'i rejimda tugma o'z-o'zidan teskari (yorug' fon, to'q matn) bo'ladi. */
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
  background: var(--text-1);
  color: var(--surface);
  box-shadow: var(--shadow-soft);
  transition: background .15s, transform .15s, opacity .15s;
}
.submit-btn:hover:not(:disabled) { background: var(--text-2); }
.submit-btn:active:not(:disabled) { transform: translateY(1px); }
.submit-btn:disabled { opacity: .6; cursor: not-allowed; }
.submit-btn:focus-visible { outline: none; box-shadow: 0 0 0 4px var(--primary-ring); }

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
</style>
