export default defineNuxtRouteMiddleware(async (to) => {
  const authStore = useAuthStore()

  // 1. 如果 Pinia 中没有用户信息，尝试从后端拉取 (Cookie 自动携带)
  if (!authStore.isLoggedIn) {
    try {
      await authStore.fetchUser()
    } catch (e) {
      console.error('Failed to fetch user:', e)
      // 拉取失败视为未登录，不处理错误
    }
  }

  const isLoggedIn = authStore.isLoggedIn
  const isLoginPage = to.path === '/login' || to.path === '/'

  /**
   * 已登录用户访问登录页 -> 跳转到聊天页
   */
  if (isLoggedIn && isLoginPage) {
    return navigateTo('/chat')
  }

  /**
   * 未登录访问受保护页面 -> 跳转到登录页
   */
  if (!isLoggedIn && to.path.startsWith('/chat')) {
    return navigateTo(`/login?redirect=${to.fullPath}`)
  }
})
