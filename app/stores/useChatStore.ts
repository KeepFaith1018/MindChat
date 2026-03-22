import { defineStore } from 'pinia'
// @ts-ignore
import { v4 as uuidv4 } from 'uuid'
import { chatApi } from '~/api/chat'
import { getErrorMessage } from '~/utils/error'
import { $apiStream } from '~/utils/api'
import { parseSSEStream, type SSEEvent } from '~/utils/stream'
import { useModelStore } from './useModelStore'
import { useFileStore } from './useFileStore'
import type { UploadResponseData } from '~/api/upload'
import type { Conversation, Message, MessageRole, MessageStatus, ModelConfig } from '~/api/types'

// Re-export types for component usage
export type { Conversation, Message, MessageRole, MessageStatus, ModelConfig, UploadResponseData }

/**
 * SSE 事件类型定义
 */
type SSEEventType = 'meta' | 'thinking' | 'content' | 'tool_call' | 'tool_result' | 'error' | 'done'

export const useChatStore = defineStore('chat', () => {
  const toast = useToast()
  const modelStore = useModelStore()
  const fileStore = useFileStore()
  const route = useRoute()
  const router = useRouter()

  // --- State ---
  const conversations = ref<Conversation[]>([])
  const currentMessages = ref<Message[]>([])
  const currentConversationId = ref<string | null>(null)
  const isGenerating = ref(false)
  const isCreatingConversation = ref(false)
  const isConversationMissing = ref(false)
  const abortController = ref<AbortController | null>(null)

  // --- Computed ---
  const isDraftConversation = computed(
    () => !!currentConversationId.value && currentMessages.value.length === 0 && !isGenerating.value
  )

  // --- Helpers ---

  /**
   * 同步路由中的会话 ID
   */
  const updateConversationQuery = async (conversationId: string | null) => {
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

  /**
   * 创建用户消息对象
   */
  const createUserMessage = (content: string): Message => ({
    id: uuidv4(),
    role: 'user',
    content: content.trim(),
    createdAt: new Date().toISOString()
  })

  /**
   * 创建助手消息对象（初始状态）
   */
  const createAssistantMessage = (): Message => ({
    id: uuidv4(),
    role: 'assistant',
    content: '',
    reasoning: '',
    status: 'thinking',
    toolResults: [],
    createdAt: new Date().toISOString()
  })

  /**
   * 重置当前会话状态到欢迎页
   */
  const resetToWelcome = async () => {
    currentConversationId.value = null
    currentMessages.value = []
    fileStore.clearFiles()
    await updateConversationQuery(null)
  }

  // --- Actions ---

  /**
   * 加载历史会话列表
   */
  const loadConversations = async (page = 1) => {
    try {
      const response = await chatApi.getConversations(page, 20)
      if (response.success && response.data) {
        if (page === 1) {
          conversations.value = response.data.items
        } else {
          conversations.value.push(...response.data.items)
        }
      }
    } catch (e) {
      toast.add({ title: '加载列表失败', description: getErrorMessage(e), color: 'error' })
    }
  }

  /**
   * 加载特定会话详情
   */
  const loadConversation = async (id: string) => {
    if (isGenerating.value) {
      if (!import.meta.client || !window.confirm('当前正在生成，是否停止并切换？')) return
      abortGeneration()
    }

    try {
      const response = await chatApi.getConversation(id)
      if (response.success && response.data) {
        const data = response.data
        isConversationMissing.value = false
        currentConversationId.value = data.id

        // 核心改动：调用 ModelStore 切换模型
        modelStore.selectModel(data.modelId)

        fileStore.clearFiles()

        currentMessages.value = data.messages.map((m: any) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          reasoning: m.reasoningContent,
          status: 'done',
          toolResults: m.toolResults || [],
          createdAt: m.createdAt
        }))
        await updateConversationQuery(data.id)
      }
    } catch (e) {
      const code = (e as any)?.response?._data?.code
      if (code === 43001) {
        isConversationMissing.value = true
        await resetToWelcome()
        toast.add({ title: getErrorMessage(e), color: 'warning' })
      } else {
        toast.add({ title: '加载失败', description: getErrorMessage(e), color: 'error' })
      }
    }
  }

  /**
   * 发送消息并开启流式响应
   */
  const sendMessage = async (content: string) => {
    if (!content.trim() || isGenerating.value) return
    if (isConversationMissing.value) {
      toast.add({ title: '会话不存在，请新建', color: 'warning' })
      return
    }

    // 1. 自动创建会话（如果是新对话）
    if (!currentConversationId.value) {
      isCreatingConversation.value = true
      try {
        const res = await chatApi.createConversation({ modelId: modelStore.currentModel })
        if (res.success && res.data) {
          currentConversationId.value = res.data.id
          modelStore.applyModelCapabilities(modelStore.currentModel)
          await updateConversationQuery(res.data.id)
          await loadConversations(1)
        } else {
          throw new Error('Create failed')
        }
      } catch (e) {
        toast.add({ title: '创建会话失败', description: getErrorMessage(e), color: 'error' })
        return
      } finally {
        isCreatingConversation.value = false
      }
    }

    const fileIds = [...fileStore.currentFileIds]

    // 2. 乐观更新 UI
    const userMsg = createUserMessage(content)
    currentMessages.value.push(userMsg)

    const aiMsg = createAssistantMessage()
    const aiMsgIndex = currentMessages.value.length
    currentMessages.value.push(aiMsg)
    fileStore.clearFiles()

    // 3. 启动流式传输
    await startChatStream(aiMsgIndex, fileIds)
  }

  /**
   * 核心流式处理逻辑
   */
  const startChatStream = async (aiMsgIndex: number, fileIds: string[]) => {
    isGenerating.value = true
    abortController.value = new AbortController()

    try {
      const history = currentMessages.value
        .slice(0, -1)
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .map((m) => ({
          role: m.role,
          content: m.content
        }))

      // 1. 发起流式请求
      const response = await $apiStream('/chat', {
        method: 'POST',
        body: {
          messages: history,
          model: modelStore.currentModel,
          conversationId: currentConversationId.value,
          fileIds,
          capabilities: modelStore.enabledCapabilities
        },
        signal: abortController.value?.signal
      })

      // 2. 解析流数据
      for await (const msg of parseSSEStream(response)) {
        if (!isGenerating.value) break
        handleSSEMessage(msg, aiMsgIndex)
      }
    } catch (err: any) {
      // 如果是手动中断，不作为错误处理
      if (err.name === 'AbortError') return

      console.error('Chat Stream Error:', err)
      handleSSEError(err)

      const msg = currentMessages.value[aiMsgIndex]
      if (msg) {
        msg.status = 'error'
        if (!msg.content) msg.content = `生成失败: ${getErrorMessage(err)}`
      }
    } finally {
      isGenerating.value = false
      abortController.value = null
    }
  }

  const retryAssistantMessage = async (messageId: string) => {
    if (isGenerating.value) return

    const assistantIndex = currentMessages.value.findIndex(
      (message) => message.id === messageId && message.role === 'assistant'
    )
    if (assistantIndex === -1) return

    currentMessages.value = currentMessages.value.slice(0, assistantIndex)
    const aiMsg = createAssistantMessage()
    const aiMsgIndex = currentMessages.value.length
    currentMessages.value.push(aiMsg)
    await startChatStream(aiMsgIndex, [])
  }

  /**
   * 处理 SSE 消息分发
   */
  const handleSSEMessage = (msg: SSEEvent, index: number) => {
    const event = msg.event as SSEEventType
    let data: any
    try {
      data = msg.data ? JSON.parse(msg.data) : null
    } catch (e) {
      console.log('SSE Parse Error:', e)
      data = msg.data
    }

    const currentAiMsg = currentMessages.value[index]
    if (!currentAiMsg) return

    switch (event) {
      case 'meta':
        if (data?.conversationId) {
          currentConversationId.value = data.conversationId
          updateConversationQuery(data.conversationId)
        }
        break

      case 'tool_result':
        if (data) {
          currentAiMsg.toolResults = currentAiMsg.toolResults || []
          currentAiMsg.toolResults.push({
            tool: data.tool,
            query: data.query,
            items: data.items,
            images: data.images
          })
        }
        break

      case 'thinking':
        currentAiMsg.status = 'thinking'
        if (data?.delta) currentAiMsg.reasoning += data.delta
        break

      case 'content':
        currentAiMsg.status = 'answering'
        if (data?.delta) currentAiMsg.content += data.delta
        break

      case 'done':
        currentAiMsg.status = 'done'
        loadConversations(1)
        break

      case 'error':
        currentAiMsg.status = 'error'
        throw new Error(data?.message || 'Stream Error')
    }
  }

  /**
   * 处理流式错误分类提示
   */
  const handleSSEError = (err: any) => {
    const message = err.message || ''
    if (message === 'Unauthorized') {
      toast.add({ title: '请先登录', color: 'error' })
      navigateTo('/login')
    } else if (message === 'ConversationNotFound') {
      toast.add({ title: '会话已失效', color: 'warning' })
      resetToWelcome()
    } else if (message.startsWith('NetworkError')) {
      toast.add({ title: '网络连接异常', color: 'error' })
    } else if (message === 'ServerError') {
      toast.add({ title: '服务器繁忙，请稍后再试', color: 'error' })
    }
  }

  /**
   * 停止生成
   */
  const abortGeneration = () => {
    if (abortController.value) {
      abortController.value.abort()
      abortController.value = null
      isGenerating.value = false
      const lastMsg = currentMessages.value[currentMessages.value.length - 1]
      if (lastMsg?.role === 'assistant' && lastMsg.status !== 'done') {
        lastMsg.status = 'done'
      }
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
      if (!import.meta.client || !window.confirm('当前正在生成，是否停止并新建？')) return
      abortGeneration()
    }

    isCreatingConversation.value = true
    try {
      isConversationMissing.value = false
      const response = await chatApi.createConversation({ modelId: modelStore.currentModel })
      if (response.success && response.data) {
        currentConversationId.value = response.data.id
        modelStore.selectModel(response.data.modelId || modelStore.currentModel)
        await updateConversationQuery(response.data.id)
      } else {
        currentConversationId.value = null
        await updateConversationQuery(null)
      }
    } catch (e) {
      toast.add({ title: '创建失败', description: getErrorMessage(e), color: 'warning' })
      currentConversationId.value = null
      await updateConversationQuery(null)
    } finally {
      isCreatingConversation.value = false
    }

    currentMessages.value = []
    fileStore.clearFiles()
    await loadConversations(1)
  }

  /**
   * 模型切换并同步到后端
   */
  const selectModel = async (modelId: string) => {
    if (!modelId) return

    // 1. 更新本地模型状态
    modelStore.selectModel(modelId)

    // 2. 如果存在当前会话，同步到后端
    if (currentConversationId.value) {
      try {
        await chatApi.updateConversation(currentConversationId.value, { modelId })
      } catch (e) {
        console.error('Failed to sync model choice:', e)
      }
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
        const current = conversations.value[index]!
        conversations.value[index] = {
          id: current.id,
          title: payload.title ?? current.title,
          updatedAt: payload.updatedAt ?? current.updatedAt,
          modelId: payload.modelId ?? current.modelId
        }
      }
    } catch (e) {
      console.error('Failed to update conversation:', e)
      toast.add({ title: '更新失败', description: getErrorMessage(e), color: 'error' })
    }
  }

  return {
    // Main State
    conversations,
    currentMessages,
    currentConversationId,
    isGenerating,
    isCreatingConversation,
    isConversationMissing,
    // Computed
    isDraftConversation,
    // Actions
    loadConversations,
    loadConversation,
    createConversation,
    sendMessage,
    retryAssistantMessage,
    abortGeneration,
    resetToWelcome,
    selectModel,
    updateConversation,
    deleteConversation: async (id: string) => {
      try {
        await chatApi.deleteConversation(id)
        conversations.value = conversations.value.filter((c) => c.id !== id)
        if (currentConversationId.value === id) await resetToWelcome()
        toast.add({ title: '已删除' })
      } catch (e) {
        console.error('Failed to delete conversation:', e)
        toast.add({ title: '删除失败', color: 'error' })
      }
    }
  }
})
