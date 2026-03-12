import { z } from 'zod'
import { prisma } from '../../db/prismaClient'
import { hashPassword } from '../../utils/password'
import { signUserToken } from '../../utils/jwt'
import { successResponse } from '../../utils/http'

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional()
})

/**
 * 用户注册接口
 * @description 创建新用户并返回 JWT Token
 * @method POST
 * @path /api/auth/register
 * @param {string} email - 用户邮箱
 * @param {string} password - 用户密码
 * @param {string} [name] - 用户昵称
 * @returns {object} user - 用户信息 (不含密码)
 * @returns {string} token - JWT Token
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

  const user = await prisma.user.create({
    data: {
      email: body.email,
      passwordHash,
      name: body.name || body.email.split('@')[0]
    }
  })

  const token = await signUserToken(user)

  // 移除敏感信息
  const { passwordHash: _passwordHash, ...userWithoutPassword } = user

  return successResponse(
    {
      user: userWithoutPassword,
      token
    },
    '注册成功'
  )
})
