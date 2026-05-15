<script setup lang="ts">
const auth = useAuthStore()
const i18n = useI18n()
const route = useRoute()
const mobileMenu = ref(false)
const profileMenu = ref(false)
const profileRef = ref<HTMLElement | null>(null)

const navLinks = computed(() => {
  if (!auth.user) return []
  return [
    { to: '/',            label: i18n.t({ uz: 'Bosh sahifa', kr: 'Бош саҳифа' }) },
    { to: '/tickets',     label: i18n.t({ uz: 'Biletlar',    kr: 'Билетлар' }) },
    { to: '/topics',      label: i18n.t({ uz: 'Mavzular',    kr: 'Мавзулар' }) },
    { to: '/me/stats',    label: i18n.t({ uz: 'Statistika',  kr: 'Статистика' }) },
    { to: '/me/mistakes', label: i18n.t({ uz: 'Xatolar',     kr: 'Хатолар' }) },
  ]
})

async function changeLocale(value: 'uz_latn' | 'uz_cyrl') {
  await i18n.setLocale(value)
}

async function logout() {
  await auth.logout()
  await navigateTo('/login')
}

function onDocClick(e: MouseEvent) {
  if (profileMenu.value && profileRef.value && !profileRef.value.contains(e.target as Node)) {
    profileMenu.value = false
  }
}
onMounted(() => document.addEventListener('click', onDocClick))
onBeforeUnmount(() => document.removeEventListener('click', onDocClick))

const initials = computed(() => {
  const src = auth.user?.full_name || auth.user?.login || ''
  return src
    .split(/\s+/).filter(Boolean).slice(0, 2)
    .map(s => s[0]?.toUpperCase()).join('') || '·'
})
</script>

