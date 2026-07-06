<script setup lang="ts">
const i18n = useI18n()
const seen = useCookie<string | null>('onboarded_v1', {
  default: () => null,
  maxAge: 60 * 60 * 24 * 365,
  sameSite: 'lax',
})

const open = ref(false)
const step = ref(0)

onMounted(() => { if (!seen.value) open.value = true })

const steps = computed(() => [
  {
    icon: 'exam', tone: 'brand',
    title: i18n.t({ uz: 'Xush kelibsiz!', kr: 'Хуш келибсиз!' }),
    text: i18n.t({
      uz: 'Haydovchilik imtihoniga tayyorlaning: imtihon, mavzu, bilet, marafon va yodlash rejimlarida mashq qiling.',
      kr: 'Ҳайдовчилик имтиҳонига тайёрланинг: имтиҳон, мавзу, билет, марафон ва ёдлаш режимларида машқ қилинг.',
    }),
  },
  {
    icon: 'flame', tone: 'amber',
    title: i18n.t({ uz: 'Seriya va ball to\'plang', kr: 'Серия ва балл тўпланг' }),
    text: i18n.t({
      uz: 'Har kuni mashq qilib seriya (streak) va XP ball yig\'ing, yutuqlarni oching va reytingda ko\'tariling.',
      kr: 'Ҳар куни машқ қилиб серия (streak) ва XP балл йиғинг, ютуқларни очинг ва рейтингда кўтарилинг.',
    }),
  },
  {
    icon: 'spark', tone: 'violet',
    title: i18n.t({ uz: 'Bepul va Premium', kr: 'Бепул ва Премиум' }),
    text: i18n.t({
      uz: 'Birinchi 10 ta bilet bepul. Premium bilan barcha biletlar, marafon, xatolar ustida ishlash va batafsil tahlil ochiladi.',
      kr: 'Биринчи 10 та билет бепул. Премиум билан барча билетлар, марафон, хатолар устида ишлаш ва батафсил таҳлил очилади.',
    }),
  },
])

const cur = computed(() => steps.value[step.value])
const isLast = computed(() => step.value === steps.value.length - 1)

function next() { if (isLast.value) close(); else step.value++ }
function close() { seen.value = '1'; open.value = false }
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="fixed inset-0 z-[100] flex items-center justify-center p-4" style="background: rgba(15,23,42,0.55);">
      <div class="card w-full max-w-md p-6 text-center relative">
        <button type="button" @click="close" class="absolute top-3 right-3 text-ink-400 hover:text-ink-900">
          <AppIcon name="x" :size="18" />
        </button>
        <div class="flex justify-center mb-4"><IconTile :icon="cur.icon" :tone="(cur.tone as any)" :size="56" /></div>
        <h2 class="text-xl font-semibold text-ink-900">{{ cur.title }}</h2>
        <p class="text-sm text-ink-500 mt-2 leading-relaxed">{{ cur.text }}</p>
        <div class="flex items-center justify-center gap-1.5 mt-5">
          <span v-for="(s, idx) in steps" :key="idx" class="h-1.5 rounded-full transition-all"
                :style="{ width: idx === step ? '20px' : '6px', background: idx === step ? 'var(--text-1)' : 'var(--surface-inset)' }"></span>
        </div>
        <div class="flex items-center gap-2 mt-6">
          <button type="button" @click="close" class="btn-outline flex-1">
            {{ i18n.t({ uz: 'O\'tkazib yuborish', kr: 'Ўтказиб юбориш' }) }}
          </button>
          <button type="button" @click="next" class="btn-primary flex-1">
            {{ isLast ? i18n.t({ uz: 'Boshlash', kr: 'Бошлаш' }) : i18n.t({ uz: 'Keyingi', kr: 'Кейинги' }) }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
