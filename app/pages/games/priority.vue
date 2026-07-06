<script setup lang="ts">
// 2D "Chorrahada ustunlik" (intersection priority) mini-game. Top-down SVG intersection;
// the player taps the cars in the order they should pass. Each scenario is hand-authored
// with the correct order + the YHQ rule explanation (so the rules are always correct and
// the legend makes the scenario unambiguous regardless of SVG rendering).
definePageMeta({ middleware: 'auth' })

const i18n = useI18n()

type Dir = 'N' | 'S' | 'E' | 'W'
type Turn = 'straight' | 'left' | 'right'
interface Car { id: string, from: Dir, turn: Turn, color: string, road?: 'main' | 'minor', light?: 'green' | 'red' }
interface Scenario { cars: Car[], order: string[], rule: { uz: string, kr: string } }

const SCENARIOS: Scenario[] = [
  {
    cars: [
      { id: 'A', from: 'S', turn: 'straight', color: '#3b82f6' },
      { id: 'B', from: 'W', turn: 'straight', color: '#ef4444' },
    ],
    order: ['A', 'B'],
    rule: {
      uz: 'Belgisiz (teng) chorrahada o\'ng tomondagi mashinaga yo\'l beriladi. B uchun A o\'ng tomonda turibdi — shuning uchun avval A o\'tadi, keyin B.',
      kr: 'Белгисиз чорраҳада ўнг томондаги машинага йўл берилади. B учун A ўнг томонда — аввал A ўтади, кейин B.',
    },
  },
  {
    cars: [
      { id: 'A', from: 'W', turn: 'straight', color: '#3b82f6', road: 'main' },
      { id: 'B', from: 'S', turn: 'straight', color: '#ef4444', road: 'minor' },
    ],
    order: ['A', 'B'],
    rule: {
      uz: 'Bosh yo\'ldagi mashina ustun. A bosh yo\'lda (sariq romb) — birinchi o\'tadi. B "yo\'l bering" belgisi ostida — kutadi.',
      kr: 'Бош йўлдаги машина устун. A бош йўлда — биринчи; B "йўл беринг" белгиси остида — кутади.',
    },
  },
  {
    cars: [
      { id: 'A', from: 'S', turn: 'straight', color: '#3b82f6' },
      { id: 'B', from: 'N', turn: 'left', color: '#ef4444' },
    ],
    order: ['A', 'B'],
    rule: {
      uz: 'Chapga buriluvchi qarama-qarshidan to\'g\'ri keluvchiga yo\'l beradi. A to\'g\'ri ketyapti — birinchi; B chapga buriladi — kutadi.',
      kr: 'Чапга бурилувчи қарама-қаршидан тўғри келувчига йўл беради. A тўғри — биринчи; B чапга — кутади.',
    },
  },
  {
    cars: [
      { id: 'A', from: 'S', turn: 'straight', color: '#3b82f6' },
      { id: 'B', from: 'E', turn: 'straight', color: '#22c55e' },
      { id: 'C', from: 'W', turn: 'straight', color: '#f59e0b' },
    ],
    order: ['B', 'A', 'C'],
    rule: {
      uz: 'O\'ng qo\'l qoidasi: har kim o\'ng tomonidagiga yo\'l beradi. B ning o\'ngi bo\'sh — birinchi. A → B ga yo\'l beradi. C → A ga yo\'l beradi. Tartib: B, A, C.',
      kr: 'Ўнг қўл қоидаси. B нинг ўнги бўш — биринчи. A, B га; C, A га йўл беради. Тартиб: B, A, C.',
    },
  },
  {
    cars: [
      { id: 'A', from: 'N', turn: 'left', color: '#ef4444', road: 'main' },
      { id: 'B', from: 'S', turn: 'straight', color: '#3b82f6', road: 'main' },
    ],
    order: ['B', 'A'],
    rule: {
      uz: 'Ikkalasi bosh yo\'lda. Chapga buriluvchi A qarama-qarshi to\'g\'ri keluvchi B ga yo\'l beradi. Tartib: B, keyin A.',
      kr: 'Иккаласи бош йўлда. Чапга бурилувчи A қарама-қарши B га йўл беради. Тартиб: B, кейин A.',
    },
  },
  {
    cars: [
      { id: 'A', from: 'S', turn: 'straight', color: '#3b82f6', light: 'green' },
      { id: 'B', from: 'W', turn: 'straight', color: '#ef4444', light: 'red' },
    ],
    order: ['A', 'B'],
    rule: {
      uz: 'Svetofor belgilardan ustun. A da yashil — birinchi o\'tadi. B da qizil — yashil yongach o\'tadi.',
      kr: 'Светофор белгилардан устун. A да яшил — биринчи; B да қизил — кутади.',
    },
  },
]

const idx = ref(0)
const picked = ref<string[]>([])
const checked = ref(false)
const correct = ref(false)
const score = ref(0)
const finished = ref(false)

const scenario = computed(() => SCENARIOS[idx.value])

