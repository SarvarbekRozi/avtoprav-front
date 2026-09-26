<script setup lang="ts">
/**
 * Huquqiy hujjat (maxfiylik siyosati, foydalanish shartlari) uchun umumiy qobiq.
 *
 * Matn sahifalarda MA'LUMOT sifatida turadi, bu yerda faqat chiziladi — ikkala
 * hujjat bir xil ko'rinadi va yangi bo'lim qo'shish uchun shablonga tegish
 * shart emas.
 */
type L = { uz: string, kr: string }
export type LegalBlock = L | { list: L[] }
export type LegalSection = { title: L, body: LegalBlock[] }

defineProps<{
  eyebrow: L
  title: L
  updated: L
  intro: L
  sections: LegalSection[]
}>()

const i18n = useI18n()
const route = useRoute()

const isList = (b: LegalBlock): b is { list: L[] } => 'list' in b
</script>

<template>
  <div class="legal mx-auto w-full max-w-3xl px-4 sm:px-6 pt-6 lg:pt-10 pb-16">
    <header>
      <div class="eyebrow">{{ i18n.t(eyebrow) }}</div>
      <h1 class="page-title">{{ i18n.t(title) }}</h1>
      <p class="updated">{{ i18n.t(updated) }}</p>
      <p class="intro">{{ i18n.t(intro) }}</p>
    </header>

    <article class="panel-card mt-6 p-5 sm:p-8">
      <section v-for="(s, i) in sections" :key="i" class="sec">
        <h2 class="sec-title">
          <span class="sec-n tabular-nums">{{ i + 1 }}.</span> {{ i18n.t(s.title) }}
        </h2>
        <template v-for="(b, j) in s.body" :key="j">
          <ul v-if="isList(b)" class="sec-list">
            <li v-for="(li, k) in b.list" :key="k">{{ i18n.t(li) }}</li>
          </ul>
          <p v-else class="sec-p">{{ i18n.t(b) }}</p>
        </template>
      </section>
    </article>

    <nav class="other" :aria-label="i18n.t({ uz: 'Boshqa hujjatlar', kr: 'Бошқа ҳужжатлар' })">
      <NuxtLink v-if="route.path !== '/maxfiylik'" to="/maxfiylik">
        {{ i18n.t({ uz: 'Maxfiylik siyosati', kr: 'Махфийлик сиёсати' }) }}
      </NuxtLink>
      <NuxtLink v-if="route.path !== '/shartlar'" to="/shartlar">
        {{ i18n.t({ uz: 'Foydalanish shartlari', kr: 'Фойдаланиш шартлари' }) }}
      </NuxtLink>
      <NuxtLink to="/">{{ i18n.t({ uz: 'Bosh sahifa', kr: 'Бош саҳифа' }) }}</NuxtLink>
    </nav>
  </div>
</template>

<style scoped>
.panel-card {
  background: var(--surface);
  border: 1px solid var(--border-1);
  border-radius: 1rem;
  box-shadow: var(--shadow-card);
}
.eyebrow {
  font-size: 0.75rem; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase;
  color: var(--primary);
}
.page-title {
  margin-top: 0.35rem;
  font-size: 1.875rem; font-weight: 700; letter-spacing: -0.025em; line-height: 1.15;
  color: var(--text-1);
}
@media (min-width: 640px) { .page-title { font-size: 2.25rem; } }
.updated { margin-top: 0.5rem; font-size: 0.8125rem; color: var(--text-4); }
.intro { margin-top: 0.875rem; font-size: 0.9375rem; line-height: 1.7; color: var(--text-2); }

.sec + .sec { margin-top: 1.75rem; padding-top: 1.75rem; border-top: 1px solid var(--divider); }
.sec-title { font-size: 1.125rem; font-weight: 650; line-height: 1.35; color: var(--text-1); }
.sec-n { color: var(--text-4); font-weight: 600; }
.sec-p, .sec-list { margin-top: 0.75rem; font-size: 0.9375rem; line-height: 1.7; color: var(--text-2); }
.sec-list { padding-left: 1.25rem; list-style: disc; }
.sec-list li + li { margin-top: 0.375rem; }
.sec-list li::marker { color: var(--text-4); }

.other {
  margin-top: 1.5rem;
  display: flex; flex-wrap: wrap; gap: 0.5rem 1.25rem;
  font-size: 0.875rem;
}
.other a { color: var(--primary); font-weight: 500; }
.other a:hover { text-decoration: underline; }
</style>
