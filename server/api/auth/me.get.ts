import { prisma } from '../../db/prismaClient'
import { verifyUserToken } from '../../utils/jwt'
import { successResponse } from '../../utils/http'
import { getAccessToken } from '../../utils/cookie'

/**
 * 获取当前用户信息接口
 * @description 根据 Cookie 中的 Access Token 获取用户信息及配额
 * @method GET
 * @path /api/auth/me
 * @returns {object} user - 用户信息 (含配额，不含密码)
 */
export default defineEventHandler(async (event) => {
  const token = getAccessToken(event)

  if (!token) {
    throw createError({
      statusCode: 401,
      message: '未登录或 Token 已过期'
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
    where: { id: payload.id },
    include: {
      quota: true
    }
  })

  if (!user) {
    throw createError({
      statusCode: 404,
      message: '用户不存在'
    })
  }

  // 序列化 BigInt 字段 (quota.totalTokenUsage)
  let serializedQuota = null
  if (user.quota) {
    serializedQuota = {
      ...user.quota,
      totalTokenUsage: user.quota.totalTokenUsage.toString()
    }
  }

  const { passwordHash: _passwordHash, quota: _quota, ...userWithoutPassword } = user

  // 返回结构需符合 Share 类型 MeResponse
  return successResponse(
    {
      user: userWithoutPassword,
      quota: serializedQuota
    },
    '获取用户信息成功'
  )
})
