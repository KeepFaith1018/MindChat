/**
 * Google OAuth 登录跳转接口
 * @description 生成 OAuth 状态码并重定向到 Google 授权页面
 * @method GET
 * @path /api/auth/google
 * @returns {void} 重定向到 Google
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  if (!config.googleClientId) {
    throw createError({
      statusCode: 500,
      message: 'Google Client ID 未配置'
    })
  }

  const state = Math.random().toString(36).substring(7)
  setCookie(event, 'google_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 10, // 10 分钟
    path: '/'
  })

  const origin = getRequestURL(event).origin
  const redirectUri = `${origin}${config.public.apiBase}/auth/google/callback`

  const params = new URLSearchParams({
    client_id: config.googleClientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state
  })

  return sendRedirect(event, `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`)
})
