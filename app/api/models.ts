import { $api } from '../utils/api'
import type { ModelConfig } from './types'

export const modelsApi = {
  /**
   * 获取可用模型列表
   */
  getAvailableModels: () => $api<ModelConfig[]>('/models/available', { method: 'GET' })
}
