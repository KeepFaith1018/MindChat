<script setup lang="ts">
interface Props {
  loading?: boolean
  mode?: 'centered' | 'bottom'
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'bottom'
})

const emit = defineEmits<{
  send: [content: string]
}>()

const content = ref('')

// 模拟模型
const models = [
  { label: 'DeepSeek R1', value: 'deepseek-r1', icon: 'i-lucide-brain' },
  { label: 'GPT-4o', value: 'gpt-4o', icon: 'i-lucide-sparkles' },
  { label: 'Claude 3.5 Sonnet', value: 'claude-3-5-sonnet', icon: 'i-lucide-zap' }
]
const selectedModel = ref(models[0])

function handleSend() {
  if (!content.value.trim() || props.loading) return
  emit('send', content.value)
  content.value = ''
}

function handleKeydown(e: KeyboardEvent) {
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
                checked: selectedModel!.value === m.value
              }))
            ]"
            :ui="{ content: 'w-48 rounded-xl' }"
          >
            <UButton
              :icon="selectedModel!.icon"
              :label="selectedModel!.label"
              variant="ghost"
              color="neutral"
              size="xs"
              class="rounded-lg bg-white/50 px-2 py-1 text-xs font-medium dark:bg-white/5"
            />
          </UDropdownMenu>

          <UButton
            icon="i-lucide-paperclip"
            variant="ghost"
            color="neutral"
            size="sm"
            class="rounded-lg"
          />
        </div>

        <!-- 右侧：发送按钮 -->
        <UButton
          :icon="loading ? 'i-lucide-loader-2' : 'i-lucide-arrow-up'"
          :color="content.trim() ? 'primary' : 'neutral'"
          variant="solid"
          size="sm"
          class="rounded-xl transition-all"
          :class="[content.trim() ? '' : 'opacity-50']"
          :loading="loading"
          :disabled="!content.trim() || loading"
          @click="handleSend"
        />
      </div>
    </div>

    <div v-if="mode === 'bottom'" class="mt-2 text-center">
      <p class="text-[10px] text-gray-400">AI 生成的内容可能不准确，请核实重要信息。</p>
    </div>
  </div>
</template>
