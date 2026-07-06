<script setup lang="ts">
const i18n = useI18n()
const auth = useAuthStore()

const isPremium = computed(() => auth.user?.is_premium ?? false)
const isGuest = computed(() => auth.user?.is_guest ?? false)
const dailyLimit = computed(() => auth.user?.daily_tests?.limit ?? 2)

// Payment isn't wired up yet — the CTA reveals a "coming soon" note instead.
// Guests must register first (progress is kept), per the product flow.
const showSoon = ref(false)

async function onPremiumClick() {
  // No account (or anonymous guest) → register first, then come back here
  if (!auth.user || auth.user.is_guest) {
    await navigateTo('/register?redirect=/pricing')
    return
  }
  showSoon.value = !showSoon.value
}

const freeFeatures = computed(() => [
  i18n.t({ uz: `Har kuni ${dailyLimit.value} ta test`, kr: `Ҳар куни ${dailyLimit.value} та тест` }),
  i18n.t({ uz: 'Barcha rejimlar: imtihon, bilet, mavzu, marafon…', kr: 'Барча режимлар: имтиҳон, билет, мавзу, марафон…' }),
  i18n.t({ uz: 'Barcha 63 bilet va mavzular', kr: 'Барча 63 билет ва мавзулар' }),
  i18n.t({ uz: 'AI izohlar va shaxsiy tavsiyalar', kr: 'AI изоҳлар ва шахсий тавсиялар' }),
  i18n.t({ uz: 'Statistika, seriya (streak), XP va reyting', kr: 'Статистика, серия (streak), XP ва рейтинг' }),
])

