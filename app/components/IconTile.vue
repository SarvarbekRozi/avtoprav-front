<script setup lang="ts">
// Tur aniq import qilinadi: defineProps<T> kompilyatsiya paytida turni yechishi
// kerak, avto-importga tayanib bo'lmaydi.
import type { Tone } from '~/composables/useTone'

const props = withDefaults(defineProps<{
  icon: string
  tone?: Tone
  size?: number
  /** burchak radiusi; berilmasa o'lchamga qarab tanlanadi */
  radius?: number
}>(), {
  tone: 'brand',
  size: 44,
})

// Ranglar useTone() da — IconTile, QuickActionCard va boshqalar bir manbadan oladi
const t = useTone(() => props.tone)
const radiusPx = computed(() => props.radius ?? Math.round(props.size * 0.29))
</script>

<template>
  <div class="grid place-items-center flex-shrink-0 transition-colors"
       :style="{
         width: size + 'px',
         height: size + 'px',
         borderRadius: radiusPx + 'px',
         background: t.bg,
         color: t.fg,
       }">
    <AppIcon :name="icon" :size="Math.round(size * 0.46)" />
  </div>
</template>
