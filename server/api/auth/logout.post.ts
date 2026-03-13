import { clearAuthCookies } from '../../utils/cookie'
import { successResponse } from '../../utils/http'

/**
 * 退出登录接口
 * @description 清除认证 Cookies
 * @method POST
 * @path /api/auth/logout
 * @returns {null} 无数据返回
 */
export default defineEventHandler((event) => {
  clearAuthCookies(event)
  return successResponse(null, '退出登录成功')
})
