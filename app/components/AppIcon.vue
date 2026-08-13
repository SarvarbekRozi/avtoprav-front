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
  'chev-ud':     'lucide:chevrons-up-down',

  // status
  check:         'lucide:check',
  x:             'lucide:x',
  info:          'lucide:info',

  // time
  clock:         'lucide:clock',

  // mavzu almashtirish + mobil menyu (ilgari qo'lda chizilgan sodda SVG edi —
  // yonidagi Lucide ikonkalari bilan uslubi mos kelmasdi)
  moon:          'lucide:moon',
  sun:           'lucide:sun',
  menu:          'lucide:menu',

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
  // `traffic-cone` EMAS: konus yo'l belgisi emas, "Yo'l belgilari" bo'limi
  // uchun ma'nosi noto'g'ri edi. `signpost` — aynan yo'l ko'rsatkichi.
  sign:          'lucide:signpost',

  bookmark:      'lucide:bookmark',
  target:        'lucide:target',
  shield:        'lucide:shield-check',
  eye:           'lucide:eye',
  'eye-off':     'lucide:eye-off',
  car:           'lucide:car',
  alert:         'lucide:triangle-alert',
  activity:      'lucide:activity',

  // biletlar sahifasi: qidiruv va ko'rinish almashtirgich
  search:         'lucide:search',
  grid:           'lucide:layout-grid',
  list:           'lucide:list',

  // natija sahifasi
  flag:           'lucide:flag',
  percent:        'lucide:percent',
  circle:         'lucide:circle',
  // yo'l belgilari sahifasi: kategoriya ikonkalari + saqlash holati
  'circle-dot':   'lucide:circle-dot',
  'bookmark-on':  'lucide:bookmark-check',
  // test ekrani: rasmni kattalashtirish
  expand:         'lucide:maximize-2',
  // AI izoh sarlavhasi — `sparkles` (✨) hamma joyda "sun'iy intellekt" belgisi,
  // ya'ni panelning AI'ligi bir qarashda bilinadi (ilgari oddiy chat ikonkasi edi).
  ai:             'lucide:sparkles',

  // outlined status circles (activity feed)
  'check-circle': 'lucide:circle-check-big',
  'x-circle':     'lucide:circle-x',
  // "reklamasiz" / taqiq — chizilgan doira (tariflar taqqoslash jadvali)
  ban:            'lucide:ban',

  // Mavzu (PDD bobi) ikonkalari — /topics sahifasi har bobga o'z ikonkasini
  // beradi, ilgari hammasi bitta 'sign' edi. Nomlar Lucide to'plamiga
  // tekshirilgan (@iconify-json/lucide).
  users:          'lucide:users',
  'traffic-cone': 'lucide:traffic-cone',
  pedestrian:     'lucide:person-standing',
  ambulance:      'lucide:ambulance',
  diamond:        'lucide:diamond',
  'arrow-lr':     'lucide:arrow-left-right',
  wrench:         'lucide:wrench',
  equal:          'lucide:equal',
  columns:        'lucide:columns-3',
  'light-signal': 'lucide:circle-dot',
  'user-cog':     'lucide:user-round-cog',
  'octagon-alert': 'lucide:octagon-alert',
  waypoints:      'lucide:waypoints',
  route:          'lucide:route',
  gauge:          'lucide:gauge',
  parking:        'lucide:square-parking',
  fork:           'lucide:git-fork',
  train:          'lucide:train-front',
  mountain:       'lucide:mountain-snow',
  bus:            'lucide:bus',
  link:           'lucide:link',
  graduation:     'lucide:graduation-cap',
  package:        'lucide:package',
  bike:           'lucide:bike',
  clipboard:      'lucide:clipboard-list',
  'shield-alert': 'lucide:shield-alert',
  pulse:          'lucide:heart-pulse',
  layers:         'lucide:layers',

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
  logout:        'lucide:log-out',
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
