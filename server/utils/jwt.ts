import { SignJWT, jwtVerify } from 'jose'

const ACCESS_TOKEN_EXPIRATION = '15m'
const REFRESH_TOKEN_EXPIRATION = '7d'

export async function signUserToken(user: { id: string; email: string }) {
  const config = useRuntimeConfig()
  const secret = new TextEncoder().encode(config.jwtSecret)

  const accessToken = await new SignJWT({ id: user.id, email: user.email, type: 'access' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRATION)
    .sign(secret)

  const refreshToken = await new SignJWT({ id: user.id, type: 'refresh' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_EXPIRATION)
    .sign(secret)

  return { accessToken, refreshToken }
}

export async function verifyUserToken(token: string) {
  const config = useRuntimeConfig()
  const secret = new TextEncoder().encode(config.jwtSecret)

  try {
    const { payload } = await jwtVerify(token, secret)
    if (payload.type !== 'access') return null
    return payload as { id: string; email: string; type: string }
  } catch (_e) {
    return null
  }
}

export async function verifyRefreshToken(token: string) {
  const config = useRuntimeConfig()
  const secret = new TextEncoder().encode(config.jwtSecret)

  try {
    const { payload } = await jwtVerify(token, secret)
    if (payload.type !== 'refresh') return null
    return payload as { id: string; type: string }
  } catch (_e) {
    return null
  }
}
