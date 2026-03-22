import { defineStore } from 'pinia'
import { authApi, type LoginDto, type RegisterDto } from '~/api/auth'
import type { User, UsageQuota } from '~/api/types'

export const useAuthStore = defineStore('auth', () => {
  const user = useState<User | null>('auth-user', () => null)
  const quota = useState<UsageQuota | null>('auth-quota', () => null)

  const isLoggedIn = computed(() => !!user.value)

  function setUser(data: User | null) {
    user.value = data
  }

  function setQuota(data: UsageQuota | null) {
    quota.value = data
  }

  function clearAuth() {
    user.value = null
    quota.value = null
  }

  async function fetchUser() {
    try {
      const response = await authApi.me()

      if ((response.success || response.code === 0) && response.data) {
        const { quota: quotaData, ...userData } = response.data

        user.value = userData as User
        quota.value = quotaData ?? null
      } else {
        clearAuth()
      }
    } catch (error) {
      console.error('Auth Store Error:', error)
      clearAuth()
    }
  }

  async function login(credentials: LoginDto) {
    await authApi.login(credentials)
    await fetchUser()
    await navigateTo('/chat')
  }

  async function register(data: RegisterDto) {
    await authApi.register(data)
    await fetchUser()
  }

  async function logout() {
    try {
      await authApi.logout()
    } catch (e) {
      console.warn('Logout API failed:', e)
    }

    clearAuth()

    // 强制跳转到登录页
    if (import.meta.client) {
      // 使用 window.location.href 强制刷新页面，以确保清除所有状态
      window.location.href = '/login'
    } else {
      return navigateTo('/login', { replace: true })
    }
  }

  return {
    user,
    quota,
    isLoggedIn,
    setUser,
    setQuota,
    clearAuth,
    fetchUser,
    login,
    register,
    logout
  }
})
