<script setup lang="ts">
import { type Message } from '~/stores/useChatStore'
import AiMessageContent from './AiMessageContent.vue'

const props = defineProps<{
  messages: Message[]
}>()
const emit = defineEmits<{
  retry: [messageId: string]
}>()
const toast = useToast()
const getToolLabel = (tool: string) => (tool === 'web_search' ? '联网参考' : '工具调用')
const openedSources = ref<Record<string, boolean>>({})

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

const isSourcesOpen = (messageId: string) => !!openedSources.value[messageId]

const toggleSources = (messageId: string) => {
  openedSources.value[messageId] = !openedSources.value[messageId]
}

const copyMessage = async (content: string) => {
  if (!import.meta.client || !content) return
  await navigator.clipboard.writeText(content)
  toast.add({ title: '已复制' })
}
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
      <div class="w-full">
        <div class="flex min-w-0 flex-col gap-1">
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
            v-if="msg.role === 'user'"
            class="border-primary-100 bg-primary-50 dark:border-primary-900/40 dark:bg-primary-900/20 ml-auto w-fit max-w-[75%] rounded-2xl border p-3 text-sm"
          >
            <div class="whitespace-pre-wrap">{{ msg.content }}</div>
          </div>
          <AiMessageContent
            v-else
            class="w-full px-1 py-2"
            :content="msg.content"
            :status="msg.status"
          />

          <div v-if="msg.role === 'assistant'" class="mt-1 flex items-center gap-1">
            <UButton
              icon="i-lucide-copy"
              color="neutral"
              variant="ghost"
              size="xs"
              label="复制"
              @click="copyMessage(msg.content)"
            />
            <UButton
              icon="i-lucide-refresh-cw"
              color="neutral"
              variant="ghost"
              size="xs"
              label="重试"
              @click="emit('retry', msg.id)"
            />
            <UButton
              icon="i-lucide-book-open"
              color="neutral"
              variant="ghost"
              size="xs"
              :label="isSourcesOpen(msg.id) ? '收起来源' : '来源'"
              :disabled="!msg.toolResults?.length"
              @click="toggleSources(msg.id)"
            />
          </div>

          <!-- 工具调用结果 (如联网搜索) -->
          <div
            v-if="msg.role === 'assistant' && msg.toolResults?.length && isSourcesOpen(msg.id)"
            class="mt-2 flex flex-col gap-2"
          >
            <div v-for="(result, rIdx) in msg.toolResults" :key="rIdx">
              <div
                class="rounded-xl border border-gray-200 bg-gray-50/70 px-2 py-1.5 dark:border-gray-800 dark:bg-gray-900/60"
              >
                <UAccordion
                  :items="[
                    {
                      label: `${getToolLabel(result.tool)}（${(result.items || []).length}条）`,
                      icon: result.tool === 'web_search' ? 'i-lucide-globe' : 'i-lucide-wrench'
                    }
                  ]"
                >
                  <template #content>
                    <div class="flex flex-col gap-2 pt-2">
                      <a
                        v-for="(item, idx) in (result.items || []).slice(0, 5)"
                        :key="idx"
                        :href="item.url"
                        target="_blank"
                        class="block rounded-lg border border-gray-100 bg-white p-2 transition-colors hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800"
                      >
                        <div
                          class="mb-0.5 line-clamp-1 text-xs font-medium text-blue-600 dark:text-blue-400"
                        >
                          {{ item.title }}
                        </div>
                        <div class="line-clamp-2 text-[10px] text-gray-500">{{ item.snippet }}</div>
                      </a>
                      <div
                        v-if="(result.items || []).length > 5"
                        class="text-[10px] text-gray-500 dark:text-gray-400"
                      >
                        还有 {{ (result.items || []).length - 5 }} 条参考，可在搜索页继续查看
                      </div>
                    </div>
                  </template>
                </UAccordion>
              </div>
            </div>
          </div>

          <!-- 错误提示 -->
          <div v-if="msg.status === 'error'" class="text-xs text-red-500">发送失败</div>
        </div>
      </div>
    </div>
  </div>
</template>
