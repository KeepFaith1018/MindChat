import { defineStore } from 'pinia'
import { modelsApi } from '~/api/models'
import { chatApi } from '~/api/chat'
import type { ModelConfig, ChatCapabilities } from '~/api/types'

/**
 * 辅助函数：标准化模型列表响应
 */
type BackendModelItem = {
  modelKey?: string
  displayName?: string
  provider?: string
  capabilities?: Partial<ChatCapabilities> & { stream?: boolean }
}

type NormalizedModels = {
  models: ModelConfig[]
  defaultModel?: string
}

const normalizeModelsResponse = (payload: unknown): NormalizedModels => {
  const mapItem = (item: BackendModelItem): ModelConfig | null => {
    const id = item.modelKey
    const name = item.displayName
    if (!id || !name) return null

    return {
      id,
      name,
      provider: item.provider || 'unknown',
      capabilities: {
        webSearch: !!item.capabilities?.webSearch,
        reasoning: !!item.capabilities?.reasoning,
        fileQa: !!item.capabilities?.fileQa
      }
    }
  }

  if (payload && typeof payload === 'object') {
    const data = payload as Record<string, any>
    const list = Array.isArray(data.models) ? data.models : []
    return {
      defaultModel: typeof data.defaultModel === 'string' ? data.defaultModel : undefined,
      models: list.map((item) => mapItem(item as BackendModelItem)).filter(Boolean) as ModelConfig[]
    }
  }

  if (Array.isArray(payload)) {
    return {
      models: payload
        .map((item) => mapItem(item as BackendModelItem))
        .filter(Boolean) as ModelConfig[]
    }
  }

  return { models: [] }
}

export const useModelStore = defineStore('model', () => {
  // --- State ---
  const availableModels = ref<ModelConfig[]>([])
  const isLoadingModels = ref(false)
  const fetchError = ref<string | null>(null)
  const currentModel = ref('deepseek-ai/DeepSeek-V3.2')
  const isInitialized = ref(false)

  // 本地兜底模型配置
  const fallbackModels: ModelConfig[] = [
    {
      id: 'deepseek-ai/DeepSeek-V3.2',
      name: 'DeepSeek V3.2',
      provider: 'SiliconFlow',
      capabilities: { webSearch: true, reasoning: false, fileQa: true }
    },
    {
      id: 'deepseek-ai/DeepSeek-R1',
      name: 'DeepSeek R1',
      provider: 'SiliconFlow',
      capabilities: { webSearch: true, reasoning: true, fileQa: true }
    }
  ]

  // 当前模型支持的能力约束
  const currentCapabilities = ref<ChatCapabilities>({
    webSearch: false,
    reasoning: false,
    fileQa: false
  })

  // 用户手动开启的能力开关
  const enabledCapabilities = ref<ChatCapabilities>({
    webSearch: false,
    reasoning: false,
    fileQa: false
  })

  // 同步模型能力开关
  const syncCapabilities = (supported: ChatCapabilities) => {
    // 确保 supported 有默认值，避免解构错误
    const safeSupported = supported || { webSearch: false, reasoning: false, fileQa: false }
    currentCapabilities.value = { ...safeSupported }

    // 遍历所有能力键值，如果不支持则禁用用户开关
    Object.keys(enabledCapabilities.value).forEach((key) => {
      const k = key as keyof ChatCapabilities
      if (!safeSupported[k]) {
        enabledCapabilities.value[k] = false
      }
    })
  }

  /**
   * 应用选定模型的能力约束
   */
  const applyModelCapabilities = (modelId: string) => {
    if (!modelId) return
    const model = availableModels.value.find((item) => item.id === modelId)
    if (model) {
      syncCapabilities(model.capabilities)
    } else {
      // 如果找不到模型，使用默认能力（全关）
      syncCapabilities({ webSearch: false, reasoning: false, fileQa: false })
    }
  }

  // --- Actions ---

  /**
   * 获取全局能力配置（后端支持的能力矩阵）
   */
  const loadCapabilities = async (force = false) => {
    // 如果已经初始化过且不是强制刷新，则直接返回
    if (isInitialized.value && !force && currentCapabilities.value.webSearch !== false) return

    try {
      const response = await chatApi.getCapabilities()
      if ((response.success || response.code === 0) && response.data) {
        syncCapabilities(response.data)
      }
    } catch (e) {
      console.error('Failed to load global capabilities:', e)
    }
  }

  /**
   * 加载模型列表并应用能力
   */
  const loadModels = async (force = false) => {
    // 如果正在加载，或者已经有数据且不是强制刷新，则跳过
    if (isLoadingModels.value) return
    if (availableModels.value.length > 0 && !force) {
      isInitialized.value = true
      return
    }

    isLoadingModels.value = true
    fetchError.value = null
    try {
      console.log('[ModelStore] Fetching models...')
      const response = await modelsApi.getAvailableModels()
      console.log('[ModelStore] Response:', response)

      // 兼容两种成功判断：success 字段或 code === 0
      const isSuccess = response.success === true || response.code === 0
      console.log('[ModelStore] isSuccess:', isSuccess)
      console.log('[ModelStore] Response data:', response.data)
      if (isSuccess && response.data) {
        const normalized = normalizeModelsResponse(response.data)
        if (normalized.models.length > 0) {
          availableModels.value = normalized.models
          if (normalized.defaultModel) {
            const hasDefault = normalized.models.some((m) => m.id === normalized.defaultModel)
            if (hasDefault) {
              currentModel.value = normalized.defaultModel
            }
          }
          console.log('[ModelStore] Models loaded:', normalized.models.length)
        } else {
          availableModels.value = [...fallbackModels]
          console.warn('API returned empty models, using fallback')
        }
      } else {
        availableModels.value = [...fallbackModels]
        fetchError.value = response.message || `获取模型列表失败 (Code: ${response.code})`
        console.error('[ModelStore] Business error:', response.message)
      }
    } catch (e: any) {
      // 网络或系统错误
      availableModels.value = [...fallbackModels]
      fetchError.value = e?.message || '网络请求失败，已切换至离线模式'
      console.error('[ModelStore] Network error:', e)
    } finally {
      isLoadingModels.value = false
      isInitialized.value = true

      // 自动回退逻辑：确保当前选中的模型在列表中，否则重置为第一个
      const exists = availableModels.value.some((m) => m.id === currentModel.value)
      if (!exists && availableModels.value.length > 0) {
        currentModel.value = availableModels.value[0]!.id
      }
      applyModelCapabilities(currentModel.value)
      console.log('[ModelStore] loadModels finished. isInitialized:', isInitialized.value)
    }
  }

  /**
   * 模型切换
   */
  const selectModel = (modelId: string) => {
    if (!modelId || currentModel.value === modelId) return
    currentModel.value = modelId
    applyModelCapabilities(modelId)
  }

  return {
    // State
    availableModels,
    isLoadingModels,
    currentModel,
    isInitialized,
    fetchError,
    currentCapabilities,
    enabledCapabilities,
    // Actions
    loadModels,
    loadCapabilities,
    selectModel,
    applyModelCapabilities
  }
})
