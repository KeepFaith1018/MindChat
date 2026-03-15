<script setup lang="ts">
import { type Message } from '~/stores/useChatStore'
import MarkdownRenderer from './MarkdownRenderer.vue'

const props = defineProps<{
  messages: Message[]
}>()

const containerRef = ref<HTMLElement | null>(null)

// 自动滚动
const scrollToBottom = () => {
  if (containerRef.value) {
    nextTick(() => {
      containerRef.value!.scrollTop = containerRef.value!.scrollHeight
    })
  }
}

watch(
  () => props.messages,
  () => {
    scrollToBottom()
  },
  { deep: true, flush: 'post' }
)

onMounted(() => {
  scrollToBottom()
})
</script>

<template>
  <div ref="containerRef" class="flex-1 space-y-6 overflow-y-auto scroll-smooth p-4">
    <div
      v-if="messages.length === 0"
      class="flex h-full min-h-[50vh] flex-col items-center justify-center text-gray-400"
    >
      <UIcon name="i-lucide-bot" class="mb-4 h-16 w-16 opacity-50" />
      <p>开始一个新的对话吧</p>
    </div>

    <div v-for="msg in messages" :key="msg.id" class="flex flex-col gap-4">
      <div
        class="flex max-w-4xl gap-4"
        :class="[msg.role === 'user' ? 'flex-row-reverse self-end' : 'self-start']"
      >
        <!-- 头像 -->
        <UAvatar
          :src="msg.role === 'user' ? 'https://avatars.githubusercontent.com/u/739984?v=4' : ''"
          :alt="msg.role === 'user' ? 'User' : 'AI'"
          :icon="msg.role === 'assistant' ? 'i-lucide-bot' : undefined"
          size="sm"
          class="mt-1 shrink-0"
        />

        <!-- 内容气泡 -->
        <div class="flex max-w-[85%] min-w-0 flex-col gap-1">
          <!-- 名称 -->
          <div
            class="flex gap-2 px-1 text-xs text-gray-400"
            :class="[msg.role === 'user' ? 'justify-end' : '']"
          >
            <span>{{ msg.role === 'user' ? '你' : 'MindChat' }}</span>
          </div>

          <!-- 思考过程 (仅 AI) -->
          <UAccordion
            v-if="msg.reasoning"
            class="mb-2"
            :items="[
              { label: '深度思考过程', content: msg.reasoning, icon: 'i-lucide-brain-circuit' }
            ]"
          >
            <template #content="{ item }">
              <div
                class="rounded bg-gray-50 p-2 text-xs whitespace-pre-wrap text-gray-500 dark:bg-gray-900"
              >
                {{ item.content }}
              </div>
            </template>
          </UAccordion>

          <!-- 思考中状态 -->
          <div
            v-if="msg.status === 'thinking' && !msg.reasoning"
            class="flex animate-pulse items-center gap-2 text-xs text-gray-400"
          >
            <UIcon name="i-lucide-brain-circuit" />
            <span>正在思考...</span>
          </div>

          <!-- 消息主体 -->
          <div
            class="prose dark:prose-invert max-w-none rounded-2xl border border-gray-100 p-3 text-sm shadow-sm dark:border-gray-800"
            :class="[
              msg.role === 'user'
                ? 'bg-primary-50 dark:bg-primary-900/20'
                : 'bg-white dark:bg-gray-900'
            ]"
          >
            <MarkdownRenderer :content="msg.content || (msg.status === 'answering' ? ' ' : '')" />

            <!-- 光标动画 -->
            <span
              v-if="msg.status === 'answering'"
              class="bg-primary-500 ml-1 inline-block h-4 w-1.5 animate-pulse align-middle"
            />
          </div>

          <!-- 错误提示 -->
          <div v-if="msg.status === 'error'" class="text-xs text-red-500">发送失败</div>
        </div>
      </div>
    </div>
  </div>
</template>
