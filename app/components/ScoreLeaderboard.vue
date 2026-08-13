<script setup lang="ts">
/**
 * Rejim reytingi (kunlik challenge / blits) — maketdagi PODIUM ko'rinishi:
 * yuqorida 2-1-3 o'rin (1-chisi kattaroq va yorqin halqada), pastda 4-o'rindan
 * boshlab oddiy qatorlar.
 */
const props = defineProps<{
  endpoint: string
  title: { uz: string, kr: string }
  subtitle?: { uz: string, kr: string }
  icon?: string
  tone?: 'violet' | 'amber'
  boardKey?: string
  /** "Barchasini ko'rish" havolasi (maketda bor) */
  moreTo?: string
}>()

const i18n = useI18n()
const { data, pending } = await useAsyncData(props.boardKey || `board-${props.endpoint}`,
  () => apiFetch<any>(props.endpoint),
  { server: false, default: () => null },
)

const top = computed<any[]>(() => data.value?.top ?? [])
const me = computed(() => data.value?.me ?? null)
const outOf = computed<number | null>(() => data.value?.out_of ?? null)
const meInTop = computed(() => top.value.some((u: any) => u.is_me))

/** Podium tartibi: 2 — 1 — 3 (maketdagidek), faqat mavjudlari. */
const podium = computed(() => [top.value[1], top.value[0], top.value[2]].filter(Boolean))
const qolgan = computed(() => top.value.slice(3))

function initials(name: string | null, login: string) {
  const src = name || login || ''
  return src.split(/\s+/).filter(Boolean).slice(0, 2).map(s => s[0]?.toUpperCase()).join('') || '·'
}
function fmtScore(s: number | null) {
  if (s === null || s === undefined) return '—'
  return outOf.value ? `${s}/${outOf.value}` : `${s}`
}
</script>

<template>
  <div class="lb" :class="`lb-${tone || 'amber'}`">
    <div class="lb-head">
      <span class="lb-tile"><AppIcon :name="icon || 'trophy'" :size="19" /></span>
      <div class="lb-ttl">
        <h2 class="lb-title">{{ i18n.t(title) }}</h2>
        <p v-if="subtitle" class="lb-sub">{{ i18n.t(subtitle) }}</p>
      </div>
      <NuxtLink v-if="moreTo" :to="moreTo" class="lb-more">
        {{ i18n.t({ uz: 'Barchasini ko\'rish', kr: 'Барчасини кўриш' }) }}
        <AppIcon name="arrow" :size="14" />
      </NuxtLink>
    </div>

    <!-- Yuklanmoqda -->
    <div v-if="pending && !top.length" class="lb-skel">
      <div v-for="i in 3" :key="i" class="sk" />
    </div>

    <!-- Bo'sh -->
    <p v-else-if="!top.length" class="lb-empty">
      {{ i18n.t({ uz: 'Hozircha ishtirokchi yo\'q. Birinchi bo\'ling!', kr: 'Ҳозирча иштирокчи йўқ. Биринчи бўлинг!' }) }}
    </p>

    <template v-else>
      <!-- ── Podium: 2 — 1 — 3 ── -->
      <ol class="pod">
        <li v-for="u in podium" :key="u.id" class="pod-i" :class="`p${u.rank}`">
          <div class="pod-av-wrap">
            <span class="pod-rk" :class="`r${u.rank}`">{{ u.rank }}</span>
            <span class="pod-av">{{ initials(u.full_name, u.login) }}</span>
          </div>
          <div class="pod-nom">{{ u.full_name || u.login }}</div>
          <div class="pod-score tabular-nums">{{ fmtScore(u.score) }}</div>
          <div v-if="u.is_me" class="pod-siz">({{ i18n.t({ uz: 'siz', kr: 'сиз' }) }})</div>
          <span v-if="u.points" class="pod-xp" :class="{ lead: u.rank === 1 }">
            <AppIcon name="trophy" :size="12" />
            <span class="tabular-nums">{{ u.points }}</span> XP
          </span>
        </li>
      </ol>

      <!-- ── 4-o'rindan pastga ── -->
      <ul v-if="qolgan.length" class="rows">
        <li v-for="u in qolgan" :key="u.id" class="row" :class="{ me: u.is_me }">
          <span class="row-rk tabular-nums">{{ u.rank }}</span>
          <span class="row-av">{{ initials(u.full_name, u.login) }}</span>
          <span class="row-nom">
            {{ u.full_name || u.login }}
            <span v-if="u.is_me" class="row-siz">({{ i18n.t({ uz: 'siz', kr: 'сиз' }) }})</span>
          </span>
          <span class="row-score tabular-nums">{{ fmtScore(u.score) }}</span>
          <span v-if="u.points" class="row-xp tabular-nums">{{ u.points }} XP</span>
        </li>
      </ul>

      <!-- Mehmon: ro'yxatdan o'tish taklifi -->
      <NuxtLink v-if="me?.is_guest" to="/register" class="lb-cta">
        {{ i18n.t({ uz: 'Reytingda qatnashish uchun ro\'yxatdan o\'ting', kr: 'Рейтингда қатнашиш учун рўйхатдан ўтинг' }) }}
        <AppIcon name="arrow" :size="14" />
      </NuxtLink>

      <!-- Siz TOP'da bo'lmasangiz — o'z natijangiz -->
      <div v-else-if="me && me.score !== null && !meInTop" class="row me own">
        <span class="row-rk tabular-nums">{{ me.rank ?? '—' }}</span>
        <span class="row-av">{{ initials(me.full_name, me.login) }}</span>
        <span class="row-nom">
          {{ me.full_name || me.login }}
          <span class="row-siz">({{ i18n.t({ uz: 'siz', kr: 'сиз' }) }})</span>
        </span>
        <span class="row-score tabular-nums">{{ fmtScore(me.score) }}</span>
      </div>
    </template>
  </div>
