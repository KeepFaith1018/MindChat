import { defineStore } from 'pinia'
import { uploadApi, type UploadResponseData } from '~/api/upload'
import { getErrorMessage } from '~/utils/error'

export const useFileStore = defineStore('file', () => {
  const toast = useToast()

  // --- State ---
  const currentFiles = ref<UploadResponseData[]>([])

  // --- Computed ---
  const currentFileIds = computed(() => currentFiles.value.map((f) => f.id))

  const normalizeFilename = (filename: string) => {
    if (!filename) return filename

    try {
      const bytes = Uint8Array.from(filename, (char) => char.charCodeAt(0))
      const decoded = new TextDecoder('utf-8', { fatal: false }).decode(bytes)
      const hasCjk = /[\u4e00-\u9fff]/.test(decoded)
      return hasCjk ? decoded : filename
    } catch {
      return filename
    }
  }

  // --- Actions ---

  /**
   * 上传文件
   */
  const uploadFile = async (file: File) => {
    try {
      const response = await uploadApi.upload(file)
      if (response.success && response.data) {
        currentFiles.value.push({
          ...response.data,
          filename: normalizeFilename(response.data.filename)
        })
        toast.add({ title: '上传成功' })
        return {
          ...response.data,
          filename: normalizeFilename(response.data.filename)
        }
      }
    } catch (e) {
      toast.add({ title: '上传失败', description: getErrorMessage(e), color: 'error' })
    }
    return null
  }

  /**
   * 移除文件
   */
  const removeFile = (id: string) => {
    currentFiles.value = currentFiles.value.filter((f) => f.id !== id)
  }

  /**
   * 清除所有文件
   */
  const clearFiles = () => {
    currentFiles.value = []
  }

  return {
    // State
    currentFiles,
    // Computed
    currentFileIds,
    // Actions
    uploadFile,
    removeFile,
    clearFiles
  }
})
