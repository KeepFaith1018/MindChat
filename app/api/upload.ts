import { $api } from '../utils/api'

export interface UploadResponseData {
  id: string
  filename: string
  size: number
  contentPreview: string
}

export const uploadApi = {
  /**
   * 上传文件
   * @param file 文件对象
   */
  upload: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)

    return $api<UploadResponseData>('/upload', {
      method: 'POST',
      body: formData
    })
  }
}
