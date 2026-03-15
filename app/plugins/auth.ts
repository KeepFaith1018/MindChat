export default defineNuxtPlugin(async () => {
  const authStore = useAuthStore()

  const token = useCookie('access_token')

  // 没 token 不请求
  if (!token.value) {
    return
  }

  // 已有 user 不请求
  if (authStore.user) {
    return
  }

  try {
    await authStore.fetchUser()
  } catch (error) {
    console.error('Auth Plugin Error:', error)
  }
})
