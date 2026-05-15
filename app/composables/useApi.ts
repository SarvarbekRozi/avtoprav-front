import type { UseFetchOptions } from 'nuxt/app'

export function useApi<T = any>(url: string | (() => string), opts: UseFetchOptions<T> = {}) {
  const config = useRuntimeConfig()
  const auth = useAuthStore()

  return useFetch<T>(url, {
    baseURL: config.public.apiBase + '/api',
    headers: computed(() => {
      const h: Record<string, string> = { Accept: 'application/json' }
      if (auth.token) h.Authorization = `Bearer ${auth.token}`
      return h
    }) as any,
    onResponseError({ response }) {
      if (response?.status === 401) {
        auth.clear()
      }
    },
    ...opts,
  })
}

export async function apiFetch<T = any>(url: string, opts: any = {}): Promise<T> {
  const config = useRuntimeConfig()
  const auth = useAuthStore()
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(opts.headers || {}),
  }
  if (auth.token) headers.Authorization = `Bearer ${auth.token}`

  try {
    return await $fetch<T>(url, {
      baseURL: config.public.apiBase + '/api',
      ...opts,
      headers,
    })
  }
  catch (err: any) {
    if (err?.response?.status === 401) {
      auth.clear()
    }
    throw err
  }
}
