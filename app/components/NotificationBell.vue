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

const open = ref(false)
const items = ref<Notif[]>([])
const unread = ref(0)
const rootRef = ref<HTMLElement | null>(null)

async function fetchNotifs() {
  if (!auth.token) return
  try {
    const res = await apiFetch<{ data: Notif[], unread: number }>('/me/notifications')
    items.value = res.data || []
    unread.value = res.unread || 0
  }
  catch { /* ignore */ }
}

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
  <div ref="rootRef" class="fixed top-3 right-3 z-30">
    <button type="button" @click="toggle"
      class="h-10 w-10 rounded-full grid place-items-center border shadow-soft relative transition-colors"
      style="background: var(--surface); border-color: var(--border-soft); color: var(--text-2);"
      :aria-label="i18n.t({ uz: 'Bildirishnomalar', kr: 'Билдиришномалар' })">
      <AppIcon name="bell" :size="18" />
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
      <div v-if="open" class="absolute right-0 mt-2 w-80 max-w-[calc(100vw-1.5rem)] card overflow-hidden"
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
