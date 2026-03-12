export interface IApiResponse<T = any> {
  code: number
  message: string
  data: T | null
}

/**
 * 成功响应结构
 * @param data 返回的数据
 * @param message 成功提示信息
 * @returns 统一的响应结构
 */
export const successResponse = <T>(data: T, message: string = '操作成功'): IApiResponse<T> => {
  return {
    code: 200,
    message,
    data
  }
}

/**
 * 错误响应结构 (通常用于业务逻辑错误，HTTP 状态码仍为 200)
 * 如果需要返回非 200 状态码，请直接使用 createError
 * @param code 错误码 (非 200)
 * @param message 错误提示信息
 * @returns 统一的响应结构
 */
export const errorResponse = (
  code: number = 400,
  message: string = '操作失败'
): IApiResponse<null> => {
  return {
    code,
    message,
    data: null
  }
}
