/**
 * Dashboard aksent ohanglari — bitta manba.
 *
 * IconTile, QuickActionCard va mavzu progress barlari shu yerdan rang oladi,
 * shuning uchun bir ohang (masalan "violet") hamma joyda bir xil ko'rinadi.
 * Light/dark uchun alohida to'plam: dark rejimda pastel fonlar ko'zni qamashtirmasin
 * deb shaffof rgba ishlatiladi.
 */
export type Tone = 'brand' | 'emerald' | 'amber' | 'rose' | 'violet' | 'sky' | 'ink'

export interface ToneSet {
  /** ikonka plitkasi foni */
  bg: string
  /** ikonka rangi */
  fg: string
  /** dumaloq strelka tugmasi foni */
  arrowBg: string
}

const LIGHT: Record<Tone, ToneSet> = {
  brand:   { bg: '#e6ecfa', fg: '#3f5894', arrowBg: 'rgba(63,88,148,0.10)' },
  emerald: { bg: '#d8f6e7', fg: '#047857', arrowBg: 'rgba(16,185,129,0.12)' },
  amber:   { bg: '#fef1d6', fg: '#b45309', arrowBg: 'rgba(245,158,11,0.14)' },
  rose:    { bg: '#ffe3e8', fg: '#be123c', arrowBg: 'rgba(244,63,94,0.12)' },
  violet:  { bg: '#ece8fe', fg: '#6d28d9', arrowBg: 'rgba(139,92,246,0.12)' },
  sky:     { bg: '#dff1fe', fg: '#0369a1', arrowBg: 'rgba(14,165,233,0.12)' },
  ink:     { bg: '#edeef2', fg: '#3f4552', arrowBg: 'rgba(95,100,112,0.12)' },
}

const DARK: Record<Tone, ToneSet> = {
  brand:   { bg: 'rgba(79,110,240,0.20)',  fg: '#a5b6e8', arrowBg: 'rgba(79,110,240,0.18)' },
  emerald: { bg: 'rgba(16,185,129,0.18)',  fg: '#6ee7b7', arrowBg: 'rgba(16,185,129,0.16)' },
  amber:   { bg: 'rgba(251,191,36,0.18)',  fg: '#fcd34d', arrowBg: 'rgba(251,191,36,0.16)' },
  rose:    { bg: 'rgba(244,63,94,0.18)',   fg: '#fda4af', arrowBg: 'rgba(244,63,94,0.16)' },
  violet:  { bg: 'rgba(139,92,246,0.20)',  fg: '#c4b5fd', arrowBg: 'rgba(139,92,246,0.18)' },
  sky:     { bg: 'rgba(14,165,233,0.18)',  fg: '#7dd3fc', arrowBg: 'rgba(14,165,233,0.16)' },
  ink:     { bg: 'rgba(255,255,255,0.08)', fg: '#d9dade', arrowBg: 'rgba(255,255,255,0.08)' },
}

export function useTone(tone: MaybeRefOrGetter<Tone>) {
  const theme = useTheme()
  return computed<ToneSet>(() => {
    const t = toValue(tone)
    const set = theme.isDark.value ? DARK : LIGHT
    return set[t] ?? set.brand
  })
}
