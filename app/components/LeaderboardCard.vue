<script setup lang="ts">
/**
 * Umumiy XP reytingi — maketdagi ko'rinish: sarlavha + davr tablari
 * (Hafta / Oy / Hammasi) va qatorlar: o'rin nishoni, avatar, ism,
 * "🔥 N kunlik seriya", javob berilgan savol soni va XP chipi.
 */
const i18n = useI18n()

const davr = ref<'week' | 'month' | 'all'>('all')

const { data, status } = await useAsyncData(
  'xp-leaderboard',
  () => apiFetch<any>(`/leaderboard?period=${davr.value}&limit=10`),
  { server: false, default: () => null, watch: [davr] },
)
/** Davr almashganda skelet miltillamasin — oldingi ro'yxat shaffofroq turadi. */
const yangilanmoqda = computed(() => status.value === 'pending' && !!data.value)

const top = computed<any[]>(() => data.value?.top ?? [])
const me = computed(() => data.value?.me ?? null)
const meInTop = computed(() => top.value.some(u => u.is_me))

const DAVRLAR = [
  { id: 'week' as const, soz: { uz: 'Hafta', kr: 'Ҳафта' } },
  { id: 'month' as const, soz: { uz: 'Oy', kr: 'Ой' } },
  { id: 'all' as const, soz: { uz: 'Hammasi', kr: 'Ҳаммаси' } },
]

function initials(name: string | null, login: string) {
  const src = name || login || ''
  return src.split(/\s+/).filter(Boolean).slice(0, 2).map(s => s[0]?.toUpperCase()).join('') || '·'
}
function medal(rank: number) {
  return rank === 1 ? 'g' : rank === 2 ? 's' : rank === 3 ? 'b' : ''
}
</script>

<template>
  <section class="xlb">
    <div class="xlb-head">
      <span class="xlb-tile"><AppIcon name="trophy" :size="19" /></span>
      <div class="xlb-ttl">
        <h2 class="xlb-title">{{ i18n.t({ uz: 'Reyting', kr: 'Рейтинг' }) }}</h2>
        <p class="xlb-sub">{{ i18n.t({ uz: 'Umumiy XP bo\'yicha eng yaxshi foydalanuvchilar', kr: 'Умумий XP бўйича энг яхши фойдаланувчилар' }) }}</p>
      </div>
      <div class="segs" role="group" :aria-label="i18n.t({ uz: 'Davr', kr: 'Давр' })">
        <button
          v-for="d in DAVRLAR" :key="d.id" type="button" class="seg"
          :class="{ on: davr === d.id }" :aria-pressed="davr === d.id"
          @click="davr = d.id"
        >{{ i18n.t(d.soz) }}</button>
      </div>
    </div>

    <div v-if="status === 'pending' && !data" class="xlb-skel">
      <div v-for="i in 5" :key="i" class="sk" />
    </div>

    <p v-else-if="!top.length" class="xlb-empty">
      {{ i18n.t({ uz: 'Bu davr uchun ma\'lumot yo\'q.', kr: 'Бу давр учун маълумот йўқ.' }) }}
    </p>

    <ol v-else class="xrows" :class="{ stale: yangilanmoqda }">
      <li v-for="u in top" :key="u.id" class="xrow" :class="{ me: u.is_me }">
        <span class="xrk" :class="medal(u.rank)">{{ u.rank }}</span>
        <span class="xav">{{ initials(u.full_name, u.login) }}</span>

        <span class="xnom">
          <span class="xnom-t">
            {{ u.full_name || u.login }}
            <span v-if="u.is_me" class="xsiz">({{ i18n.t({ uz: 'siz', kr: 'сиз' }) }})</span>
          </span>
          <span v-if="u.streak" class="xstreak">
            <AppIcon name="flame" :size="12" />
            <span class="tabular-nums">{{ u.streak }}</span>
            {{ i18n.t({ uz: 'kunlik seriya', kr: 'кунлик серия' }) }}
          </span>
        </span>

        <span class="xnum">
          <span class="xnum-v tabular-nums">{{ (u.questions ?? 0).toLocaleString() }}</span>
          <span class="xnum-l">{{ i18n.t({ uz: 'Savol', kr: 'Савол' }) }}</span>
        </span>

        <span class="xxp">
          <AppIcon name="trophy" :size="13" />
          <span class="tabular-nums">{{ (u.points ?? 0).toLocaleString() }}</span> XP
        </span>
      </li>

      <!-- Siz TOP'da bo'lmasangiz -->
      <li v-if="me && !meInTop && !me.is_guest" class="xrow me own">
        <span class="xrk">{{ me.rank ?? '—' }}</span>
        <span class="xav">{{ initials(me.full_name, me.login) }}</span>
        <span class="xnom">
          <span class="xnom-t">
            {{ me.full_name || me.login }}
            <span class="xsiz">({{ i18n.t({ uz: 'siz', kr: 'сиз' }) }})</span>
          </span>
        </span>
        <span class="xxp">
          <AppIcon name="trophy" :size="13" />
          <span class="tabular-nums">{{ (me.points ?? 0).toLocaleString() }}</span> XP
        </span>
      </li>

      <li v-else-if="me?.is_guest" class="xrow">
        <NuxtLink to="/register" class="xcta">
          {{ i18n.t({ uz: 'Reytingda qatnashish uchun ro\'yxatdan o\'ting', kr: 'Рейтингда қатнашиш учун рўйхатдан ўтинг' }) }}
          <AppIcon name="arrow" :size="14" />
        </NuxtLink>
      </li>
    </ol>
  </section>
