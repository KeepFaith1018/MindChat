export default defineNuxtRouteMiddleware(async (to) => {
  const authStore = useAuthStore()
  // 只有在访问 /chat 开头的路由时才校验登录态，加载用户信息
  if (!to.path.startsWith('/chat')) {
    return
  }
  await authStore.fetchUser()
  if (!authStore.isLoggedIn) {
    return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`)
  }
})
