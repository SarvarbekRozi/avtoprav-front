<script setup lang="ts">
const auth = useAuthStore()
const i18n = useI18n()
const theme = useTheme()
const route = useRoute()

const mobileSidebar = ref(false)
const profileMenu = ref(false)
const profileRef = ref<HTMLElement | null>(null)

// Collapsible state — persisted in localStorage
const collapsed = ref(false)
onMounted(() => {
  const stored = localStorage.getItem('sidebar-collapsed')
  if (stored !== null) collapsed.value = stored === '1'
})
watch(collapsed, (v) => {
  if (import.meta.client) localStorage.setItem('sidebar-collapsed', v ? '1' : '0')
})

const navLinks = computed(() => {
  if (!auth.user) return []
  return [
    { to: '/',         icon: 'home',   label: i18n.t({ uz: 'Bosh sahifa', kr: 'Бош саҳифа' }) },
    { to: '/test/start/exam', icon: 'exam', label: i18n.t({ uz: 'Imtihon', kr: 'Имтиҳон' }) },
    { to: '/tickets',  icon: 'ticket', label: i18n.t({ uz: 'Biletlar',    kr: 'Билетлар' }) },
    { to: '/topics',   icon: 'book',   label: i18n.t({ uz: 'Mavzular',    kr: 'Мавзулар' }) },
    { to: '/me/stats', icon: 'stat',   label: i18n.t({ uz: 'Statistika',  kr: 'Статистика' }) },
    { to: '/pricing',  icon: 'card',   label: i18n.t({ uz: 'Tariflar',    kr: 'Тарифлар' }) },
  ]
})

const isActive = (to: string) => to === '/' ? route.path === '/' : route.path.startsWith(to)

async function changeLocale(value: 'uz_latn' | 'uz_cyrl') {
  await i18n.setLocale(value)
}