</template>

<style scoped>
.xlb {
  margin-top: 1rem; padding: 1.25rem 1.5rem 1.25rem;
  background: var(--surface); border: 1px solid var(--border-1);
  border-radius: 1rem; box-shadow: var(--shadow-card);
}
.xlb-head { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
.xlb-tile { flex-shrink: 0; display: grid; place-items: center; width: 2.375rem; height: 2.375rem; border-radius: 0.625rem; background: var(--warn-soft); color: var(--warn-ink); }
.xlb-ttl { flex: 1 1 auto; min-width: 0; }
.xlb-title { font-size: 1rem; font-weight: 600; color: var(--text-1); }
.xlb-sub { margin-top: 0.1rem; font-size: 0.8125rem; color: var(--text-3); }

.segs { display: inline-flex; gap: 0.125rem; padding: 0.1875rem; border-radius: 0.5rem; background: var(--surface-inset); }
.seg { height: 1.875rem; padding: 0 0.75rem; border-radius: 0.375rem; font-size: 0.8125rem; font-weight: 500; color: var(--text-3); transition: background 0.15s, color 0.15s; }
.seg:hover { color: var(--text-1); }
.seg.on { background: var(--surface); color: var(--text-1); box-shadow: var(--shadow-soft); font-weight: 600; }

.xlb-skel { display: grid; gap: 0.5rem; margin-top: 1.25rem; }
.sk { height: 3rem; border-radius: 0.625rem; background: var(--surface-inset); animation: x-p 1.4s ease-in-out infinite; }
@keyframes x-p { 0%, 100% { opacity: 1 } 50% { opacity: 0.55 } }
.xlb-empty { margin: 2rem 0; text-align: center; font-size: 0.875rem; color: var(--text-3); }

.xrows { margin-top: 1rem; }
.stale { opacity: 0.6; transition: opacity 0.2s; }
.xrow {
  display: flex; align-items: center; gap: 0.875rem;
  padding: 0.75rem 0.25rem; border-bottom: 1px solid var(--divider);
}
.xrows > .xrow:last-child { border-bottom: none; }
.xrow.me { background: var(--primary-soft); border-radius: 0.625rem; padding-left: 0.625rem; padding-right: 0.625rem; }
.xrow.own { margin-top: 0.5rem; border-bottom: none; }

.xrk {
  flex-shrink: 0; display: grid; place-items: center;
  width: 1.625rem; height: 1.625rem; border-radius: 9999px;
  background: var(--surface-inset); color: var(--text-3);
  font-size: 0.75rem; font-weight: 700; font-variant-numeric: tabular-nums;
}
.xrk.g { background: #f59e0b; color: #fff; }
.xrk.s { background: #94a3b8; color: #fff; }
.xrk.b { background: #d97706; color: #fff; }

.xav { flex-shrink: 0; display: grid; place-items: center; width: 2.25rem; height: 2.25rem; border-radius: 9999px; background: var(--text-1); color: var(--surface); font-size: 0.75rem; font-weight: 700; }

.xnom { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; gap: 0.1rem; }
.xnom-t { font-size: 0.875rem; font-weight: 600; color: var(--text-1); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.xsiz { font-size: 0.6875rem; font-weight: 500; color: var(--text-3); }
.xstreak { display: inline-flex; align-items: center; gap: 0.25rem; font-size: 0.75rem; color: var(--warn-ink); }

.xnum { flex-shrink: 0; display: flex; flex-direction: column; align-items: flex-end; min-width: 4rem; }
.xnum-v { font-size: 0.875rem; font-weight: 600; color: var(--text-1); }
.xnum-l { font-size: 0.6875rem; color: var(--text-3); }

.xxp {
  flex-shrink: 0; display: inline-flex; align-items: center; gap: 0.3rem;
  height: 2rem; padding: 0 0.7rem; border-radius: 0.5rem;
  background: var(--warn-soft); color: var(--warn-ink);
  font-size: 0.8125rem; font-weight: 700;
}

.xcta { display: flex; align-items: center; justify-content: center; gap: 0.4rem; width: 100%; height: 2.5rem; border-radius: 0.5rem; background: var(--primary-soft); color: var(--primary-ink); font-size: 0.8125rem; font-weight: 600; }

@media (prefers-reduced-motion: reduce) { .sk { animation: none; } .stale { transition: none; } }
@media (max-width: 767px) {
  .xlb { padding: 1.125rem; }
  .xnum { display: none; }
  .segs { width: 100%; }
  /* Mobilda barmoq bilan bosiladi: 30px juda kichik edi → 36px */
  .seg { flex: 1 1 auto; height: 2.25rem; }
}
</style>
