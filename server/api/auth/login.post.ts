import { z } from 'zod'
import { prisma } from '../../db/prismaClient'
import { verifyPassword } from '../../utils/password'
import { signUserToken } from '../../utils/jwt'
import { successResponse } from '../../utils/http'
import { setAuthCookies } from '../../utils/cookie'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
})

/**
 * 用户登录接口
 * @description 验证邮箱密码并返回 JWT Token (通过 Cookie)
 * @method POST
 * @path /api/auth/login
 * @param {string} email - 用户邮箱
 * @param {string} password - 用户密码
 * @returns {object} user - 用户信息 (不含密码)
 */
export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, loginSchema.parse)

  const user = await prisma.user.findUnique({
    where: { email: body.email }
  })

  if (!user || !user.passwordHash) {
    throw createError({
      statusCode: 401,
      message: '邮箱或密码错误'
    })
  }

  const isValid = await verifyPassword(body.password, user.passwordHash)

  if (!isValid) {
    throw createError({
      statusCode: 401,
      message: '邮箱或密码错误'
    })
  }

  const tokens = await signUserToken(user)
  setAuthCookies(event, tokens)

  const { passwordHash: _passwordHash, ...userWithoutPassword } = user

  return successResponse(
    {
      user: userWithoutPassword
    },
    '登录成功'
  )
})
