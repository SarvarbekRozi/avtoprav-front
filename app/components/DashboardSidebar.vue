<script setup lang="ts">
/**
 * Ilovaning yagona navigatsiyasi: desktop'da yopiladigan sidebar,
 * mobil'da hamburger + chekka menyu (drawer).
 *
 * DIQQAT — bu komponent ATAYLAB ko'p ildizli (aside + hamburger + drawer):
 * aside layout'ning flex qatoridagi to'g'ridan-to'g'ri farzandi bo'lishi kerak,
 * hamburger va drawer esa `fixed`. Ularni bitta <div> ichiga o'rash flex
 * tuzilishini buzadi. Layout ildizi baribir bitta tugun bo'lib qoladi,
 * shuning uchun SSR/hidratsiya shartiga putur yetmaydi.
 */
defineOptions({ inheritAttrs: false })

const auth = useAuthStore()
const i18n = useI18n()
const theme = useTheme()
const route = useRoute()

const mobileOpen = ref(false)

// Yig'ilgan holat localStorage'da. O'qish faqat onMounted'da — SSR bilan
// mos kelishi uchun boshlang'ich qiymat doim `false`.
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
    { to: '/',                icon: 'home',   label: i18n.t({ uz: 'Bosh sahifa',     kr: 'Бош саҳифа' }) },
    { to: '/test/start/exam', icon: 'exam',   label: i18n.t({ uz: 'Imtihon',         kr: 'Имтиҳон' }) },
    { to: '/tickets',         icon: 'ticket', label: i18n.t({ uz: 'Biletlar',        kr: 'Билетлар' }) },
    { to: '/topics',          icon: 'book',   label: i18n.t({ uz: 'Mavzular',        kr: 'Мавзулар' }) },
    { to: '/belgilar',        icon: 'sign',   label: i18n.t({ uz: 'Yo\'l belgilari', kr: 'Йўл белгилари' }) },
    { to: '/me/stats',        icon: 'stat',   label: i18n.t({ uz: 'Statistika',      kr: 'Статистика' }) },
    { to: '/pricing',         icon: 'card',   label: i18n.t({ uz: 'Tariflar',        kr: 'Тарифлар' }) },
  ]
})

const isActive = (to: string) => to === '/' ? route.path === '/' : route.path.startsWith(to)

// Boshqa marshrutga o'tilganda yopiladi. DIQQAT: havolalarda ayrim holda
// @click ham bor — allaqachon ochiq turgan sahifaga bosilganda `fullPath`
// o'zgarmaydi va faqat bu kuzatuvchiga tayanish menyuni ochiq qoldirardi.
watch(() => route.fullPath, () => { mobileOpen.value = false })

// Escape bilan yopish (modal ustidan)
function onEsc(e: KeyboardEvent) {
  if (e.key === 'Escape' && mobileOpen.value) mobileOpen.value = false
}
onMounted(() => document.addEventListener('keydown', onEsc))
onBeforeUnmount(() => document.removeEventListener('keydown', onEsc))

// Menyu ochiq turganda orqadagi sahifa aylanmasin
watch(mobileOpen, (open) => {
  if (!import.meta.client) return
  document.body.style.overflow = open ? 'hidden' : ''
})
onBeforeUnmount(() => {
  if (import.meta.client) document.body.style.overflow = ''
})

async function changeLocale(value: 'uz_latn' | 'uz_cyrl') {
  await i18n.setLocale(value)
}
const localeLabel = computed(() => i18n.locale.value === 'uz_cyrl' ? 'Ўзбекча' : 'O\'zbekcha')
const localeTitle = computed(() => i18n.locale.value === 'uz_latn' ? 'Кириллга ўтиш' : 'Lotin alifbosiga o\'tish')

const themeTitle = computed(() => theme.isDark.value
  ? i18n.t({ uz: 'Yorug\' rejim', kr: 'Ёруғ режим' })
  : i18n.t({ uz: 'Qorong\'i rejim', kr: 'Қоронғи режим' }))

// Seriya. `watch: [() => auth.user?.id]` SHART: mehmon → haqiqiy hisobga
// almashganda (Telegram/Google kirishi) qayta so'raladigan yagona joy shu.
const { data: streak } = useAsyncData('sidebar-streak', async () => {
  if (!auth.token) return null
  try { return await apiFetch<any>('/me/streak') }
  catch { return null }
}, { server: false, default: () => null, watch: [() => auth.user?.id] })

const points = computed(() => auth.user?.points ?? 0)
</script>

