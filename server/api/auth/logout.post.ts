import { clearAuthCookies } from '../../utils/cookie'
import { successResponse } from '../../utils/http'

/**
 * 用户登出接口
 * @description 清除 Access Token 和 Refresh Token Cookie
 * @method POST
 * @path /api/auth/logout
 */
export default defineEventHandler(async (event) => {
  clearAuthCookies(event)

  return successResponse(null, '退出登录成功')
})
