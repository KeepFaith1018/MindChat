import { prisma } from '../../../db/prismaClient'
import { signUserToken } from '../../../utils/jwt'
import { setAuthCookies } from '../../../utils/cookie'

/**
 * GitHub OAuth 回调接口
 * @description 处理 GitHub 授权回调，创建或关联用户，并生成 JWT (通过 Cookie)
 * @method GET
 * @path /api/auth/github/callback
 * @query {string} code - GitHub 授权码
 * @query {string} state - 状态码 (用于防 CSRF)
 * @returns {void} 重定向到首页
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
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { email: primaryEmail },
        { accounts: { some: { provider: 'github', providerId: String(githubUser.id) } } }
      ]
    },
    include: { accounts: true }
  })

  let user: { id: string; email: string }

  if (!existingUser) {
    // 创建新用户并初始化配额
    // 使用事务确保数据一致性
    user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
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
        }
      })

      // 初始化配额
      await tx.usageQuota.create({
        data: {
          userId: newUser.id,
          dailyTokenLimit: 500000
        }
      })

      return newUser
    })
  } else {
    user = existingUser
    // 更新或关联 Account
    const githubAccount = existingUser.accounts.find((a) => a.provider === 'github')
    if (githubAccount) {
      await prisma.account.update({
        where: { id: githubAccount.id },
        data: { accessToken: tokenResponse.access_token }
      })
    } else {
      await prisma.account.create({
        data: {
          userId: existingUser.id,
          provider: 'github',
          providerId: String(githubUser.id),
          accessToken: tokenResponse.access_token
        }
      })
    }
  }

  const tokens = await signUserToken(user)
  setAuthCookies(event, tokens)

  return sendRedirect(event, '/')
})
