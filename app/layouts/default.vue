<script setup lang="ts">
const auth = useAuthStore()
const i18n = useI18n()
const theme = useTheme()

async function changeLocale(value: 'uz_latn' | 'uz_cyrl') {
  await i18n.setLocale(value)
}

// Ikonkali tugmaning ko'rinadigan matni yo'q — aks holda ekran o'quvchi uchun
// nomsiz bo'lib qoladi (WCAG 4.1.2).
const themeLabel = computed(() => theme.isDark.value
  ? i18n.t({ uz: 'Yorug\' rejimga o\'tish', kr: 'Ёруғ режимга ўтиш' })
  : i18n.t({ uz: 'Qorong\'i rejimga o\'tish', kr: 'Қоронғи режимга ўтиш' }))
</script>

<template>
  <div v-if="auth.user" class="min-h-screen flex" style="background: var(--canvas);">
    <!-- DIQQAT: shablon ILDIZI bitta tugun bo'lishi SHART (v-if / v-else juftligi).
         Ildizga qo'shimcha element yoki izoh qo'yilsa, ildiz ko'p tugunli (fragment)
         bo'lib qoladi va SSR/klient hidratsiyasi mos kelmay sahifa oq qoladi.
         Shuning uchun izohlar ham shu div ICHIDA.

         `auth.user` — jonli reaktiv o'qish. U SSR va hidratsiya davomida null,
         middleware'dan keyin to'ladi. Uni snapshotga olish (const isAuthed = ...)
         mehmon/foydalanuvchi tarmoqlarini muzlatib qo'yadi. -->

    <!-- Mobil uchun suzuvchi qo'ng'iroq; desktop'da u sidebar ichida turadi -->
    <NotificationBell class="md:hidden" />

    <DashboardSidebar />

    <!-- min-w-0 SHART: usiz ichkaridagi keng grid/jadval main'ni cho'zib yuboradi -->
    <main class="flex-1 min-w-0">
      <slot />
    </main>
  </div>

  <div v-else class="min-h-screen flex flex-col" style="background: var(--canvas);">
    <!-- Mehmon (login/register): toza markazlashgan sahifa. `flex flex-col`
         login.vue va register.vue markazlashuvi uchun kerak. -->
    <div class="absolute top-3 right-3 z-30 flex items-center gap-2">
      <div class="hidden sm:flex items-center rounded-md p-0.5 text-xs font-medium"
           style="background: var(--surface-inset);">
        <button type="button" @click="changeLocale('uz_latn')"
          class="px-2 py-1 rounded transition-colors"
          :style="i18n.locale.value === 'uz_latn'
            ? { background: 'var(--surface)', boxShadow: 'var(--shadow-soft)', color: 'var(--text-1)' }
            : { color: 'var(--text-3)' }">Lotin</button>
        <button type="button" @click="changeLocale('uz_cyrl')"
          class="px-2 py-1 rounded transition-colors"
          :style="i18n.locale.value === 'uz_cyrl'
            ? { background: 'var(--surface)', boxShadow: 'var(--shadow-soft)', color: 'var(--text-1)' }
            : { color: 'var(--text-3)' }">Кирилл</button>
      </div>
      <button type="button" @click="theme.toggle()"
              class="h-8 w-8 rounded-md grid place-items-center transition-colors"
              style="color: var(--text-3); background: var(--surface-inset);"
              :title="themeLabel" :aria-label="themeLabel">
        <AppIcon :name="theme.isDark.value ? 'sun' : 'moon'" :size="17" />
      </button>
    </div>

    <main class="flex-1 flex flex-col">
      <slot />
    </main>
  </div>
</template>
