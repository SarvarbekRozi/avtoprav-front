<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const route = useRoute()
const i18n = useI18n()
const mode = route.params.mode as string

const error = ref('')
const starting = ref(true)
const premiumRequired = ref(false)

const params: Record<string, any> = { mode }
if (route.query.topic_id)  params.topic_id  = Number(route.query.topic_id)
if (route.query.ticket_id) params.ticket_id = Number(route.query.ticket_id)
if (route.query.count)     params.count     = Number(route.query.count)

onMounted(async () => {
  try {
    const res = await apiFetch<{ attempt_id: number }>('/test/start', { method: 'POST', body: params })
    await navigateTo(`/test/play/${res.attempt_id}`)
  } catch (e: any) {
    if (e?.statusCode === 403 || e?.response?.status === 403) premiumRequired.value = true
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

    <template v-else-if="premiumRequired">
      <div class="inline-flex w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 items-center justify-center mb-6">
        <AppIcon name="spark" :size="22" />
      </div>
      <div class="text-lg font-semibold text-ink-900 mb-1">
        {{ i18n.t({ uz: 'Premium funksiya', kr: 'Премиум функция' }) }}
      </div>
      <p class="text-sm text-ink-500 mb-6">{{ error }}</p>
      <div class="flex items-center justify-center gap-2">
        <NuxtLink to="/pricing" class="btn-primary">
          <AppIcon name="spark" :size="14" /> {{ i18n.t({ uz: 'Premium olish', kr: 'Премиум олиш' }) }}
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
