<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const route = useRoute()
const i18n = useI18n()
const mode = route.params.mode as string

const auth = useAuthStore()

const error = ref('')
const starting = ref(true)
const limitReached = ref(false)
const dailyLimit = ref(2)

const params: Record<string, any> = { mode }
if (route.query.topic_id)  params.topic_id  = Number(route.query.topic_id)
if (route.query.ticket_id) params.ticket_id = Number(route.query.ticket_id)
if (route.query.count)     params.count     = Number(route.query.count)

onMounted(async () => {
  try {
    const res = await apiFetch<{ attempt_id: number, daily_tests?: { limit: number | null, used_today: number } }>(
      '/test/start', { method: 'POST', body: params },
    )
    if (res.daily_tests && auth.user) auth.user.daily_tests = res.daily_tests
    await navigateTo(`/test/play/${res.attempt_id}`)
  } catch (e: any) {
    const status = e?.statusCode || e?.response?.status
    if (status === 403 && e?.data?.code === 'daily_limit_reached') {
      limitReached.value = true
      dailyLimit.value = e.data.limit ?? 2
      if (auth.user) auth.user.daily_tests = { limit: e.data.limit ?? 2, used_today: e.data.used_today ?? e.data.limit ?? 2 }
    }
    error.value = e?.data?.message || i18n.t({ uz: 'Test boshlanmadi', kr: 'Тест бошланмади' })
    starting.value = false
  }
})
</script>

<template>
  <div class="max-w-md mx-auto px-4 py-24 text-center">
    <template v-if="starting">
      <div class="inline-flex w-12 h-12 rounded-2xl bg-ink-900 text-white items-center justify-center mb-6">
        <svg class="w-5 h-5 animate-spin" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="7.5" stroke="currentColor" stroke-width="2" stroke-opacity="0.25"/>
          <path d="M17.5 10A7.5 7.5 0 0 0 10 2.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </div>
      <div class="text-lg font-semibold text-ink-900 mb-1">
        {{ i18n.t({ uz: 'Test tayyorlanmoqda', kr: 'Тест тайёрланмоқда' }) }}
      </div>
      <p class="text-sm text-ink-500">
        {{ i18n.t({ uz: 'Savollarni yuklayapmiz...', kr: 'Саволларни юклаяпмиз...' }) }}
      </p>
    </template>

    <template v-else-if="limitReached">
      <div class="text-5xl mb-4" aria-hidden="true">🎉</div>
      <div class="text-lg font-semibold text-ink-900 mb-1">
        {{ i18n.t({ uz: 'Bugungi bepul testlar tugadi', kr: 'Бугунги бепул тестлар тугади' }) }}
      </div>
      <p class="text-sm text-ink-500 mb-2">
        {{ i18n.t({ uz: `Zo'r ishladingiz! Ertaga yana ${dailyLimit} ta bepul test olasiz.`, kr: `Зўр ишладингиз! Эртага яна ${dailyLimit} та бепул тест оласиз.` }) }}
      </p>
      <p class="text-sm text-ink-500 mb-6">
        {{ i18n.t({ uz: 'To\'xtamasdan mashq qilishni istaysizmi? Premium — cheksiz testlar.', kr: 'Тўхтамасдан машқ қилишни истайсизми? Премиум — чексиз тестлар.' }) }}
      </p>
      <div class="flex items-center justify-center gap-2">
        <NuxtLink to="/pricing" class="btn-gradient">
          <AppIcon name="spark" :size="14" /> {{ i18n.t({ uz: 'Premium haqida', kr: 'Премиум ҳақида' }) }}
        </NuxtLink>
        <NuxtLink to="/" class="btn-outline">{{ i18n.t({ uz: 'Bosh sahifa', kr: 'Бош саҳифа' }) }}</NuxtLink>
      </div>
    </template>

    <template v-else>
      <div class="inline-flex w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 items-center justify-center mb-6">
        <svg class="w-5 h-5" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="1.6"/>
          <path d="M10 6v5M10 13.5v.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
        </svg>
      </div>
      <div class="text-lg font-semibold text-ink-900 mb-1">
        {{ i18n.t({ uz: 'Test boshlanmadi', kr: 'Тест бошланмади' }) }}
      </div>
      <p class="text-sm text-rose-600 mb-6">{{ error }}</p>
      <NuxtLink to="/" class="btn-primary">
        {{ i18n.t({ uz: 'Bosh sahifaga qaytish', kr: 'Бош саҳифага қайтиш' }) }}
      </NuxtLink>
    </template>
  </div>
</template>
