export interface Achievement {
  id: string
  icon: string
  tone: 'brand' | 'emerald' | 'amber' | 'rose' | 'violet' | 'sky' | 'ink'
  title: { uz: string, kr: string }
  desc:  { uz: string, kr: string }
  on: boolean
  reward?: number
  unlocked_at?: string | null
  progress?: { value: number, target: number }
}

/**
 * Achievements are now defined and evaluated on the backend
 * (GET /api/me/achievements). The endpoint returns the full catalog with
 * each item's unlock state, progress and bonus reward.
 */
export function useAchievements() {
  const auth = useAuthStore()

  const { data, pending, refresh } = useAsyncData<Achievement[]>('me-achievements', async () => {
    if (!auth.token) return []
    try {
      const res = await apiFetch<{ data: Achievement[] }>('/me/achievements')
      return res.data || []
    }
    catch {
      return []
    }
  }, { server: false })

  const items = computed<Achievement[]>(() => data.value || [])
  const earned = computed(() => items.value.filter(a => a.on))

  return { items, earned, pending, refresh }
}
