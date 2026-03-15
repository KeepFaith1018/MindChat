// 通用响应结构
export interface ApiResponse<T = any> {
  success: boolean
  code: number
  message: string
  data: T
}

// 用户信息 (Data Model)
export interface User {
  id: string
  email: string
  name?: string
  avatarUrl?: string
  status: number
  createdAt: string
  updatedAt: string
}

// 配额信息 (假设)
export interface UsageQuota {
  userId: string
  dailyTokenLimit: number
  dailyTokenUsage: number
  totalTokenUsage: string // BigInt usually serialized as string
  updatedAt: string
}

// 登录/注册响应中的 Data 部分
export interface AuthResponseData extends User {
  quota?: UsageQuota
}

// 消息角色
export type MessageRole = 'user' | 'assistant' | 'system'

// 消息状态 (FSM)
export type MessageStatus = 'idle' | 'thinking' | 'tool_calling' | 'answering' | 'error' | 'done'

// 消息结构
export interface Message {
  id: string
  conversationId?: string
  role: MessageRole
  content: string
  reasoning?: string
  status?: MessageStatus // 仅 assistant 消息有此状态
  createdAt: string
  toolCalls?: any[]
}

// 会话结构
export interface Conversation {
  id: string
  title: string
  updatedAt: string
  modelId: string
}

// 分页响应
export interface PaginatedList<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
