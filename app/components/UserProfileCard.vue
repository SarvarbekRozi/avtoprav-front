<script setup lang="ts">
/** Sidebar pastidagi profil kartasi + ochiluvchi menyu. */
const props = withDefaults(defineProps<{
  /** yig'ilgan sidebar: faqat avatar ko'rinadi */
  collapsed?: boolean
}>(), { collapsed: false })

const emit = defineEmits<{ navigate: [] }>()

const auth = useAuthStore()
const i18n = useI18n()

const open = ref(false)
const root = ref<HTMLElement | null>(null)

const isGuest = computed(() => auth.user?.is_guest ?? false)

const displayName = computed(() => {
  if (!auth.user) return ''
  if (auth.user.is_guest) return i18n.t({ uz: 'Mehmon', kr: 'Меҳмон' })
  return auth.user.full_name || auth.user.login
})

const secondary = computed(() => {
  if (!auth.user) return ''
  if (auth.user.is_guest) return i18n.t({ uz: 'Hisob saqlanmagan', kr: 'Ҳисоб сақланмаган' })
  return auth.user.email || auth.user.login
})

const initials = computed(() =>
  displayName.value.split(/\s+/).filter(Boolean).slice(0, 2)
    .map(s => s[0]?.toUpperCase()).join('') || '·')

const menuItems = computed(() => [
  { to: '/me/profile',   label: i18n.t({ uz: 'Profil',        kr: 'Профил' }) },
  { to: '/me/bookmarks', label: i18n.t({ uz: 'Saqlanganlar',  kr: 'Сақланганлар' }) },
  { to: '/me/mistakes',  label: i18n.t({ uz: 'Xatolarim',     kr: 'Хатоларим' }) },
  { to: '/me/settings',  label: i18n.t({ uz: 'Sozlamalar',    kr: 'Созламалар' }) },
])

function go() {
  open.value = false
  emit('navigate')
}

async function logout() {
  open.value = false
  emit('navigate')
  await auth.logout()
  await navigateTo('/login')
}

function onDocClick(e: MouseEvent) {
  if (open.value && root.value && !root.value.contains(e.target as Node)) open.value = false
}
function onEsc(e: KeyboardEvent) {
  if (e.key === 'Escape') open.value = false
}
onMounted(() => {
  document.addEventListener('click', onDocClick)
  document.addEventListener('keydown', onEsc)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick)
  document.removeEventListener('keydown', onEsc)
})
</script>

<template>
  <div ref="root" class="relative">
    <button
      type="button"
      class="profile-btn flex items-center rounded-xl transition-colors"
      :class="props.collapsed ? 'w-11 h-11 justify-center' : 'w-full gap-2.5 px-2.5 h-14'"
      :data-boxed="props.collapsed ? undefined : ''"
      :aria-expanded="open"
      aria-haspopup="true"
      :title="props.collapsed ? displayName : undefined"
      @click="open = !open"
    >
      <span class="w-9 h-9 rounded-full grid place-items-center text-xs font-bold text-white shrink-0"
            style="background: linear-gradient(135deg, #4f6ef0, #23335c);">
        {{ initials }}
      </span>
      <template v-if="!props.collapsed">
        <span class="flex-1 min-w-0 text-left">
          <span class="block text-[13px] font-semibold truncate" style="color: var(--text-1);">{{ displayName }}</span>
          <span class="block text-2xs truncate" style="color: var(--text-4);">{{ secondary }}</span>
        </span>
        <AppIcon name="chev-ud" :size="14" class="shrink-0" style="color: var(--text-4);" />
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
      <!-- role="menu"/"menuitem" ATAYLAB YO'Q: ARIA menu naqshi o'q tugmalar,
           Home/End va typeahead navigatsiyasini talab qiladi. Ularsiz rol
           qo'yish havolalarni o'z semantikasidan mahrum qiladi va holatni
           yomonlashtiradi. Bu yerda oddiy havolalar ro'yxati — Tab bilan
           tabiiy ishlaydi. -->
      <div v-if="open"
           class="absolute card py-1.5 z-40"
           :class="props.collapsed ? 'left-[calc(100%+8px)] bottom-0 w-56' : 'left-0 right-0 bottom-[calc(100%+6px)]'"
           style="box-shadow: var(--shadow-lift);">
        <NuxtLink v-for="m in menuItems" :key="m.to" :to="m.to" @click="go"
          class="menu-item block px-3 py-2 text-sm transition-colors" style="color: var(--text-2);">
          {{ m.label }}
        </NuxtLink>

        <div class="my-1 divider"></div>

        <template v-if="isGuest">
          <NuxtLink to="/register" @click="go"
            class="menu-item block px-3 py-2 text-sm font-semibold transition-colors" style="color: var(--accent);">
            {{ i18n.t({ uz: 'Ro\'yxatdan o\'tish', kr: 'Рўйхатдан ўтиш' }) }}
          </NuxtLink>
          <NuxtLink to="/login" @click="go"
            class="menu-item block px-3 py-2 text-sm transition-colors" style="color: var(--text-2);">
            {{ i18n.t({ uz: 'Hisobga kirish', kr: 'Ҳисобга кириш' }) }}
          </NuxtLink>
        </template>
        <button v-else type="button" @click="logout"
          class="menu-item-danger w-full text-left px-3 py-2 text-sm transition-colors"
          style="color: var(--danger-ink);">
          {{ i18n.t({ uz: 'Chiqish', kr: 'Чиқиш' }) }}
        </button>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.profile-btn[data-boxed] {
  background: var(--surface);
  border: 1px solid var(--border-1);
}
.profile-btn:hover { background: var(--surface-inset); }
.menu-item:hover { background: var(--surface-inset); }
.menu-item-danger:hover { background: rgba(244, 63, 94, 0.10); }
</style>
