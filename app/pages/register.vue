<script setup lang="ts">
definePageMeta({ middleware: 'guest' })

const auth = useAuthStore()
const i18n = useI18n()

const form = reactive({
  login: '',
  full_name: '',
  email: '',
  phone: '',
  password: '',
  password_confirmation: '',
})
const errors = ref<Record<string, string[]>>({})
const error = ref('')

async function submit() {
  errors.value = {}
  error.value = ''
  try {
    await auth.register({ ...form, locale: i18n.locale.value })
    await navigateTo('/')
  } catch (e: any) {
    if (e?.data?.errors) errors.value = e.data.errors
    else error.value = e?.data?.message || i18n.t({ uz: 'Xatolik yuz berdi', kr: 'Хатолик юз берди' })
  }
}
</script>

<template>
  <div class="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-12">
    <div class="w-full max-w-lg">
      <div class="text-center mb-8">
        <div class="inline-flex w-11 h-11 rounded-2xl bg-ink-900 text-white items-center justify-center text-lg font-bold tracking-tight mb-4">A</div>
        <h1 class="text-2xl font-semibold tracking-tightish text-ink-900">
          {{ i18n.t({ uz: 'Ro\'yxatdan o\'tish', kr: 'Рўйхатдан ўтиш' }) }}
        </h1>
        <p class="text-sm text-ink-500 mt-1.5">
          {{ i18n.t({ uz: 'Bepul hisob yarating va testlarni boshlang', kr: 'Бепул ҳисоб яратинг ва тестларни бошланг' }) }}
        </p>
      </div>

      <div class="card p-6 sm:p-8">
        <div v-if="error" class="mb-5 px-3.5 py-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-sm">
          {{ error }}
        </div>

        <form @submit.prevent="submit" class="space-y-4">
          <div>
            <label class="label">{{ i18n.t({ uz: 'Login', kr: 'Логин' }) }} <span class="text-rose-500">*</span></label>
            <input v-model="form.login" required class="input" placeholder="ali2024" autocomplete="username">
            <div v-if="errors.login" class="err">{{ errors.login[0] }}</div>
          </div>
          <div>
            <label class="label">{{ i18n.t({ uz: 'F.I.Sh.', kr: 'Ф.И.Ш.' }) }}</label>
            <input v-model="form.full_name" class="input" :placeholder="i18n.t({ uz: 'Aliyev Ali Akbarovich', kr: 'Алиев Али Акбарович' })" autocomplete="name">
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="label">Email</label>
              <input v-model="form.email" type="email" class="input" placeholder="ali@example.com" autocomplete="email">
              <div v-if="errors.email" class="err">{{ errors.email[0] }}</div>
            </div>
            <div>
              <label class="label">{{ i18n.t({ uz: 'Telefon', kr: 'Телефон' }) }}</label>
              <input v-model="form.phone" class="input" placeholder="+998 90 123 45 67" autocomplete="tel">
            </div>
          </div>
          <div>
            <label class="label">{{ i18n.t({ uz: 'Parol', kr: 'Парол' }) }} <span class="text-rose-500">*</span></label>
            <input v-model="form.password" type="password" required class="input" placeholder="••••••••" autocomplete="new-password">
            <div v-if="errors.password" class="err">{{ errors.password[0] }}</div>
            <div v-else class="hint">{{ i18n.t({ uz: 'Kamida 8 ta belgi', kr: 'Камида 8 та белги' }) }}</div>
          </div>
          <div>
            <label class="label">{{ i18n.t({ uz: 'Parolni takrorlang', kr: 'Паролни такрорланг' }) }} <span class="text-rose-500">*</span></label>
            <input v-model="form.password_confirmation" type="password" required class="input" placeholder="••••••••" autocomplete="new-password">
          </div>
          <button :disabled="auth.loading" class="btn-primary btn-lg w-full mt-2">
            <span v-if="auth.loading" class="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            <span v-else>{{ i18n.t({ uz: 'Hisob yaratish', kr: 'Ҳисоб яратиш' }) }}</span>
          </button>

          <p class="text-xs text-ink-500 text-center mt-2">
            {{ i18n.t({
              uz: 'Ro\'yxatdan o\'tish orqali siz xizmat shartlariga rozilik bildirasiz.',
              kr: 'Рўйхатдан ўтиш орқали сиз хизмат шартларига розилик билдирасиз.'
            }) }}
          </p>
        </form>
      </div>

      <div class="text-center mt-6 text-sm text-ink-500">
        {{ i18n.t({ uz: 'Hisobingiz bormi?', kr: 'Ҳисобингиз борми?' }) }}
        <NuxtLink to="/login" class="text-ink-900 font-medium ml-1 hover:underline underline-offset-4">
          {{ i18n.t({ uz: 'Kirish', kr: 'Кириш' }) }}
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
