export default defineNuxtPlugin(async () => {
  const authStore = useAuthStore()

  // 初始化用户信息
  // 1. 服务端渲染时：尝试从 Cookie 获取 Token 并请求用户信息，注入到 Store
  // 2. 客户端激活时：如果服务端已获取 (Hydration)，则跳过；否则 (SPA 导航) 尝试获取
  if (!authStore.user) {
    try {
      await authStore.fetchUser()
    } catch (e) {
      console.error('Auth Plugin Error:', e)
      // 初始化失败时，仅置空状态，不执行其他副作用（如强制跳转）
      // authStore.fetchUser 内部已经处理了 state 重置
    }
  }
})
