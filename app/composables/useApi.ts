import type { $Fetch, FetchOptions } from 'ofetch'
import { useAuthStore } from '~/stores/auth'

export class ApiError extends Error {
  constructor(public status: number, public data: any) {
    super(extractMessage(data) || `Xatolik (${status})`)
  }
}

/** DRF xatolik javobidan o'qiladigan matn chiqaradi */
export function extractMessage(data: any): string {
  if (!data)
    return ''
  if (typeof data === 'string')
    return data
  if (data.detail)
    return String(data.detail)
  if (Array.isArray(data))
    return data.map(extractMessage).join(', ')
  if (typeof data === 'object') {
    return Object.entries(data)
      .map(([key, value]) => {
        const msg = extractMessage(value)
        return key === 'non_field_errors' ? msg : `${key}: ${msg}`
      })
      .join('; ')
  }
  return ''
}

// Nitro'ning route-typed $fetch'i o'rniga oddiy ofetch tipi
const http = $fetch as unknown as $Fetch

let refreshing: Promise<boolean> | null = null

async function refreshToken(base: string): Promise<boolean> {
  const auth = useAuthStore()
  if (!auth.refresh)
    return false
  refreshing ??= http<{ access: string }>('/api/auth/refresh/', {
    baseURL: base,
    method: 'POST',
    body: { refresh: auth.refresh },
  })
    .then((res) => {
      auth.setAccess(res.access)
      return true
    })
    .catch(() => false)
    .finally(() => {
      refreshing = null
    })
  return refreshing
}

export function useApi() {
  const config = useRuntimeConfig()
  const base = config.public.apiBase as string

  async function request<T>(url: string, options: FetchOptions<'json'> = {}, retry = true): Promise<T> {
    const auth = useAuthStore()
    try {
      return await http<T>(url, {
        baseURL: base,
        ...options,
        headers: {
          ...(options.headers as Record<string, string>),
          ...(auth.access ? { Authorization: `Bearer ${auth.access}` } : {}),
        },
      })
    }
    catch (e: any) {
      const status = e?.response?.status ?? 0
      if (status === 401 && retry && auth.refresh) {
        if (await refreshToken(base))
          return request<T>(url, options, false)
        auth.logout()
        await navigateTo('/login')
      }
      throw new ApiError(status, e?.data)
    }
  }

  return {
    get: <T>(url: string, query?: Record<string, any>) => request<T>(url, { query }),
    post: <T>(url: string, body?: any) => request<T>(url, { method: 'POST', body }),
    patch: <T>(url: string, body?: any) => request<T>(url, { method: 'PATCH', body }),
    del: <T>(url: string) => request<T>(url, { method: 'DELETE' }),
    request,
  }
}
