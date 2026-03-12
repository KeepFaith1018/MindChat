/**
 * Auth Middleware - 鉴权中间件 (Global)
 *
 * 职责：
 * - 拦截未登录用户访问受限页面 (如 /chat)
 * - 拦截已登录用户访问 LandingPage 并重定向至 /chat
 *
 * @module app/middleware/auth.global
 */

export default defineNuxtRouteMiddleware((to) => {
  const authStore = useAuthStore()

  /**
   * 1. 拦截已登录用户：
   * 如果用户已登录，且当前访问的是首页 (/) 或登录页 (/login)，则重定向至对话页 (/chat)
   */
  if (authStore.isLoggedIn && (to.path === '/' || to.path === '/login')) {
    return navigateTo('/chat')
  }

  /**
   * 2. 拦截未登录用户：
   * 如果用户未登录，且当前访问的是受限页面 (如 /chat)，则重定向至登录页 (/login)
   */
  if (!authStore.isLoggedIn && to.path === '/chat') {
    return navigateTo(`/login?redirect=${to.fullPath}`)
  }
})
