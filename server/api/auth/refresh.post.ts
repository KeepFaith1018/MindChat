import { verifyRefreshToken, signUserToken } from '../../utils/jwt'
import { getRefreshToken, setAuthCookies } from '../../utils/cookie'
import { successResponse } from '../../utils/http'
import { prisma } from '../../db/prismaClient'

/**
 * 刷新 Token 接口
 * @description 使用 Refresh Token 获取新的 Access Token 和 Refresh Token
 * @method POST
 * @path /api/auth/refresh
 * @returns {null} 无数据返回，仅更新 Cookie
 */
export default defineEventHandler(async (event) => {
  const refreshToken = getRefreshToken(event)

  if (!refreshToken) {
    throw createError({
      statusCode: 401,
      message: 'Refresh Token 不存在'
    })
  }

  const payload = await verifyRefreshToken(refreshToken)

  if (!payload) {
    throw createError({
      statusCode: 401,
      message: 'Refresh Token 无效或已过期'
    })
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.id }
  })

  if (!user) {
    throw createError({
      statusCode: 401,
      message: '用户不存在'
    })
  }

  const tokens = await signUserToken(user)
  setAuthCookies(event, tokens)

  return successResponse(null, 'Token 刷新成功')
})
