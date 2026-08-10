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
const isUpgrade = computed(() => auth.user?.is_guest ?? false)

async function submit() {
  errors.value = {}
  error.value = ''
  try {
    const payload = { ...form, locale: i18n.locale.value }
    if (isUpgrade.value) await auth.completeRegistration(payload)
    else await auth.register(payload)
    await navigateTo((route.query.redirect as string) || '/')
  }
  catch (e: any) {
    const fromServer = e?.data?.errors as Record<string, string[]> | undefined
    if (fromServer) {
      errors.value = fromServer
      // JIMGINA YIQILISHDAN himoya: server formada CHIZILMAGAN maydon uchun
      // xato qaytarsa (masalan `locale`), foydalanuvchi hech narsa ko'rmasdi —
      // tugma bosiladi, sahifa jim turadi. Shunday kalitlarni umumiy
      // bannerga chiqaramiz.
      const shown = ['login', 'full_name', 'phone', 'password', 'password_confirmation']
      const orphan = Object.keys(fromServer).filter(k => !shown.includes(k))
      if (orphan.length) error.value = orphan.map(k => fromServer[k]?.[0]).filter(Boolean).join(' ')
    }
    else {
      error.value = e?.data?.message || i18n.t({ uz: 'Xatolik yuz berdi', kr: 'Хатолик юз берди' })
    }
  }
}
</script>

<template>
  <div class="flex-1 grid xl:grid-cols-[minmax(0,52fr)_minmax(0,48fr)]">
    <!-- Mehmon yuksalayotganda chap ustun sarlavhasi ham shu kontekstni aytadi:
         odam nima yo'qotmasligini bilib turishi kerak. -->
    <AuthShowcase
      class="hidden xl:flex"
      :title="isUpgrade ? i18n.t({
        uz: 'Progressingizni yo\'qotmang — hisobingizni saqlang',
        kr: 'Прогрессингизни йўқотманг — ҳисобингизни сақланг',
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

          <div v-if="error" class="note note-error" role="alert">
            <AppIcon name="info" :size="16" class="shrink-0 mt-px" />
            <span>{{ error }}</span>
          </div>

          <form class="mt-7 flex flex-col gap-4" @submit.prevent="submit">
            <div>
              <label for="login" class="field-label">
                {{ i18n.t({ uz: 'Login', kr: 'Логин' }) }} <span class="req">*</span>
              </label>
              <input id="login" v-model="form.login" required autofocus autocomplete="username"
                     placeholder="ali2024" class="field"
                     :aria-invalid="!!errors.login" />
              <p v-if="errors.login" class="field-err">{{ errors.login[0] }}</p>
            </div>

            <div>
              <label for="full_name" class="field-label">
                {{ i18n.t({ uz: 'F.I.Sh.', kr: 'Ф.И.Ш.' }) }}
              </label>
              <input id="full_name" v-model="form.full_name" autocomplete="name" class="field"
                     :placeholder="i18n.t({ uz: 'Aliyev Ali Akbarovich', kr: 'Алиев Али Акбарович' })" />
              <p v-if="errors.full_name" class="field-err">{{ errors.full_name[0] }}</p>
            </div>

            <div>
              <label for="phone" class="field-label">
                {{ i18n.t({ uz: 'Telefon', kr: 'Телефон' }) }}
              </label>
              <input id="phone" v-model="form.phone" autocomplete="tel" inputmode="tel"
                     placeholder="+998 90 123 45 67" class="field" />
              <p v-if="errors.phone" class="field-err">{{ errors.phone[0] }}</p>
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
                       class="field pr-11" :aria-invalid="!!errors.password" />
                <button type="button" class="reveal-icon" :aria-pressed="showPwd"
                        :aria-label="showPwd
                          ? i18n.t({ uz: 'Parolni yashirish', kr: 'Паролни яшириш' })
                          : i18n.t({ uz: 'Parolni ko\'rsatish', kr: 'Паролни кўрсатиш' })"
                        @click="showPwd = !showPwd">
                  <AppIcon :name="showPwd ? 'eye-off' : 'eye'" :size="18" />
                </button>
              </div>
              <p v-if="errors.password" class="field-err">{{ errors.password[0] }}</p>
              <!-- 6, 8 EMAS: backend qoidasi `min:6` (AuthController). 8 deb
                   yozilgani foydalanuvchiga haqiqatdan qattiqroq shart aytardi. -->
              <p v-else class="field-hint">{{ i18n.t({ uz: 'Kamida 6 ta belgi', kr: 'Камида 6 та белги' }) }}</p>
            </div>

            <div>
              <label for="password_confirmation" class="field-label">
                {{ i18n.t({ uz: 'Parolni takrorlang', kr: 'Паролни такрорланг' }) }} <span class="req">*</span>
              </label>
              <input id="password_confirmation" v-model="form.password_confirmation"
                     :type="showPwd ? 'text' : 'password'" required autocomplete="new-password"
                     placeholder="••••••••" class="field" />
              <p v-if="errors.password_confirmation" class="field-err">{{ errors.password_confirmation[0] }}</p>
            </div>

            <button type="submit" :disabled="auth.loading" class="submit-btn mt-1">
              <span v-if="auth.loading" class="spinner" aria-hidden="true" />
              <span v-else>{{ isUpgrade
                ? i18n.t({ uz: 'Hisobni saqlash', kr: 'Ҳисобни сақлаш' })
                : i18n.t({ uz: 'Hisob yaratish', kr: 'Ҳисоб яратиш' }) }}</span>
            </button>

            <p class="text-xs text-center leading-relaxed" style="color: var(--text-4);">
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
          <NuxtLink to="/login" class="auth-link ml-1">
            {{ i18n.t({ uz: 'Kirish', kr: 'Кириш' }) }}
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
/* DIQQAT: bu blok login.vue dagi bilan ATAYLAB bir xil. Ikkisini umumiy
   faylga chiqarish mumkin edi, lekin `scoped` uslublar komponentlar orasida
   ulashilmaydi — global CSS'ga chiqarish esa auth sahifalariga tegishli
   klasslarni butun saytga tarqatardi. */
.auth-side { background: var(--canvas); }

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
.field::placeholder { color: var(--text-muted); }
.field:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 4px var(--primary-ring);
}
.field[aria-invalid='true'] { border-color: var(--danger); }

.field-err  { font-size: 12px; margin-top: 0.375rem; color: var(--danger-ink); }
.field-hint { font-size: 12px; margin-top: 0.375rem; color: var(--text-4); }

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
