<script setup lang="ts">
const auth = useAuthStore()
const i18n = useI18n()
const theme = useTheme()
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
    { to: '/pricing',     label: i18n.t({ uz: 'Tariflar',    kr: 'Тарифлар' }) },
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
  <div class="min-h-screen flex flex-col">
    <header class="sticky top-0 z-30 backdrop-blur-md border-b"
            style="background: color-mix(in srgb, var(--surface) 70%, transparent); border-color: var(--border-soft);">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        <NuxtLink to="/" class="flex items-center gap-2.5">
          <div class="w-7 h-7 rounded-lg grid place-items-center text-sm font-bold tracking-tight"
               style="background: var(--text-1); color: var(--surface);">A</div>
          <span class="font-semibold tracking-tightish" style="color: var(--text-1);">Avtoprav</span>
        </NuxtLink>

        <nav class="hidden md:flex items-center gap-0.5">
          <NuxtLink v-for="link in navLinks" :key="link.to" :to="link.to"
            class="px-3 h-8 inline-flex items-center rounded-md text-sm font-medium transition-colors"
            :style="route.path === link.to
              ? { background: 'var(--surface-inset)', color: 'var(--text-1)' }
              : { color: 'var(--text-3)' }">
            {{ link.label }}
          </NuxtLink>
        </nav>

        <div class="flex items-center gap-2">
          <!-- Theme toggle -->
          <button @click="theme.toggle()"
                  class="h-8 w-8 rounded-md grid place-items-center transition-colors"
                  style="color: var(--text-3);"
                  :title="theme.isDark.value ? i18n.t({ uz: 'Yorug\' rejim', kr: 'Ёруғ режим' }) : i18n.t({ uz: 'Qorong\'i rejim', kr: 'Қоронғи режим' })"
                  @mouseenter="(e: any) => e.target.style.background = 'var(--surface-inset)'"
                  @mouseleave="(e: any) => e.target.style.background = ''">
            <!-- sun (light mode -> shows moon to switch to dark) -->
            <svg v-if="!theme.isDark.value" width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M13 9.5A5.5 5.5 0 0 1 6.5 3a5.5 5.5 0 1 0 6.5 6.5z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
            </svg>
            <svg v-else width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="3" stroke="currentColor" stroke-width="1.5"/>
              <path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3.5 3.5l1 1M11.5 11.5l1 1M3.5 12.5l1-1M11.5 4.5l1-1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </button>

          <div class="hidden sm:flex items-center rounded-md p-0.5 text-xs font-medium"
               style="background: var(--surface-inset);">
            <button @click="changeLocale('uz_latn')"
              class="px-2 py-1 rounded transition-colors"
              :style="i18n.locale.value === 'uz_latn'
                ? { background: 'var(--surface)', boxShadow: 'var(--shadow-soft)', color: 'var(--text-1)' }
                : { color: 'var(--text-3)' }">Lotin</button>
            <button @click="changeLocale('uz_cyrl')"
              class="px-2 py-1 rounded transition-colors"
              :style="i18n.locale.value === 'uz_cyrl'
                ? { background: 'var(--surface)', boxShadow: 'var(--shadow-soft)', color: 'var(--text-1)' }
                : { color: 'var(--text-3)' }">Кирилл</button>
          </div>

          <template v-if="auth.user">
            <!-- XP chip -->
            <NuxtLink to="/me/stats"
              class="hidden sm:flex items-center gap-1.5 h-8 px-2.5 rounded-full text-sm transition-all"
              :title="i18n.t({ uz: 'Sizning XP balingiz · reytingga', kr: 'Сизнинг XP балингиз · рейтингга' })"
              style="background: linear-gradient(90deg, rgba(63,88,148,0.10), rgba(251,191,36,0.10)); border: 1px solid rgba(63,88,148,0.20);">
              <AppIcon name="trophy" :size="13" class="text-amber-500" />
              <span class="font-semibold tabular-nums" style="color: var(--text-1);">{{ (auth.user.points ?? 0).toLocaleString() }}</span>
              <span class="text-2xs font-medium" style="color: var(--text-3);">XP</span>
            </NuxtLink>

            <StreakBadge compact />

            <div ref="profileRef" class="relative">
              <button @click="profileMenu = !profileMenu"
                class="flex items-center gap-2 h-9 pl-1 pr-2 rounded-full transition"
                @mouseenter="(e: any) => e.currentTarget.style.background = 'var(--surface-inset)'"
                @mouseleave="(e: any) => e.currentTarget.style.background = ''">
                <div class="w-7 h-7 rounded-full grid place-items-center text-xs font-semibold"
                     style="background: var(--text-1); color: var(--surface);">
                  {{ initials }}
                </div>
                <span class="hidden sm:inline text-sm max-w-[120px] truncate" style="color: var(--text-2);">
                  {{ auth.user.full_name || auth.user.login }}
                </span>
                <svg class="w-3.5 h-3.5 transition-transform" :class="{ 'rotate-180': profileMenu }" viewBox="0 0 12 12" fill="none" style="color: var(--text-4);">
                  <path d="M3 4.5 6 7.5l3-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>

              <div v-if="profileMenu"
                class="absolute right-0 mt-2 w-56 card py-1.5 anim-in z-40 origin-top-right"
                style="box-shadow: var(--shadow-lift);">
                <div class="px-3 py-2 border-b" style="border-color: var(--divider);">
                  <div class="text-sm font-medium truncate" style="color: var(--text-1);">{{ auth.user.full_name || auth.user.login }}</div>
                  <div class="text-xs truncate" style="color: var(--text-3);">{{ auth.user.email || auth.user.login }}</div>
                </div>
                <NuxtLink to="/me/profile" @click="profileMenu = false"
                  class="flex items-center gap-2 px-3 py-2 text-sm transition-colors"
                  style="color: var(--text-2);"
                  @mouseenter="(e: any) => e.currentTarget.style.background = 'var(--surface-inset)'"
                  @mouseleave="(e: any) => e.currentTarget.style.background = ''">
                  {{ i18n.t({ uz: 'Profil', kr: 'Профил' }) }}
                </NuxtLink>
                <NuxtLink to="/me/bookmarks" @click="profileMenu = false"
                  class="flex items-center gap-2 px-3 py-2 text-sm transition-colors"
                  style="color: var(--text-2);"
                  @mouseenter="(e: any) => e.currentTarget.style.background = 'var(--surface-inset)'"
                  @mouseleave="(e: any) => e.currentTarget.style.background = ''">
                  {{ i18n.t({ uz: 'Saqlanganlar', kr: 'Сақланганлар' }) }}
                </NuxtLink>
                <NuxtLink to="/me/stats" @click="profileMenu = false"
                  class="flex items-center gap-2 px-3 py-2 text-sm transition-colors"
                  style="color: var(--text-2);"
                  @mouseenter="(e: any) => e.currentTarget.style.background = 'var(--surface-inset)'"
                  @mouseleave="(e: any) => e.currentTarget.style.background = ''">
                  {{ i18n.t({ uz: 'Statistika', kr: 'Статистика' }) }}
                </NuxtLink>
                <div class="my-1 divider"></div>
                <button @click="logout"
                  class="w-full text-left px-3 py-2 text-sm text-rose-600 transition-colors"
                  @mouseenter="(e: any) => e.currentTarget.style.background = 'rgba(244,63,94,0.10)'"
                  @mouseleave="(e: any) => e.currentTarget.style.background = ''">
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
        <div v-if="mobileMenu" class="md:hidden border-t"
             style="background: var(--surface); border-color: var(--border-soft);">
          <nav class="px-2 py-2 flex flex-col">
            <NuxtLink v-for="link in navLinks" :key="link.to" :to="link.to"
              class="px-3 py-2.5 rounded-md text-sm font-medium"
              :style="route.path === link.to
                ? { background: 'var(--surface-inset)', color: 'var(--text-1)' }
                : { color: 'var(--text-2)' }"
              @click="mobileMenu = false">{{ link.label }}</NuxtLink>
          </nav>
        </div>
      </Transition>
    </header>

    <main class="flex-1">
      <slot />
    </main>

    <footer class="border-t mt-12 backdrop-blur"
            style="border-color: var(--border-soft); background: color-mix(in srgb, var(--surface) 40%, transparent);">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm" style="color: var(--text-3);">
        <div class="flex items-center gap-2.5">
          <div class="w-5 h-5 rounded grid place-items-center text-2xs font-bold"
               style="background: var(--text-1); color: var(--surface);">A</div>
          <span>© {{ new Date().getFullYear() }} Avtoprav</span>
        </div>
        <div>{{ i18n.t({ uz: 'Yo\'l harakati testlari · O\'zbekiston', kr: 'Йўл ҳаракати тестлари · Ўзбекистон' }) }}</div>
      </div>
    </footer>
  </div>
</template>
