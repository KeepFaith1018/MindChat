/**
 * 错误处理工具
 */

/**
 * 从 Nuxt/Ofetch 错误对象中提取人类可读的错误信息
 * @param error 错误对象
 * @returns 错误描述字符串
 */
export function getErrorMessage(error: any): string {
  // 1. 优先提取后端返回的业务 message (通常在 _data.message 或 data.message)
  if (error?.response?._data?.message) {
    return error.response._data.message
  }
  if (error?.data?.message) {
    return error.data.message
  }

  // 2. 其次提取 HTTP statusMessage
  if (error?.response?.statusMessage) {
    return error.response.statusMessage
  }

  // 3. 提取原生 message
  if (error?.message) {
    return error.message
  }

  // 4. 兜底
  return '发生了未知错误，请稍后重试'
}
