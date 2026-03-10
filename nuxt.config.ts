import { z } from 'zod'

const envSchema = z.object({
  NUXT_PUBLIC_APP_NAME: z.string().trim().min(1).default('MindChat'),
  NUXT_PUBLIC_API_BASE: z
    .string()
    .trim()
    .refine(
      (value) =>
        value.startsWith('/') || value.startsWith('http://') || value.startsWith('https://'),
      {
        message: 'NUXT_PUBLIC_API_BASE must be an absolute URL or start with /'
      }
    )
    .default('/api')
})

const parsedEnv = envSchema.safeParse(process.env)

if (!parsedEnv.success) {
  throw new Error(
    `Invalid environment variables: ${parsedEnv.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join(', ')}`
  )
}

const env = parsedEnv.data

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxt/eslint'],
  runtimeConfig: {
    public: {
      appName: env.NUXT_PUBLIC_APP_NAME,
      apiBase: env.NUXT_PUBLIC_API_BASE
    }
  }
})
