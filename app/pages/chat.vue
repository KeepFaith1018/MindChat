<script setup lang="ts">
/**
 * Chat Page - 聊天页面
 *
 * 职责：负责渲染对话列表和输入框，处理聊天逻辑。
 *
 * @module app/pages/chat
 */

const chatStore = useChatStore()
const modelStore = useModelStore()
const appStore = useAppStore()
const route = useRoute()

const showWelcome = computed(
  () => !chatStore.currentConversationId && chatStore.currentMessages.length === 0
)

/**
 * SSR 数据预取
 * 在服务器端并行加载会话列表，以及当前选中的会话详情
 * 模型加载改为客户端 mounted 后加载，以优化首屏 SSR 性能
 */
await useAsyncData('chat-init', async () => {
  try {
    console.log('[ChatPage] useAsyncData starting (Conversations only)...')
    const promises: Promise<any>[] = [chatStore.loadConversations(1)]

    const cid = typeof route.query.cid === 'string' ? route.query.cid : null
    if (cid) {
      console.log('[ChatPage] Loading specific conversation:', cid)
      promises.push(chatStore.loadConversation(cid))
    }

    // 设置一个超时，防止整个页面挂死
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Initialization timeout')), 10000)
    )

    await Promise.race([Promise.all(promises), timeoutPromise])
    console.log('[ChatPage] useAsyncData finished successfully')
    return true
  } catch (e) {
    console.error('[ChatPage] Init failed or timed out:', e)
    return false
  }
})

onMounted(() => {
  console.log('[ChatPage] onMounted')
  appStore.setLoading(false)

  // 核心逻辑：客户端挂载后加载模型
  if (!modelStore.isInitialized) {
    console.log('[ChatPage] Initializing models on client mounted...')
    modelStore.loadModels()
    modelStore.loadCapabilities()
  }
})

watch(
  () => route.query.cid,
  (cid) => {
    const nextCid = typeof cid === 'string' ? cid : null
    if (nextCid && nextCid !== chatStore.currentConversationId) {
      chatStore.loadConversation(nextCid)
    }
  }
)
</script>

<template>
  <div
    class="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-white dark:bg-gray-950"
  >
    <!-- 欢迎屏幕（居中） -->
    <div v-if="showWelcome" class="flex-1 overflow-y-auto">
      <ChatWelcomeScreen
        :disabled="chatStore.isConversationMissing"
        @send="chatStore.sendMessage"
      />
    </div>

    <!-- 聊天模式（消息 + 底部输入框） -->
    <template v-else>
      <ChatMessageList
        :messages="chatStore.currentMessages"
        @retry="chatStore.retryAssistantMessage"
      />
      <ChatInputBox
        mode="bottom"
        :loading="chatStore.isGenerating"
        :disabled="chatStore.isConversationMissing"
        @send="chatStore.sendMessage"
        @stop="chatStore.abortGeneration"
      />
    </template>
  </div>
</template>
