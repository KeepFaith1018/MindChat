import { defineStore } from 'pinia'
import { fetchEventSource } from '@microsoft/fetch-event-source'
// @ts-ignore
import { v4 as uuidv4 } from 'uuid'
import { chatApi } from '~/api/chat'
import { uploadApi } from '~/api/upload'
import type { Conversation, Message, MessageRole, MessageStatus } from '~/api/types'

// Re-export types for component usage if needed, or update components to import from types
export type { Conversation, Message, MessageRole, MessageStatus }

// SSE 事件类型
type SSEEventType = 'meta' | 'thinking' | 'content' | 'tool_call' | 'tool_result' | 'error' | 'done'

export const useChatStore = defineStore('chat', () => {
  const toast = useToast()
  const authStore = useAuthStore()
  const route = useRoute()
  const router = useRouter()

  // State
  const conversations = ref<Conversation[]>([])
  const currentMessages = ref<Message[]>([])
  const currentConversationId = ref<string | null>(null)
  const isGenerating = ref(false)
  const isCreatingConversation = ref(false)
  const isConversationMissing = ref(false)
  const currentModel = ref('deepseek-ai/DeepSeek-V3')
  const abortController = ref<AbortController | null>(null)
  const currentFileIds = ref<string[]>([]) // 存储当前上传的文件 IDs
  const isDraftConversation = computed(
    () => !!currentConversationId.value && currentMessages.value.length === 0 && !isGenerating.value
  )

  const syncConversationQuery = async (conversationId: string | null) => {
    const currentCid = typeof route.query.cid === 'string' ? route.query.cid : null
    if (currentCid === conversationId) return
    const nextQuery = { ...route.query }
    if (conversationId) {
      nextQuery.cid = conversationId
    } else {
      delete nextQuery.cid
    }
    await router.replace({ query: nextQuery })
  }

  // Actions

  /**
   * 加载会话列表
   */
  const loadConversations = async (page = 1) => {
    try {
      const response = await chatApi.getConversations(page, 20)
      // 注意：$api 返回 ApiResponse，如果 code === 0，则 data 是 PaginatedList
      if (response.success && response.data) {
        if (page === 1) {
          conversations.value = response.data.items
        } else {
          conversations.value.push(...response.data.items)
        }
      }
    } catch (e) {
      console.error('Failed to load conversations:', e)
    }
  }

  /**
   * 加载会话详情
   */
  const loadConversation = async (id: string) => {
    if (isGenerating.value) {
      if (!import.meta.client || !window.confirm('当前正在生成内容，是否停止并切换会话？')) return
      abortGeneration()
    }

    try {
      const response = await chatApi.getConversation(id)
      if (response.success && response.data) {
        const data = response.data
        isConversationMissing.value = false
        currentConversationId.value = data.id
        currentModel.value = data.modelId
        currentFileIds.value = []

        // 转换消息格式
        currentMessages.value = data.messages.map((m: any) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          reasoning: m.reasoningContent, // 确保后端字段名一致
          status: 'done',
          createdAt: m.createdAt
        }))
        await syncConversationQuery(data.id)
      }
    } catch (e) {
      console.error('Failed to load conversation:', e)
      const code = (e as any)?.response?._data?.code
      if (code === 43001) {
        isConversationMissing.value = true
        currentConversationId.value = null
        currentMessages.value = []
        currentFileIds.value = []
        await syncConversationQuery(null)
        toast.add({ title: '当前会话不存在，请新建会话或选择其他历史对话', color: 'warning' })
        return
      }
      toast.add({ title: '加载会话失败', color: 'error' })
      navigateTo('/chat')
    }
  }

  /**
   * 删除会话
   */
  const deleteConversation = async (id: string) => {
    try {
      await chatApi.deleteConversation(id)
      conversations.value = conversations.value.filter((c) => c.id !== id)

      if (currentConversationId.value === id) {
        createConversation()
      }
      toast.add({ title: '会话已删除' })
    } catch (e) {
      console.error('Failed to delete conversation:', e)
      toast.add({ title: '删除失败', color: 'error' })
    }
  }

  /**
   * 更新会话 (标题/置顶)
   */
  const updateConversation = async (id: string, payload: Partial<Conversation>) => {
    try {
      await chatApi.updateConversation(id, payload)

      const index = conversations.value.findIndex((c) => c.id === id)
      if (index !== -1 && conversations.value[index]) {
        const current = conversations.value[index]
        conversations.value[index] = {
          id: current.id,
          title: payload.title ?? current.title,
          updatedAt: payload.updatedAt ?? current.updatedAt,
          modelId: payload.modelId ?? current.modelId
        }
      }
    } catch (e) {
      console.error('Failed to update conversation:', e)
      toast.add({ title: '更新失败', color: 'error' })
    }
  }

  /**
   * 创建新会话
   */
  const createConversation = async () => {
    if (isCreatingConversation.value) return

    if (isDraftConversation.value) {
      toast.add({ title: '当前已是新对话', color: 'info' })
      return
    }

    if (isGenerating.value) {
      if (!import.meta.client || !window.confirm('当前正在生成内容，是否停止并新建对话？')) return
      abortGeneration()
    }

    isCreatingConversation.value = true
    try {
      isConversationMissing.value = false
      const response = await chatApi.createConversation({ modelId: currentModel.value })
      if (response.success && response.data) {
        currentConversationId.value = response.data.id
        currentModel.value = response.data.modelId || currentModel.value
        await syncConversationQuery(response.data.id)
      } else {
        currentConversationId.value = null
        await syncConversationQuery(null)
      }
    } catch (e) {
      console.error('Failed to create conversation:', e)
      toast.add({ title: '创建会话失败，已切换到本地草稿', color: 'warning' })
      currentConversationId.value = null
      await syncConversationQuery(null)
    } finally {
      isCreatingConversation.value = false
    }

    currentMessages.value = []
    currentFileIds.value = []
    await loadConversations(1)
  }

  /**
   * 中断生成
   */
  const abortGeneration = () => {
    if (abortController.value) {
      abortController.value.abort()
      abortController.value = null
      isGenerating.value = false

      // 更新最后一条消息状态
      const lastMsg = currentMessages.value[currentMessages.value.length - 1]
      if (lastMsg && lastMsg.role === 'assistant' && lastMsg.status !== 'done') {
        lastMsg.status = 'done'
      }
    }
  }

  /**
   * 发送消息
   */
  const sendMessage = async (content: string) => {
    if (!content.trim() || isGenerating.value) return
    if (isConversationMissing.value) {
      toast.add({ title: '当前会话不存在，请先新建会话或选择其他历史对话', color: 'warning' })
      return
    }

    if (!currentConversationId.value) {
      isCreatingConversation.value = true
      try {
        const response = await chatApi.createConversation({ modelId: currentModel.value })
        if (response.success && response.data) {
          isConversationMissing.value = false
          currentConversationId.value = response.data.id
          currentModel.value = response.data.modelId || currentModel.value
          await syncConversationQuery(response.data.id)
          await loadConversations(1)
        } else {
          toast.add({ title: '创建会话失败，请稍后重试', color: 'error' })
          return
        }
      } catch (e) {
        console.error('Failed to create conversation:', e)
        toast.add({ title: '创建会话失败，请稍后重试', color: 'error' })
        return
      } finally {
        isCreatingConversation.value = false
      }
    }

    // 1. 添加用户消息
    const userMsg: Message = {
      id: uuidv4(),
      role: 'user',
      content: content.trim(),
      createdAt: new Date().toISOString()
    }
    currentMessages.value.push(userMsg)

    // 2. 准备 AI 消息占位符
    const aiMsgId = uuidv4()
    const aiMsg: Message = {
      id: aiMsgId,
      role: 'assistant',
      content: '',
      reasoning: '', // 初始化为空
      status: 'thinking', // 初始状态为思考中 (乐观更新)
      createdAt: new Date().toISOString()
    }
    currentMessages.value.push(aiMsg)

    isGenerating.value = true
    abortController.value = new AbortController()

    try {
      // 0. 发送前确保 Token 有效 (通过 fetchUser 触发 $api 的自动刷新逻辑)
      if (!authStore.isLoggedIn) {
        try {
          await authStore.fetchUser()
        } catch (e) {
          console.error('Failed to fetch user:', e)
          // 如果 fetchUser 失败，说明真的无法获取用户信息，直接停止
          toast.add({ title: '请先登录', color: 'error' })
          await navigateTo('/login')
          isGenerating.value = false
          abortController.value = null
          // 删除刚才添加的临时消息
          currentMessages.value.pop() // remove AI msg
          currentMessages.value.pop() // remove user msg
          return
        }
      }

      // 3. 发起 SSE 请求
      const config = useRuntimeConfig()
      await fetchEventSource(`${config.public.apiBase}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
          // 自动附加 Auth Token (如果 $api 已处理 cookie，fetchEventSource 可能需要手动处理)
          // 这里假设 cookie 自动携带，或者需要从 authStore 获取 token
        },
        body: JSON.stringify({
          messages: currentMessages.value.slice(0, -1).map((m) => ({
            role: m.role,
            content: m.content
          })),
          model: currentModel.value,
          conversationId: currentConversationId.value,
          fileIds: currentFileIds.value // 添加文件 ID
        }),
        signal: abortController.value.signal,

        async onopen(response) {
          if (response.ok) {
            return // connection established
          } else if (response.status === 401) {
            // 处理未登录
            throw new Error('Unauthorized')
          } else {
            throw new Error(`Server error: ${response.status}`)
          }
        },

        onmessage(msg) {
          // 如果消息被中断，停止处理
          if (!isGenerating.value) return

          const event = msg.event as SSEEventType
          let data: any
          try {
            data = msg.data ? JSON.parse(msg.data) : null
          } catch (e) {
            console.error('Failed to parse SSE message:', e)
            // done event might send plain text
            data = msg.data
          }

          // 获取当前响应式消息对象
          const currentAiMsg = currentMessages.value.find((m) => m.id === aiMsgId)
          if (!currentAiMsg) return

          switch (event) {
            case 'meta':
              if (data?.conversationId) {
                currentConversationId.value = data.conversationId
                syncConversationQuery(data.conversationId)
              }
              break

            case 'thinking':
              // 收到思考内容
              if (currentAiMsg.status !== 'thinking') {
                currentAiMsg.status = 'thinking'
              }
              if (data?.delta) {
                currentAiMsg.reasoning = (currentAiMsg.reasoning || '') + data.delta
              }
              break

            case 'content':
              // 收到正文内容，状态流转为 answering
              if (currentAiMsg.status !== 'answering') {
                currentAiMsg.status = 'answering'
              }
              if (data?.delta) {
                currentAiMsg.content += data.delta
              }
              break

            case 'done':
              currentAiMsg.status = 'done'
              isGenerating.value = false
              abortController.value = null
              loadConversations(1)
              break

            case 'error':
              currentAiMsg.status = 'error'
              currentAiMsg.content += `\n[Error: ${data?.message || 'Unknown error'}]`
              isGenerating.value = false
              throw new Error(data?.message)
          }
        },

        onerror(err) {
          console.error('SSE Error:', err)
          if (err.message === 'Unauthorized') {
            toast.add({ title: '请先登录', color: 'error' })
            navigateTo('/login')
          }
          // fetchEventSource 默认会重试，除非抛出错误
          throw err
        }
      })
    } catch (err: any) {
      console.error('Chat Error:', err)
      const currentAiMsg = currentMessages.value.find((m) => m.id === aiMsgId)
      if (currentAiMsg) {
        currentAiMsg.status = 'error'
        if (!currentAiMsg.content) {
          currentAiMsg.content = '生成失败，请重试。'
        }
      }
      isGenerating.value = false
      abortController.value = null
    }
  }

  /**
   * 上传文件 (简单版)
   */
  const uploadFile = async (file: File) => {
    try {
      const response = await uploadApi.upload(file)
      if (response.success && response.data) {
        currentFileIds.value.push(response.data.id)
        toast.add({ title: '上传成功' })
        return response.data
      }
    } catch (e) {
      console.error('Upload failed:', e)
      toast.add({ title: '上传失败', color: 'error' })
    }
    return null
  }

  return {
    conversations,
    currentMessages,
    currentConversationId,
    isGenerating,
    isCreatingConversation,
    isConversationMissing,
    isDraftConversation,
    currentModel,
    currentFileIds, // export state
    createConversation,
    loadConversations,
    loadConversation,
    deleteConversation,
    updateConversation,
    sendMessage,
    abortGeneration,
    uploadFile // export action
  }
})
