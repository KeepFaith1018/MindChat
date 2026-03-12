import { defineStore } from 'pinia'

// 聊天类型定义
export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  createdAt: string
  reasoning?: string // 用于思考过程
  toolCalls?: any[]
}

export interface Conversation {
  id: string
  title: string
  updatedAt: string
}

export const useChatStore = defineStore('chat', () => {
  // 状态
  const conversations = ref<Conversation[]>([])
  const currentMessages = ref<Message[]>([])
  const currentConversationId = ref<string | null>(null)
  const isThinking = ref(false)

  // 操作
  async function createConversation() {
    const newId = Date.now().toString()
    const newConv: Conversation = {
      id: newId,
      title: '新对话',
      updatedAt: new Date().toISOString()
    }
    conversations.value.unshift(newConv)
    currentConversationId.value = newId
    currentMessages.value = [] // 清除新聊天的消息
    return newId
  }

  async function sendMessage(content: string) {
    if (!content.trim()) return

    // 添加用户消息
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      createdAt: new Date().toISOString()
    }
    currentMessages.value.push(userMsg)
    isThinking.value = true

    // 模拟 AI 响应（流式传输模拟）
    // 在真实应用中，这将使用 fetch/SSE
    setTimeout(() => {
      const aiMsgId = (Date.now() + 1).toString()
      const aiMsg: Message = {
        id: aiMsgId,
        role: 'assistant',
        content: '',
        createdAt: new Date().toISOString(),
        reasoning: '正在思考...'
      }
      currentMessages.value.push(aiMsg)

      // 模拟流式传输
      let i = 0
      const text =
        '这是一个模拟的 AI 回复。\n\n我正在使用 Nuxt 4 和 Nuxt UI 4 构建这个聊天应用。如有任何问题请告诉我！'
      const interval = setInterval(() => {
        if (i < text.length) {
          // 在数组中查找消息并更新它（响应式）
          const msg = currentMessages.value.find((m) => m.id === aiMsgId)
          if (msg) {
            msg.content += text[i]
            // 模拟提前完成思考
            if (i > 5 && msg.reasoning) msg.reasoning = undefined
          }
          i++
        } else {
          clearInterval(interval)
          isThinking.value = false
        }
      }, 50)
    }, 600)
  }

  return {
    conversations,
    currentMessages,
    currentConversationId,
    isThinking,
    createConversation,
    sendMessage
  }
})
