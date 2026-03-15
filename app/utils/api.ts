import type { ApiResponse } from '~/api/types'
import type { FetchOptions } from 'ofetch'

/**
 * refresh token 请求锁
 * 防止多个 401 同时触发 refresh
 */
let refreshPromise: Promise<void> | null = null

/**
 * 刷新 token
 */
async function refreshToken() {
  const config = useRuntimeConfig()
  if (!refreshPromise) {
    refreshPromise = $fetch<ApiResponse<null>>('/auth/refresh', {
      baseURL: config.public.apiBase,
      method: 'POST'
    })
      .then(() => {})
      .finally(() => {
        refreshPromise = null
      })
  }

  return refreshPromise
}

/**
 * 统一 API 请求封装
 */
export const $api = async <T>(
  url: string,
  options: FetchOptions<'json'> = {}
): Promise<ApiResponse<T>> => {
  const config = useRuntimeConfig()

  // SSR 自动透传 Cookie
  if (import.meta.server) {
    const headers = useRequestHeaders(['cookie'])
    options.headers = {
      ...headers,
      ...options.headers
    }
  }

  const doRequest = () =>
    $fetch<ApiResponse<T>>(url, {
      baseURL: config.public.apiBase,
      ...(options as any)
    })

  try {
    const response = await doRequest()

    /**
     * 业务 401
     */
    if (
      response?.code === 40101 &&
      !url.includes('/auth/refresh') &&
      !url.includes('/auth/login')
    ) {
      await refreshToken()
      return await doRequest()
    }

    return response
  } catch (error: any) {
    /**
     * HTTP 401
     */
    if (
      error?.response?.status === 401 &&
      !url.includes('/auth/refresh') &&
      !url.includes('/auth/login')
    ) {
      try {
        await refreshToken()
        return await doRequest()
      } catch {
        const authStore = useAuthStore()
        authStore.clearAuth()

        throw error
      }
    }

    throw error
  }
}