const premiumFeatures = computed(() => [
  i18n.t({ uz: 'Cheksiz testlar — kunlik cheklovsiz', kr: 'Чексиз тестлар — кунлик чекловсиз' }),
  i18n.t({ uz: 'Bepul tarifdagi hamma narsa', kr: 'Бепул тарифдаги ҳамма нарса' }),
  i18n.t({ uz: 'Istalgan payt, istalgancha mashq', kr: 'Исталган пайт, исталганча машқ' }),
  i18n.t({ uz: 'Loyiha rivojini qo\'llab-quvvatlaysiz', kr: 'Лойиҳа ривожини қўллаб-қувватлайсиз' }),
])
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 py-12">
    <div class="text-center mb-10">
      <div class="eyebrow">{{ i18n.t({ uz: 'Tariflar', kr: 'Тарифлар' }) }}</div>
      <h1 class="text-3xl sm:text-4xl font-semibold tracking-tightest text-ink-900 mt-2">
        {{ i18n.t({ uz: 'Sodda va halol', kr: 'Содда ва ҳалол' }) }}
      </h1>
      <p class="mt-3 max-w-xl mx-auto text-ink-500">
        {{ i18n.t({
          uz: `Hammasi bepul — har kuni ${dailyLimit} ta test. Ko'proq mashq qilmoqchimisiz? Premium bilan cheksiz.`,
          kr: `Ҳаммаси бепул — ҳар куни ${dailyLimit} та тест. Кўпроқ машқ қилмоқчимисиз? Премиум билан чексиз.`
        }) }}
      </p>
    </div>

    <!-- Plans -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
      <!-- Free -->
      <div class="card p-6">
        <div class="text-xs font-semibold uppercase tracking-[0.12em]" style="color: #5f6470">
          {{ i18n.t({ uz: 'Hozir foydalanayotganingiz', kr: 'Ҳозир фойдаланаётганингиз' }) }}
        </div>
        <div class="mt-1 text-xl font-semibold tracking-tightish text-ink-900">
          {{ i18n.t({ uz: 'Bepul', kr: 'Бепул' }) }}
        </div>

        <div class="mt-5 flex items-baseline gap-1.5">
          <span class="text-3xl sm:text-4xl font-semibold tabular-nums tracking-tightest text-ink-900">0</span>
          <span class="text-sm text-ink-500">{{ i18n.t({ uz: 'so\'m', kr: 'сўм' }) }}</span>
        </div>

        <ul class="mt-6 space-y-2.5 text-sm">
          <li v-for="f in freeFeatures" :key="f" class="flex items-start gap-2.5">
            <span class="w-4 h-4 rounded-full grid place-items-center flex-shrink-0 mt-0.5"
                  style="background: #d1fae5; color: #047857">
              <AppIcon name="check" :size="10" />
            </span>
            <span style="color: #2f3340">{{ f }}</span>
          </li>
        </ul>
      </div>

      <!-- Premium -->
      <div class="relative rounded-2xl p-6"
           style="background: #0e1016; color: #fff; border: 1px solid #0e1016; box-shadow: 0 16px 48px -16px rgba(15,23,42,0.35);">
        <div class="absolute -top-3 left-1/2 -translate-x-1/2 badge" style="background: #fef3c7; color: #92400e;">
          <AppIcon name="spark" :size="10" /> {{ i18n.t({ uz: 'Cheksiz mashq', kr: 'Чексиз машқ' }) }}
        </div>

        <div class="text-xs font-semibold uppercase tracking-[0.12em]" style="color: rgba(255,255,255,0.55)">
          {{ i18n.t({ uz: 'Jiddiy tayyorgarlik uchun', kr: 'Жиддий тайёргарлик учун' }) }}
        </div>
        <div class="mt-1 text-xl font-semibold tracking-tightish text-white">Premium</div>

        <div class="mt-5 flex items-baseline gap-1.5">
          <span class="text-3xl sm:text-4xl font-semibold tabular-nums tracking-tightest text-white">29 000</span>
          <span class="text-sm text-white/55">{{ i18n.t({ uz: 'so\'m / oy', kr: 'сўм / ой' }) }}</span>
        </div>

        <div v-if="isPremium"
             class="btn-lg w-full mt-5 inline-flex items-center justify-center gap-2 px-4 rounded-xl font-medium text-base"
             style="background: rgba(110,231,183,0.15); color: #6ee7b7;">
          <AppIcon name="check" :size="16" />
          {{ i18n.t({ uz: 'Sizda Premium faol', kr: 'Сизда Премиум фаол' }) }}
        </div>
        <template v-else>
          <button @click="onPremiumClick"
                  class="btn-lg w-full mt-5 inline-flex items-center justify-center gap-2 px-4 rounded-xl font-medium text-base"
                  style="background: #fff; color: #0e1016;">
            <AppIcon name="spark" :size="15" />
            {{ i18n.t({ uz: 'Premium olish', kr: 'Премиум олиш' }) }}
          </button>
          <div v-if="isGuest" class="mt-3 px-3.5 py-2.5 rounded-lg text-xs leading-relaxed"
               style="background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.75);">
            {{ i18n.t({
              uz: 'Premium olish uchun avval ro\'yxatdan o\'tasiz — progressingiz to\'liq saqlanib qoladi.',
              kr: 'Премиум олиш учун аввал рўйхатдан ўтасиз — прогрессингиз тўлиқ сақланиб қолади.'
            }) }}
          </div>
          <div v-else-if="showSoon" class="mt-3 px-3.5 py-2.5 rounded-lg text-xs leading-relaxed"
               style="background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.75);">
            {{ i18n.t({
              uz: 'Onlayn to\'lov tez orada ishga tushadi. Hozircha Premium administrator orqali faollashtiriladi.',
              kr: 'Онлайн тўлов тез орада ишга тушади. Ҳозирча Премиум администратор орқали фаоллаштирилади.'
            }) }}
          </div>
        </template>

        <ul class="mt-6 space-y-2.5 text-sm">
          <li v-for="f in premiumFeatures" :key="f" class="flex items-start gap-2.5">
            <span class="w-4 h-4 rounded-full grid place-items-center flex-shrink-0 mt-0.5"
                  style="background: rgba(255,255,255,0.12); color: #6ee7b7">
              <AppIcon name="check" :size="10" />
            </span>
            <span class="text-white">{{ f }}</span>
          </li>
        </ul>
      </div>
    </div>

    <p class="text-center text-2xs text-ink-500 mt-8">
      {{ i18n.t({
        uz: 'Yashirin to\'lovlar yo\'q. Bepul tarif doim bepul qoladi.',
        kr: 'Яширин тўловлар йўқ. Бепул тариф доим бепул қолади.'
      }) }}
    </p>
  </div>
</template>
