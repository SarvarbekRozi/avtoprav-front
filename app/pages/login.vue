<script setup lang="ts">
definePageMeta({ middleware: 'guest' })

const auth = useAuthStore()
const i18n = useI18n()
const route = useRoute()

const form = reactive({ login: '', password: '' })
const error = ref('')
const showPwd = ref(false)

async function submit() {
  error.value = ''
  try {
    await auth.login(form)
    const redirect = (route.query.redirect as string) || '/'
    await navigateTo(redirect)
  } catch (e: any) {
    error.value = e?.data?.message || i18n.t({ uz: 'Xatolik yuz berdi', kr: 'Хатолик юз берди' })
  }
}
</script>

<template>
  <div class="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-12">
    <div class="w-full max-w-md">
      <div class="text-center mb-8">
        <div class="inline-flex w-11 h-11 rounded-2xl bg-ink-900 text-white items-center justify-center text-lg font-bold tracking-tight mb-4">A</div>
        <h1 class="text-2xl font-semibold tracking-tightish text-ink-900">
          {{ i18n.t({ uz: 'Hisobingizga kiring', kr: 'Ҳисобингизга киринг' }) }}
        </h1>
        <p class="text-sm text-ink-500 mt-1.5">
          {{ i18n.t({ uz: 'Haydovchilik imtihoniga tayyorlaning — har kuni 2 ta bepul test', kr: 'Ҳайдовчилик имтиҳонига тайёрланинг — ҳар куни 2 та бепул тест' }) }}
        </p>
      </div>

      <div class="card p-6 sm:p-8">
        <div v-if="error" class="mb-5 px-3.5 py-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-sm flex items-start gap-2">
          <svg class="w-4 h-4 flex-shrink-0 mt-0.5" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5"/>
            <path d="M8 5v3.5M8 10.75v.25" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          {{ error }}
        </div>

        <form @submit.prevent="submit" class="space-y-4">
          <div>
            <label class="label">{{ i18n.t({ uz: 'Login yoki email', kr: 'Логин ёки email' }) }}</label>
            <input v-model="form.login" required autofocus class="input" autocomplete="username" placeholder="ali2024">
          </div>
          <div>
            <label class="label flex items-center justify-between">
              <span>{{ i18n.t({ uz: 'Parol', kr: 'Парол' }) }}</span>
              <button type="button" @click="showPwd = !showPwd" class="text-xs text-ink-500 hover:text-ink-900 font-normal">
                {{ showPwd ? i18n.t({ uz: 'Yashirish', kr: 'Яшириш' }) : i18n.t({ uz: 'Ko\'rsatish', kr: 'Кўрсатиш' }) }}
              </button>
            </label>
            <input v-model="form.password" :type="showPwd ? 'text' : 'password'" required class="input" autocomplete="current-password" placeholder="••••••••">
          </div>
          <button :disabled="auth.loading" class="btn-primary btn-lg w-full mt-1">
            <span v-if="auth.loading" class="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            <span v-else>{{ i18n.t({ uz: 'Davom etish', kr: 'Давом этиш' }) }}</span>
          </button>
        </form>
      </div>

      <div class="text-center mt-6 text-sm text-ink-500">
        {{ i18n.t({ uz: 'Hisobingiz yo\'qmi?', kr: 'Ҳисобингиз йўқми?' }) }}
        <NuxtLink to="/register" class="text-ink-900 font-medium ml-1 hover:underline underline-offset-4">
          {{ i18n.t({ uz: 'Ro\'yxatdan o\'tish', kr: 'Рўйхатдан ўтиш' }) }}
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
