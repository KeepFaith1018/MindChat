import { prisma } from '../../../db/prismaClient'
import { signUserToken } from '../../../utils/jwt'
import { setAuthCookies } from '../../../utils/cookie'

/**
 * Google OAuth 回调接口
 * @description 处理 Google 授权回调，创建或关联用户，并生成 JWT (通过 Cookie)
 * @method GET
 * @path /api/auth/google/callback
 * @query {string} code - Google 授权码
 * @query {string} state - 状态码
 * @returns {void} 重定向到首页
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const { code, state } = getQuery(event) as { code: string; state: string }

  // 1. 验证 state
  const savedState = getCookie(event, 'google_oauth_state')
  if (!state || state !== savedState) {
    throw createError({ statusCode: 400, message: '无效的状态码(state)' })
  }
  deleteCookie(event, 'google_oauth_state')

  const origin = getRequestURL(event).origin
  const redirectUri = `${origin}${config.public.apiBase}/auth/google/callback`

  // 2. 换取 Token
  const tokenResponse = await $fetch<{ access_token: string; id_token: string }>(
    'https://oauth2.googleapis.com/token',
    {
      method: 'POST',
      body: {
        client_id: config.googleClientId,
        client_secret: config.googleClientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri
      }
    }
  )

  // 3. 获取用户信息
  const googleUser = await $fetch<any>('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
  })

  if (!googleUser.email) {
    throw createError({ statusCode: 400, message: '未获取到 Google 邮箱' })
  }

  // 4. 数据库逻辑
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { email: googleUser.email },
        { accounts: { some: { provider: 'google', providerId: googleUser.id } } }
      ]
    },
    include: { accounts: true }
  })

  let user: { id: string; email: string }

  if (!existingUser) {
    // 创建新用户
    user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: googleUser.email,
          name: googleUser.name,
          avatarUrl: googleUser.picture,
          accounts: {
            create: {
              provider: 'google',
              providerId: googleUser.id,
              accessToken: tokenResponse.access_token
            }
          }
        }
      })
      await tx.usageQuota.create({
        data: { userId: newUser.id, dailyTokenLimit: 500000 }
      })
      return newUser
    })
  } else {
    user = existingUser
    const googleAccount = existingUser.accounts.find((a) => a.provider === 'google')
    if (googleAccount) {
      await prisma.account.update({
        where: { id: googleAccount.id },
        data: { accessToken: tokenResponse.access_token }
      })
    } else {
      await prisma.account.create({
        data: {
          userId: existingUser.id,
          provider: 'google',
          providerId: googleUser.id,
          accessToken: tokenResponse.access_token
        }
      })
    }
  }

  const tokens = await signUserToken(user)
  setAuthCookies(event, tokens)

  return sendRedirect(event, '/')
})