async function logout() {
  profileMenu.value = false
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

watch(() => route.fullPath, () => { mobileSidebar.value = false })

const isGuest = computed(() => auth.user?.is_guest ?? false)

const displayName = computed(() => {
  if (!auth.user) return ''
  if (auth.user.is_guest) return i18n.t({ uz: 'Mehmon', kr: 'Меҳмон' })
  return auth.user.full_name || auth.user.login
})

const initials = computed(() => {
  return displayName.value
    .split(/\s+/).filter(Boolean).slice(0, 2)
    .map(s => s[0]?.toUpperCase()).join('') || '·'
})

const { data: streak } = useAsyncData('sidebar-streak', async () => {
  if (!auth.token) return null
  try { return await apiFetch<any>('/me/streak') } catch { return null }
}, { server: false, default: () => null, watch: [() => auth.user?.id] })
</script>

<template>
  <!-- Authenticated: collapsible sidebar -->
  <div v-if="auth.user" class="min-h-screen flex" style="background: var(--canvas);">
    <NotificationBell />

    <!-- Sidebar (desktop) -->
    <aside
      class="hidden md:flex flex-col shrink-0 border-r sticky top-0 h-screen relative transition-[width] duration-200 ease-out"
      :class="collapsed ? 'w-[68px]' : 'w-64'"
      style="background: var(--surface); border-color: var(--border-soft);"
    >
      <!-- Logo + theme toggle -->
      <div class="flex items-center gap-2 h-14 border-b shrink-0"
           :class="collapsed ? 'justify-center px-2' : 'justify-between px-4'"
           style="border-color: var(--border-soft);">
        <NuxtLink to="/" class="flex items-center gap-2.5 min-w-0">
          <div class="w-8 h-8 rounded-lg grid place-items-center text-sm font-bold tracking-tight shrink-0"
               style="background: var(--text-1); color: var(--surface);">A</div>
          <span v-if="!collapsed" class="font-semibold text-[15px] tracking-tightish truncate" style="color: var(--text-1);">Avtoprav</span>
        </NuxtLink>
        <button
          v-if="!collapsed"
          @click="theme.toggle()"
          class="h-8 w-8 rounded-md grid place-items-center transition-colors shrink-0"
          style="color: var(--text-3);"
          :title="theme.isDark.value ? i18n.t({ uz: 'Yorug\' rejim', kr: 'Ёруғ режим' }) : i18n.t({ uz: 'Qorong\'i rejim', kr: 'Қоронғи режим' })"
          @mouseenter="(e: any) => e.currentTarget.style.background = 'var(--surface-inset)'"
          @mouseleave="(e: any) => e.currentTarget.style.background = ''"
        >
          <svg v-if="!theme.isDark.value" width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M13 9.5A5.5 5.5 0 0 1 6.5 3a5.5 5.5 0 1 0 6.5 6.5z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
          </svg>
          <svg v-else width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="3" stroke="currentColor" stroke-width="1.5"/>
            <path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3.5 3.5l1 1M11.5 11.5l1 1M3.5 12.5l1-1M11.5 4.5l1-1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </button>
      </div>

      <!-- Nav (prominent) -->
      <nav class="flex-1 overflow-y-auto py-3 flex flex-col gap-1"
           :class="collapsed ? 'px-2 items-center' : 'px-3'">
        <NuxtLink
          v-for="link in navLinks"
          :key="link.to"
          :to="link.to"
          :title="collapsed ? link.label : ''"
          class="relative flex items-center rounded-lg text-[14px] font-medium transition-all group"
          :class="[
            collapsed ? 'w-11 h-11 justify-center' : 'gap-3 px-3 h-11',
            isActive(link.to) ? 'shadow-soft' : '',
          ]"
          :style="isActive(link.to)
            ? { background: 'var(--accent-soft)', color: 'var(--accent)', fontWeight: 600 }
            : { color: 'var(--text-2)' }"
          @mouseenter="(e: any) => { if (!isActive(link.to)) e.currentTarget.style.background = 'var(--surface-inset)' }"
          @mouseleave="(e: any) => { if (!isActive(link.to)) e.currentTarget.style.background = '' }"
        >
          <!-- Active accent bar -->
          <span v-if="isActive(link.to) && !collapsed" aria-hidden="true"
                class="absolute left-0 top-2 bottom-2 w-1 rounded-r-full"
                style="background: var(--accent);"></span>
          <AppIcon :name="link.icon" :size="20" />
          <span v-if="!collapsed" class="truncate">{{ link.label }}</span>
        </NuxtLink>
      </nav>

      <!-- Stats row -->
      <div v-if="!collapsed" class="px-3 pb-2 flex gap-1.5">
        <NuxtLink to="/me/stats"
          class="flex-1 flex items-center gap-1.5 h-9 px-2.5 rounded-md text-sm transition-all"
          :title="i18n.t({ uz: 'XP balingiz', kr: 'XP балингиз' })"
          style="background: linear-gradient(90deg, rgba(63,88,148,0.10), rgba(251,191,36,0.10)); border: 1px solid rgba(63,88,148,0.18);">
          <AppIcon name="trophy" :size="13" class="text-amber-500" />
          <span class="font-semibold tabular-nums truncate" style="color: var(--text-1);">{{ (auth.user.points ?? 0).toLocaleString() }}</span>
          <span class="text-2xs font-medium" style="color: var(--text-3);">XP</span>
        </NuxtLink>
        <div v-if="streak && streak.current > 0"
             class="flex items-center gap-1 h-9 px-2.5 rounded-md text-sm bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200"
             :title="i18n.t({ uz: 'Kunlik seriya', kr: 'Кунлик серия' })">
          <svg class="w-3.5 h-3.5 text-amber-600" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 1.5c-.4 1.3-1.2 2.5-2.3 3.4C4.2 6.2 3 7.7 3 9.7 3 12.5 5.2 14.5 8 14.5s5-2 5-4.8c0-1.3-.5-2.3-1.2-3.2-.4.5-.9.7-1.4.7-1 0-1.6-.8-1.4-1.7.2-1.3-.3-3-1-4Z"/>
          </svg>
          <span class="font-semibold text-amber-800 tabular-nums">{{ streak.current }}</span>
        </div>
      </div>

      <!-- Language switcher -->
      <div v-if="!collapsed" class="px-3 pb-2">
        <div class="flex items-center rounded-md p-0.5 text-xs font-medium"
             style="background: var(--surface-inset);">
          <button @click="changeLocale('uz_latn')"
            class="flex-1 px-2 py-1 rounded transition-colors"
            :style="i18n.locale.value === 'uz_latn'
              ? { background: 'var(--surface)', boxShadow: 'var(--shadow-soft)', color: 'var(--text-1)' }
              : { color: 'var(--text-3)' }">Lotin</button>
          <button @click="changeLocale('uz_cyrl')"
            class="flex-1 px-2 py-1 rounded transition-colors"
            :style="i18n.locale.value === 'uz_cyrl'
              ? { background: 'var(--surface)', boxShadow: 'var(--shadow-soft)', color: 'var(--text-1)' }
              : { color: 'var(--text-3)' }">Кирилл</button>
        </div>
      </div>

      <!-- Collapsed-only buttons: theme + lang -->
      <div v-if="collapsed" class="px-2 pb-2 flex flex-col items-center gap-1">
        <button
          @click="theme.toggle()"
          class="h-9 w-9 rounded-md grid place-items-center transition-colors"
          style="color: var(--text-3);"
          :title="theme.isDark.value ? i18n.t({ uz: 'Yorug\' rejim', kr: 'Ёруғ режим' }) : i18n.t({ uz: 'Qorong\'i rejim', kr: 'Қоронғи режим' })"
          @mouseenter="(e: any) => e.currentTarget.style.background = 'var(--surface-inset)'"
          @mouseleave="(e: any) => e.currentTarget.style.background = ''"
        >
          <svg v-if="!theme.isDark.value" width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M13 9.5A5.5 5.5 0 0 1 6.5 3a5.5 5.5 0 1 0 6.5 6.5z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
          </svg>
          <svg v-else width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="3" stroke="currentColor" stroke-width="1.5"/>
            <path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3.5 3.5l1 1M11.5 11.5l1 1M3.5 12.5l1-1M11.5 4.5l1-1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </button>
        <button
          @click="changeLocale(i18n.locale.value === 'uz_latn' ? 'uz_cyrl' : 'uz_latn')"
          class="h-9 w-9 rounded-md grid place-items-center text-xs font-semibold transition-colors"
          style="color: var(--text-2); background: var(--surface-inset);"
          :title="i18n.locale.value === 'uz_latn' ? 'Кириллга ўтиш' : 'Lotin alifbosiga'"
        >
          {{ i18n.locale.value === 'uz_latn' ? 'Aa' : 'Аа' }}
        </button>
      </div>

      <!-- Profile -->
      <div ref="profileRef" class="relative shrink-0 border-t"
           :class="collapsed ? 'p-2 flex justify-center' : 'p-2'"
           style="border-color: var(--border-soft);">
        <button
          class="flex items-center transition-colors rounded-md"
          :class="collapsed ? 'w-11 h-11 justify-center' : 'w-full gap-2.5 px-2 h-12'"
          @click="profileMenu = !profileMenu"
          @mouseenter="(e: any) => e.currentTarget.style.background = 'var(--surface-inset)'"
          @mouseleave="(e: any) => e.currentTarget.style.background = ''"
          :title="collapsed ? displayName : ''"
        >
          <div class="w-8 h-8 rounded-full grid place-items-center text-xs font-semibold shrink-0"
               style="background: var(--text-1); color: var(--surface);">
            {{ initials }}
          </div>
          <template v-if="!collapsed">
            <div class="flex-1 min-w-0 text-left">
              <div class="text-sm font-medium truncate" style="color: var(--text-1);">
                {{ displayName }}
              </div>
              <div class="text-2xs truncate" style="color: var(--text-4);">
                {{ isGuest ? i18n.t({ uz: 'Hisob saqlanmagan', kr: 'Ҳисоб сақланмаган' }) : (auth.user.email || auth.user.login) }}
              </div>
            </div>
            <svg class="w-3.5 h-3.5 transition-transform shrink-0"
                 :class="{ 'rotate-180': profileMenu }"
                 viewBox="0 0 12 12" fill="none" style="color: var(--text-4);">
              <path d="M3 4.5 6 7.5l3-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </template>
        </button>

        <Transition
          enter-active-class="transition duration-150 ease-out"
          enter-from-class="opacity-0 translate-y-1"
          enter-to-class="opacity-100 translate-y-0"
          leave-active-class="transition duration-100 ease-in"
          leave-from-class="opacity-100"
          leave-to-class="opacity-0"
        >
          <div
            v-if="profileMenu"
            class="absolute card py-1.5 z-40"
            :class="collapsed ? 'left-[calc(100%+6px)] bottom-2 w-56' : 'left-2 right-2 bottom-[calc(100%+4px)]'"
            style="box-shadow: var(--shadow-lift);"
          >
            <NuxtLink to="/me/profile" @click="profileMenu = false"
              class="block px-3 py-2 text-sm transition-colors"
              style="color: var(--text-2);"
              @mouseenter="(e: any) => e.currentTarget.style.background = 'var(--surface-inset)'"
              @mouseleave="(e: any) => e.currentTarget.style.background = ''">
              {{ i18n.t({ uz: 'Profil', kr: 'Профил' }) }}
            </NuxtLink>
            <NuxtLink to="/me/bookmarks" @click="profileMenu = false"
              class="block px-3 py-2 text-sm transition-colors"
              style="color: var(--text-2);"
              @mouseenter="(e: any) => e.currentTarget.style.background = 'var(--surface-inset)'"
              @mouseleave="(e: any) => e.currentTarget.style.background = ''">
              {{ i18n.t({ uz: 'Saqlanganlar', kr: 'Сақланганлар' }) }}
            </NuxtLink>
            <NuxtLink to="/me/mistakes" @click="profileMenu = false"
              class="block px-3 py-2 text-sm transition-colors"
              style="color: var(--text-2);"
              @mouseenter="(e: any) => e.currentTarget.style.background = 'var(--surface-inset)'"
              @mouseleave="(e: any) => e.currentTarget.style.background = ''">
              {{ i18n.t({ uz: 'Xatolarim', kr: 'Хатоларим' }) }}
            </NuxtLink>
            <NuxtLink to="/me/settings" @click="profileMenu = false"
              class="block px-3 py-2 text-sm transition-colors"
              style="color: var(--text-2);"
              @mouseenter="(e: any) => e.currentTarget.style.background = 'var(--surface-inset)'"
              @mouseleave="(e: any) => e.currentTarget.style.background = ''">
              {{ i18n.t({ uz: 'Sozlamalar', kr: 'Созламалар' }) }}
            </NuxtLink>
            <div class="my-1 divider"></div>
            <template v-if="isGuest">
              <NuxtLink to="/register" @click="profileMenu = false"
                class="block px-3 py-2 text-sm font-semibold transition-colors"
                style="color: var(--accent);"
                @mouseenter="(e: any) => e.currentTarget.style.background = 'var(--accent-soft)'"
                @mouseleave="(e: any) => e.currentTarget.style.background = ''">
                {{ i18n.t({ uz: 'Ro\'yxatdan o\'tish', kr: 'Рўйхатдан ўтиш' }) }}
              </NuxtLink>
              <NuxtLink to="/login" @click="profileMenu = false"
                class="block px-3 py-2 text-sm transition-colors"
                style="color: var(--text-2);"
                @mouseenter="(e: any) => e.currentTarget.style.background = 'var(--surface-inset)'"
                @mouseleave="(e: any) => e.currentTarget.style.background = ''">
                {{ i18n.t({ uz: 'Hisobga kirish', kr: 'Ҳисобга кириш' }) }}
              </NuxtLink>
            </template>
            <button v-else @click="logout"
              class="w-full text-left px-3 py-2 text-sm text-rose-600 transition-colors"
              @mouseenter="(e: any) => e.currentTarget.style.background = 'rgba(244,63,94,0.10)'"
              @mouseleave="(e: any) => e.currentTarget.style.background = ''">
              {{ i18n.t({ uz: 'Chiqish', kr: 'Чиқиш' }) }}
            </button>
          </div>
        </Transition>
      </div>

      <!-- Collapse toggle (sits on right edge of sidebar) -->
      <button
        @click="collapsed = !collapsed"
        class="absolute top-16 -right-3 z-10 h-7 w-7 rounded-full grid place-items-center border transition-all shadow-soft hover:shadow-lift"
        style="background: var(--surface); border-color: var(--border-soft); color: var(--text-3);"
        :title="collapsed ? i18n.t({ uz: 'Ochish', kr: 'Очиш' }) : i18n.t({ uz: 'Yopish', kr: 'Ёпиш' })"
        @mouseenter="(e: any) => e.currentTarget.style.color = 'var(--text-1)'"
        @mouseleave="(e: any) => e.currentTarget.style.color = 'var(--text-3)'"
      >
        <svg class="w-3.5 h-3.5 transition-transform" :class="{ 'rotate-180': collapsed }" viewBox="0 0 12 12" fill="none">
          <path d="M7.5 3 4.5 6l3 3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </aside>

    <!-- Mobile floating hamburger -->
    <button
      class="md:hidden fixed top-3 left-3 z-30 h-10 w-10 rounded-full grid place-items-center border shadow-soft"
      style="background: var(--surface); border-color: var(--border-soft); color: var(--text-2);"
      @click="mobileSidebar = true"
      aria-label="Menu"
    >
      <svg class="w-5 h-5" viewBox="0 0 20 20" fill="none">
        <path d="M3 6h14M3 10h14M3 14h14" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
      </svg>
    </button>

    <!-- Mobile drawer overlay -->
    <Transition
      enter-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0" enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-150"
      leave-from-class="opacity-100" leave-to-class="opacity-0"
    >
      <div v-if="mobileSidebar"
           class="md:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
           @click="mobileSidebar = false"></div>
    </Transition>
    <Transition
      enter-active-class="transition-transform duration-200 ease-out"
      enter-from-class="-translate-x-full" enter-to-class="translate-x-0"
      leave-active-class="transition-transform duration-150 ease-in"
      leave-from-class="translate-x-0" leave-to-class="-translate-x-full"
    >
      <aside
        v-if="mobileSidebar"
        class="md:hidden fixed top-0 left-0 bottom-0 z-50 w-72 flex flex-col border-r overflow-y-auto"
        style="background: var(--surface); border-color: var(--border-soft);"
      >
        <div class="flex items-center justify-between gap-2 h-14 px-4 border-b shrink-0"
             style="border-color: var(--border-soft);">
          <NuxtLink to="/" class="flex items-center gap-2.5" @click="mobileSidebar = false">
            <div class="w-8 h-8 rounded-lg grid place-items-center text-sm font-bold tracking-tight"
                 style="background: var(--text-1); color: var(--surface);">A</div>
            <span class="font-semibold tracking-tightish" style="color: var(--text-1);">Avtoprav</span>
          </NuxtLink>
          <button @click="theme.toggle()"
                  class="h-8 w-8 rounded-md grid place-items-center"
                  style="color: var(--text-3);">
            <svg v-if="!theme.isDark.value" width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M13 9.5A5.5 5.5 0 0 1 6.5 3a5.5 5.5 0 1 0 6.5 6.5z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
            </svg>
            <svg v-else width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="3" stroke="currentColor" stroke-width="1.5"/>
              <path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3.5 3.5l1 1M11.5 11.5l1 1M3.5 12.5l1-1M11.5 4.5l1-1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </button>
        </div>

        <nav class="flex-1 px-3 py-3 flex flex-col gap-1">
          <NuxtLink
            v-for="link in navLinks"
            :key="link.to"
            :to="link.to"
            class="relative flex items-center gap-3 px-3 h-11 rounded-lg text-[14px] font-medium"
            :style="isActive(link.to)
              ? { background: 'var(--accent-soft)', color: 'var(--accent)', fontWeight: 600 }
              : { color: 'var(--text-2)' }"
          >
            <span v-if="isActive(link.to)" aria-hidden="true"
                  class="absolute left-0 top-2 bottom-2 w-1 rounded-r-full"
                  style="background: var(--accent);"></span>
            <AppIcon :name="link.icon" :size="20" />
            <span>{{ link.label }}</span>
          </NuxtLink>
        </nav>

        <div class="px-3 pb-2 flex gap-1.5">
          <NuxtLink to="/me/stats" @click="mobileSidebar = false"
            class="flex-1 flex items-center gap-1.5 h-9 px-2.5 rounded-md text-sm"
            style="background: linear-gradient(90deg, rgba(63,88,148,0.10), rgba(251,191,36,0.10)); border: 1px solid rgba(63,88,148,0.18);">
            <AppIcon name="trophy" :size="13" class="text-amber-500" />
            <span class="font-semibold tabular-nums truncate" style="color: var(--text-1);">{{ (auth.user.points ?? 0).toLocaleString() }}</span>
            <span class="text-2xs font-medium" style="color: var(--text-3);">XP</span>
          </NuxtLink>
          <div v-if="streak && streak.current > 0"
               class="flex items-center gap-1 h-9 px-2.5 rounded-md text-sm bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200">
            <svg class="w-3.5 h-3.5 text-amber-600" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 1.5c-.4 1.3-1.2 2.5-2.3 3.4C4.2 6.2 3 7.7 3 9.7 3 12.5 5.2 14.5 8 14.5s5-2 5-4.8c0-1.3-.5-2.3-1.2-3.2-.4.5-.9.7-1.4.7-1 0-1.6-.8-1.4-1.7.2-1.3-.3-3-1-4Z"/>
            </svg>
            <span class="font-semibold text-amber-800 tabular-nums">{{ streak.current }}</span>
          </div>
        </div>

        <div class="px-3 pb-2">
          <div class="flex items-center rounded-md p-0.5 text-xs font-medium"
               style="background: var(--surface-inset);">
            <button @click="changeLocale('uz_latn')"
              class="flex-1 px-2 py-1 rounded"
              :style="i18n.locale.value === 'uz_latn'
                ? { background: 'var(--surface)', boxShadow: 'var(--shadow-soft)', color: 'var(--text-1)' }
                : { color: 'var(--text-3)' }">Lotin</button>
            <button @click="changeLocale('uz_cyrl')"
              class="flex-1 px-2 py-1 rounded"
              :style="i18n.locale.value === 'uz_cyrl'
                ? { background: 'var(--surface)', boxShadow: 'var(--shadow-soft)', color: 'var(--text-1)' }
                : { color: 'var(--text-3)' }">Кирилл</button>
          </div>
        </div>

        <div class="p-2 border-t flex flex-col gap-1" style="border-color: var(--border-soft);">
          <NuxtLink to="/me/profile"
            class="flex items-center gap-2.5 px-2 h-11 rounded-md text-sm" style="color: var(--text-2);">
            <div class="w-8 h-8 rounded-full grid place-items-center text-xs font-semibold"
                 style="background: var(--text-1); color: var(--surface);">{{ initials }}</div>
            <span class="truncate">{{ displayName }}</span>
          </NuxtLink>
          <template v-if="isGuest">
            <NuxtLink to="/register"
              class="w-full block px-2 h-11 leading-[44px] rounded-md text-sm font-semibold" style="color: var(--accent);">
              {{ i18n.t({ uz: 'Ro\'yxatdan o\'tish', kr: 'Рўйхатдан ўтиш' }) }}
            </NuxtLink>
            <NuxtLink to="/login"
              class="w-full block px-2 h-11 leading-[44px] rounded-md text-sm" style="color: var(--text-2);">
              {{ i18n.t({ uz: 'Hisobga kirish', kr: 'Ҳисобга кириш' }) }}
            </NuxtLink>
          </template>
          <button v-else @click="logout"
            class="w-full text-left px-2 h-11 rounded-md text-sm text-rose-600">
            {{ i18n.t({ uz: 'Chiqish', kr: 'Чиқиш' }) }}
          </button>
        </div>
      </aside>
    </Transition>

    <!-- Main column -->
    <main class="flex-1 min-w-0">
      <slot />
    </main>
  </div>

  <!-- Guest: clean centered layout -->
  <div v-else class="min-h-screen flex flex-col" style="background: var(--canvas);">
    <div class="absolute top-3 right-3 z-30 flex items-center gap-2">
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
      <button @click="theme.toggle()"
              class="h-8 w-8 rounded-md grid place-items-center transition-colors"
              style="color: var(--text-3); background: var(--surface-inset);">
        <svg v-if="!theme.isDark.value" width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M13 9.5A5.5 5.5 0 0 1 6.5 3a5.5 5.5 0 1 0 6.5 6.5z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
        </svg>
        <svg v-else width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="3" stroke="currentColor" stroke-width="1.5"/>
          <path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3.5 3.5l1 1M11.5 11.5l1 1M3.5 12.5l1-1M11.5 4.5l1-1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </button>
    </div>

    <main class="flex-1 flex flex-col">
      <slot />
    </main>
  </div>
</template>
