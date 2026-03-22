<script setup lang="ts">
import { useChatStore } from '~/stores/useChatStore'
import { useModelStore } from '~/stores/useModelStore'
import { useFileStore } from '~/stores/useFileStore'
import { useFileDialog } from '@vueuse/core'
import FileList from './FileList.vue'

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
const modelStore = useModelStore()
const fileStore = useFileStore()
const content = ref('')
const isUploading = ref(false)
const isComposing = ref(false)

const isMounted = ref(false)
onMounted(() => {
  console.log('[InputBox] onMounted')
  isMounted.value = true
  if (!modelStore.isInitialized) {
    console.log('[InputBox] loading models')
    modelStore.loadModels()
  }
})

// 文件选择
const { open, onChange } = useFileDialog({
  multiple: false, // 暂时只支持单文件上传，避免并发问题
  accept: '.pdf,.doc,.docx,.txt,.md' // 限制类型
})

onChange(async (files) => {
  if (!files || files.length === 0) return

  const file = files[0]
  if (!file) return

  // 简单校验大小 (10MB)
  if (file.size > 10 * 1024 * 1024) {
    // 这里最好用 toast 提示
    console.warn('文件大小不能超过 10MB')
    return
  }

  isUploading.value = true
  await fileStore.uploadFile(file)
  isUploading.value = false
})

// 动态计算模型列表
const models = computed(() => {
  // 如果 store 已加载数据（不论是接口还是兜底），优先使用
  if (modelStore.availableModels.length > 0) {
    return modelStore.availableModels.map((m) => {
      const normalizedId = (m.id || '').toLowerCase()
      return {
        label: m.name || 'Unknown',
        value: m.id,
        icon: normalizedId.includes('deepseek') ? 'i-lucide-brain-circuit' : 'i-lucide-sparkles'
      }
    })
  }

  // 这里的兜底仅用于 store 彻底初始化前的极短瞬间，或者 fallbackModels 也为空的情况
  return [
    { label: 'DeepSeek V3.2', value: 'deepseek-ai/DeepSeek-V3.2', icon: 'i-lucide-brain' },
    { label: 'DeepSeek R1', value: 'deepseek-ai/DeepSeek-R1', icon: 'i-lucide-brain-circuit' }
  ]
})

const selectedModel = computed({
  get: () => {
    const current = modelStore.currentModel
    return (
      models.value.find((m) => m.value === current) ||
      models.value[0] || {
        label: 'DeepSeek V3.2',
        value: 'deepseek-ai/DeepSeek-V3.2',
        icon: 'i-lucide-brain'
      }
    )
  },
  set: (val) => {
    if (val?.value) {
      chatStore.selectModel(val.value)
    }
  }
})

const modelMenuItems = computed(() => {
  const current = selectedModel.value?.value
  return [
    models.value.map((m) => {
      const checked = current === m.value
      return {
        label: m.label,
        icon: checked ? 'i-lucide-check-circle-2' : m.icon,
        class: checked
          ? 'bg-primary-50 dark:bg-primary-950/30 text-primary-600 dark:text-primary-300 font-medium rounded-lg'
          : '',
        onSelect: (e: Event) => {
          e.preventDefault()
          chatStore.selectModel(m.value)
        }
      }
    })
  ]
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

function isMacPlatform() {
  if (!import.meta.client) return false
  return /Mac|iPhone|iPad|iPod/i.test(window.navigator.platform)
}

function handleKeydown(e: KeyboardEvent) {
  if (props.disabled) return
  if (isComposing.value || e.isComposing || (e as any).keyCode === 229) return
  if (e.key !== 'Enter') return

  const allowNewline = isMacPlatform() ? e.altKey : e.shiftKey
  if (allowNewline) return

  e.preventDefault()
  handleSend()
}

function handleCompositionStart() {
  isComposing.value = true
}

function handleCompositionEnd() {
  isComposing.value = false
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
        @compositionstart="handleCompositionStart"
        @compositionend="handleCompositionEnd"
      />

      <!-- 文件列表 -->
      <FileList :files="fileStore.currentFiles" @remove="fileStore.removeFile" />

      <!-- 底部工具栏 -->
      <div class="flex items-center justify-between px-2 pb-1">
        <!-- 左侧：模型选择器和附件 -->
        <div class="flex items-center gap-2">
          <UDropdownMenu
            v-if="isMounted"
            :items="modelMenuItems"
            :ui="{ content: 'w-56 rounded-xl' }"
          >
            <UButton
              :icon="selectedModel?.icon || 'i-lucide-box'"
              :label="modelStore.isLoadingModels ? '加载中...' : selectedModel?.label || 'Model'"
              variant="ghost"
              :color="modelStore.fetchError ? 'error' : 'neutral'"
              size="xs"
              :disabled="props.disabled || modelStore.isLoadingModels"
              :loading="modelStore.isLoadingModels"
              class="rounded-lg bg-white/50 px-2 py-1 text-xs font-medium dark:bg-white/5"
            >
              <template v-if="modelStore.fetchError" #trailing>
                <UTooltip :text="modelStore.fetchError">
                  <UIcon name="i-lucide-circle-alert" class="text-error-500 size-3" />
                </UTooltip>
              </template>
            </UButton>
          </UDropdownMenu>
          <UButton
            v-else
            icon="i-lucide-box"
            label="Loading..."
            variant="ghost"
            color="neutral"
            size="xs"
            disabled
            class="rounded-lg bg-white/50 px-2 py-1 text-xs font-medium dark:bg-white/5"
          />

          <!-- 能力开关 -->
          <div class="flex items-center gap-1 border-l border-gray-200 pl-2 dark:border-gray-800">
            <UTooltip text="联网搜索">
              <UButton
                :icon="
                  modelStore.enabledCapabilities.webSearch ? 'i-lucide-globe' : 'i-lucide-globe'
                "
                :color="modelStore.enabledCapabilities.webSearch ? 'primary' : 'neutral'"
                variant="ghost"
                size="sm"
                :disabled="
                  !isMounted || props.disabled || !modelStore.currentCapabilities.webSearch
                "
                :class="[
                  modelStore.enabledCapabilities.webSearch
                    ? 'bg-primary-50 dark:bg-primary-950/30'
                    : ''
                ]"
                @click="
                  modelStore.enabledCapabilities.webSearch =
                    !modelStore.enabledCapabilities.webSearch
                "
              />
            </UTooltip>

            <UTooltip text="深度思考">
              <UButton
                :icon="
                  modelStore.enabledCapabilities.reasoning
                    ? 'i-lucide-brain-circuit'
                    : 'i-lucide-brain-circuit'
                "
                :color="modelStore.enabledCapabilities.reasoning ? 'primary' : 'neutral'"
                variant="ghost"
                size="sm"
                :disabled="
                  !isMounted || props.disabled || !modelStore.currentCapabilities.reasoning
                "
                :class="[
                  modelStore.enabledCapabilities.reasoning
                    ? 'bg-primary-50 dark:bg-primary-950/30'
                    : ''
                ]"
                @click="
                  modelStore.enabledCapabilities.reasoning =
                    !modelStore.enabledCapabilities.reasoning
                "
              />
            </UTooltip>
          </div>

          <UButton
            icon="i-lucide-paperclip"
            variant="ghost"
            color="neutral"
            size="sm"
            :loading="isUploading"
            :disabled="props.disabled || isUploading"
            class="rounded-lg"
            @click="open()"
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
