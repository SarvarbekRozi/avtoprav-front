<script setup lang="ts">
const i18n = useI18n()
const auth = useAuthStore()

interface Notif {
  id: string
  read: boolean
  type: string
  icon: string
  tone: string
  title: { uz: string, kr: string } | null
  body: { uz: string, kr: string } | null
  reward: number | null
  created_at: string
}

const props = withDefaults(defineProps<{
  /**
   * true (standart) — ekranning o'ng yuqorisida suzib turadi (mobil).
   * false — oddiy oqimdagi tugma (desktop sidebar ichida).
   */
  floating?: boolean
  /** menyu qaysi tomonga ochilsin */
  align?: 'left' | 'right'
}>(), { floating: true, align: 'right' })

const open = ref(false)
const rootRef = ref<HTMLElement | null>(null)

// Holat useState orqali BO'LISHILADI: mobil (suzuvchi) va desktop (sidebar)
// nusxalari bir vaqtda mount bo'ladi, lekin so'rov bir marta ketishi kerak.
const items = useState<Notif[]>('notifications-items', () => [])
const unread = useState<number>('notifications-unread', () => 0)
// Kim uchun yuklangani. `true/false` emas, aynan FOYDALANUVCHI ID'si:
// chiqib boshqa hisobga kirilganda (SPA, sahifa qayta yuklanmaydi) eski
// hisobning bildirishnomalari ko'rinib qolmasligi uchun.
const loadedFor = useState<number | null>('notifications-loaded-for', () => null)

async function fetchNotifs() {
  const uid = auth.user?.id ?? null
  if (!auth.token || uid === null || loadedFor.value === uid) return
  loadedFor.value = uid
  try {
    const res = await apiFetch<{ data: Notif[], unread: number }>('/me/notifications')
    items.value = res.data || []
    unread.value = res.unread || 0
  }
  catch { loadedFor.value = null /* keyingi urinishda qayta so'ralsin */ }
}

// Hisob almashganda darrov tozalab, yangisini yuklaymiz.
// Ikkala nusxa ham shu kuzatuvchini ro'yxatdan o'tkazadi, shuning uchun
// tozalash `loadedFor` bilan himoyalangan — aks holda ikkinchi nusxa
// birinchisining natijasini o'chirib, so'rovni takrorlardi.
watch(() => auth.user?.id, (id, prev) => {
  if (id === prev) return
  if (loadedFor.value !== id) {
    items.value = []
    unread.value = 0
    loadedFor.value = null
  }
  open.value = false
  if (id != null) fetchNotifs()
})

async function toggle() {
  open.value = !open.value
  if (open.value && unread.value > 0) {
    try {
      await apiFetch('/me/notifications/read', { method: 'POST' })
      unread.value = 0
      items.value = items.value.map(n => ({ ...n, read: true }))
    }
    catch { /* ignore */ }
  }
}

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return i18n.t({ uz: 'hozirgina', kr: 'ҳозиргина' })
  if (mins < 60) return `${mins} ${i18n.t({ uz: 'daq oldin', kr: 'дақ олдин' })}`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} ${i18n.t({ uz: 'soat oldin', kr: 'соат олдин' })}`
  return `${Math.floor(hrs / 24)} ${i18n.t({ uz: 'kun oldin', kr: 'кун олдин' })}`
}

function onDocClick(e: MouseEvent) {
  if (open.value && rootRef.value && !rootRef.value.contains(e.target as Node)) open.value = false
}

onMounted(() => {
  fetchNotifs()
  document.addEventListener('click', onDocClick)
})
onBeforeUnmount(() => document.removeEventListener('click', onDocClick))
</script>

<template>
  <div ref="rootRef" :class="props.floating ? 'fixed top-3 right-3 z-30' : 'relative'">
    <button type="button" @click="toggle"
      class="grid place-items-center relative transition-colors"
      :class="props.floating
        ? 'h-10 w-10 rounded-full border shadow-soft'
        : 'h-8 w-8 rounded-lg hover:bg-[var(--surface-inset)]'"
      :style="props.floating
        ? 'background: var(--surface); border-color: var(--border-soft); color: var(--text-2);'
        : 'color: var(--text-3);'"
      :aria-label="i18n.t({ uz: 'Bildirishnomalar', kr: 'Билдиришномалар' })">
      <AppIcon name="bell" :size="props.floating ? 18 : 17" />
      <span v-if="unread > 0"
        class="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold grid place-items-center tabular-nums">
        {{ unread > 9 ? '9+' : unread }}
      </span>
    </button>

    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0 -translate-y-1" enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100" leave-to-class="opacity-0">
      <div v-if="open"
           class="absolute mt-2 w-80 max-w-[calc(100vw-1.5rem)] card overflow-hidden z-50"
           :class="props.align === 'left' ? 'left-0' : 'right-0'"
           style="box-shadow: var(--shadow-lift);">
        <div class="px-4 py-3 flex items-center justify-between" style="border-bottom: 1px solid var(--divider);">
          <div class="text-sm font-semibold" style="color: var(--text-1);">
            {{ i18n.t({ uz: 'Bildirishnomalar', kr: 'Билдиришномалар' }) }}
          </div>
        </div>

        <div v-if="!items.length" class="px-4 py-10 text-center text-sm" style="color: var(--text-4);">
          {{ i18n.t({ uz: 'Hozircha bildirishnoma yo\'q', kr: 'Ҳозирча билдиришнома йўқ' }) }}
        </div>

        <div v-else class="max-h-[60vh] overflow-y-auto divide-y" style="--tw-divide-opacity: 1;">
          <div v-for="n in items" :key="n.id"
               class="flex items-start gap-3 px-4 py-3"
               :style="{ background: n.read ? 'transparent' : 'var(--surface-soft)' }">
            <IconTile :icon="n.icon" :tone="(n.tone as any)" :size="34" />
            <div class="min-w-0 flex-1">
              <div class="text-sm font-semibold leading-snug" style="color: var(--text-1);">
                {{ n.title ? i18n.t(n.title) : '' }}
              </div>
              <div v-if="n.body" class="text-2xs leading-snug mt-0.5" style="color: var(--text-3);">
                {{ i18n.t(n.body) }}
                <span v-if="n.reward" class="font-semibold text-amber-600">· +{{ n.reward }}</span>
              </div>
              <div class="text-2xs mt-1" style="color: var(--text-4);">{{ timeAgo(n.created_at) }}</div>
            </div>
            <span v-if="!n.read" class="w-2 h-2 rounded-full bg-rose-500 flex-shrink-0 mt-1.5"></span>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>
