<script setup lang="ts">
import { useChatStore } from '~/stores/useChatStore'

interface Props {
  loading?: boolean
  mode?: 'centered' | 'bottom'
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'bottom'
})

const emit = defineEmits<{
  send: [content: string]
  stop: []
}>()

const chatStore = useChatStore()
const content = ref('')

// 实际模型列表
const models = [
  { label: 'DeepSeek V3', value: 'deepseek-ai/DeepSeek-V3', icon: 'i-lucide-brain' },
  { label: 'DeepSeek R1', value: 'deepseek-ai/DeepSeek-R1', icon: 'i-lucide-brain-circuit' },
  { label: 'Qwen 2.5 72B', value: 'Qwen/Qwen2.5-72B-Instruct', icon: 'i-lucide-sparkles' },
  { label: 'Yi 1.5 34B', value: '01-ai/Yi-1.5-34B-Chat-16K', icon: 'i-lucide-zap' }
]

const selectedModel = computed({
  get: () => models.find((m) => m.value === chatStore.currentModel) || models[0],
  set: (val) => {
    if (val) chatStore.currentModel = val.value
  }
})

function handleSend() {
  if (!content.value.trim() || props.loading || props.disabled) return
  emit('send', content.value)
  content.value = ''
  // Reset height
  nextTick(() => {
    const textarea = document.querySelector('textarea')
    if (textarea) textarea.style.height = '56px'
  })
}

function handleStop() {
  emit('stop')
}

function handleKeydown(e: KeyboardEvent) {
  if (props.disabled) return
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
}

function handleInput(e: Event) {
  const target = e.target as HTMLTextAreaElement
  target.style.height = 'auto'
  target.style.height = target.scrollHeight + 'px'
}
</script>

<template>
  <div
    class="w-full transition-all duration-500"
    :class="[mode === 'centered' ? 'mx-auto max-w-2xl px-4' : 'shrink-0 p-4']"
  >
    <div
      class="focus-within:ring-primary-500/20 relative flex flex-col gap-2 rounded-3xl bg-gray-50 p-2 transition-all focus-within:ring-2 dark:bg-gray-900"
      :class="[
        mode === 'centered' ? 'shadow-xl' : 'border border-gray-200 shadow-sm dark:border-gray-800'
      ]"
    >
      <!-- 文本区域 -->
      <textarea
        v-model="content"
        rows="1"
        :disabled="props.disabled"
        :placeholder="mode === 'centered' ? '想问点什么？' : '输入消息...'"
        class="max-h-64 w-full resize-none border-none bg-transparent px-3 py-3 text-base leading-6 focus:ring-0 focus:outline-none dark:text-gray-100"
        style="min-height: 56px"
        @keydown="handleKeydown"
        @input="handleInput"
      />

      <!-- 底部工具栏 -->
      <div class="flex items-center justify-between px-2 pb-1">
        <!-- 左侧：模型选择器和附件 -->
        <div class="flex items-center gap-2">
          <UDropdownMenu
            :items="[
              models.map((m) => ({
                label: m.label,
                icon: m.icon,
                click: () => (selectedModel = m),
                checked: selectedModel ? selectedModel.value === m.value : false
              }))
            ]"
            :ui="{ content: 'w-48 rounded-xl' }"
          >
            <UButton
              :icon="selectedModel?.icon || 'i-lucide-box'"
              :label="selectedModel?.label || 'Model'"
              variant="ghost"
              color="neutral"
              size="xs"
              :disabled="props.disabled"
              class="rounded-lg bg-white/50 px-2 py-1 text-xs font-medium dark:bg-white/5"
            />
          </UDropdownMenu>

          <UButton
            icon="i-lucide-paperclip"
            variant="ghost"
            color="neutral"
            size="sm"
            :disabled="props.disabled"
            class="rounded-lg"
          />
        </div>

        <!-- 发送按钮 -->
        <UButton
          v-if="!loading"
          icon="i-lucide-arrow-up"
          color="primary"
          size="sm"
          class="rounded-xl transition-all hover:scale-105 active:scale-95"
          :disabled="props.disabled || !content.trim()"
          @click="handleSend"
        />
        <UButton
          v-else
          icon="i-lucide-square"
          color="error"
          size="sm"
          class="animate-pulse rounded-xl transition-all hover:scale-105 active:scale-95"
          @click="handleStop"
        />
      </div>
    </div>

    <div v-if="mode === 'bottom'" class="mt-2 text-center">
      <p class="text-[10px] text-gray-400">AI 生成的内容可能不准确，请核实重要信息。</p>
    </div>
  </div>
</template>
