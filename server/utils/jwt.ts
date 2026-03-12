import { SignJWT, jwtVerify } from 'jose'

export async function signUserToken(user: { id: string; email: string }) {
  const config = useRuntimeConfig()
  const secret = new TextEncoder().encode(config.jwtSecret)

  return await new SignJWT({ id: user.id, email: user.email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret)
}

export async function verifyUserToken(token: string) {
  const config = useRuntimeConfig()
  const secret = new TextEncoder().encode(config.jwtSecret)

  try {
    const { payload } = await jwtVerify(token, secret)
    return payload as { id: string; email: string }
  } catch (_e) {
    return null
  }
}