const POS: Record<Dir, { x: number, y: number, w: number, h: number, facing: string }> = {
  S: { x: 160, y: 250, w: 30, h: 46, facing: '↑' },
  N: { x: 160, y: 70, w: 30, h: 46, facing: '↓' },
  E: { x: 250, y: 160, w: 46, h: 30, facing: '←' },
  W: { x: 70, y: 160, w: 46, h: 30, facing: '→' },
}
const TURN_GLYPH: Record<Turn, { uz: string, kr: string }> = {
  straight: { uz: '↑ to\'g\'ri', kr: '↑ тўғри' },
  left: { uz: '↰ chapga', kr: '↰ чапга' },
  right: { uz: '↱ o\'ngga', kr: '↱ ўнгга' },
}
const FROM_LABEL: Record<Dir, { uz: string, kr: string }> = {
  S: { uz: 'Janubdan', kr: 'Жанубдан' }, N: { uz: 'Shimoldan', kr: 'Шимолдан' },
  E: { uz: 'Sharqdan', kr: 'Шарқдан' }, W: { uz: 'G\'arbdan', kr: 'Ғарбдан' },
}

function pick(id: string) {
  if (checked.value) return
  const i = picked.value.indexOf(id)
  if (i >= 0) picked.value.splice(i, 1)
  else picked.value.push(id)
}
function orderOf(id: string) { const i = picked.value.indexOf(id); return i >= 0 ? i + 1 : null }

function check() {
  if (picked.value.length !== scenario.value.cars.length) return
  checked.value = true
  correct.value = JSON.stringify(picked.value) === JSON.stringify(scenario.value.order)
  if (correct.value) score.value++
}
function next() {
  if (idx.value >= SCENARIOS.length - 1) { finished.value = true; return }
  idx.value++; picked.value = []; checked.value = false; correct.value = false
}
function restart() { idx.value = 0; picked.value = []; checked.value = false; correct.value = false; score.value = 0; finished.value = false }
</script>

