import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', () => {
  // 当前登录用户信息
  const user = useStorage<any>('mindchat-user', null)

  // 双 Token 机制 (使用 Cookie 存储)
  const accessToken = useCookie<string | null>('mindchat-access-token', { maxAge: 60 * 60 * 2 }) // 2小时
  const refreshToken = useCookie<string | null>('mindchat-refresh-token', {
    maxAge: 60 * 60 * 24 * 7
  }) // 7天

  // 计算属性：是否已登录
  const isLoggedIn = computed(() => !!accessToken.value)

  // 操作
  function setUser(userData: any) {
    user.value = userData
  }

  /**
   * 模拟登录行为
   */
  async function login(credentials: { email: string; password?: string }) {
    // 这里模拟 API 请求响应
    return new Promise((resolve) => {
      setTimeout(() => {
        accessToken.value = 'mock-access-token-' + Date.now()
        refreshToken.value = 'mock-refresh-token-' + Date.now()
        user.value = {
          id: '1',
          name: credentials.email.split('@')[0],
          email: credentials.email,
          avatar: ''
        }
        resolve(true)
      }, 800)
    })
  }

  /**
   * 模拟注册行为
   */
  async function register(data: { email: string; password?: string; name?: string }) {
    return new Promise((resolve) => {
      setTimeout(() => {
        accessToken.value = 'mock-access-token-' + Date.now()
        refreshToken.value = 'mock-refresh-token-' + Date.now()
        user.value = {
          id: '1',
          name: data.name || data.email.split('@')[0],
          email: data.email,
          avatar: ''
        }
        resolve(true)
      }, 800)
    })
  }

  /**
   * 模拟 Token 刷新机制
   */
  async function refreshTokens() {
    if (!refreshToken.value) return false

    accessToken.value = 'mock-access-token-refreshed-' + Date.now()
    return true
  }

  function logout() {
    user.value = null
    accessToken.value = null
    refreshToken.value = null
  }

  return {
    user,
    accessToken,
    refreshToken,
    isLoggedIn,
    setUser,
    login,
    register,
    logout,
    refreshTokens
  }
})
