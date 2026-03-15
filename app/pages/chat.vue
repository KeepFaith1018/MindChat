<script setup lang="ts">
/**
 * Chat Page - 聊天页面
 *
 * 职责：负责渲染对话列表和输入框，处理聊天逻辑。
 *
 * @module app/pages/chat
 */

const chatStore = useChatStore()
const appStore = useAppStore()
const route = useRoute()
const showWelcome = computed(
  () => !chatStore.currentConversationId && chatStore.currentMessages.length === 0
)

/**
 * 确保有一个对话，或者在挂载时创建一个
 */
onMounted(() => {
  appStore.setLoading(false)
  const cid = typeof route.query.cid === 'string' ? route.query.cid : null
  if (cid && cid !== chatStore.currentConversationId) {
    chatStore.loadConversation(cid)
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
      <ChatMessageList :messages="chatStore.currentMessages" />
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
