import { prisma } from '../../../db/prismaClient'
import { signUserToken } from '../../../utils/jwt'

/**
 * GitHub OAuth 回调接口
 * @description 处理 GitHub 授权回调，创建或关联用户，并生成 JWT
 * @method GET
 * @path /api/auth/github/callback
 * @query {string} code - GitHub 授权码
 * @query {string} state - 状态码 (用于防 CSRF)
 * @returns {void} 重定向到前端并携带 Token
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const { code, state } = getQuery(event) as { code: string; state: string }

  // 1. 验证 state
  const savedState = getCookie(event, 'github_oauth_state')
  if (!state || state !== savedState) {
    throw createError({
      statusCode: 400,
      message: '无效的状态码(state)'
    })
  }
  deleteCookie(event, 'github_oauth_state')

  // 2. 换取 access_token
  const tokenResponse = await $fetch<{ access_token: string }>(
    'https://github.com/login/oauth/access_token',
    {
      method: 'POST',
      body: {
        client_id: config.githubClientId,
        client_secret: config.githubClientSecret,
        code
      },
      headers: {
        Accept: 'application/json'
      }
    }
  )

  if (!tokenResponse.access_token) {
    throw createError({
      statusCode: 401,
      message: '换取 Access Token 失败'
    })
  }

  // 3. 获取用户信息
  const githubUser = await $fetch<any>('https://api.github.com/user', {
    headers: {
      Authorization: `token ${tokenResponse.access_token}`,
      'User-Agent': 'MindChat-App'
    }
  })

  // 4. 获取用户邮箱 (GitHub 可能不直接返回私有邮箱)
  const emails = await $fetch<any[]>('https://api.github.com/user/emails', {
    headers: {
      Authorization: `token ${tokenResponse.access_token}`,
      'User-Agent': 'MindChat-App'
    }
  })
  const primaryEmail =
    emails.find((e: any) => e.primary)?.email || emails[0]?.email || githubUser.email

  if (!primaryEmail) {
    throw createError({
      statusCode: 400,
      message: '未获取到 GitHub 邮箱'
    })
  }

  // 5. 数据库逻辑
  let user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: primaryEmail },
        { accounts: { some: { provider: 'github', providerId: String(githubUser.id) } } }
      ]
    },
    include: { accounts: true }
  })

  if (!user) {
    // 创建新用户
    user = await prisma.user.create({
      data: {
        email: primaryEmail,
        name: githubUser.name || githubUser.login,
        avatarUrl: githubUser.avatar_url,
        accounts: {
          create: {
            provider: 'github',
            providerId: String(githubUser.id),
            accessToken: tokenResponse.access_token
          }
        }
      },
      include: { accounts: true }
    })
  } else {
    // 更新或创建 account
    const githubAccount = user.accounts.find((a) => a.provider === 'github')
    if (!githubAccount) {
      await prisma.account.create({
        data: {
          userId: user.id,
          provider: 'github',
          providerId: String(githubUser.id),
          accessToken: tokenResponse.access_token
        }
      })
    } else {
      await prisma.account.update({
        where: { id: githubAccount.id },
        data: { accessToken: tokenResponse.access_token }
      })
    }
  }

  // 6. 生成 Token 并重定向
  const token = await signUserToken(user)

  // 重定向回前端，带上 token (通常建议放在 Cookie 中或通过 URL 参数，这里根据需求决定)
  // 为了方便前端处理，我们重定向到 /auth/callback?token=...
  return sendRedirect(event, `/auth/callback?token=${token}`)
})
