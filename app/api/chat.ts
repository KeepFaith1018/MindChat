import { $api } from '../utils/api'
import type { Conversation, PaginatedList, Message } from './types'

export const chatApi = {
  createConversation: (payload?: { modelId?: string }) =>
    $api<Conversation>('/conversations', {
      method: 'POST',
      body: payload
    }),

  /**
   * 加载会话列表
   */
  getConversations: (page = 1, pageSize = 20) =>
    $api<PaginatedList<Conversation>>('/conversations', {
      params: { page, pageSize }
    }),

  /**
   * 加载会话详情
   */
  getConversation: (id: string) =>
    $api<Conversation & { messages: Message[] }>(`/conversations/${id}`),

  /**
   * 删除会话
   */
  deleteConversation: (id: string) => $api<null>(`/conversations/${id}`, { method: 'DELETE' }),

  /**
   * 更新会话 (标题/置顶等)
   */
  updateConversation: (id: string, payload: Partial<Conversation>) =>
    $api<null>(`/conversations/${id}`, {
      method: 'PATCH',
      body: payload
    })
}