<template>
  <div class="max-w-3xl mx-auto px-4 py-6">
    <div class="flex items-center justify-between mb-4">
      <div>
        <h1 class="text-2xl font-semibold text-ink-900">{{ i18n.t({ uz: 'Chorrahada ustunlik', kr: 'Чорраҳада устунлик' }) }}</h1>
        <p class="text-sm text-ink-500">{{ i18n.t({ uz: 'Mashinalarni o\'tish tartibida bosing', kr: 'Машиналарни ўтиш тартибида босинг' }) }}</p>
      </div>
      <div class="text-right">
        <div class="text-2xs uppercase text-ink-400">{{ i18n.t({ uz: 'Ball', kr: 'Балл' }) }}</div>
        <div class="text-xl font-bold text-emerald-600 tabular-nums">{{ score }} / {{ SCENARIOS.length }}</div>
      </div>
    </div>

    <div v-if="!finished" class="card p-5">
      <div class="text-xs text-ink-400 mb-2">{{ i18n.t({ uz: 'Vaziyat', kr: 'Вазият' }) }} {{ idx + 1 }} / {{ SCENARIOS.length }}</div>

      <div class="grid sm:grid-cols-[320px_1fr] gap-5 items-start">
        <!-- intersection -->
        <svg viewBox="0 0 320 320" class="w-full max-w-[320px] mx-auto rounded-xl" style="background:#6ab04c;">
          <!-- roads -->
          <rect x="125" y="0" width="70" height="320" fill="#3a3f47" />
          <rect x="0" y="125" width="320" height="70" fill="#3a3f47" />
          <!-- centre dashes -->
          <line x1="160" y1="0" x2="160" y2="320" stroke="#eef2f6" stroke-width="2" stroke-dasharray="10 10" opacity="0.6" />
          <line x1="0" y1="160" x2="320" y2="160" stroke="#eef2f6" stroke-width="2" stroke-dasharray="10 10" opacity="0.6" />

          <!-- cars -->
          <g v-for="c in scenario.cars" :key="c.id" style="cursor:pointer" @click="pick(c.id)">
            <rect :x="POS[c.from].x - POS[c.from].w / 2" :y="POS[c.from].y - POS[c.from].h / 2"
              :width="POS[c.from].w" :height="POS[c.from].h" rx="6" :fill="c.color"
              :stroke="orderOf(c.id) ? '#0f172a' : '#0f172a55'" :stroke-width="orderOf(c.id) ? 3 : 1.5" />
            <text :x="POS[c.from].x" :y="POS[c.from].y + 5" text-anchor="middle" font-size="16" font-weight="bold" fill="#fff">{{ c.id }}</text>
            <!-- facing -->
            <text :x="POS[c.from].x" :y="POS[c.from].y - POS[c.from].h / 2 - 4" text-anchor="middle" font-size="13" fill="#0f172a">{{ POS[c.from].facing }}</text>
            <!-- order badge -->
            <g v-if="orderOf(c.id)">
              <circle :cx="POS[c.from].x + POS[c.from].w / 2 + 4" :cy="POS[c.from].y - POS[c.from].h / 2 - 4" r="11" fill="#0ea5e9" stroke="#fff" stroke-width="2" />
              <text :x="POS[c.from].x + POS[c.from].w / 2 + 4" :y="POS[c.from].y - POS[c.from].h / 2" text-anchor="middle" font-size="13" font-weight="bold" fill="#fff">{{ orderOf(c.id) }}</text>
            </g>
            <!-- priority / give-way / light marker -->
            <text v-if="c.road === 'main'" :x="POS[c.from].x - POS[c.from].w / 2 - 8" :y="POS[c.from].y" text-anchor="middle" font-size="15">🔶</text>
            <text v-else-if="c.road === 'minor'" :x="POS[c.from].x - POS[c.from].w / 2 - 8" :y="POS[c.from].y" text-anchor="middle" font-size="14">🔻</text>
            <circle v-if="c.light" :cx="POS[c.from].x - POS[c.from].w / 2 - 8" :cy="POS[c.from].y" r="6" :fill="c.light === 'green' ? '#22c55e' : '#ef4444'" stroke="#0f172a" stroke-width="1" />
          </g>
        </svg>

        <!-- legend + controls -->
        <div>
          <div class="space-y-2">
            <div v-for="c in scenario.cars" :key="c.id" class="flex items-center gap-2.5 text-sm">
              <span class="inline-block w-4 h-4 rounded" :style="{ background: c.color }"></span>
              <span class="font-semibold text-ink-900">{{ c.id }}</span>
              <span class="text-ink-600">— {{ i18n.t(FROM_LABEL[c.from]) }}, {{ i18n.t(TURN_GLYPH[c.turn]) }}</span>
              <span v-if="c.road === 'main'" class="text-2xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">{{ i18n.t({ uz: 'bosh yo\'l', kr: 'бош йўл' }) }}</span>
              <span v-else-if="c.road === 'minor'" class="text-2xs px-1.5 py-0.5 rounded bg-rose-100 text-rose-700">{{ i18n.t({ uz: 'yo\'l bering', kr: 'йўл беринг' }) }}</span>
              <span v-if="c.light" class="text-2xs px-1.5 py-0.5 rounded" :class="c.light === 'green' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'">{{ c.light === 'green' ? i18n.t({ uz: 'yashil', kr: 'яшил' }) : i18n.t({ uz: 'qizil', kr: 'қизил' }) }}</span>
            </div>
          </div>

          <div v-if="!checked" class="mt-5">
            <button @click="check" :disabled="picked.length !== scenario.cars.length"
              class="btn-gradient btn-lg w-full disabled:opacity-50">
              {{ i18n.t({ uz: 'Tekshirish', kr: 'Текшириш' }) }} ({{ picked.length }}/{{ scenario.cars.length }})
            </button>
          </div>

          <div v-else class="mt-5">
            <div class="px-4 py-3 rounded-xl" :class="correct ? 'bg-emerald-50 border border-emerald-200' : 'bg-rose-50 border border-rose-200'">
              <div class="font-semibold mb-1" :class="correct ? 'text-emerald-700' : 'text-rose-700'">
                {{ correct ? i18n.t({ uz: '✓ To\'g\'ri!', kr: '✓ Тўғри!' }) : i18n.t({ uz: '✗ Noto\'g\'ri', kr: '✗ Нотўғри' }) }}
              </div>
              <div class="text-sm text-ink-700 leading-relaxed">{{ i18n.t(scenario.rule) }}</div>
              <div v-if="!correct" class="text-xs text-ink-500 mt-2">{{ i18n.t({ uz: 'To\'g\'ri tartib', kr: 'Тўғри тартиб' }) }}: {{ scenario.order.join(' → ') }}</div>
            </div>
            <button @click="next" class="btn-gradient btn-lg w-full mt-3">
              {{ idx >= SCENARIOS.length - 1 ? i18n.t({ uz: 'Yakunlash', kr: 'Якунлаш' }) : i18n.t({ uz: 'Keyingi', kr: 'Кейинги' }) }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- result -->
    <div v-else class="card p-7 text-center">
      <div class="text-5xl mb-3">{{ score >= SCENARIOS.length - 1 ? '🏆' : '👍' }}</div>
      <h2 class="text-2xl font-semibold text-ink-900">{{ i18n.t({ uz: 'Tugadi!', kr: 'Тугади!' }) }}</h2>
      <div class="mt-3 text-3xl font-bold text-emerald-600 tabular-nums">{{ score }} / {{ SCENARIOS.length }}</div>
      <button @click="restart" class="btn-gradient btn-lg w-full mt-6">{{ i18n.t({ uz: 'Qayta o\'ynash', kr: 'Қайта ўйнаш' }) }}</button>
      <NuxtLink to="/" class="block mt-3 text-sm text-ink-500 hover:text-ink-900">{{ i18n.t({ uz: 'Bosh sahifa', kr: 'Бош саҳифа' }) }}</NuxtLink>
    </div>
  </div>
</template>
