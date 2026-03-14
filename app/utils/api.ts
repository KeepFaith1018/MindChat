/**
 * 封装 $fetch，统一处理 401 Token 过期问题
 */
export const $api = async <T>(url: string, options: any = {}) => {
  // 服务端渲染时，自动透传 Cookie
  if (import.meta.server) {
    const headers = useRequestHeaders(['cookie'])
    options.headers = { ...headers, ...options.headers }
  }

  try {
    return await $fetch<T>(url, options)
  } catch (error: any) {
    // 拦截 401 错误，排除登录和刷新接口本身
    if (
      error.response?.status === 401 &&
      !url.includes('/auth/refresh') &&
      !url.includes('/auth/login')
    ) {
      try {
        // 尝试刷新 Token
        await $fetch('/api/auth/refresh', { method: 'POST' })

        // 刷新成功，重试原请求
        return await $fetch<T>(url, options)
      } catch (refreshError) {
        // 刷新失败 (Refresh Token 过期或无效)，执行登出
        const authStore = useAuthStore()

        // 只有当不在登录页时才执行强制登出逻辑，避免死循环
        // 同时检查是否在首页，避免匿名访问首页时被强制跳转
        if (
          import.meta.client &&
          !window.location.pathname.startsWith('/login') &&
          window.location.pathname !== '/'
        ) {
          authStore.logout()
        }

        throw refreshError
      }
    }
    // 其他错误直接抛出
    throw error
  }
}
