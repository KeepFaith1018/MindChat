import type { H3Event } from 'h3'

const ACCESS_TOKEN_COOKIE = 'access_token'
const REFRESH_TOKEN_COOKIE = 'refresh_token'

/**
 * 设置认证 Cookies
 * @param event H3Event
 * @param tokens 包含 accessToken 和 refreshToken 的对象
 */
export function setAuthCookies(
  event: H3Event,
  tokens: { accessToken: string; refreshToken: string }
) {
  // Access Token: 15分钟过期
  setCookie(event, ACCESS_TOKEN_COOKIE, tokens.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 15 * 60 // 15 minutes
  })

  // Refresh Token: 7天过期
  setCookie(event, REFRESH_TOKEN_COOKIE, tokens.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 // 7 days
  })
}

/**
 * 清除认证 Cookies
 * @param event H3Event
 */
export function clearAuthCookies(event: H3Event) {
  deleteCookie(event, ACCESS_TOKEN_COOKIE)
  deleteCookie(event, REFRESH_TOKEN_COOKIE)
}

/**
 * 获取 Access Token
 * @param event H3Event
 */
export function getAccessToken(event: H3Event) {
  return getCookie(event, ACCESS_TOKEN_COOKIE)
}

/**
 * 获取 Refresh Token
 * @param event H3Event
 */
export function getRefreshToken(event: H3Event) {
  return getCookie(event, REFRESH_TOKEN_COOKIE)
}