<template>
  <div class="min-h-screen flex flex-col bg-white">
    <header class="sticky top-0 z-30 bg-white/85 backdrop-blur border-b border-ink-200/70">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        <NuxtLink to="/" class="flex items-center gap-2.5">
          <div class="w-7 h-7 rounded-lg bg-ink-900 text-white flex items-center justify-center text-sm font-bold tracking-tight">A</div>
          <span class="font-semibold tracking-tightish text-ink-900">AutoTest</span>
        </NuxtLink>

        <nav class="hidden md:flex items-center gap-0.5">
          <NuxtLink v-for="link in navLinks" :key="link.to" :to="link.to"
            class="px-3 h-8 inline-flex items-center rounded-md text-sm font-medium transition-colors"
            :class="route.path === link.to
              ? 'text-ink-900 bg-ink-100'
              : 'text-ink-600 hover:text-ink-900 hover:bg-ink-50'">
            {{ link.label }}
          </NuxtLink>
        </nav>

        <div class="flex items-center gap-2">
          <div class="hidden sm:flex items-center bg-ink-100 rounded-md p-0.5 text-xs font-medium">
            <button @click="changeLocale('uz_latn')"
              :class="i18n.locale.value === 'uz_latn' ? 'bg-white shadow-soft text-ink-900' : 'text-ink-500 hover:text-ink-700'"
              class="px-2 py-1 rounded">Lotin</button>
            <button @click="changeLocale('uz_cyrl')"
              :class="i18n.locale.value === 'uz_cyrl' ? 'bg-white shadow-soft text-ink-900' : 'text-ink-500 hover:text-ink-700'"
              class="px-2 py-1 rounded">Кирилл</button>
          </div>

          <template v-if="auth.user">
            <StreakBadge compact />

            <div ref="profileRef" class="relative">
              <button @click="profileMenu = !profileMenu"
                class="flex items-center gap-2 h-9 pl-1 pr-2 rounded-full hover:bg-ink-50 transition">
                <div class="w-7 h-7 rounded-full bg-ink-900 text-white grid place-items-center text-xs font-semibold">
                  {{ initials }}
                </div>
                <span class="hidden sm:inline text-sm text-ink-700 max-w-[120px] truncate">
                  {{ auth.user.full_name || auth.user.login }}
                </span>
                <svg class="w-3.5 h-3.5 text-ink-400 transition-transform" :class="{ 'rotate-180': profileMenu }" viewBox="0 0 12 12" fill="none">
                  <path d="M3 4.5 6 7.5l3-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>

              <div v-if="profileMenu"
                class="absolute right-0 mt-2 w-56 card shadow-lift py-1.5 anim-in z-40 origin-top-right">
                <div class="px-3 py-2 border-b border-ink-200/70">
                  <div class="text-sm font-medium text-ink-900 truncate">{{ auth.user.full_name || auth.user.login }}</div>
                  <div class="text-xs text-ink-500 truncate">{{ auth.user.email || auth.user.login }}</div>
                </div>
                <NuxtLink to="/me/profile" @click="profileMenu = false"
                  class="flex items-center gap-2 px-3 py-2 text-sm text-ink-700 hover:bg-ink-50">
                  {{ i18n.t({ uz: 'Profil', kr: 'Профил' }) }}
                </NuxtLink>
                <NuxtLink to="/me/bookmarks" @click="profileMenu = false"
                  class="flex items-center gap-2 px-3 py-2 text-sm text-ink-700 hover:bg-ink-50">
                  {{ i18n.t({ uz: 'Saqlanganlar', kr: 'Сақланганлар' }) }}
                </NuxtLink>
                <NuxtLink to="/me/stats" @click="profileMenu = false"
                  class="flex items-center gap-2 px-3 py-2 text-sm text-ink-700 hover:bg-ink-50">
                  {{ i18n.t({ uz: 'Statistika', kr: 'Статистика' }) }}
                </NuxtLink>
                <div class="my-1 divider"></div>
                <button @click="logout"
                  class="w-full text-left px-3 py-2 text-sm text-rose-600 hover:bg-rose-50">
                  {{ i18n.t({ uz: 'Chiqish', kr: 'Чиқиш' }) }}
                </button>
              </div>
            </div>
          </template>
          <template v-else>
            <NuxtLink to="/login" class="btn-ghost text-sm">{{ i18n.t({ uz: 'Kirish', kr: 'Кириш' }) }}</NuxtLink>
            <NuxtLink to="/register" class="btn-primary text-sm">{{ i18n.t({ uz: 'Ro\'yxatdan o\'tish', kr: 'Рўйхатдан ўтиш' }) }}</NuxtLink>
          </template>

          <button class="md:hidden btn-ghost h-9 px-2.5" @click="mobileMenu = !mobileMenu" aria-label="Menu">
            <svg class="w-5 h-5" viewBox="0 0 20 20" fill="none">
              <path d="M3 6h14M3 10h14M3 14h14" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
      </div>

      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0 -translate-y-1"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0">
        <div v-if="mobileMenu" class="md:hidden border-t border-ink-200/70 bg-white">
          <nav class="px-2 py-2 flex flex-col">
            <NuxtLink v-for="link in navLinks" :key="link.to" :to="link.to"
              class="px-3 py-2.5 rounded-md text-sm font-medium"
              :class="route.path === link.to ? 'bg-ink-100 text-ink-900' : 'text-ink-700 hover:bg-ink-50'"
              @click="mobileMenu = false">{{ link.label }}</NuxtLink>
          </nav>
        </div>
      </Transition>
    </header>

    <main class="flex-1">
      <slot />
    </main>

    <footer class="border-t border-ink-200/70 mt-12">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-ink-500">
        <div class="flex items-center gap-2.5">
          <div class="w-5 h-5 rounded bg-ink-900 text-white grid place-items-center text-2xs font-bold">A</div>
          <span>© {{ new Date().getFullYear() }} AutoTest</span>
        </div>
        <div>{{ i18n.t({ uz: 'Yo\'l harakati testlari · O\'zbekiston', kr: 'Йўл ҳаракати тестлари · Ўзбекистон' }) }}</div>
      </div>
    </footer>
  </div>
</template>
