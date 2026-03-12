<script setup lang="ts">
import MarkdownIt from 'markdown-it'
import { useChatStore, type Message } from '~/stores/useChatStore'

const props = defineProps<{
  messages: Message[]
}>()

const md = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true
})

const containerRef = ref<HTMLElement | null>(null)
const chatStore = useChatStore()

// 自动滚动
watch(
  () => props.messages.length,
  () => {
    nextTick(() => {
      scrollToBottom()
    })
  }
)

// 同时监听最后一条消息内容的变化（流式传输）
watch(
  () => props.messages[props.messages.length - 1]?.content,
  () => {
    scrollToBottom()
  },
  { deep: true }
)

function scrollToBottom() {
  if (containerRef.value) {
    containerRef.value.scrollTop = containerRef.value.scrollHeight
  }
}

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

    <div
      v-for="msg in messages"
      :key="msg.id"
      class="mx-auto flex max-w-4xl gap-4"
      :class="[msg.role === 'user' ? 'flex-row-reverse' : '']"
    >
      <!-- 头像 -->
      <UAvatar
        :src="msg.role === 'user' ? 'https://avatars.githubusercontent.com/u/739984?v=4' : ''"
        :alt="msg.role === 'user' ? 'User' : 'AI'"
        :icon="msg.role === 'assistant' ? 'i-lucide-bot' : undefined"
        :color="msg.role === 'assistant' ? 'primary' : 'neutral'"
        size="sm"
        class="mt-1 shrink-0"
      />

      <!-- 内容气泡 -->
      <div class="flex max-w-[85%] min-w-0 flex-col gap-1">
        <!-- 名称和时间 -->
        <div
          class="flex gap-2 px-1 text-xs text-gray-400"
          :class="[msg.role === 'user' ? 'justify-end' : '']"
        >
          <span>{{ msg.role === 'user' ? '你' : 'MindChat' }}</span>
        </div>

        <!-- 推理（思考） -->
        <div
          v-if="msg.reasoning"
          class="mb-2 rounded-r border-l-2 border-gray-300 bg-gray-50 p-3 text-sm text-gray-500 italic dark:border-gray-700 dark:bg-gray-900"
        >
          <div class="mb-1 flex items-center gap-2 text-xs font-semibold">
            <UIcon name="i-lucide-brain-circuit" class="h-3 w-3" />
            <span>思考过程</span>
          </div>
          {{ msg.reasoning }}
        </div>

        <!-- 消息主体 -->
        <div
          class="prose dark:prose-invert max-w-none rounded-2xl border border-gray-100 p-3 text-sm break-words shadow-sm dark:border-gray-800"
          :class="[
            msg.role === 'user'
              ? 'bg-primary-50 dark:bg-primary-950/30 rounded-tr-none text-gray-900 dark:text-gray-100'
              : 'rounded-tl-none bg-white dark:bg-gray-900'
          ]"
          v-html="md.render(msg.content || '')"
        />
      </div>
    </div>

    <!-- 加载指示器 -->
    <div
      v-if="chatStore.isThinking && messages[messages.length - 1]?.role === 'user'"
      class="mx-auto flex max-w-4xl gap-4"
    >
      <UAvatar icon="i-lucide-bot" color="primary" size="sm" class="mt-1 shrink-0" />
      <div
        class="rounded-2xl rounded-tl-none border border-gray-100 bg-white p-3 shadow-sm dark:border-gray-800 dark:bg-gray-900"
      >
        <div class="flex gap-1">
          <div
            class="h-2 w-2 animate-bounce rounded-full bg-gray-400"
            style="animation-delay: 0ms"
          />
          <div
            class="h-2 w-2 animate-bounce rounded-full bg-gray-400"
            style="animation-delay: 150ms"
          />
          <div
            class="h-2 w-2 animate-bounce rounded-full bg-gray-400"
            style="animation-delay: 300ms"
          />
        </div>
      </div>
    </div>
  </div>
</template>
