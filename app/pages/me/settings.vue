<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const i18n = useI18n()
const theme = useTheme()
const auth = useAuthStore()

const langs = [
  { id: 'uz_latn', label: 'O\'zbekcha (lotin)' },
  { id: 'uz_cyrl', label: 'Ўзбекча (кирилл)' },
] as const

const themeOptions = computed(() => [
  { id: 'light', label: i18n.t({ uz: 'Yorug\'', kr: 'Ёруғ' }), icon: 'sun' },
  { id: 'dark', label: i18n.t({ uz: 'Qorong\'i', kr: 'Қоронғи' }), icon: 'moon' },
  { id: 'auto', label: i18n.t({ uz: 'Avtomatik', kr: 'Автоматик' }), icon: 'settings' },
] as const)

// Local notification preferences (used when push/in-app notifications ship)
const notifyDaily = useCookie<string>('notify_daily', { default: () => '1', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' })
const notifyAch = useCookie<string>('notify_ach', { default: () => '1', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' })
function toggle(c: Ref<string>) { c.value = c.value === '1' ? '0' : '1' }

async function setLang(l: 'uz_latn' | 'uz_cyrl') { await i18n.setLocale(l) }

async function logout() {
  await auth.logout()
  await navigateTo('/login')
}
</script>

<template>
  <div class="max-w-2xl mx-auto px-4 sm:px-6 py-10" v-if="auth.user">
    <div class="mb-7">
      <div class="eyebrow">{{ i18n.t({ uz: 'Sozlamalar', kr: 'Созламалар' }) }}</div>
      <h1 class="text-3xl font-semibold tracking-tightest text-ink-900 mt-1.5">
        {{ i18n.t({ uz: 'Sozlamalar', kr: 'Созламалар' }) }}
      </h1>
    </div>

    <div class="space-y-5">
      <!-- Language -->
      <div class="card p-6">
        <div class="flex items-center gap-2 mb-4">
          <AppIcon name="globe" :size="18" class="text-ink-500" />
          <div class="text-base font-semibold text-ink-900">{{ i18n.t({ uz: 'Til', kr: 'Тил' }) }}</div>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <button v-for="l in langs" :key="l.id" type="button" @click="setLang(l.id)"
            class="px-4 h-11 rounded-xl border text-sm font-medium transition-all"
            :class="i18n.locale.value === l.id ? 'border-ink-900 bg-ink-900 text-white' : 'border-ink-200 text-ink-700 hover:border-ink-400'">
            {{ l.label }}
          </button>
        </div>
      </div>

      <!-- Theme -->
      <div class="card p-6">
        <div class="flex items-center gap-2 mb-4">
          <AppIcon name="sun" :size="18" class="text-ink-500" />
          <div class="text-base font-semibold text-ink-900">{{ i18n.t({ uz: 'Mavzu (tema)', kr: 'Мавзу (тема)' }) }}</div>
        </div>
        <div class="grid grid-cols-3 gap-2">
          <button v-for="t in themeOptions" :key="t.id" type="button" @click="theme.setMode(t.id)"
            class="px-3 h-11 rounded-xl border text-sm font-medium transition-all inline-flex items-center justify-center gap-1.5"
            :class="theme.mode.value === t.id ? 'border-ink-900 bg-ink-900 text-white' : 'border-ink-200 text-ink-700 hover:border-ink-400'">
            <AppIcon :name="t.icon" :size="14" /> {{ t.label }}
          </button>
        </div>
      </div>

      <!-- Notifications -->
      <div class="card p-6">
        <div class="flex items-center gap-2 mb-4">
          <AppIcon name="bell" :size="18" class="text-ink-500" />
          <div class="text-base font-semibold text-ink-900">{{ i18n.t({ uz: 'Bildirishnomalar', kr: 'Билдиришномалар' }) }}</div>
        </div>
        <div class="space-y-3">
          <label class="flex items-center justify-between cursor-pointer">
            <span class="text-sm text-ink-700">{{ i18n.t({ uz: 'Kunlik mashq eslatmasi', kr: 'Кунлик машқ эслатмаси' }) }}</span>
            <button type="button" @click="toggle(notifyDaily)"
              class="w-11 h-6 rounded-full transition-colors relative flex-shrink-0"
              :style="{ background: notifyDaily === '1' ? 'var(--text-1)' : 'var(--surface-inset)' }">
              <span class="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all" :style="{ left: notifyDaily === '1' ? '22px' : '2px' }"></span>
            </button>
          </label>
          <label class="flex items-center justify-between cursor-pointer">
            <span class="text-sm text-ink-700">{{ i18n.t({ uz: 'Yutuq bildirishnomalari', kr: 'Ютуқ билдиришномалари' }) }}</span>
            <button type="button" @click="toggle(notifyAch)"
              class="w-11 h-6 rounded-full transition-colors relative flex-shrink-0"
              :style="{ background: notifyAch === '1' ? 'var(--text-1)' : 'var(--surface-inset)' }">
              <span class="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all" :style="{ left: notifyAch === '1' ? '22px' : '2px' }"></span>
            </button>
          </label>
        </div>
      </div>

      <!-- Account -->
      <div class="card p-6">
        <div class="flex items-center gap-2 mb-4">
          <AppIcon name="user" :size="18" class="text-ink-500" />
          <div class="text-base font-semibold text-ink-900">{{ i18n.t({ uz: 'Hisob', kr: 'Ҳисоб' }) }}</div>
        </div>
        <div class="flex items-center justify-between flex-wrap gap-3">
          <div class="text-sm text-ink-500">
            <template v-if="auth.user.is_guest">{{ i18n.t({ uz: 'Mehmon hisobi', kr: 'Меҳмон ҳисоби' }) }}</template>
            <template v-else>@{{ auth.user.login }}</template>
            <span v-if="auth.user.is_premium" class="badge-warn ml-1"><AppIcon name="spark" :size="10" /> Premium</span>
          </div>
          <div class="flex items-center gap-2">
            <template v-if="auth.user.is_guest">
              <NuxtLink to="/register" class="btn-primary">{{ i18n.t({ uz: 'Ro\'yxatdan o\'tish', kr: 'Рўйхатдан ўтиш' }) }}</NuxtLink>
              <NuxtLink to="/login" class="btn-outline">{{ i18n.t({ uz: 'Hisobga kirish', kr: 'Ҳисобга кириш' }) }}</NuxtLink>
            </template>
            <template v-else>
              <NuxtLink to="/me/profile" class="btn-outline">{{ i18n.t({ uz: 'Profil', kr: 'Профил' }) }}</NuxtLink>
              <button type="button" @click="logout" class="btn-outline text-rose-600 border-rose-200 hover:border-rose-400">
                {{ i18n.t({ uz: 'Chiqish', kr: 'Чиқиш' }) }}
              </button>
            </template>
          </div>
        </div>
      </div>

      <!-- Contact / Telegram channel -->
      <div class="card p-6">
        <div class="flex items-center gap-2 mb-4">
          <AppIcon name="send" :size="18" class="text-ink-500" />
          <div class="text-base font-semibold text-ink-900">{{ i18n.t({ uz: 'Bog\'lanish', kr: 'Боғланиш' }) }}</div>
        </div>
        <a href="https://t.me/avtoprav_uz" target="_blank" rel="noopener"
           class="flex items-center gap-3 -mx-2 px-2 py-2 rounded-xl transition-colors hover:bg-ink-50 group">
          <span class="w-10 h-10 rounded-xl grid place-items-center flex-shrink-0 text-white" style="background: #229ED9;">
            <AppIcon name="send" :size="18" />
          </span>
          <div class="min-w-0 flex-1">
            <div class="text-sm font-semibold text-ink-900">@avtoprav_uz</div>
            <div class="text-xs mt-0.5" style="color: var(--text-3);">
              {{ i18n.t({ uz: 'Taklif va murojaatlar uchun, yangiliklardan xabardor bo\'ling', kr: 'Таклиф ва мурожаатлар учун, янгиликлардан хабардор бўлинг' }) }}
            </div>
          </div>
          <AppIcon name="chev-r" :size="16" class="text-ink-300 flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
        </a>
      </div>
    </div>
  </div>
</template>
