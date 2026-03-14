import { defineStore } from 'pinia'
import type { User, UsageQuota, MeResponse, IApiResponse } from 'share/types'

export const useAuthStore = defineStore('auth', () => {
  // 当前登录用户信息 (使用 useState 保持 SSR 同步)
  const user = useState<User | null>('auth-user', () => null)
  const quota = useState<UsageQuota | null>('auth-quota', () => null)

  // 计算属性：是否已登录
  const isLoggedIn = computed(() => !!user.value)

  // 操作
  function setUser(userData: User | null) {
    user.value = userData
  }

  function setQuota(quotaData: UsageQuota | null) {
    quota.value = quotaData
  }

  /**
   * 初始化/获取用户信息
   */
  async function fetchUser() {
    try {
      // 使用 $api 封装，自动处理 Token 刷新
      const response = await $api<IApiResponse<MeResponse>>('/api/auth/me')
      if (response.code === 200 && response.data) {
        user.value = response.data.user
        quota.value = response.data.quota
      } else {
        user.value = null
        quota.value = null
      }
    } catch (error) {
      console.error('Auth Store Error:', error)
      user.value = null
      quota.value = null
    }
  }

  /**
   * 登录
   */
  async function login(credentials: { email: string; password?: string }) {
    await $api('/api/auth/login', {
      method: 'POST',
      body: credentials
    })
    // 登录成功后拉取用户信息
    await fetchUser()
  }

  /**
   * 注册
   */
  async function register(data: {
    email: string
    password?: string
    name?: string
    confirmPassword?: string
  }) {
    await $api('/api/auth/register', {
      method: 'POST',
      body: data
    })
    // 注册成功后拉取用户信息
    await fetchUser()
  }

  /**
   * 退出登录
   */
  async function logout() {
    try {
      await $api('/api/auth/logout', { method: 'POST' })
    } catch (e) {
      // 忽略登出错误，确保前端状态清除
      console.warn('Logout API failed:', e)
    } finally {
      user.value = null
      quota.value = null

      // 只有当前不在登录页时，才执行跳转或刷新
      if (import.meta.client && !window.location.pathname.startsWith('/login')) {
        // 强制刷新页面以清除所有状态
        window.location.href = '/login'
      } else if (import.meta.server) {
        navigateTo('/login')
      }
    }
  }

  return {
    user,
    quota,
    isLoggedIn,
    setUser,
    setQuota,
    fetchUser,
    login,
    register,
    logout
  }
})
