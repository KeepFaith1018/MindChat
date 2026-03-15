/**
 * 通用 API 响应结构
 */
export interface IApiResponse<T = any> {
  code: number
  message: string
  data: T | null
}

/**
 * 用户基础信息
 * 对应数据库 User 表
 */
export interface User {
  id: string
  email: string
  name: string | null
  avatarUrl: string | null
  status: number
  createdAt: string | Date
  updatedAt: string | Date
}

/**
 * 用户用量配额
 * 对应数据库 UsageQuota 表
 */
export interface UsageQuota {
  userId: string
  dailyTokenLimit: number
  dailyTokenUsage: number
  totalTokenUsage: number | string // BigInt 在 JSON 中通常会被转为字符串
  lastRequestAt: string | Date | null
  updatedAt: string | Date
}

/**
 * 登录/注册成功后的返回数据 (包含 User)
 * 注意：Token 通过 HttpOnly Cookie 传递，不在响应体中
 */
export type AuthResponse = User

/**
 * 获取当前用户信息接口的返回数据
 */
export interface MeResponse {
  user: User
  quota: UsageQuota | null
}