<template>
  <!-- ── Desktop sidebar ── -->
  <!-- `z-40` SHART: `sticky` o'z stacking konteksti yaratadi, shuning uchun
       ichidagi ochiladigan panelning (bildirishnomalar, til, profil) `z-50`
       si faqat SHU kontekst ichida ishlaydi. Aside'ning o'zida z-index
       bo'lmasa, DOM'da keyin turgan kontent (imtihon banneri, kartalar)
       uning ustidan chiziladi va panel kontent ORTIDA qolib ketardi. -->
  <aside
    class="hidden md:flex flex-col shrink-0 sticky top-0 z-40 h-screen relative border-r transition-[width] duration-200 ease-out"
    :class="collapsed ? 'w-[72px]' : 'w-[280px]'"
    style="background: var(--surface); border-color: var(--border-soft);"
  >
    <!-- Logo -->
    <div class="flex items-center gap-2 h-[76px] shrink-0"
         :class="collapsed ? 'justify-center px-2' : 'justify-between px-4'">
      <NuxtLink to="/" class="flex items-center gap-2.5 min-w-0">
        <img src="/logo-mark.svg" alt="Avtoprav" width="38" height="38" class="w-[38px] h-[38px] shrink-0 rounded-[11px]" />
        <span v-if="!collapsed" class="wordmark truncate">Avtoprav</span>
      </NuxtLink>
      <div v-if="!collapsed" class="flex items-center gap-0.5 shrink-0">
        <!-- Desktop'da qo'ng'iroq shu yerda; mobil'da esa layout'dagi suzuvchi nusxa.
             Ikkalasi useState orqali bitta so'rovni bo'lishadi. -->
        <NotificationBell :floating="false" align="left" />
        <button type="button" class="icon-btn h-8 w-8 rounded-lg grid place-items-center"
                :title="themeTitle" :aria-label="themeTitle" @click="theme.toggle()">
          <AppIcon :name="theme.isDark.value ? 'sun' : 'moon'" :size="17" />
        </button>
      </div>
    </div>

    <!-- Navigatsiya -->
    <nav class="flex-1 overflow-y-auto scrollbar-thin pt-2 pb-3 flex flex-col gap-1.5"
         :class="collapsed ? 'px-2 items-center' : 'px-3'">
      <NuxtLink v-for="link in navLinks" :key="link.to" :to="link.to"
        class="nav-item"
        :class="collapsed ? 'w-11 h-11 justify-center' : 'gap-3.5 px-3.5 h-12'"
        :aria-current="isActive(link.to) ? 'page' : undefined"
        :title="collapsed ? link.label : undefined">
        <AppIcon :name="link.icon" :size="20" />
        <span v-if="!collapsed" class="truncate">{{ link.label }}</span>
      </NuxtLink>
    </nav>

    <!-- Pastki blok: XP, til, profil -->
    <div v-if="!collapsed" class="px-4 pb-4 flex flex-col gap-3">
      <XPLevelCard :points="points" :streak="streak?.current ?? 0" />

      <button type="button" class="lang-btn w-full flex items-center gap-2.5 h-11 px-3.5 rounded-xl text-[13.5px] font-medium"
              :title="localeTitle"
              @click="changeLocale(i18n.locale.value === 'uz_latn' ? 'uz_cyrl' : 'uz_latn')">
        <AppIcon name="globe" :size="16" style="color: var(--text-3);" />
        <span class="flex-1 text-left truncate">{{ localeLabel }}</span>
        <AppIcon name="chev-ud" :size="14" style="color: var(--text-4);" />
      </button>

      <UserProfileCard />
    </div>

    <!-- Yig'ilgan holatdagi tugmalar -->
    <div v-else class="px-2 pb-3 flex flex-col items-center gap-1.5">
      <NotificationBell :floating="false" align="left" />
      <NuxtLink to="/me/stats" class="icon-btn h-9 w-9 rounded-lg grid place-items-center"
                :title="`${points.toLocaleString()} XP`">
        <AppIcon name="trophy" :size="16" class="text-amber-500" />
      </NuxtLink>
      <button type="button" class="icon-btn h-9 w-9 rounded-lg grid place-items-center"
              :title="themeTitle" :aria-label="themeTitle" @click="theme.toggle()">
        <AppIcon :name="theme.isDark.value ? 'sun' : 'moon'" :size="17" />
      </button>
      <button type="button" class="icon-btn h-9 w-9 rounded-lg grid place-items-center text-xs font-semibold"
              :title="localeTitle"
              @click="changeLocale(i18n.locale.value === 'uz_latn' ? 'uz_cyrl' : 'uz_latn')">
        {{ i18n.locale.value === 'uz_latn' ? 'Aa' : 'Аа' }}
      </button>
      <UserProfileCard collapsed />
    </div>

    <!-- Yig'ish tugmasi: aside'da `relative` va overflow-hidden YO'Q bo'lishi shart -->
    <button type="button"
      class="collapse-btn absolute top-[26px] -right-3 z-10 h-7 w-7 rounded-full grid place-items-center border"
      :title="collapsed ? i18n.t({ uz: 'Ochish', kr: 'Очиш' }) : i18n.t({ uz: 'Yopish', kr: 'Ёпиш' })"
      @click="collapsed = !collapsed">
      <AppIcon name="chev-l" :size="15" class="transition-transform" :class="{ 'rotate-180': collapsed }" />
    </button>
  </aside>

  <!-- ── Mobil: hamburger ── -->
  <button type="button"
    class="md:hidden fixed top-3 left-3 z-30 h-10 w-10 rounded-full grid place-items-center border shadow-soft"
    style="background: var(--surface); border-color: var(--border-soft); color: var(--text-2);"
    :aria-label="i18n.t({ uz: 'Menyu', kr: 'Меню' })"
    :aria-expanded="mobileOpen"
    @click="mobileOpen = true">
    <AppIcon name="menu" :size="20" />
  </button>

  <!-- ── Mobil: fon ── -->
  <Transition
    enter-active-class="transition-opacity duration-200" enter-from-class="opacity-0" enter-to-class="opacity-100"
    leave-active-class="transition-opacity duration-150" leave-from-class="opacity-100" leave-to-class="opacity-0">
    <div v-if="mobileOpen" class="md:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
         @click="mobileOpen = false"></div>
  </Transition>

  <!-- ── Mobil: chekka menyu ── -->
  <Transition
    enter-active-class="transition-transform duration-200 ease-out"
    enter-from-class="-translate-x-full" enter-to-class="translate-x-0"
    leave-active-class="transition-transform duration-150 ease-in"
    leave-from-class="translate-x-0" leave-to-class="-translate-x-full">
    <aside v-if="mobileOpen"
      role="dialog" aria-modal="true"
      :aria-label="i18n.t({ uz: 'Asosiy menyu', kr: 'Асосий меню' })"
      class="md:hidden fixed top-0 left-0 bottom-0 z-50 w-[280px] flex flex-col border-r overflow-y-auto"
      style="background: var(--surface); border-color: var(--border-soft);">
      <div class="flex items-center justify-between gap-2 h-[76px] px-4 shrink-0">
        <NuxtLink to="/" class="flex items-center gap-2.5 min-w-0" @click="mobileOpen = false">
          <img src="/logo-mark.svg" alt="Avtoprav" width="38" height="38" class="w-[38px] h-[38px] rounded-[11px]" />
          <span class="wordmark truncate">Avtoprav</span>
        </NuxtLink>
        <button type="button" class="icon-btn h-8 w-8 rounded-lg grid place-items-center"
                :title="themeTitle" :aria-label="themeTitle" @click="theme.toggle()">
          <AppIcon :name="theme.isDark.value ? 'sun' : 'moon'" :size="17" />
        </button>
      </div>

      <nav class="flex-1 px-3 pb-3 flex flex-col gap-1">
        <NuxtLink v-for="link in navLinks" :key="link.to" :to="link.to"
          class="nav-item gap-3.5 px-3.5 h-12"
          :aria-current="isActive(link.to) ? 'page' : undefined"
          @click="mobileOpen = false">
          <AppIcon :name="link.icon" :size="20" />
          <span>{{ link.label }}</span>
        </NuxtLink>
      </nav>

      <div class="px-4 pb-5 flex flex-col gap-3">
        <XPLevelCard :points="points" :streak="streak?.current ?? 0" />

        <button type="button" class="lang-btn w-full flex items-center gap-2.5 h-11 px-3.5 rounded-xl text-[13.5px] font-medium"
                @click="changeLocale(i18n.locale.value === 'uz_latn' ? 'uz_cyrl' : 'uz_latn')">
          <AppIcon name="globe" :size="16" style="color: var(--text-3);" />
          <span class="flex-1 text-left truncate">{{ localeLabel }}</span>
          <AppIcon name="chev-ud" :size="14" style="color: var(--text-4);" />
        </button>

        <UserProfileCard @navigate="mobileOpen = false" />
      </div>
    </aside>
  </Transition>
</template>

<style scoped>
/* Brend yozuvi — oddiy Inter (sayt shrifti), faqat kattaroq va to'qroq.
   Inter o'zgaruvchan shrift, shuning uchun 800 og'irlik qo'shimcha fayl
   yuklamaydi. */
.wordmark {
  font-size: 23px;
  font-weight: 800;
  font-variation-settings: 'wght' 800;
  letter-spacing: -0.025em;
  line-height: 1;
  color: var(--text-1);
}

.icon-btn {
  color: var(--text-3);
  transition: background .15s, color .15s;
}
.icon-btn:hover { background: var(--surface-inset); color: var(--text-1); }

.lang-btn {
  background: var(--surface);
  border: 1px solid var(--border-1);
  color: var(--text-2);
  transition: background .15s;
}
.lang-btn:hover { background: var(--surface-inset); }

.collapse-btn {
  background: var(--surface);
  border-color: var(--border-soft);
  color: var(--text-3);
  box-shadow: var(--shadow-soft);
  transition: color .15s, box-shadow .15s;
}
.collapse-btn:hover { color: var(--text-1); box-shadow: var(--shadow-lift); }
</style>
