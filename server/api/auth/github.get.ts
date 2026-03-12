/**
 * GitHub OAuth 登录跳转接口
 * @description 生成 OAuth 状态码并重定向到 GitHub 授权页面
 * @method GET
 * @path /api/auth/github
 * @returns {void} 重定向到 GitHub
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  if (!config.githubClientId) {
    throw createError({
      statusCode: 500,
      message: 'GitHub Client ID 未配置'
    })
  }

  const state = Math.random().toString(36).substring(7)
  setCookie(event, 'github_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 10, // 10 分钟
    path: '/'
  })

  const origin = getRequestURL(event).origin
  const redirectUri = `${origin}${config.public.apiBase}/auth/github/callback`

  const params = new URLSearchParams({
    client_id: config.githubClientId,
    redirect_uri: redirectUri,
    scope: 'read:user user:email',
    state
  })

  return sendRedirect(event, `https://github.com/login/oauth/authorize?${params.toString()}`)
})
