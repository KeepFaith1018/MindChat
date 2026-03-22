import type { ApiResponse } from '~/api/types'
import type { FetchOptions } from 'ofetch'

type ApiOptions = FetchOptions<'json'> & {
  _retry?: boolean
  silent?: boolean
}

let isRefreshing = false
let refreshQueue: Array<() => void> = []

/**
 * 判断 auth API
 */
function isAuthApi(url: string) {
  return (
    url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/refresh')
  )
}

/**
 * 获取运行时 API 基础地址
 */
function getApiBaseURL() {
  const apiBase = process.env.NUXT_PUBLIC_API_BASE || '/v1'
  const apiAllBase = process.env.NUXT_PUBLIC_API_ALL_BASE || 'http://localhost:3001/v1'
  return import.meta.server ? apiAllBase : apiBase
}

/**
 * 获取 SSR headers 快照（仅在入口处调用）
 */
function getSSRHeadersSnapshot() {
  if (!import.meta.server) {
    return undefined
  }
  return useRequestHeaders(['cookie'])
}

/**
 * SSR cookie 透传
 */
function attachSSRHeaders(options: ApiOptions, headersSnapshot?: Record<string, string>) {
  if (import.meta.server) {
    const headers = headersSnapshot || useRequestHeaders(['cookie'])

    options.headers = {
      ...headers,
      ...options.headers
    }
  }
}

/**
 * 执行 refresh
 */
async function refreshToken(headersSnapshot?: Record<string, string>) {
  if (isRefreshing) {
    return new Promise<void>((resolve) => {
      refreshQueue.push(resolve)
    })
  }

  isRefreshing = true

  try {
    const refreshOptions: ApiOptions = {
      baseURL: getApiBaseURL(),
      method: 'POST',
      credentials: 'include'
    }

    attachSSRHeaders(refreshOptions, headersSnapshot)

    const res = await $fetch<ApiResponse<null>>('/auth/refresh', refreshOptions as any)

    if (!res || res.code !== 0) {
      throw new Error('Refresh token failed')
    }

    /**
     * 刷新成功，执行队列
     */
    refreshQueue.forEach((cb) => cb())
    refreshQueue = []
  } catch (err) {
    const authStore = useAuthStore()

    authStore.clearAuth()

    if (import.meta.client) {
      navigateTo('/login')
    }

    throw err
  } finally {
    isRefreshing = false
  }
}

/**
 * 请求拦截扩展点
 */
async function requestInterceptor(
  url: string,
  options: ApiOptions
): Promise<{ url: string; options: ApiOptions }> {
  return { url, options }
}

/**
 * 响应拦截器
 * 仅做响应透传，UI 错误提示由页面/Store 处理
 */
async function responseInterceptor<T>(response: ApiResponse<T>, _options: ApiOptions) {
  return response
}

/**
 * 通用 JSON 请求封装
 */
export const $api = async <T>(url: string, options: ApiOptions = {}): Promise<ApiResponse<T>> => {
  const headersSnapshot = getSSRHeadersSnapshot()
  attachSSRHeaders(options, headersSnapshot)

  /**
   * request interceptor
   */
  const req = await requestInterceptor(url, options)

  const request = (overrideOptions: ApiOptions = {}) => {
    const fetchOptions = {
      baseURL: getApiBaseURL(),
      credentials: 'include',
      ...req.options,
      ...overrideOptions,
      headers: {
        ...((req.options.headers || {}) as Record<string, string>),
        ...((overrideOptions.headers || {}) as Record<string, string>)
      }
    } as any

    return $fetch<ApiResponse<T>>(req.url, fetchOptions)
  }

  const retry = async () => {
    options._retry = true
    await refreshToken(headersSnapshot)

    if (import.meta.server) {
      attachSSRHeaders(options, headersSnapshot)
    }

    return request(options)
  }

  try {
    const res = await request()

    /**
     * token 业务过期
     */
    if (
      (res.code === 40100 || res.code === 40101) &&
      !options._retry &&
      !isAuthApi(url) &&
      import.meta.client
    ) {
      const retryRes = await retry()
      return responseInterceptor(retryRes, options)
    }

    return responseInterceptor(res, options)
  } catch (err: any) {
    /**
     * HTTP 401
     */
    if (err?.response?.status === 401 && !options._retry && !isAuthApi(url) && import.meta.client) {
      const retryRes = await retry()
      return responseInterceptor(retryRes, options)
    }

    throw err
  }
}

/**
 * 流式请求包装器 $apiStream
 *
 * 思路：基于原生 fetch 实现，支持流式解析 ReadableStream，
 * 同时集成了 $api 的鉴权、Cookie 透传与 Token 自动刷新能力。
 */
export const $apiStream = async (url: string, options: ApiOptions = {}): Promise<Response> => {
  const headersSnapshot = getSSRHeadersSnapshot()
  // 1. SSR 处理与拦截器
  attachSSRHeaders(options, headersSnapshot)
  const req = await requestInterceptor(url, options)

  // 2. 构造原生 fetch 请求闭包
  const request = async (overrideOptions: ApiOptions = {}) => {
    const finalOptions = {
      ...req.options,
      ...overrideOptions,
      headers: {
        ...((req.options.headers || {}) as Record<string, string>),
        ...((overrideOptions.headers || {}) as Record<string, string>)
      }
    }

    const fullUrl = req.url.startsWith('http') ? req.url : `${getApiBaseURL()}${req.url}`

    return fetch(fullUrl, {
      method: finalOptions.method || 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...finalOptions.headers
      },
      body: finalOptions.body ? JSON.stringify(finalOptions.body) : undefined,
      signal: finalOptions.signal
    })
  }

  // 3. 执行请求
  try {
    const response = await request()

    // 4. 处理 401 自动刷新
    if (response.status === 401 && !options._retry && !isAuthApi(url) && import.meta.client) {
      options._retry = true
      await refreshToken(headersSnapshot)

      if (import.meta.server) {
        attachSSRHeaders(options, headersSnapshot)
      }

      return request(options)
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `HTTP Error ${response.status}`)
    }

    return response
  } catch (err: any) {
    console.error('API Stream Error:', err)
    throw err
  }
}