</template>

<style scoped>
.lb {
  display: flex; flex-direction: column;
  background: var(--surface); border: 1px solid var(--border-1);
  border-radius: 1rem; box-shadow: var(--shadow-card);
  padding: 1.25rem 1.5rem 1.25rem;
}
/* Ohang: kunlik = siyohrang, blits = amber (maketdagidek) */
.lb-violet { --lb: #6a5cf0; --lb-soft: #eef0fe; --lb-ink: #4c3fd0; }
.lb-amber  { --lb: #f59e0b; --lb-soft: #fef3c7; --lb-ink: #92400e; }
.dark .lb-violet { --lb-soft: rgba(106, 92, 240, 0.18); --lb-ink: #a89bfa; }
.dark .lb-amber  { --lb-soft: rgba(245, 158, 11, 0.18); --lb-ink: #fcd34d; }

.lb-head { display: flex; align-items: center; gap: 0.75rem; }
.lb-tile { flex-shrink: 0; display: grid; place-items: center; width: 2.375rem; height: 2.375rem; border-radius: 0.625rem; background: var(--lb-soft); color: var(--lb-ink); }
.lb-ttl { flex: 1 1 auto; min-width: 0; }
.lb-title { font-size: 1rem; font-weight: 600; color: var(--text-1); }
.lb-sub { margin-top: 0.1rem; font-size: 0.8125rem; color: var(--text-3); }
.lb-more {
  flex-shrink: 0; display: inline-flex; align-items: center; gap: 0.35rem;
  /* 2.125rem (34px) mobil bosish zonasi uchun chegaradan past edi — 36px */
  height: 2.25rem; padding: 0 0.75rem; border-radius: 0.5rem;
  background: var(--lb-soft); color: var(--lb-ink);
  font-size: 0.8125rem; font-weight: 600;
}
.lb-more:hover { filter: brightness(0.96); }

.lb-skel { display: grid; gap: 0.5rem; margin-top: 1.25rem; }
.sk { height: 2.5rem; border-radius: 0.5rem; background: var(--surface-inset); animation: lb-p 1.4s ease-in-out infinite; }
@keyframes lb-p { 0%, 100% { opacity: 1 } 50% { opacity: 0.55 } }
.lb-empty { margin: 2rem 0; text-align: center; font-size: 0.875rem; color: var(--text-3); }

/* ── Podium ─────────────────────────────────────────────────────────── */
.pod { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); align-items: end; gap: 0.5rem; margin-top: 1.5rem; }
.pod-i { display: flex; flex-direction: column; align-items: center; text-align: center; min-width: 0; }
/* 1-o'rin tepada va kattaroq — maketdagidek */
.pod-i.p1 { padding-bottom: 1.75rem; }

.pod-av-wrap { position: relative; }
.pod-av {
  display: grid; place-items: center;
  width: 3.5rem; height: 3.5rem; border-radius: 9999px;
  background: var(--text-1); color: var(--surface);
  font-size: 0.9375rem; font-weight: 700;
}
.p1 .pod-av { width: 4.5rem; height: 4.5rem; font-size: 1.125rem; box-shadow: 0 0 0 6px var(--lb-soft); }

.pod-rk {
  position: absolute; top: -0.375rem; left: 50%; transform: translateX(-50%);
  z-index: 1; display: grid; place-items: center;
  width: 1.375rem; height: 1.375rem; border-radius: 9999px;
  font-size: 0.6875rem; font-weight: 700; color: #fff;
  border: 2px solid var(--surface);
}
.pod-rk.r1 { background: #f59e0b; }
.pod-rk.r2 { background: #94a3b8; }
.pod-rk.r3 { background: #d97706; }

.pod-nom { margin-top: 0.625rem; font-size: 0.8125rem; font-weight: 600; color: var(--text-1); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 100%; }
.p1 .pod-nom { font-size: 0.875rem; }
.pod-score { margin-top: 0.15rem; font-size: 0.8125rem; color: var(--text-3); }
.pod-siz { font-size: 0.6875rem; color: var(--text-3); }
.pod-xp {
  display: inline-flex; align-items: center; gap: 0.25rem;
  margin-top: 0.5rem; height: 1.625rem; padding: 0 0.55rem; border-radius: 0.5rem;
  background: var(--lb-soft); color: var(--lb-ink);
  font-size: 0.75rem; font-weight: 700;
}
.pod-xp.lead { background: var(--lb); color: #fff; }
.dark .pod-xp.lead { color: #0b0e15; }

/* ── 4+ qatorlar ────────────────────────────────────────────────────── */
.rows { margin-top: 1.25rem; border-top: 1px solid var(--divider); }
.row {
  display: flex; align-items: center; gap: 0.75rem;
  padding: 0.625rem 0; border-bottom: 1px solid var(--divider);
}
.rows .row:last-child { border-bottom: none; }
.row.me { background: var(--lb-soft); border-radius: 0.5rem; padding-left: 0.5rem; padding-right: 0.5rem; }
.row.own { margin-top: 0.5rem; border-bottom: none; }
.row-rk { flex-shrink: 0; width: 1.25rem; text-align: center; font-size: 0.75rem; font-weight: 600; color: var(--text-3); }
.row-av { flex-shrink: 0; display: grid; place-items: center; width: 2rem; height: 2rem; border-radius: 9999px; background: var(--text-1); color: var(--surface); font-size: 0.6875rem; font-weight: 700; }
.row-nom { flex: 1 1 auto; min-width: 0; font-size: 0.8125rem; font-weight: 500; color: var(--text-1); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.row-siz { font-size: 0.6875rem; color: var(--text-3); }
.row-score { flex-shrink: 0; font-size: 0.8125rem; color: var(--text-3); }
.row-xp { flex-shrink: 0; font-size: 0.8125rem; font-weight: 700; color: var(--lb-ink); }

.lb-cta {
  display: flex; align-items: center; justify-content: center; gap: 0.4rem;
  margin-top: 1rem; height: 2.5rem; border-radius: 0.5rem;
  background: var(--lb-soft); color: var(--lb-ink);
  font-size: 0.8125rem; font-weight: 600;
}

@media (prefers-reduced-motion: reduce) { .sk { animation: none; } }
</style>
