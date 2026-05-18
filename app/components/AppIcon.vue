<script setup lang="ts">
// Map our internal short names → Lucide icon names (via @nuxt/icon / Iconify).
// Lucide is a clean, modern, free set — used by Vercel, Linear, shadcn/ui, etc.
const NAME_MAP: Record<string, string> = {
  // navigation
  arrow:         'lucide:arrow-right',
  'arrow-left':  'lucide:arrow-left',
  'chev-r':      'lucide:chevron-right',
  'chev-l':      'lucide:chevron-left',
  'chev-d':      'lucide:chevron-down',
  'chev-u':      'lucide:chevron-up',

  // status
  check:         'lucide:check',
  x:             'lucide:x',
  info:          'lucide:info',

  // time
  clock:         'lucide:clock',

  // brand / gamification
  flame:         'lucide:flame',
  'flame-outline': 'lucide:flame',
  trophy:        'lucide:trophy',
  spark:         'lucide:sparkles',
  sparkle:       'lucide:sparkles',
  star:          'lucide:star',
  bolt:          'lucide:zap',
  bulb:          'lucide:lightbulb',

  // primary actions / modes
  exam:          'lucide:clipboard-check',
  ticket:        'lucide:ticket',
  book:          'lucide:book-open',
  shuffle:       'lucide:shuffle',
  refresh:       'lucide:rotate-ccw',
  stat:          'lucide:bar-chart-3',
  sign:          'lucide:traffic-cone',

  // user
  user:          'lucide:user-round',
  home:          'lucide:home',
  globe:         'lucide:globe',
  light:         'lucide:smartphone',
  lock:          'lucide:lock',
  bell:          'lucide:bell',
  plus:          'lucide:plus',
  settings:      'lucide:settings',
  send:          'lucide:send',
  card:          'lucide:credit-card',
}

const props = withDefaults(defineProps<{
  name: string
  size?: number | string
}>(), {
  size: 16,
})

const iconName = computed(() => NAME_MAP[props.name] || `lucide:${props.name}`)
const sizePx = computed(() => typeof props.size === 'number' ? `${props.size}px` : props.size)
</script>

<template>
  <Icon :name="iconName" :style="{ width: sizePx, height: sizePx, display: 'inline-block' }" />
</template>
