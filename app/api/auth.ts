import { $api } from '../utils/api'
import type { AuthResponseData } from './types'

// Login DTO
export interface LoginDto {
  email: string
  password?: string
}

// Register DTO
export interface RegisterDto {
  email: string
  password?: string
  name?: string
  confirmPassword?: string
}

export const authApi = {
  /**
   * 注册
   */
  register: (data: RegisterDto) =>
    $api<AuthResponseData>('/auth/register', { method: 'POST', body: data }),

  /**
   * 登录
   */
  login: (data: LoginDto) => $api<AuthResponseData>('/auth/login', { method: 'POST', body: data }),

  /**
   * 退出登录
   */
  logout: () => $api<null>('/auth/logout', { method: 'POST' }),

  /**
   * 获取当前用户信息
   */
  me: () => $api<AuthResponseData>('/auth/me', { method: 'GET' }),

  /**
   * 刷新 Token (通常由拦截器自动调用)
   */
  refresh: () => $api<null>('/auth/refresh', { method: 'POST' })
}
