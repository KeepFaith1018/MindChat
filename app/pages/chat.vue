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

/**
 * 确保有一个对话，或者在挂载时创建一个
 */
onMounted(() => {
  // 进入页面后，确保 Loading 状态关闭
  appStore.setLoading(false)

  if (!chatStore.currentConversationId) {
    chatStore.createConversation()
  }
})
</script>

<template>
  <div
    class="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-white dark:bg-gray-950"
  >
    <!-- 欢迎屏幕（居中） -->
    <div v-if="chatStore.currentMessages.length === 0" class="flex-1 overflow-y-auto">
      <ChatWelcomeScreen @send="chatStore.sendMessage" />
    </div>

    <!-- 聊天模式（消息 + 底部输入框） -->
    <template v-else>
      <ChatMessageList :messages="chatStore.currentMessages" />
      <ChatInputBox mode="bottom" :loading="chatStore.isThinking" @send="chatStore.sendMessage" />
    </template>
  </div>
</template>
