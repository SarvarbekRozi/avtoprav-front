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

// Limitga urilgan paytdagi taklif — narxlar config/payme.php bilan bir xil.
const bestTariff = {
  id: '1month',
  price: '45 000',
  perDay: '1 500',
  period: { uz: '1 oy', kr: '1 ой' },
}
const offer = ref<typeof bestTariff | null>(null)

const limitBenefits = computed(() => [
  i18n.t({ uz: 'Bugun ham, ertaga ham cheksiz test', kr: 'Бугун ҳам, эртага ҳам чексиз тест' }),
  i18n.t({ uz: 'Imtihon rejimida vaqt bilan mashq', kr: 'Имтиҳон режимида вақт билан машқ' }),
  i18n.t({ uz: 'Xatolaringiz ustida alohida ishlash', kr: 'Хатоларингиз устида алоҳида ишлаш' }),
  i18n.t({ uz: 'AI qaysi mavzudan boshlashni aytadi', kr: 'AI қайси мавзудан бошлашни айтади' }),
])

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

    <!--
      Odam aynan CHEKLOVGA duch kelgan payt — taklifni shu yerda ko'rsatamiz.
      Tariflar sahifasiga havola berib yuborish o'rniga narx va tugma shu
      yerda turadi, chunki xohish aynan shu daqiqada eng kuchli.
    -->
    <template v-else-if="limitReached">
      <div class="text-4xl mb-3" aria-hidden="true">🚦</div>
      <div class="text-lg font-semibold text-ink-900 mb-1">
        {{ i18n.t({ uz: 'Bugungi bepul testlar tugadi', kr: 'Бугунги бепул тестлар тугади' }) }}
      </div>
      <p class="text-sm mb-5" style="color: var(--text-3)">
        {{ i18n.t({
          uz: `Zo'r ishladingiz! Ertaga yana ${dailyLimit} ta bepul test ochiladi — yoki hoziroq davom eting.`,
          kr: `Зўр ишладингиз! Эртага яна ${dailyLimit} та бепул тест очилади — ёки ҳозироқ давом этинг.`
        }) }}
      </p>

      <div class="limit-card text-left">
        <div class="text-2xs font-semibold uppercase tracking-[0.12em]" style="color: rgba(255,255,255,0.55)">
          {{ i18n.t({ uz: 'Premium bilan', kr: 'Премиум билан' }) }}
        </div>
        <ul class="mt-3 space-y-2 text-sm">
          <li v-for="b in limitBenefits" :key="b" class="flex items-start gap-2.5">
            <span class="tick-dark"><AppIcon name="check" :size="10" /></span>
            <span style="color: rgba(255,255,255,0.88)">{{ b }}</span>
          </li>
        </ul>

        <button type="button" class="limit-cta" @click="offer = bestTariff">
          🚀 {{ i18n.t({ uz: 'Premiumni boshlash', kr: 'Премиумни бошлаш' }) }}
        </button>
        <div class="mt-2 text-center text-2xs" style="color: rgba(255,255,255,0.55)">
          {{ bestTariff.price }} {{ i18n.t({ uz: 'so\'m / 1 oy · ≈ 1 500 so\'m kuniga', kr: 'сўм / 1 ой · ≈ 1 500 сўм кунига' }) }}
        </div>
      </div>

      <div class="mt-4 flex items-center justify-center gap-2">
        <NuxtLink to="/pricing" class="btn-outline">
          {{ i18n.t({ uz: 'Barcha tariflar', kr: 'Барча тарифлар' }) }}
        </NuxtLink>
        <NuxtLink to="/" class="btn-outline">{{ i18n.t({ uz: 'Bosh sahifa', kr: 'Бош саҳифа' }) }}</NuxtLink>
      </div>

      <PremiumOfferModal :open="offer !== null" :tariff="offer" @close="offer = null" />
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

<style scoped>
.limit-card {
  border-radius: 1.25rem;
  padding: 1.25rem;
  background: #0e1016;
  box-shadow: 0 20px 48px -18px rgba(15, 23, 42, 0.45);
}

.tick-dark {
  width: 1rem; height: 1rem; border-radius: 9999px;
  display: grid; place-items: center; flex-shrink: 0; margin-top: 0.125rem;
  background: rgba(255, 255, 255, 0.14);
  color: #6ee7b7;
}

.limit-cta {
  width: 100%;
  height: 3rem;
  margin-top: 1.15rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border-radius: 0.75rem;
  font-weight: 600;
  font-size: 1rem;
  color: #3d2c00;
  background: linear-gradient(180deg, #fcd34d, #f5b820);
  box-shadow: 0 8px 20px -8px rgba(245, 184, 32, 0.7);
  transition: filter .15s, transform .15s;
}
.limit-cta:hover { filter: brightness(1.04); transform: translateY(-1px); }
.limit-cta:active { transform: translateY(0); }
</style>
