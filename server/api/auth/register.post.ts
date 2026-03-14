import { z } from 'zod'
import { prisma } from '../../db/prismaClient'
import { hashPassword } from '../../utils/password'
import { signUserToken } from '../../utils/jwt'
import { successResponse } from '../../utils/http'
import { setAuthCookies } from '../../utils/cookie'

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional()
})

/**
 * 用户注册接口
 * @description 创建新用户并返回 JWT Token (通过 Cookie)
 * @method POST
 * @path /api/auth/register
 * @param {string} email - 用户邮箱
 * @param {string} password - 用户密码
 * @param {string} [name] - 用户昵称
 * @returns {object} user - 用户信息 (不含密码)
 */
export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, registerSchema.parse)

  const existingUser = await prisma.user.findUnique({
    where: { email: body.email }
  })

  if (existingUser) {
    throw createError({
      statusCode: 400,
      message: '该邮箱已被注册'
    })
  }

  const passwordHash = await hashPassword(body.password)

  // 使用事务确保用户和配额同时创建
  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        email: body.email,
        passwordHash,
        name: body.name || body.email.split('@')[0]
      }
    })

    // 初始化配额: 50万 Token
    const quota = await tx.usageQuota.create({
      data: {
        userId: newUser.id,
        dailyTokenLimit: 500000
      }
    })

    return { ...newUser, quota }
  })

  const tokens = await signUserToken(user)
  setAuthCookies(event, tokens)

  // 移除敏感信息并序列化 BigInt
  const { passwordHash: _passwordHash, quota: rawQuota, ...userWithoutPassword } = user

  const serializedQuota = {
    ...rawQuota,
    totalTokenUsage: rawQuota.totalTokenUsage.toString()
  }

  return successResponse(
    {
      user: userWithoutPassword,
      quota: serializedQuota
    },
    '注册成功'
  )
})
