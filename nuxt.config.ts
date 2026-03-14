import { fileURLToPath } from 'node:url'
import { defineNuxtConfig } from 'nuxt/config'
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
    .default('/api'),
  // 数据库连接字符串校验
  DATABASE_URL: z.string().url({ message: 'DATABASE_URL 校验失败' }),
  // Auth Config
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 chars'),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional()
})
const parsedEnv = envSchema.safeParse(process.env)

if (!parsedEnv.success) {
  console.error(
    `Invalid environment variables: ${parsedEnv.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join(', ')}`
  )
  // 在开发环境下，如果缺少可选变量，我们不应该硬性崩溃，但在生产环境应该严格
  // 这里为了简单，我们只抛出必填项缺失的错误
  // 实际上 zod safeParse 已经处理了可选性
  if (process.env.NODE_ENV === 'production') {
    process.exit(1)
  }
}

// 注意：如果校验失败，parsedEnv.data 可能不存在，这里需要处理
// 但我们在上面抛出了错误（虽然没 exit），为了安全起见，这里做一个 fallback 或再次检查
// 为了简单起见，假设开发者会看控制台错误并修复 .env
const env = parsedEnv.success ? parsedEnv.data : process.env

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  future: {
    compatibilityVersion: 4
  },
  alias: {
    share: fileURLToPath(new URL('./share', import.meta.url))
  },
  devtools: { enabled: true },
  modules: ['@nuxt/eslint', '@nuxt/ui', '@pinia/nuxt'],
  ui: {
    fonts: false
  },
  colorMode: {
    classSuffix: ''
  },
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    jwtSecret: env.JWT_SECRET,
    githubClientId: env.GITHUB_CLIENT_ID,
    githubClientSecret: env.GITHUB_CLIENT_SECRET,
    googleClientId: env.GOOGLE_CLIENT_ID,
    googleClientSecret: env.GOOGLE_CLIENT_SECRET,
    public: {
      appName: env.NUXT_PUBLIC_APP_NAME,
      apiBase: env.NUXT_PUBLIC_API_BASE
    }
  }
})
