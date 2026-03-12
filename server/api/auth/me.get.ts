import { prisma } from '../../db/prismaClient'
import { verifyUserToken } from '../../utils/jwt'
import { successResponse } from '../../utils/http'

/**
 * 获取当前用户信息接口
 * @description 根据 Authorization Header 中的 JWT 获取用户信息
 * @method GET
 * @path /api/auth/me
 * @header {string} Authorization - Bearer <token>
 * @returns {object} user - 用户信息 (不含密码)
 */
export default defineEventHandler(async (event) => {
  const authHeader = getHeader(event, 'Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw createError({
      statusCode: 401,
      message: '未授权'
    })
  }

  const token = authHeader.split(' ')[1]

  if (!token) {
    throw createError({
      statusCode: 401,
      message: 'Token 格式错误'
    })
  }

  const payload = await verifyUserToken(token)

  if (!payload) {
    throw createError({
      statusCode: 401,
      message: 'Token 无效'
    })
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.id }
  })

  if (!user) {
    throw createError({
      statusCode: 404,
      message: '用户不存在'
    })
  }

  const { passwordHash: _passwordHash, ...userWithoutPassword } = user
  return successResponse({ user: userWithoutPassword }, '获取用户信息成功')
})
